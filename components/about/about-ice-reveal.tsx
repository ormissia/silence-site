"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createIceRenderer, ICE_LIFETIME_MS, type IceSegment } from "./ice-reveal-renderer";

export function AboutIceReveal({ interactionRef }: { interactionRef: RefObject<HTMLDivElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = interactionRef.current;
    if (!canvas || !surface) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer: ReturnType<typeof createIceRenderer> | undefined;
    let cancelled = false, failed = false, visible = true;
    let frame = 0, previousTime = 0, lastStroke = -Infinity;
    let lastPoint: { x: number; y: number; time: number; id: number } | undefined;
    let segments: IceSegment[] = [];
    const original = new Image();
    const ice = new Image();

    function reset() {
      cancelAnimationFrame(frame); frame = 0;
      segments = []; lastPoint = undefined; lastStroke = -Infinity;
      canvas!.style.opacity = "0";
      renderer?.clear();
    }
    function fail() {
      reset(); failed = true;
      renderer?.dispose(); renderer = undefined;
    }
    function resize() {
      reset();
      if (!renderer) return;
      try { renderer.resize(canvas!.clientWidth, canvas!.clientHeight, window.devicePixelRatio || 1); }
      catch { fail(); }
    }
    function initialize() {
      if (cancelled || failed || motion.matches || renderer || !original.naturalWidth || !ice.naturalWidth) return;
      try {
        renderer = createIceRenderer(canvas!, original, ice);
        resize();
      } catch (error) {
        if (process.env.NODE_ENV === "development") console.warn("About ice effect unavailable", error);
        fail();
      }
    }
    function tick(time: number) {
      frame = 0;
      if (!renderer || motion.matches || !visible || document.hidden) { reset(); return; }
      if (time - lastStroke > ICE_LIFETIME_MS + 100) { reset(); return; }
      renderer.draw(segments, Math.max(0, time - previousTime), time);
      segments = []; previousTime = time;
      canvas!.style.opacity = "1";
      frame = requestAnimationFrame(tick);
    }
    function pointer(event: PointerEvent) {
      if (!renderer || motion.matches || !visible || document.hidden || !event.isPrimary) return;
      if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, [role=button]")) {
        lastPoint = undefined; return;
      }
      const rect = canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left, y = rect.bottom - event.clientY;
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) { lastPoint = undefined; return; }
      const now = performance.now();
      const continuous = lastPoint && lastPoint.id === event.pointerId && now - lastPoint.time < 160;
      const segment: IceSegment = [continuous ? lastPoint!.x : x, continuous ? lastPoint!.y : y, x, y];
      if (segments.length < 12) segments.push(segment);
      else { segments[11][2] = x; segments[11][3] = y; }
      lastPoint = { x, y, time: now, id: event.pointerId }; lastStroke = now;
      if (!frame) { previousTime = now; frame = requestAnimationFrame(tick); }
    }
    function endPointer() { lastPoint = undefined; }
    function visibility() { if (document.hidden) reset(); }
    function motionChange() {
      reset();
      if (motion.matches) { renderer?.dispose(); renderer = undefined; }
      else initialize();
    }
    function contextLost(event: Event) {
      event.preventDefault(); reset(); renderer?.dispose(); renderer = undefined;
    }
    function contextRestored() { failed = false; initialize(); }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    original.onload = initialize; ice.onload = initialize;
    original.onerror = fail; ice.onerror = fail;
    original.src = "/images/background.jpg"; ice.src = "/images/background_ice.jpg";
    surface.addEventListener("pointermove", pointer, { passive: true });
    surface.addEventListener("pointerdown", pointer, { passive: true });
    surface.addEventListener("pointerleave", endPointer);
    surface.addEventListener("pointercancel", endPointer);
    // Scrolling moves the image beneath the pointer; never bridge across that movement.
    window.addEventListener("scroll", endPointer, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", motionChange);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);

    return () => {
      cancelled = true; reset(); renderer?.dispose();
      original.onload = null; ice.onload = null; original.onerror = null; ice.onerror = null;
      observer.disconnect(); resizeObserver.disconnect();
      surface.removeEventListener("pointermove", pointer);
      surface.removeEventListener("pointerdown", pointer);
      surface.removeEventListener("pointerleave", endPointer);
      surface.removeEventListener("pointercancel", endPointer);
      window.removeEventListener("scroll", endPointer);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", motionChange);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
    };
  }, [interactionRef]);

  return <canvas ref={canvasRef} aria-hidden="true" className="about-ice-canvas pointer-events-none absolute inset-0 h-full w-full opacity-0 brightness-[0.9] saturate-[0.85]" />;
}
