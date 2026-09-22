"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./site-footer.module.css";

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

function FooterLetter({ letter, index, visible, reduced }: {
  letter: string;
  index: number;
  visible: boolean;
  reduced: boolean;
}) {
  return (
    <span className={styles.letterClip} aria-hidden="true">
      <motion.span
        className={styles.letter}
        initial={{ opacity: 0, y: "75%" }}
        animate={visible || reduced ? { opacity: 1, y: "0%" } : { opacity: 0, y: "75%" }}
        transition={{ duration: reduced || !visible ? 0 : 0.9, delay: reduced || !visible ? 0 : 0.12 + index * 0.065, ease: REVEAL_EASE }}
      >
        {letter}
      </motion.span>
    </span>
  );
}

export function SiteFooter({ year }: { year: number }) {
  const footer = useRef<HTMLElement>(null);
  const [showImage, setShowImage] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const [visible, setVisible] = useState(false);
  const revealed = visible || reduced;

  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio >= 0.75) setVisible(true);
      // Reset only after the clipping edge has covered the entire title group.
      // Separate thresholds prevent replaying on tiny scroll movements.
      else if (entry.intersectionRatio <= 0.3) setVisible(false);
    }, { threshold: [0, 0.3, 0.75] });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShowImage(true);
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footer} className={`${styles.footer} font-sans`} aria-labelledby="footer-title">
      <div className={styles.scene}>
        <div className={styles.background} aria-hidden="true">
          {showImage && <Image src="/images/cover.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />}
        </div>
        <div className={styles.shade} aria-hidden="true" />

        <div className={styles.title}>
          <motion.p
            className={`${styles.eyebrow} text-caption uppercase tracking-eyebrow`}
            initial={{ opacity: 0, y: 6 }}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: reduced || !visible ? 0 : 0.7, ease: REVEAL_EASE }}
          >Photographs &amp; Notes</motion.p>
          <h2 id="footer-title" aria-label="SILENCE" className={`${styles.headline} font-sans text-display font-semibold`}>
            {Array.from("SILENCE").map((letter, index) => (
              <FooterLetter key={index} letter={letter} index={index} visible={visible} reduced={reduced} />
            ))}
          </h2>
          <motion.p
            className={`${styles.description} text-deck tracking-normal`}
            initial={{ opacity: 0, y: 8 }}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduced || !visible ? 0 : 0.8, delay: reduced || !visible ? 0 : 0.5, ease: REVEAL_EASE }}
          >收着光、句子与几次远行。</motion.p>
        </div>

        <div className={styles.info}>
          <div className={styles.contact}>
            <Link href="/" className={styles.signature}>SILENCE <span>by Song</span></Link>
            <a href="mailto:ormissia@outlook.com">ormissia@outlook.com <span aria-hidden="true">↗</span></a>
          </div>
          <div className={styles.bottom}>
            <a href="#page-top" onClick={(event) => {
              event.preventDefault();
              document.getElementById("page-top")?.focus({ preventScroll: true });
              window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
            }}>↑ 返回顶部</a>
            <span>© {year} SILENCE · Photographs &amp; Notes by Song</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
