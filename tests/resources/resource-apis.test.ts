import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const OSS_BASE = "https://album.example.invalid";
const BUILD_ID = "resource-tests-build";
const PREFIX = "works/film/album";
const KEY = `${PREFIX}/photo.jpg`;
const DIMENSION = { w: 2400, h: 1600 };

function listingXml(keys: string[], truncated = false, next = ""): string {
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<ListBucketResult><IsTruncated>${truncated}</IsTruncated>${keys.map((key) => `<Contents><Key>${escape(key)}</Key></Contents>`).join("")}${next ? `<NextContinuationToken>${escape(next)}</NextContinuationToken>` : ""}</ListBucketResult>`;
}

const resources = [
  {
    name: "album manifest",
    filename: ".album-manifest.json",
    entry: PREFIX,
    value: [KEY],
    demoValue: Array.from({ length: 6 }, (_, index) => `${PREFIX}/${index + 1}.jpg`),
    invalidValues: [null, KEY, [42], ["elsewhere/photo.jpg"], [`${PREFIX}/nested/photo.jpg`], [`${PREFIX}/file.txt`]],
    concurrency: 2,
    valueFor: (entry: string) => [`${entry}/photo.jpg`],
    requestEntry: (url: URL) => url.searchParams.get("prefix")!.replace(/\/$/, ""),
    response: (entry = PREFIX) => new Response(listingXml([`${entry}/photo.jpg`])),
    load: async () => {
      const mod = await import("@/lib/oss-list");
      return {
        read: (keys = [PREFIX]) => mod.readAlbumManifest(keys.map((prefix) => ({ prefix }))),
        prepare: (keys = [PREFIX]) => mod.prepareAlbumManifest(keys.map((prefix) => ({ prefix }))),
        ensure: (keys = [PREFIX]) => mod.ensureManifest(keys.map((prefix) => ({ prefix }))),
      };
    },
  },
  {
    name: "image dimensions",
    filename: ".image-meta.json",
    entry: KEY,
    value: DIMENSION,
    demoValue: { w: 1600, h: 1067 },
    invalidValues: [null, [2400, 1600], { w: "2400", h: 1600 }, { w: 0, h: 1600 }, { w: 2400, h: -1 }, { w: 1.5, h: 1600 }, { w: Number.MAX_SAFE_INTEGER + 1, h: 1600 }],
    concurrency: 4,
    valueFor: (_entry: string) => DIMENSION,
    requestEntry: (url: URL) => decodeURIComponent(url.pathname.slice(1)),
    response: () => Response.json({ ImageWidth: { value: "2400" }, ImageHeight: { value: "1600" } }),
    load: async () => {
      const mod = await import("@/lib/image-meta");
      return {
        read: (keys = [KEY]) => mod.readImageMeta(keys),
        prepare: (keys = [KEY]) => mod.prepareImageMeta(keys),
        ensure: (keys = [KEY]) => mod.ensureMeta(keys),
      };
    },
  },
];

let root: string;
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

function observeWrites() {
  return [
    vi.spyOn(fs, "writeFileSync"),
    vi.spyOn(fs, "renameSync"),
    vi.spyOn(fs, "unlinkSync"),
    vi.spyOn(fs, "openSync"),
    vi.spyOn(fs, "mkdirSync"),
  ];
}

function writeFixture(filename: string, entries: Record<string, unknown>, overrides: Record<string, unknown> = {}): string {
  const location = path.join(root, "content", filename);
  fs.writeFileSync(location, JSON.stringify({ version: 1, source: OSS_BASE, buildId: BUILD_ID, generatedAt: 1, entries, ...overrides }));
  return location;
}

beforeEach(() => {
  const scratch = process.env.TMPDIR;
  if (!scratch) throw new Error("Resource tests require an isolated TMPDIR");
  root = fs.mkdtempSync(path.join(scratch, "silence-oss-resources-"));
  fs.mkdirSync(path.join(root, "content"));
  // Only the resource modules' cwd is redirected; all cache IO remains real.
  vi.spyOn(process, "cwd").mockReturnValue(root);
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PHASE", undefined);
  vi.stubEnv("SILENCE_OSS_BUILD_ID", BUILD_ID);
  vi.stubEnv("NEXT_PUBLIC_OSS_BASE_URL", OSS_BASE);
  fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error("Unexpected external request"));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fs.rmSync(root, { recursive: true, force: true });
});

describe.each(resources)("explicit $name resource APIs", (resource) => {
  it("requires explicit preparation even in development, then reads without locks, writes or requests", async () => {
    const api = await resource.load();
    fetchMock.mockImplementation(async () => resource.response());
    const readWrites = observeWrites();

    await expect(api.read()).rejects.toThrow(/Required OSS cache/);
    expect(fetchMock).not.toHaveBeenCalled();
    for (const operation of readWrites) {
      expect(operation).not.toHaveBeenCalled();
      operation.mockRestore();
    }

    const expected = { [resource.entry]: resource.value };
    await expect(api.prepare()).resolves.toEqual(expected);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const filename = path.join(root, "content", resource.filename);
    const stored = fs.readFileSync(filename, "utf8");
    expect(JSON.parse(stored)).toEqual({
      version: 1,
      source: OSS_BASE,
      buildId: BUILD_ID,
      generatedAt: expect.any(Number),
      entries: expected,
    });
    expect(fs.readdirSync(path.join(root, "content"))).toEqual([resource.filename]);

    const subsequentWrites = observeWrites();
    await expect(api.read()).resolves.toEqual(expected);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const operation of subsequentWrites) expect(operation).not.toHaveBeenCalled();
    expect(fs.readFileSync(filename, "utf8")).toBe(stored);
  });
  it.each(["development", "production"] as const)("keeps missing and invalid artifacts fatal in %s reads", async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    const api = await resource.load();
    const filename = path.join(root, "content", resource.filename);
    const expected = { [resource.entry]: resource.value };
    const corruptions = [
      { version: 0 },
      { version: "1" },
      { source: "https://other.example.invalid" },
      { buildId: "previous-deployment" },
      { buildId: "" },
      { generatedAt: 0 },
      { generatedAt: 1.5 },
      { generatedAt: "1" },
      { entries: [] },
      { entries: {} },
      ...resource.invalidValues.map((invalid) => ({ entries: { [resource.entry]: invalid } })),
      { entries: { ...expected, unexpected: null } },
    ];

    await expect(api.read()).rejects.toThrow(/Required OSS cache/);
    for (const invalid of ["{", JSON.stringify(expected), ...corruptions.map((fields) => JSON.stringify({
      version: 1, source: OSS_BASE, buildId: BUILD_ID, generatedAt: 1, entries: expected, ...fields,
    }))]) {
      fs.writeFileSync(filename, invalid);
      const writes = observeWrites();
      await expect(api.read()).rejects.toThrow(/Required (OSS cache|album manifest entries missing|image dimensions missing)/);
      for (const operation of writes) {
        expect(operation).not.toHaveBeenCalled();
        operation.mockRestore();
      }
      expect(fs.readFileSync(filename, "utf8")).toBe(invalid);
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("reads a valid deployment cache in production without preparing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const expected = { [resource.entry]: resource.value };
    writeFixture(resource.filename, expected);
    const api = await resource.load();
    const writes = observeWrites();

    await expect(api.read()).resolves.toEqual(expected);
    await expect(api.ensure()).resolves.toEqual(expected);
    expect(fetchMock).not.toHaveBeenCalled();
    for (const operation of writes) expect(operation).not.toHaveBeenCalled();
  });

  it("forbids production-runtime preparation before IO, including empty and demo requests", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const api = await resource.load();
    const reads = vi.spyOn(fs, "readFileSync");
    const writes = observeWrites();

    for (const base of [OSS_BASE, ""]) {
      vi.stubEnv("NEXT_PUBLIC_OSS_BASE_URL", base);
      await expect(api.prepare()).rejects.toThrow(/only allowed during build or development/);
      await expect(api.prepare([])).rejects.toThrow(/only allowed during build or development/);
    }
    expect(reads).not.toHaveBeenCalled();
    for (const operation of writes) expect(operation).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps empty requests and demo fallback free of cache IO", async () => {
    const api = await resource.load();
    const reads = vi.spyOn(fs, "readFileSync");
    const writes = observeWrites();

    await expect(api.read([])).resolves.toEqual({});
    await expect(api.prepare([])).resolves.toEqual({});
    for (const base of ["", "https://<bucket>.oss.example.invalid"]) {
      vi.stubEnv("NEXT_PUBLIC_OSS_BASE_URL", base);
      const expected = { [resource.entry]: resource.demoValue };
      await expect(api.read()).resolves.toEqual(expected);
      await expect(api.prepare()).resolves.toEqual(expected);
      vi.stubEnv("NODE_ENV", "production");
      await expect(api.read()).resolves.toEqual(expected);
      await expect(api.ensure()).resolves.toEqual(expected);
      vi.stubEnv("NODE_ENV", "development");
    }
    expect(reads).not.toHaveBeenCalled();
    for (const operation of writes) expect(operation).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("adopts a valid previous development session before a subsequent strict read", async () => {
    const expected = { [resource.entry]: resource.value };
    const filename = writeFixture(resource.filename, expected, { buildId: "previous-development-session" });
    const api = await resource.load();
    await expect(api.read()).rejects.toThrow(/different deployment build/);
    const rename = vi.spyOn(fs, "renameSync");

    await expect(api.prepare()).resolves.toEqual(expected);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(api.read()).resolves.toEqual(expected);
    expect(JSON.parse(fs.readFileSync(filename, "utf8"))).toMatchObject({ buildId: BUILD_ID, entries: expected });
    expect(rename).toHaveBeenCalledOnce();
    expect(fs.readdirSync(path.join(root, "content"))).toEqual([resource.filename]);
    await expect(api.prepare()).resolves.toEqual(expected);
    expect(rename).toHaveBeenCalledOnce();
  });

  it("refreshes an old production build only through prepare and reuses this build's result", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    const expected = { [resource.entry]: resource.value };
    const filename = writeFixture(resource.filename, expected, { buildId: "previous-deployment" });
    const before = fs.readFileSync(filename, "utf8");
    const api = await resource.load();
    fetchMock.mockImplementation(async () => resource.response());

    await expect(api.read()).rejects.toThrow(/different deployment build/);
    expect(fs.readFileSync(filename, "utf8")).toBe(before);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(api.prepare([resource.entry, resource.entry])).resolves.toEqual(expected);
    await expect(api.prepare()).resolves.toEqual(expected);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fs.readFileSync(filename, "utf8"))).toMatchObject({ buildId: BUILD_ID, entries: expected });
    await expect(api.read()).resolves.toEqual(expected);
  });

  it("serializes concurrent preparations with a build-scoped lock and an atomic replacement", async () => {
    const api = await resource.load();
    vi.resetModules();
    const otherWorker = await resource.load();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    fetchMock.mockImplementation(async () => { await gate; return resource.response(); });
    const filename = path.join(root, "content", resource.filename);
    const lock = `${filename}.${BUILD_ID}.lock`;
    const rename = vi.spyOn(fs, "renameSync");

    const first = api.prepare();
    const second = otherWorker.prepare();
    expect(fs.readFileSync(lock, "utf8")).toBe(String(process.pid));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release();
    const expected = { [resource.entry]: resource.value };
    await expect(Promise.all([first, second])).resolves.toEqual([expected, expected]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(rename).toHaveBeenCalledExactlyOnceWith(expect.stringMatching(/\.tmp$/), filename);
    expect(fs.readdirSync(path.join(root, "content"))).toEqual([resource.filename]);
  });

  it("propagates atomic-write failures, preserves the previous artifact and removes temporary files", async () => {
    const api = await resource.load();
    const filename = writeFixture(resource.filename, {});
    const previous = fs.readFileSync(filename, "utf8");
    fetchMock.mockImplementation(async () => resource.response());
    vi.spyOn(fs, "renameSync").mockImplementation(() => { throw new Error("synthetic read-only filesystem"); });

    await expect(api.prepare()).rejects.toThrow("synthetic read-only filesystem");
    expect(fs.readFileSync(filename, "utf8")).toBe(previous);
    expect(fs.readdirSync(path.join(root, "content"))).toEqual([resource.filename]);
  });

  it("regenerates malformed caches only through explicit preparation", async () => {
    const api = await resource.load();
    const filename = path.join(root, "content", resource.filename);
    fs.writeFileSync(filename, "{malformed");
    fetchMock.mockImplementation(async () => resource.response());

    await expect(api.read()).rejects.toThrow(/Required OSS cache/);
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(api.prepare()).resolves.toEqual({ [resource.entry]: resource.value });
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/regenerating/));
    await expect(api.read()).resolves.toEqual({ [resource.entry]: resource.value });
  });

  it.each([[404, 1], [408, 3], [429, 3], [503, 3]])("fails HTTP %i after %i attempts without caching a fallback", async (status, attempts) => {
    const api = await resource.load();
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    fetchMock.mockImplementation(async () => new Response(null, { status }));

    const failure = expect(api.prepare()).rejects.toThrow(/Unable to prepare/);
    await vi.runAllTimersAsync();
    await failure;
    expect(fetchMock).toHaveBeenCalledTimes(attempts);
    expect(fs.readdirSync(path.join(root, "content"))).toEqual([]);
  });

  it("retries transient network failures before accepting a real successful response", async () => {
    const api = await resource.load();
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    fetchMock
      .mockRejectedValueOnce(new TypeError("fetch failed", { cause: { code: "ECONNRESET" } }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockImplementation(async () => resource.response());

    const prepared = api.prepare();
    await vi.runAllTimersAsync();
    await expect(prepared).resolves.toEqual({ [resource.entry]: resource.value });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("stops scheduling after a final failure while retaining only successful in-flight entries", async () => {
    const api = await resource.load();
    const entries = Array.from({ length: resource.concurrency + 2 }, (_, index) => `${resource.entry}-${index}`);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    fetchMock.mockImplementation(async (input) => {
      const entry = resource.requestEntry(new URL(String(input)));
      if (entry === entries[0]) return new Response(null, { status: 404 });
      await gate;
      return resource.response(entry);
    });

    const failure = expect(api.prepare(entries)).rejects.toThrow(/Unable to prepare/);
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(fetchMock).toHaveBeenCalledTimes(resource.concurrency);
    release();
    await failure;
    expect(fetchMock).toHaveBeenCalledTimes(resource.concurrency);
    const expected = Object.fromEntries(entries.slice(1, resource.concurrency).map((entry) => [entry, resource.valueFor(entry)]));
    const filename = path.join(root, "content", resource.filename);
    expect(JSON.parse(fs.readFileSync(filename, "utf8")).entries).toEqual(expected);
    await expect(api.read(entries)).rejects.toThrow(/missing/);

    fetchMock.mockClear().mockImplementation(async (input) => resource.response(resource.requestEntry(new URL(String(input)))));
    await expect(api.prepare(entries)).resolves.toEqual(Object.fromEntries(entries.map((entry) => [entry, resource.valueFor(entry)])));
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fs.readdirSync(path.join(root, "content"))).toEqual([resource.filename]);
  });
});

it("parses paginated XML, decodes entities once and preserves object key names", async () => {
  const { prepareAlbumManifest, readAlbumManifest } = await import("@/lib/oss-list");
  const token = "next+% #?页&";
  const escaped = `${PREFIX}/文字 &lt; #?50%.JPG`;
  const numeric = `${PREFIX}/中.jpg`;
  const firstPage = listingXml([
    KEY, KEY, escaped, `${PREFIX}/`, `${PREFIX}/nested/photo.jpg`, "elsewhere/photo.jpg", `${PREFIX}/notes.txt`,
  ], true, token).replace("</ListBucketResult>", `<CommonPrefixes><Prefix>${PREFIX}/nested/</Prefix></CommonPrefixes></ListBucketResult>`);
  const lastPage = `<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>${PREFIX}/&#x4E2D;.jpg</Key></Contents><Contents><Key>${PREFIX}/&#20013;.jpg</Key></Contents></ListBucketResult>`;
  fetchMock.mockResolvedValueOnce(new Response(firstPage)).mockResolvedValueOnce(new Response(lastPage));

  const expected = { [PREFIX]: [KEY, escaped, numeric] };
  await expect(prepareAlbumManifest([{ prefix: `${PREFIX}/` }, { prefix: PREFIX }])).resolves.toEqual(expected);
  await expect(readAlbumManifest([{ prefix: PREFIX }])).resolves.toEqual(expected);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const first = new URL(String(fetchMock.mock.calls[0][0]));
  const second = new URL(String(fetchMock.mock.calls[1][0]));
  expect(Object.fromEntries(first.searchParams)).toEqual({ "list-type": "2", prefix: `${PREFIX}/`, delimiter: "/", "max-keys": "1000" });
  expect(second.searchParams.get("continuation-token")).toBe(token);
  for (const [, options] of fetchMock.mock.calls) {
    expect(options?.cache).toBe("no-store");
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  }
});

