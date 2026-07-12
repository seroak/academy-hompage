import path from 'node:path'

const authDir = path.join(process.cwd(), 'e2e/.auth')

// 보호자 전용(관리자 세션 없음) — /apply 정상 플로우에 사용.
export const PARENT_STORAGE_STATE = path.join(authDir, 'parent.json')
// 관리자 전용(보호자 세션 없음) — /admin/* 플로우와, /apply의 isAdminPreview 케이스에 사용.
export const ADMIN_STORAGE_STATE = path.join(authDir, 'admin.json')
