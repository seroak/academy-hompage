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
 * Tailwind `sm` 브레이크포인트(640px)에 맞춘 좁은 화면 판별 훅.
 *
 * `matchMedia`의 변경 이벤트를 `useSyncExternalStore`로 구독한다.
 * SSR과 hydration 시에는 `false`를 사용하여 서버와 클라이언트의
 * 초기 렌더 결과를 일치시키고, hydration 이후 실제 브라우저의
 * 미디어 쿼리 결과와 다르면 React가 다시 렌더링한다.
 */
export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
