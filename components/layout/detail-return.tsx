"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type Dispatch, type ReactNode, type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import { ReturnToListLink } from "./list-return";
import styles from "./detail-return.module.css";

type ReturnTarget = {
  element: HTMLElement;
  pathname: string;
  href: string;
  label: string;
  ariaLabel: string;
};

type DetailReturnState = {
  target: ReturnTarget | null;
  pinnedTarget: ReturnTarget | null;
  register: (target: ReturnTarget) => () => void;
  setPinnedTarget: Dispatch<SetStateAction<ReturnTarget | null>>;
};

const DetailReturnContext = createContext<DetailReturnState | null>(null);

/** Shares only the detail's return destination and anchor, never its content. */
export function DetailReturnProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ReturnTarget | null>(null);
  const [pinnedTarget, setPinnedTarget] = useState<ReturnTarget | null>(null);
  const register = useCallback((next: ReturnTarget) => {
    setTarget(next);
    setPinnedTarget(null);
    return () => {
      setTarget(current => current === next ? null : current);
      setPinnedTarget(current => current === next ? null : current);
    };
  }, []);
  const value = useMemo(() => ({ target, pinnedTarget, register, setPinnedTarget }), [target, pinnedTarget, register]);
  return <DetailReturnContext.Provider value={value}>{children}</DetailReturnContext.Provider>;
}

export function useDetailReturn() {
  const value = useContext(DetailReturnContext);
  if (!value) throw new Error("Detail return navigation requires DetailReturnProvider");
  return value;
}

/** Keep the anchor in place when the header takes over, so its threshold stays stable. */
export function DetailReturnLink({ href, label, ariaLabel, className }: {
  href: string;
  label: string;
  ariaLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const { register, pinnedTarget } = useDetailReturn();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return register({ element, pathname, href, label, ariaLabel });
  }, [register, pathname, href, label, ariaLabel]);
  const pinned = pinnedTarget?.element === ref.current && pinnedTarget.pathname === pathname;
  return (
    <span ref={ref} className={styles.detailLink} data-detail-return data-pinned={pinned} aria-hidden={pinned || undefined}>
      <ReturnToListLink href={href} aria-label={ariaLabel} tabIndex={pinned ? -1 : undefined} className={className}>← {label}</ReturnToListLink>
    </span>
  );
}
