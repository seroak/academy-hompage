import LeadConsultationForm from './LeadConsultationForm'

export default function ConsultationSection() {
  return (
    <section
      className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 sm:py-24"
      aria-labelledby="consultation-section-heading"
    >
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-sm font-bold tracking-[0.08em] text-brand-700">부담 없이 남기는 상담 신청</p>
          <h2
            id="consultation-section-heading"
            className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-ink-900 sm:text-4xl"
          >
            상담 신청은 등록 확정이 아닙니다
          </h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-ink-700">
            아이의 연령과 수학 경험을 남겨주시면, 맞는 과정과 가능한 수업 시간을 안내해 드립니다.
          </p>
        </div>
        <LeadConsultationForm />
      </div>
    </section>
  )
}
