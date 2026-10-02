"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Point = { x: number; y: number; time: number };
const MIN_TURN_SPEED = 650; // Pixels per second on both sides of a reversal.

export function HeroSpotlight({ src, film }: { src: string; film: boolean }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const hero = layer?.closest("header");
    if (!layer || !hero || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches || !CSS.supports("mask-image", "radial-gradient(circle, black, transparent)")) return;

    let frame = 0;
    let loaded = false;
    let complete = false;
    let active = false;
    let radius = 95;
    let position = { x: 0, y: 0 };
    let points: Point[] = [];
    let shakeAxis: "x" | "y" | null = null;
    let shakeDirection = 0;
    let stroke = 0;
    let strokeStartTime = 0;
    let reverse = 0;
    let reverseStartTime = 0;
    let turns = 0;
    let turnStrength = 0;
    let lastFastTurnTime = 0;
    let breathStart = 0;
    let breathDuration = 2500 + Math.random() * 1300;
    let breathCycles = 0;

    const original = hero.querySelector<HTMLImageElement>("img[data-image-state]");
    const clearImage = imageRef.current;
    const updateReady = () => {
      loaded = !!clearImage?.complete && !!clearImage.naturalWidth &&
        !!original?.matches('[data-image-state="ready"], [data-image-state="seen"]') &&
        !original.getAnimations().some((animation) => animation.playState === "running");
      if (loaded && active && !complete) scheduleDraw();
    };
    const observer = new MutationObserver(updateReady);
    if (original) observer.observe(original, { attributes: true, attributeFilter: ["data-image-state"] });
    original?.addEventListener("animationend", updateReady);
    clearImage?.addEventListener("load", updateReady);

    const draw = () => {
      layer.style.maskImage = `radial-gradient(circle at ${position.x}px ${position.y}px, black 0, black ${radius}px, transparent ${radius + 125}px)`;
      layer.style.webkitMaskImage = layer.style.maskImage;
    };
    const animateRadius = (now: number) => {
      points = points.filter((item) => now - item.time < 4500);
      const recent = points.filter((item) => now - item.time < 220);
      const path = recent.slice(1).reduce((sum, item, index) => sum + Math.hypot(item.x - recent[index].x, item.y - recent[index].y), 0);
      const speed = recent.length > 1 ? path * 1000 / Math.max(80, now - recent[0].time) : 0;
      const speedBoost = 110 * (1 - Math.exp(-speed / 1400));
      const turnBoost = Math.min(180, turnStrength) * Math.max(0, 1 - (now - lastFastTurnTime) / 1800);
      const target = 95 + speedBoost + turnBoost;
      radius += (target - radius) * 0.045;
      draw();
      if (loaded && breathCycles < 2) {
        if (!breathStart) breathStart = now;
        let phase = (now - breathStart) / breathDuration;
        if (phase >= 1) {
          breathCycles += 1;
          breathStart = now;
          breathDuration = 2500 + Math.random() * 1300;
          phase = 0;
        }
        layer.style.opacity = breathCycles < 2
          ? String(0.68 + 0.32 * (1 - Math.cos(phase * Math.PI * 2)) / 2)
          : "1";
      } else if (loaded) layer.style.opacity = "1";
      frame = active && (points.length > 0 || Math.abs(target - radius) > 0.5 || (loaded && breathCycles < 2))
        ? requestAnimationFrame(animateRadius) : 0;
    };
    const scheduleDraw = () => { if (!frame) frame = requestAnimationFrame(animateRadius); };
    updateReady();

    const finish = () => {
      complete = true;
      layer.style.opacity = "1";
      cancelAnimationFrame(frame);
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const farthest = Math.hypot(Math.max(position.x, bounds.width - position.x), Math.max(position.y, bounds.height - position.y)) + 125;
      const start = performance.now();
      const from = radius;
      const expand = (now: number) => {
        const progress = Math.min((now - start) / 1000, 1);
        radius = from + (farthest - from) * (1 - (1 - progress) ** 3);
        draw();
        if (progress < 1) frame = requestAnimationFrame(expand);
        else {
          layer.style.maskImage = "none";
          layer.style.webkitMaskImage = "none";
          frame = 0;
        }
      };
      frame = requestAnimationFrame(expand);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || complete) return;
      const bounds = hero.getBoundingClientRect();
      position = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      active = true;
      if (loaded && breathCycles >= 2) layer.style.opacity = "1";

      const point = { ...position, time: performance.now() };
      const previous = points.at(-1);
      if (previous && point.time - previous.time > 650) {
        turns = 0;
        turnStrength = 0;
        shakeAxis = null;
        shakeDirection = 0;
        stroke = 0;
        strokeStartTime = 0;
        reverse = 0;
        reverseStartTime = 0;
        lastFastTurnTime = 0;
      }
      points.push(point);
      points = points.filter((item) => point.time - item.time < 4500);
      if (previous) {
        const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
        if (distance > 250) { points = [point]; turns = 0; turnStrength = 0; shakeAxis = null; shakeDirection = 0; stroke = 0; strokeStartTime = 0; reverse = 0; reverseStartTime = 0; lastFastTurnTime = 0; }
        else if (distance > 0) {
          const path = points.slice(1).reduce((sum, item, index) => sum + Math.hypot(item.x - points[index].x, item.y - points[index].y), 0);
          if (!shakeAxis && distance > 4) shakeAxis = Math.abs(point.x - previous.x) >= Math.abs(point.y - previous.y) ? "x" : "y";
          if (shakeAxis) {
            const delta = point[shakeAxis] - previous[shakeAxis];
            const direction = Math.sign(delta);
            if (direction && !shakeDirection) { shakeDirection = direction; strokeStartTime = previous.time; }
            if (direction === shakeDirection) { stroke += Math.abs(delta); reverse = 0; reverseStartTime = 0; }
            else if (direction) {
              if (!reverse) reverseStartTime = previous.time;
              reverse += Math.abs(delta);
              if (reverse >= 30) {
                const strokeSpeed = stroke * 1000 / Math.max(1, reverseStartTime - strokeStartTime);
                const reverseSpeed = reverse * 1000 / Math.max(1, point.time - reverseStartTime);
                if (stroke >= 55 && strokeSpeed >= MIN_TURN_SPEED && reverseSpeed >= MIN_TURN_SPEED) {
                  turns += 1;
                  turnStrength += 9 * Math.min(2, Math.sqrt(Math.min(strokeSpeed, reverseSpeed) / MIN_TURN_SPEED));
                  lastFastTurnTime = point.time;
                }
                shakeDirection = direction;
                stroke = reverse;
                strokeStartTime = reverseStartTime;
                reverse = 0;
                reverseStartTime = 0;
              }
            }
          }
          if (loaded && turns >= 14 && path > 1800) { finish(); return; }
        }
      }
      scheduleDraw();
    };

    const leave = () => {
      if (complete) return;
      active = false;
      layer.style.opacity = "0";
      points = [];
      shakeAxis = null;
      shakeDirection = 0;
      stroke = 0;
      strokeStartTime = 0;
      reverse = 0;
      reverseStartTime = 0;
      turns = 0;
      turnStrength = 0;
      lastFastTurnTime = 0;
      radius = 95;
    };

    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", leave);
    return () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      clearImage?.removeEventListener("load", updateReady);
      original?.removeEventListener("animationend", updateReady);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[4] opacity-0 transition-opacity duration-200" style={{ maskImage: "radial-gradient(circle, transparent, transparent)", WebkitMaskImage: "radial-gradient(circle, transparent, transparent)" }}>
      <Image ref={imageRef} src={src} alt="" fill sizes="100vw" className={film ? "object-cover p-4 md:p-5" : "object-cover"} />
      {film && <Image src="/images/film/film-hero-overlay.webp" alt="" fill sizes="100vw" className="object-fill opacity-60 mix-blend-screen" />}
    </div>
  );
}
