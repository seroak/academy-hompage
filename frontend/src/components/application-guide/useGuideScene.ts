'use client'

import { useEffect, useState } from 'react'

/**
 * Cycles through `sceneCount` scenes on an interval, for looping decorative
 * previews. Reduced-motion users see the final state without loading an
 * animation runtime.
 */
export function useGuideScene(
  sceneCount: number,
  intervalMs: number,
): { scene: number; isStatic: boolean } {
  const [scene, setScene] = useState(0)
  const [isStatic, setIsStatic] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setIsStatic(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
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