it.each([
  "<Error><Code>AccessDenied</Code></Error>",
  "<ListBucketResult><IsTruncated>false</IsTruncated>",
  "<ListBucketResult><IsTruncated>unknown</IsTruncated></ListBucketResult>",
  `<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>${KEY}</Key></ListBucketResult>`,
  "<ListBucketResult><IsTruncated>false</IsTruncated><Contents></Contents></ListBucketResult>",
  `<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>${KEY}</Key><Key>${KEY}</Key></Contents></ListBucketResult>`,
  `<ListBucketResult><IsTruncated>false</IsTruncated><Contents><Key>${PREFIX}/&#xD800;.jpg</Key></Contents></ListBucketResult>`,
  listingXml([KEY], true),
])("rejects malformed list responses without saving partial/empty results: %#", async (xml) => {
  const { prepareAlbumManifest } = await import("@/lib/oss-list");
  fetchMock.mockResolvedValue(new Response(xml));

  await expect(prepareAlbumManifest([{ prefix: PREFIX }])).rejects.toThrow(/Unable to prepare album manifest/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fs.readdirSync(path.join(root, "content"))).toEqual([]);
});

it("rejects repeated continuation tokens without committing a partial album", async () => {
  const { prepareAlbumManifest } = await import("@/lib/oss-list");
  fetchMock.mockImplementation(async () => new Response(listingXml([KEY], true, "repeated")));

  await expect(prepareAlbumManifest([{ prefix: PREFIX }])).rejects.toThrow(/Unable to prepare album manifest/);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fs.readdirSync(path.join(root, "content"))).toEqual([]);
});

