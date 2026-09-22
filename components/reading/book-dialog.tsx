"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/** Native top-layer dialog stays above the site's fixed header and stacking contexts. */
export function BookDialog({ children, returnHref, titleId }: {
  children: ReactNode;
  returnHref: string;
  titleId: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const close = () => router.replace(returnHref, { scroll: false });

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="book-dialog"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}
    >
      {children}
    </dialog>
  );
}
