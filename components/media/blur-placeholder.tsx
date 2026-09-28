/** Low-resolution image under a list cover while the full image loads. */
export function BlurPlaceholder({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" aria-hidden="true" loading="lazy" decoding="async" className="image-blur-placeholder" />;
}
