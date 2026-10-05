import "server-only";

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

export type ResourceCache<T> = {
  version: 1;
  source: string;
  buildId: string;
  generatedAt: number;
  entries: Record<string, T>;
};

const SESSION_ID = process.env.SILENCE_OSS_BUILD_ID || randomUUID();
let runtimeBuildId: string | undefined;

/** Next 14 在生成静态参数/页面前设置 NEXT_PHASE；该值不编译进运行产物。 */
export function canPrepareResources(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
}

export function assertCanPrepareResources(): void {
  if (!canPrepareResources()) throw new Error("OSS resource preparation is only allowed during build or development");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readResourceCache<T>(filename: string, source: string, validValue: (value: unknown, key: string) => value is T): ResourceCache<T> {
  const empty: ResourceCache<T> = { version: 1, source, buildId: SESSION_ID, generatedAt: 0, entries: {} };
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(filename, "utf8"));
    if (!isRecord(raw) || raw.version !== 1 || raw.source !== source || typeof raw.buildId !== "string" || !raw.buildId || typeof raw.generatedAt !== "number" || !Number.isSafeInteger(raw.generatedAt) || raw.generatedAt <= 0 || !isRecord(raw.entries)) {
      throw new Error("missing/unsupported cache version, source or entries; rebuild to regenerate");
    }
    // 每次生产构建重新准备；同一次构建的 worker 共用已完成的数据。
    if (process.env.NODE_ENV === "production" && canPrepareResources() && raw.buildId !== SESSION_ID) return empty;
    for (const [key, value] of Object.entries(raw.entries)) {
      if (!validValue(value, key)) throw new Error(`invalid cache entry: ${key}`);
      empty.entries[key] = value;
    }
    if (!canPrepareResources()) {
      if (raw.buildId !== SESSION_ID) throw new Error("resource cache belongs to a different deployment build; rebuild before deployment");
      if (runtimeBuildId && runtimeBuildId !== raw.buildId) throw new Error("resource caches belong to different builds");
      runtimeBuildId = raw.buildId;
    }
    empty.buildId = raw.buildId;
    empty.generatedAt = raw.generatedAt;
    return empty;
  } catch (error) {
    const label = path.relative(process.cwd(), filename);
    const reason = error instanceof Error ? error.message : String(error);
    if (!canPrepareResources()) throw new Error(`Required OSS cache ${label} is unavailable: ${reason}`);
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.warn(`[oss-cache] ${label}: ${reason}; regenerating`);
    return { ...empty, entries: {} };
  }
}

/** 持锁期间写入临时文件并原子替换，读者始终看到完整 JSON。写入失败阻止构建。 */
export function writeResourceCache<T>(filename: string, cache: ResourceCache<T>): void {
  assertCanPrepareResources();
  const temporary = `${filename}.${process.pid}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify({ ...cache, generatedAt: Date.now() }, null, 2), "utf8");
    fs.renameSync(temporary, filename);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

/** 跨 Next worker 串行准备同一清单；持锁后重新读取，避免重复刷新和覆盖其他更新。 */
export async function withResourceLock<T>(filename: string, prepare: () => Promise<T>): Promise<T> {
  assertCanPrepareResources();
  const lock = `${filename}.${SESSION_ID}.lock`;
  const deadline = Date.now() + 5 * 60 * 1000;
  let descriptor: number;
  while (true) {
    try {
      descriptor = fs.openSync(lock, "wx");
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        const owner = Number(fs.readFileSync(lock, "utf8"));
        if (Number.isSafeInteger(owner) && owner > 0) {
          try { process.kill(owner, 0); }
          catch (cause) {
            if ((cause as NodeJS.ErrnoException).code === "ESRCH") throw new Error(`Interrupted resource preparation: ${path.basename(filename)}; start a new build`);
            if ((cause as NodeJS.ErrnoException).code !== "EPERM") throw cause;
          }
        } else if (Date.now() - fs.statSync(lock).mtimeMs > 10_000) {
          throw new Error(`Invalid resource preparation lock: ${path.basename(filename)}; start a new build`);
        }
      } catch (cause) {
        if ((cause as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw cause;
      }
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for resource cache lock: ${path.basename(filename)}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  try {
    fs.writeFileSync(descriptor, String(process.pid));
    return await prepare();
  } finally {
    try { fs.closeSync(descriptor); }
    finally { fs.unlinkSync(lock); }
  }
}

export class OssHttpError extends Error {
  constructor(operation: string, readonly status: number) {
    super(`${operation} -> HTTP ${status}`);
  }
}

export function resourceFetchOptions(): RequestInit {
  assertCanPrepareResources();
  return { cache: "no-store", signal: AbortSignal.timeout(10_000) };
}
