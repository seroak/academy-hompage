import type { NextConfig } from 'next'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

// Vercel은 자체 output file tracing을 사용하므로 standalone 불필요.
// standalone/outputFileTracingRoot는 Dockerfile(.next/standalone COPY) 전용이다.
const isVercel = !!process.env.VERCEL

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isVercel ? {} : { output: 'standalone', outputFileTracingRoot: root }),
  turbopack: {
    root,
  },
  ...(process.env.NEXT_E2E ? { distDir: '.next-e2e' } : {}),
}

export default nextConfig
