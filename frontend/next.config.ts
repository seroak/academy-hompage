import type { NextConfig } from 'next'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  turbopack: {
    root,
  },
  ...(process.env.NEXT_E2E ? { distDir: '.next-e2e' } : {}),
}

export default nextConfig
