'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import MarketingConsent from '../components/MarketingConsent'
import { queryClient } from '../lib/queryClient'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <MarketingConsent />
    </QueryClientProvider>
  )
}
