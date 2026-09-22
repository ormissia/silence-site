"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./site-footer.module.css";

export function SiteFooter({ year }: { year: number }) {
  const footer = useRef<HTMLElement>(null);
  const [showImage, setShowImage] = useState(false);

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
          <p className={`${styles.eyebrow} text-caption uppercase tracking-eyebrow`}>Photographs &amp; Notes</p>
          <h2 id="footer-title" className="font-sans text-display font-semibold">SILENCE</h2>
          <p className={`${styles.description} text-deck tracking-normal`}>收着光、句子与几次远行。</p>
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
