/** 客户端 URL 拼装与服务端资源缓存共用同一配置规则。 */
export function readOssBase(): string {
  const raw = process.env.NEXT_PUBLIC_OSS_BASE_URL?.trim();
  if (!raw || raw.includes("<") || raw.includes(">") || !/^https?:\/\//.test(raw)) return "";
  return raw.replace(/\/$/, "");
}
