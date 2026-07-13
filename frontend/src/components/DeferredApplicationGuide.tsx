'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const ApplicationGuideSection = dynamic(() => import('./ApplicationGuideSection'), {
  ssr: false,
})

export default function DeferredApplicationGuide() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setShouldRender(true)
        observer.disconnect()
      },
      { rootMargin: '300px 0px' },
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      data-testid="deferred-application-guide"
      className={shouldRender ? undefined : 'min-h-[760px] lg:min-h-[620px]'}
    >
      {shouldRender ? <ApplicationGuideSection /> : null}
    </div>
  )
}
