import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { initializeMetaPixel, trackInitialMetaPageView } from '../../src/lib/marketing/metaPixel'
import { getMarketingSessionId } from '../../src/lib/marketing/session'

test('마케팅 기능은 역할별 공개 인터페이스로 분리된다', () => {
  const marketingDirectory = resolve(process.cwd(), 'src/lib/marketing')

  expect(existsSync(resolve(process.cwd(), 'src/lib/marketing.ts'))).toBe(false)
  expect(existsSync(resolve(marketingDirectory, 'attribution.ts'))).toBe(true)
  expect(existsSync(resolve(marketingDirectory, 'trackingWindow.ts'))).toBe(true)
  expect(existsSync(resolve(marketingDirectory, 'analytics.ts'))).toBe(true)
  expect(existsSync(resolve(marketingDirectory, 'metaPixel.ts'))).toBe(true)
  expect(existsSync(resolve(marketingDirectory, 'events.ts'))).toBe(true)
  expect(existsSync(resolve(marketingDirectory, 'session.ts'))).toBe(true)
  expect(existsSync(resolve(marketingDirectory, 'firstParty.ts'))).toBe(true)
})

test('같은 Meta Pixel은 초기화와 최초 PageView를 한 번만 큐에 넣는다', () => {
  const trackingWindow: { fbq?: { queue?: unknown[][] } } = {}
  const appendedScripts: unknown[] = []
  const trackingDocument = {
    querySelector: () => null,
    createElement: () => ({ async: false, src: '', dataset: {} }),
    head: { appendChild: (script: unknown) => appendedScripts.push(script) },
  }
  const originalWindow = globalThis.window
  const originalDocument = globalThis.document
  Object.defineProperty(globalThis, 'window', { value: trackingWindow, configurable: true })
  Object.defineProperty(globalThis, 'document', { value: trackingDocument, configurable: true })

  try {
    initializeMetaPixel('1234567890')
    trackInitialMetaPageView()
    initializeMetaPixel('1234567890')
    trackInitialMetaPageView()

    const calls = trackingWindow.fbq?.queue ?? []
    expect(calls.filter((call) => call[0] === 'init')).toHaveLength(1)
    expect(calls.filter((call) => call[0] === 'track' && call[1] === 'PageView')).toHaveLength(1)
    expect(appendedScripts).toHaveLength(1)
  } finally {
    Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true })
    Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true })
  }
})

test('익명 마케팅 세션은 마지막 활동 후 30분이 지나면 교체된다', () => {
  const values = new Map<string, string>()
  const originalWindow = globalThis.window
  Object.defineProperty(globalThis, 'window', { value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } }, configurable: true })
  try {
    const first = getMarketingSessionId(0)
    expect(getMarketingSessionId(29 * 60 * 1000)).toBe(first)
    expect(getMarketingSessionId(60 * 60 * 1000)).not.toBe(first)
  } finally {
    Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true })
  }
})