it("preserves a successful empty album instead of replacing it with demo images", async () => {
  const { prepareAlbumManifest, readAlbumManifest } = await import("@/lib/oss-list");
  fetchMock.mockResolvedValue(new Response(listingXml([])));

  await expect(prepareAlbumManifest([{ prefix: PREFIX }])).resolves.toEqual({ [PREFIX]: [] });
  await expect(readAlbumManifest([{ prefix: PREFIX }])).resolves.toEqual({ [PREFIX]: [] });
  expect(JSON.parse(fs.readFileSync(path.join(root, "content/.album-manifest.json"), "utf8")).entries).toEqual({ [PREFIX]: [] });
});

it.each([
  null,
  {},
  { ImageWidth: { value: "0" }, ImageHeight: { value: "1600" } },
  { ImageWidth: { value: "1.5" }, ImageHeight: { value: "1600" } },
  { ImageWidth: { value: "2400" }, ImageHeight: { value: "invalid" } },
])("rejects invalid image-info dimensions without a placeholder cache entry: %#", async (json) => {
  const { prepareImageMeta } = await import("@/lib/image-meta");
  fetchMock.mockResolvedValue(Response.json(json));

  await expect(prepareImageMeta([KEY])).rejects.toThrow(/Unable to prepare image dimensions/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fs.readdirSync(path.join(root, "content"))).toEqual([]);
});

