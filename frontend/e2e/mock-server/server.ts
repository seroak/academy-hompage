// 공개 페이지(SSR)가 Next 서버 프로세스에서 직접 호출하는 백엔드를 대신하는 목 API 서버.
// Playwright의 page.route()는 브라우저 네트워크만 가로채므로, 서버 컴포넌트가 만드는
// 요청(notices 목록·상세)은 이 서버가 실제로 응답해야 한다.
// 클라이언트(브라우저)에서 fetch하는 나머지 API는 각 spec의 page.route()가 담당하므로
// 여기서는 다루지 않는다.
import { createServer, type ServerResponse } from 'node:http'
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

const notices = loadFixture<FixtureItem[]>('notices.json')

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(payload)
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const { pathname } = url
  const method = req.method ?? 'GET'

  if (pathname === '/__health') {
    sendJson(res, 200, { ok: true })
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
