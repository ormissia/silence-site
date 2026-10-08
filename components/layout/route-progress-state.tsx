"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type RouteProgressState = {
  start: () => void;
  done: () => void;
  isLoading: boolean;
};

const idle: RouteProgressState = { start: () => {}, done: () => {}, isLoading: false };
const RouteProgressContext = createContext<RouteProgressState>(idle);

/** Lightweight navigation state: importing an action must not import animation code. */
export function useRouteProgress(): RouteProgressState {
  return useContext(RouteProgressContext);
}

export function RouteProgressProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useState(false);
  const start = useCallback(() => setLoading(true), []);
  const done = useCallback(() => setLoading(false), []);
  const value = useMemo(() => ({ start, done, isLoading }), [start, done, isLoading]);
  return <RouteProgressContext.Provider value={value}>{children}</RouteProgressContext.Provider>;
}
