import type { ReactNode } from 'react'

export default function PreviewFrame({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <div
      data-testid={testId}
      aria-hidden="true"
      className="aspect-[8/5] w-full overflow-hidden rounded-[18px] border border-[#f2dfb9] bg-[#fff8eb] p-3"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[12px] border border-slate-200 bg-white p-4 shadow-[0_8px_20px_rgba(95,67,18,0.06)]">
        {children}
      </div>
    </div>
  )
}
