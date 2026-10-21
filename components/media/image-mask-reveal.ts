const revealedImages = new Set<string>();

export function observeImageMaskReveal(frame: HTMLElement, entry: HTMLElement, key: string, skip = false) {
  const image = frame.querySelector("img");
  if (!image) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (skip) revealedImages.add(key);
  if (revealedImages.has(key) || reduce.matches || typeof IntersectionObserver === "undefined") {
    entry.dataset.workReveal = "seen";
    return;
  }

  let visible = false;
  let finished = false;
  const show = (immediate = false) => {
    if (finished && !immediate) return;
    finished = true;
    entry.dataset.workReveal = immediate ? "seen" : "visible";
    revealedImages.add(key);
    observer.disconnect();
    images.disconnect();
  };
  const ready = () => {
    if (visible && ["ready", "seen", "error"].includes(image.dataset.imageState ?? "")) show();
  };
  const observer = new IntersectionObserver(entries => {
    if (entries.some(item => item.isIntersecting)) { visible = true; ready(); }
  }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
  const images = new MutationObserver(ready);
  const focus = () => show(true);
  const motionChange = () => { if (reduce.matches) show(true); };

  entry.dataset.workReveal = "pending";
  images.observe(image, { attributes: true, attributeFilter: ["data-image-state"] });
  observer.observe(frame.parentElement ?? frame);
  entry.addEventListener("focusin", focus);
  reduce.addEventListener("change", motionChange);
  return () => {
    observer.disconnect();
    images.disconnect();
    entry.removeEventListener("focusin", focus);
    reduce.removeEventListener("change", motionChange);
  };
}
