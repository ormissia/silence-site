export type ImageState = "pending" | "ready" | "seen" | "error";

/** A slight first-row cadence; later images appear as soon as they are decoded. */
export function imageRevealDelay(index = 0) {
  return `${index < 4 ? index * 40 : 0}ms`;
}

// Survives client-side navigation; a full page reload starts a new visit.
const revealedSources = new Set<string>();

const visibleCallbacks = new WeakMap<Element, () => void>();
let viewportObserver: IntersectionObserver | undefined;

function whenVisible(image: HTMLImageElement, callback: () => void) {
  if (typeof IntersectionObserver === "undefined") {
    callback();
    return () => {};
  }
  viewportObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      visibleCallbacks.get(entry.target)?.();
      visibleCallbacks.delete(entry.target);
      viewportObserver?.unobserve(entry.target);
    });
  }, { rootMargin: "160px 0px" });
  visibleCallbacks.set(image, callback);
  viewportObserver.observe(image);
  return () => {
    visibleCallbacks.delete(image);
    viewportObserver?.unobserve(image);
  };
}

/** Cached images and slow decodes follow the same path; failed images remain visible. */
export function observeImage(image: HTMLImageElement, onState: (state: ImageState) => void, waitForViewport = false) {
  let active = true;
  let decoded = false;
  let revealed = false;
  let visible = !waitForViewport;
  const sourceKey = () => image.currentSrc || image.src;
  const showSeen = () => {
    if (!active || revealed || !revealedSources.has(sourceKey())) return false;
    revealed = true;
    onState("seen");
    return true;
  };
  // Returning to a page with an already displayed, cached image needs no observer or decode delay.
  if (image.complete && image.naturalWidth > 0 && showSeen()) return () => { active = false; };
  const reveal = () => {
    if (!active || revealed || !decoded || !visible) return;
    if (showSeen()) return;
    revealed = true;
    revealedSources.add(sourceKey());
    onState("ready");
  };
  const stopObserving = waitForViewport ? whenVisible(image, () => { visible = true; reveal(); }) : () => {};
  const loaded = async () => {
    const source = image.currentSrc || image.src;
    try { await image.decode(); } catch { /* Some browsers cannot decode SVGs explicitly. */ }
    if (active && source === (image.currentSrc || image.src)) {
      if (image.naturalWidth > 0) {
        decoded = true;
        if (showSeen()) stopObserving();
        else reveal();
      }
      else failed();
    }
  };
  const failed = () => {
    stopObserving();
    if (active) onState("error");
  };
  image.addEventListener("load", loaded);
  image.addEventListener("error", failed);
  if (image.complete) {
    if (image.naturalWidth > 0) void loaded();
    else if (image.currentSrc || image.getAttribute("src")) failed();
  }
  return () => {
    active = false;
    stopObserving();
    image.removeEventListener("load", loaded);
    image.removeEventListener("error", failed);
  };
}
