/**
 * 构建期 OSS 探测/列举的两件套：有界并发 + 短重试。
 *
 * 背景：lib/image-meta.ts 和 lib/oss-list.ts 都会在第一次 build 时对几十~几百
 * 个 OSS key/prefix 同时发请求。一上来全部 Promise.all 出去会把 undici 的
 * 连接池打满，弱网/跨网下大量 ConnectTimeoutError，且现状没有重试。
 *
 * 本文件不引入第三方依赖（项目内还没装 p-limit / p-retry），手写两个最小工具。
 */

/**
 * 有界并发 map。N 个 worker 共同消费 items，按输入顺序返回结果。
 *
 * 实现细节：用共享游标 next 取下一个待处理 index；并发 worker 把结果按 index
 * 直接写回固定长度的 results 数组，避免乱序拼接。limit <= 0 时退化为串行。
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  if (items.length === 0) return results;

  const workerCount = Math.max(1, Math.min(limit, items.length));
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

/**
 * 仅对瞬时网络错误重试的最小重试器。
 *
 * 默认 retries=2、baseDelayMs=300（即 300ms、900ms 两轮 backoff）。
 * 默认 shouldRetry 只认 undici/Node 的连接级错误码，HTTP 4xx 不会被重试，
 * 避免「这张图就是 404」被打成 retry 风暴。
 */
export async function withRetry<R>(
  fn: () => Promise<R>,
  opts: {
    retries?: number;
    baseDelayMs?: number;
    shouldRetry?: (err: unknown) => boolean;
  } = {}
): Promise<R> {
  const retries = opts.retries ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 300;
  const shouldRetry = opts.shouldRetry ?? isTransientNetworkError;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err;
      const delay = baseDelayMs * Math.pow(3, attempt); // 300, 900, 2700...
      await sleep(delay);
      attempt++;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 识别 undici/Node 抛出的瞬时网络错误。
 * fetch failed 时真正的 code 通常在 err.cause.code，所以两层都看。
 */
const TRANSIENT_CODES = new Set([
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENETUNREACH",
]);

function extractCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as { code?: unknown; cause?: unknown; name?: unknown };
  if (typeof e.code === "string") return e.code;
  if (e.cause) return extractCode(e.cause);
  if (typeof e.name === "string" && e.name === "AbortError") return "AbortError";
  return undefined;
}

export function isTransientNetworkError(err: unknown): boolean {
  const code = extractCode(err);
  return !!code && (TRANSIENT_CODES.has(code) || code === "AbortError");
}
