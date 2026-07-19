import type { OAuthProvider } from '../../api/schemas/auth.schema'

export const socialProviders: Array<{ provider: OAuthProvider; label: string; className: string }> = [
  {
    provider: 'google',
    label: 'Google로 계속하기',
    className: 'border-[#ead7ad] bg-white text-[#2b2418] hover:border-[#ffd66b]',
  },
  {
    provider: 'kakao',
    label: '카카오로 계속하기',
    className: 'border-[#f6df36] bg-[#f6df36] text-[#2b2418] hover:bg-[#f1d900]',
  },
  {
    provider: 'naver',
    label: '네이버로 계속하기',
    className: 'border-[#03c75a] bg-[#03c75a] text-white hover:bg-[#02b351]',
  },
]
