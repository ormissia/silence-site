type Bounds = { left: number; top: number; width: number; height: number };
type Direction = "enter" | "return";
type Flight = {
  slug: string;
  direction: Direction;
  source: HTMLElement;
  frame: HTMLDivElement;
  image: HTMLImageElement;
  from: Bounds;
  imageFrom: Bounds;
  animations: Animation[];
  dispose: () => void;
  target?: HTMLElement;
  arrival?: number;
  shade?: HTMLDivElement;
  filter: string;
};

let active: Flight | undefined;
const ease = "cubic-bezier(.22,1,.36,1)";
const center = (box: Bounds) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 });

export function cancelCoverTransition() { active?.dispose(); }

export function checkCoverTransitionRoute(pathname: string) {
  if (active && pathname !== "/works" && pathname !== `/works/${active.slug}`) active.dispose();
  else if (active?.target && pathname !== (active.direction === "enter" ? `/works/${active.slug}` : "/works")) active.dispose();
}

function imageGeometry(image: HTMLImageElement, fallbackRatio?: number) {
  const box = image.getBoundingClientRect();
  const style = getComputedStyle(image);
  const left = parseFloat(style.paddingLeft) || 0, right = parseFloat(style.paddingRight) || 0;
  const top = parseFloat(style.paddingTop) || 0, bottom = parseFloat(style.paddingBottom) || 0;
  const frame = { left: box.left + left, top: box.top + top, width: box.width - left - right, height: box.height - top - bottom };
  const ratio = image.naturalWidth / image.naturalHeight || fallbackRatio || frame.width / frame.height;
  const width = Math.max(frame.width, frame.height * ratio), height = width / ratio;
  return { frame, picture: { left: frame.left + (frame.width - width) / 2, top: frame.top + (frame.height - height) / 2, width, height },
    filter: style.getPropertyValue("--image-filter") || "none" };
}

