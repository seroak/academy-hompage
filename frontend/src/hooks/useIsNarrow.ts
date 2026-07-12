"use client";

import { useSyncExternalStore } from "react";

const NARROW_QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void): () => void {
  const mediaQueryList = window.matchMedia(NARROW_QUERY);
  mediaQueryList.addEventListener("change", onChange);
  return () => mediaQueryList.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(NARROW_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tailwind `sm` 브레이크포인트(640px)와 맞춘 좁은 화면 판별 훅.
 * matchMedia 구독을 useSyncExternalStore로 감싸, SSR에서는 고정 스냅샷(false)을
 * 쓰고 클라이언트 첫 렌더부터 실제 값을 동기적으로 읽는다 — useState+useEffect
 * 조합과 달리 하이드레이션 이후 추가 리렌더(깜빡임) 없이 값이 확정된다.
 */
export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
