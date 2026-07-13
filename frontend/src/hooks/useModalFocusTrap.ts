'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableElements(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0,
  )
}

export function useModalFocusTrap(isOpen: boolean) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!isOpen) return

    if (!dialogRef.current) return
    const dialogElement = dialogRef.current as HTMLDialogElement

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusInitialElement = () => {
      const initial = dialogElement.querySelector<HTMLElement>('[data-autofocus]') ?? focusableElements(dialogElement)[0] ?? dialogElement
      initial.focus()
    }
    const animationFrame = window.requestAnimationFrame(focusInitialElement)

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== 'Tab') return
      if (event.isComposing) return

      const focusables = focusableElements(dialogElement)
      if (focusables.length === 0) {
        event.preventDefault()
        dialogElement.focus()
        return
      }

      const activeElement = document.activeElement
      const currentIndex = activeElement instanceof HTMLElement ? focusables.indexOf(activeElement) : -1
      const nextIndex = event.shiftKey
        ? currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1
        : currentIndex === focusables.length - 1 ? 0 : currentIndex + 1

      event.preventDefault()
      focusables[nextIndex].focus()
    }

    document.addEventListener('keydown', trapFocus)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      document.removeEventListener('keydown', trapFocus)
      if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [isOpen])

  return dialogRef
}
