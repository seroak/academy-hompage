'use client'

import { useEffect, type RefObject } from 'react'

export function useClickOutsideAndEscape(containerRef: RefObject<HTMLElement | null>, isActive: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!isActive) return

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && event.target instanceof Node && !containerRef.current.contains(event.target)) {
        onDismiss()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, isActive, onDismiss])
}
