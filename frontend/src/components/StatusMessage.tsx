interface StatusMessageProps {
  isLoading?: boolean
  error?: unknown
  loadingText?: string
  errorText?: string
}

export default function StatusMessage({
  isLoading,
  error,
  loadingText = '불러오는 중...',
  errorText = '데이터를 불러오지 못했습니다.',
}: StatusMessageProps) {
  if (isLoading) {
    return <p className="py-10 text-center text-slate-500">{loadingText}</p>
  }

  if (error) {
    return <p className="py-10 text-center text-red-600">{errorText}</p>
  }

  return null
}
