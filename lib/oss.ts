/**
 * 图片源统一出口。
 * 当前 demo 使用 picsum.photos 占位；真实接入阿里云 OSS 时，
 * 仅替换 buildSrc 内部实现 + .env 中的 NEXT_PUBLIC_OSS_BASE_URL，调用方无需改动。
 */

export type ImagePreset = "hero" | "gridThumb" | "detail" | "portrait";

const PRESET_DIM: Record<ImagePreset, { w: number; h: number }> = {
  hero: { w: 2400, h: 1350 },
  gridThumb: { w: 1200, h: 1500 },
  detail: { w: 2000, h: 1333 },
  portrait: { w: 1200, h: 1500 },
};

function readOssBase(): string {
  const raw = process.env.NEXT_PUBLIC_OSS_BASE_URL?.trim();
  if (!raw) return "";
  // 占位字面量（来自 .env.example）当作未配置处理，避免拼出含 <bucket> 的非法 URL
  if (raw.includes("<") || raw.includes(">")) return "";
  if (!/^https?:\/\//.test(raw)) return "";
  return raw.replace(/\/$/, "");
}

const OSS_BASE = readOssBase();

/**
 * 把内容清单里的 key 拼成可访问的图片 URL。
 *
 * - key 形如 "albums/bzlyuj/cover.jpg"（构建期由 OSS 列举得到,已含扩展名）
 *   或外链 "https://..." 时直接透传
 * - 当 NEXT_PUBLIC_OSS_BASE_URL 未配置（demo 模式），回落到 picsum.photos，
 *   通过对 key 取 hash 得到稳定的占位图，保证刷新不变
 */
export function buildSrc(key: string, preset: ImagePreset): string {
  if (/^https?:\/\//.test(key)) return key;
  // 本地资源（public/ 下）直通
  if (key.startsWith("/")) return key;

  const { w, h } = PRESET_DIM[preset];

  if (!OSS_BASE) {
    const seed = encodeURIComponent(key);
    return `https://picsum.photos/seed/${seed}/${w}/${h}`;
  }

  // OSS 图片处理：缩放 + WebP。key 已含扩展名,直接拼;
  // format,webp 会覆盖原扩展名输出 WebP,所以源是 .jpg / .png 都不影响最终格式。
  const process = `image/resize,w_${w},h_${h},m_lfit/format,webp/quality,q_82`;
  return `${OSS_BASE}/${key}?x-oss-process=${process}`;
}

export function presetSize(preset: ImagePreset): { width: number; height: number } {
  const { w, h } = PRESET_DIM[preset];
  return { width: w, height: h };
}