it("keeps differently built resource artifacts incompatible", async () => {
  vi.stubEnv("NODE_ENV", "production");
  writeFixture(".album-manifest.json", { [PREFIX]: [KEY] });
  writeFixture(".image-meta.json", { [KEY]: DIMENSION }, { buildId: "previous-deployment" });
  const { readAlbumManifest } = await import("@/lib/oss-list");
  const { readImageMeta } = await import("@/lib/image-meta");
  const writes = observeWrites();

  await expect(readAlbumManifest([{ prefix: PREFIX }])).resolves.toEqual({ [PREFIX]: [KEY] });
  await expect(readImageMeta([KEY])).rejects.toThrow(/different deployment build/);
  expect(fetchMock).not.toHaveBeenCalled();
  for (const operation of writes) expect(operation).not.toHaveBeenCalled();
});

it("keeps request timeouts at ten seconds and forbids runtime request options", async () => {
  const { resourceFetchOptions } = await import("@/lib/oss-cache");
  const timeout = vi.spyOn(AbortSignal, "timeout");

  expect(resourceFetchOptions()).toEqual({ cache: "no-store", signal: expect.any(AbortSignal) });
  expect(timeout).toHaveBeenCalledExactlyOnceWith(10_000);
  vi.stubEnv("NODE_ENV", "production");
  expect(() => resourceFetchOptions()).toThrow(/only allowed during build or development/);
  expect(timeout).toHaveBeenCalledTimes(1);
});

it("probes the same encoded object path used by display URLs", async () => {
  const { prepareImageMeta } = await import("@/lib/image-meta");
  const { buildSrc } = await import("@/lib/oss");
  const key = "works/胶片/50% #? 中文%2F.jpg";
  const encoded = "works/%E8%83%B6%E7%89%87/50%25%20%23%3F%20%E4%B8%AD%E6%96%87%252F.jpg";
  fetchMock.mockResolvedValue(Response.json({ ImageWidth: { value: "2400" }, ImageHeight: { value: "1600" } }));

  await expect(prepareImageMeta([key])).resolves.toEqual({ [key]: DIMENSION });
  expect(fetchMock).toHaveBeenCalledWith(`${OSS_BASE}/${encoded}?x-oss-process=image/info`, expect.any(Object));
  const probe = new URL(String(fetchMock.mock.calls[0][0]));
  const display = new URL(buildSrc(key, "detail"));
  expect(probe.pathname).toBe(display.pathname);
  expect(decodeURIComponent(probe.pathname.slice(1))).toBe(key);
  expect(probe.hash).toBe("");
  expect([...probe.searchParams.keys()]).toEqual(["x-oss-process"]);
});
