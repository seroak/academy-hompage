'use client'

import { useEffect, useState } from 'react'

/**
 * Cycles through `sceneCount` scenes on an interval, for looping decorative
 * previews. Mirrors the mount-gate pattern used for GIF/SVG fallback
 * previously: `reduceMotion` from framer-motion's `useReducedMotion()` is
 * `null` during SSR/first paint, so we don't trust it until after mount to
 * avoid a hydration mismatch — until then scenes still cycle normally.
 *
 * When reduced motion is confirmed, playback freezes on the final scene and
 * `isStatic` becomes true so callers can skip mount/unmount enter animations.
 */
export function useGuideScene(
  sceneCount: number,
  intervalMs: number,
  reduceMotion: boolean | null,
): { scene: number; isStatic: boolean } {
  const [isMounted, setIsMounted] = useState(false)
  const [scene, setScene] = useState(0)
  const isStatic = isMounted && Boolean(reduceMotion)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isStatic) return

    const id = setInterval(() => {
      setScene((current) => (current + 1) % sceneCount)
    }, intervalMs)

    return () => clearInterval(id)
  }, [sceneCount, intervalMs, isStatic])

  return { scene: isStatic ? sceneCount - 1 : scene, isStatic }
}
