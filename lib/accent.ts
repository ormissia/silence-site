import type { CSSProperties } from "react";

/** Runs in <head> before paint, once per document. Only geometry is randomized. */
export const ACCENT_INIT_SCRIPT = `(() => {
  const root = document.documentElement;
  if (root.style.getPropertyValue("--accent-angle-base")) return;
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  const unit = (index) => values[index] / 4294967296;
  root.style.setProperty("--accent-angle-base", (unit(0) * 360).toFixed(2) + "deg");
  root.style.setProperty("--accent-position-base", (25 + unit(1) * 50).toFixed(2) + "%");
  root.style.setProperty("--accent-glow-base", (30 + unit(2) * 40).toFixed(2) + "%");
  root.style.setProperty("--accent-shadow-base", (unit(3) * 6 - 3).toFixed(2) + "px");
})()`;

/** Stable semantic keys keep SSR, hydration and route returns in agreement. */
export function getAccentStyle(key: string): CSSProperties {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index++) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
  }
  const value = hash >>> 0;
  return {
    "--accent-angle-offset": `${value % 360}deg`,
    "--accent-position-offset": `${(value >>> 8) % 51 - 25}%`,
    "--accent-glow-offset": `${(value >>> 16) % 21 - 10}%`,
    "--accent-shadow-offset": `${(value >>> 24) % 5 - 2}px`,
  } as CSSProperties;
}
