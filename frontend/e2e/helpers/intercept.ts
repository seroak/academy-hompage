import type { Page, Route } from '@playwright/test'
import { MOCK_API_BASE_URL } from '../../playwright.config'

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
type RouteHandler = (route: Route) => void | Promise<void>

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 목 API 서버(예: http://localhost:4310)로 가는 요청만 정확히 매칭한다.
// pathPattern은 origin 뒤에 그대로 이어붙는 정규식 소스라 [^/]+ 같은 패턴을 쓸 수 있다.
// origin까지 통째로 앵커링해야 하는 이유: 앱 자신의 페이지 경로(예: /admin/notices,
// /admin/reservations)가 API 경로 문자열로 끝나는 경우 느슨한 정규식이 페이지 내비게이션
// 자체를 가로채 버려(실제로 겪은 버그) 브라우저가 JSON 응답을 그대로 렌더링하게 된다.
export function apiPattern(pathPattern: string): RegExp {
  return new RegExp(`^${escapeRegExp(MOCK_API_BASE_URL)}${pathPattern}`)
}

// 같은 URL에 메서드별로 다른 처리가 필요할 때 쓰는 헬퍼.
// 등록되지 않은 메서드는 route.continue()가 아니라 route.fallback()으로 넘겨
// 이후 등록된(혹은 실제 네트워크로 가는) 핸들러 체인이 이어지게 한다.
export function routeByMethod(page: Page, urlPattern: string | RegExp, handlers: Partial<Record<Method, RouteHandler>>) {
  return page.route(urlPattern, async (route) => {
    const method = route.request().method() as Method
    const handler = handlers[method]
    if (!handler) {
      await route.fallback()
      return
    }
    await handler(route)
  })
}

export function fulfillJson(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

export function fulfillNoContent(route: Route) {
  return route.fulfill({ status: 204 })
}
