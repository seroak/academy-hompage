'use client'

export default function ConsentSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('openmath:open-consent'))}
      className="underline decoration-[#c9ad79] underline-offset-4 transition hover:text-[#e86f00] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e86f00]"
    >
      분석 및 마케팅 설정
    </button>
  )
}
