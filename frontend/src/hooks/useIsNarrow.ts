"use client";

import { useEffect, useState } from "react";

const NARROW_QUERY = "(max-width: 639px)";

/**
 * Tailwind `sm` 브레이크포인트(640px)와 맞춘 좁은 화면 판별 훅.
 * SSR/hydration 안전을 위해 초기값은 항상 false(데스크톱)이며,
 * 마운트 후 matchMedia로 실제 값을 반영한다.
 */
export function useIsNarrow(): boolean {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(NARROW_QUERY);
    setIsNarrow(mediaQueryList.matches);

    function handleChange(event: MediaQueryListEvent) {
      setIsNarrow(event.matches);
    }

    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, []);

  return isNarrow;
}
