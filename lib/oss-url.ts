/** OSS keys are raw object names: encode each segment once, preserving path separators. */
export function buildOssObjectUrl(base: string, key: string): string {
  return `${base}/${key.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
}
