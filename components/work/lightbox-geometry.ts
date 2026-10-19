export type PhotoFrame = { x: number; y: number; width: number; height: number };

export function fitPhoto(width: number, height: number, viewportWidth: number, viewportHeight: number): PhotoFrame {
  const margin = viewportWidth < 640 ? 16 : 80;
  const availableWidth = Math.max(1, viewportWidth - margin * 2);
  const availableHeight = Math.max(1, viewportHeight - 144);
  const ratio = width > 0 && height > 0 ? width / height : 1.5;
  const fittedWidth = Math.min(availableWidth, availableHeight * ratio);
  const fittedHeight = fittedWidth / ratio;
  return { x: (viewportWidth - fittedWidth) / 2, y: (viewportHeight - fittedHeight) / 2, width: fittedWidth, height: fittedHeight };
}

export function thumbnailFrame(image?: HTMLImageElement | null): PhotoFrame | undefined {
  const rect = image?.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return;
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}