/** Called only after the shared navigation-intent check; Next Link still owns navigation. */
export function beginCoverTransition(source: HTMLElement, slug: string, direction: Direction = "enter") {
  cancelCoverTransition();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const image = source.querySelector("img");
  if (reduce.matches || !image?.complete || !image.naturalWidth || typeof source.animate !== "function") return;
  const sourceBox = source.getBoundingClientRect();
  const geometry = imageGeometry(image);
  const left = Math.max(sourceBox.left, geometry.frame.left), top = Math.max(sourceBox.top, geometry.frame.top);
  const from = direction === "return" ? { left, top,
    width: Math.min(sourceBox.right, geometry.frame.left + geometry.frame.width) - left,
    height: Math.min(sourceBox.bottom, geometry.frame.top + geometry.frame.height) - top } : sourceBox;
  if (from.width <= 0 || from.height <= 0 || from.top + from.height <= 0 || from.top >= window.innerHeight) return;

  const frame = document.createElement("div");
  const copy = document.createElement("img");
  const imageFrom = geometry.picture;
  frame.className = "work-cover-flight";
  frame.setAttribute("aria-hidden", "true");
  copy.src = image.currentSrc || image.src;
  copy.alt = "";
  Object.assign(frame.style, {
    left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`,
    borderRadius: getComputedStyle(source).borderRadius,
  });
  Object.assign(copy.style, {
    left: `${imageFrom.left - from.left}px`, top: `${imageFrom.top - from.top}px`,
    width: `${imageFrom.width}px`, height: `${imageFrom.height}px`,
    filter: geometry.filter,
  });
  frame.append(copy);
  document.body.append(frame);
  source.dataset.coverDeparting = "true";

  let disposed = false;
  const cancel = () => flight.dispose();
  const motionChange = () => { if (reduce.matches) cancel(); };
  const keydown = (event: KeyboardEvent) => {
    if (["Escape", "Tab", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) cancel();
  };
  const flight: Flight = {
    slug, direction, source, frame, image: copy, from, imageFrom, filter: geometry.filter, animations: [],
    dispose: () => {
      if (disposed) return;
      disposed = true;
      clearTimeout(timeout);
      flight.animations.forEach(animation => animation.cancel());
      frame.remove();
      delete source.dataset.coverDeparting;
      if (flight.target) {
        delete flight.target.dataset.coverArriving;
        delete flight.target.dataset.coverReady;
      }
      window.removeEventListener("resize", cancel);
      window.removeEventListener("popstate", cancel);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", keydown);
      reduce.removeEventListener("change", motionChange);
      if (active === flight) active = undefined;
    },
  };
  const sourceShade = source.querySelector<HTMLElement>("[data-work-cover-shade]");
  if (sourceShade) {
    flight.shade = document.createElement("div");
    Object.assign(flight.shade.style, { position: "absolute", inset: "0", backgroundImage: getComputedStyle(sourceShade).backgroundImage });
    frame.append(flight.shade);
  }
  const timeout = window.setTimeout(cancel, 3500);
  window.addEventListener("resize", cancel, { passive: true });
  window.addEventListener("popstate", cancel);
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("keydown", keydown);
  reduce.addEventListener("change", motionChange);
  active = flight;
}

function imageReady(image: HTMLImageElement) {
  return new Promise<boolean>(resolve => {
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.removeEventListener("load", loaded);
      image.removeEventListener("error", failed);
      resolve(ready);
    };
    const loaded = async () => {
      try { await image.decode?.(); } catch { /* Fall back to the browser's decoded image state. */ }
      finish(image.naturalWidth > 0);
    };
    const failed = () => finish(false);
    const timeout = window.setTimeout(failed, 1200);
    image.addEventListener("load", loaded);
    image.addEventListener("error", failed);
    if (image.complete) void loaded();
  });
}

export function arriveCoverTransition(target: HTMLElement, slug: string, direction: Direction = "enter") {
  if (direction === "enter") delete target.dataset.coverTransferred;
  const flight = active;
  if (!flight || flight.slug !== slug || flight.direction !== direction) return;
  const image = target.querySelector<HTMLImageElement>(direction === "enter" ? "[data-work-hero-image]" : "img");
  if (!image) { flight.dispose(); return; }
  flight.target = target;
  const arrival = flight.arrival = (flight.arrival ?? 0) + 1;
  target.dataset.coverArriving = "true";
  // Let both Next's layout scroll and the list's saved-position effect settle.
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => {
      if (active !== flight) return;
      void animateArrival(flight, target, image);
    });
  });
  return () => {
    cancelAnimationFrame(frame);
    // Strict Mode reconnects the same target before this cleanup task runs.
    queueMicrotask(() => { if (flight.arrival === arrival) flight.dispose(); });
  };
}

async function animateArrival(flight: Flight, target: HTMLElement, image: HTMLImageElement) {
  try {
    const geometry = imageGeometry(image, flight.imageFrom.width / flight.imageFrom.height);
    const to = flight.direction === "enter" ? geometry.frame : target.getBoundingClientRect();
    if (!to.width || !to.height || to.top >= window.innerHeight || to.top + to.height <= 0) { flight.dispose(); return; }
    const start = center(flight.from), end = center(to);
    const width = Math.max(flight.from.width, to.width), height = Math.max(flight.from.height, to.height);
    const imageWidth = geometry.picture.width, imageHeight = geometry.picture.height;
    const imageStart = center(flight.imageFrom), imageEnd = center(geometry.picture);
    const imageOffset = { x: imageEnd.x - end.x, y: imageEnd.y - end.y };
    const inset = (bounds: Bounds) => {
      const card = bounds === to ? flight.direction === "return" : flight.direction === "enter";
      return `inset(${(height - bounds.height) / 2}px ${(width - bounds.width) / 2}px round ${card ? 4 : 0}px)`;
    };
    Object.assign(flight.frame.style, {
      left: `${end.x - width / 2}px`, top: `${end.y - height / 2}px`, width: `${width}px`, height: `${height}px`, borderRadius: "0",
    });
    Object.assign(flight.image.style, {
      left: `${(width - imageWidth) / 2 + imageOffset.x}px`, top: `${(height - imageHeight) / 2 + imageOffset.y}px`,
      width: `${imageWidth}px`, height: `${imageHeight}px`,
    });
    const options: KeyframeAnimationOptions = { duration: 560, easing: ease, fill: "both" };
    const movement = flight.frame.animate([
      { transform: `translate(${start.x - end.x}px, ${start.y - end.y}px)`, clipPath: inset(flight.from) },
      { transform: "translate(0, 0)", clipPath: inset(to) },
    ], options);
    const picture = flight.image.animate([
      { transform: `translate(${imageStart.x - start.x - imageOffset.x}px, ${imageStart.y - start.y - imageOffset.y}px) scale(${flight.imageFrom.width / imageWidth})`, filter: flight.filter },
      { transform: "translate(0, 0) scale(1)", filter: geometry.filter },
    ], options);
    const shade = target.querySelector<HTMLElement>("[data-work-cover-shade]");
    if (shade || flight.shade) {
      const scrim = flight.shade ?? document.createElement("div");
      const backgroundImage = shade ? getComputedStyle(shade).backgroundImage : scrim.style.backgroundImage;
      const shadeBounds = flight.shade ? flight.from : to;
      Object.assign(scrim.style, { position: "absolute", left: `${(width - shadeBounds.width) / 2}px`, top: `${(height - shadeBounds.height) / 2}px`,
        width: `${shadeBounds.width}px`, height: `${shadeBounds.height}px`, backgroundImage });
      flight.frame.append(scrim);
      flight.animations.push(scrim.animate([{ opacity: flight.shade ? 1 : 0 }, { opacity: shade ? 1 : 0 }], options));
    }
    flight.animations.push(movement, picture);
    const [, ready] = await Promise.all([movement.finished, imageReady(image)]);
    if (active !== flight) return;
    if (!ready) { flight.dispose(); return; }
    // Reveal the real image underneath before fading out the cached travelling cover.
    if (flight.direction === "enter") target.dataset.coverTransferred = "true";
    target.dataset.coverReady = "true";
    const fade = flight.frame.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "both" });
    flight.animations.push(fade);
    await fade.finished;
    flight.dispose();
  } catch {
    flight.dispose();
  }
}
