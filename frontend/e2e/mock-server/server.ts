// 공개 페이지(SSR)가 Next 서버 프로세스에서 직접 호출하는 백엔드를 대신하는 목 API 서버.
// Playwright의 page.route()는 브라우저 네트워크만 가로채므로, 서버 컴포넌트가 만드는
// 요청(courses/instructors/notices 목록·상세)은 이 서버가 실제로 응답해야 한다.
// 클라이언트(브라우저)에서 fetch하는 나머지 API는 각 spec의 page.route()가 담당하므로
// 여기서는 다루지 않는다.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, '..', 'fixtures')

function loadFixture<T>(name: string): T {
  const raw = readFileSync(path.join(fixturesDir, name), 'utf8')
  return JSON.parse(raw) as T
}

interface FixtureItem {
  id: string
  [key: string]: unknown
}

const courses = loadFixture<FixtureItem[]>('courses.json')
const instructors = loadFixture<FixtureItem[]>('instructors.json')
const notices = loadFixture<FixtureItem[]>('notices.json')

// public-smoke.spec.ts가 폴백(빈 배열) 렌더링을 검증하기 위해 1회성으로 토글하는 시나리오.
// 소비되면 즉시 'default'로 되돌아가 다른 테스트를 오염시키지 않는다.
type Scenario = 'default' | 'courses-500' | 'courses-empty'
let scenario: Scenario = 'default'

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(payload)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const { pathname } = url
  const method = req.method ?? 'GET'

  if (pathname === '/__health') {
    sendJson(res, 200, { ok: true })
    return
  }

  if (pathname === '/__scenario' && method === 'POST') {
    const body = await readBody(req)
    const parsed = body ? (JSON.parse(body) as { name?: Scenario }) : {}
    scenario = parsed.name ?? 'default'
    res.writeHead(204)
    res.end()
    return
  }

  if (pathname === '/courses' && method === 'GET') {
    // Next dev 서버는 SSR 중 같은 fetch를 두 번(RSC payload + HTML) 호출하는 경우가 있어
    // 시나리오를 1회성으로 소비하면 두 번째 요청이 기본값을 받아버린다. 따라서 시나리오는
    // 테스트가 명시적으로 'default'로 되돌릴 때까지 유지한다(1회성 소비 금지).
    if (scenario === 'courses-500') {
      sendJson(res, 500, { message: 'mock forced error' })
      return
    }
    if (scenario === 'courses-empty') {
      sendJson(res, 200, [])
      return
    }
    sendJson(res, 200, courses)
    return
  }

  const courseDetailMatch = pathname.match(/^\/courses\/([^/]+)$/)
  if (courseDetailMatch && method === 'GET') {
    const found = courses.find((course) => course.id === courseDetailMatch[1])
    if (!found) {
      sendJson(res, 404, { message: 'not found' })
      return
    }
    sendJson(res, 200, found)
    return
  }

  if (pathname === '/instructors' && method === 'GET') {
    sendJson(res, 200, instructors)
    return
  }

  if (pathname === '/notices' && method === 'GET') {
    sendJson(res, 200, notices)
    return
  }

  const noticeDetailMatch = pathname.match(/^\/notices\/([^/]+)$/)
  if (noticeDetailMatch && method === 'GET') {
    const found = notices.find((notice) => notice.id === noticeDetailMatch[1])
    if (!found) {
      sendJson(res, 404, { message: 'not found' })
      return
    }
    sendJson(res, 200, found)
    return
  }

  sendJson(res, 404, { message: `no mock route for ${method} ${pathname}` })
})

const port = Number(process.env.MOCK_API_PORT ?? 4310)
server.listen(port, () => {
  console.log(`[mock-server] listening on http://localhost:${port}`)
})
