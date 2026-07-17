import { classTimes } from './data'

export default function ClassTimeTable() {
  return (
    <section className="py-12 sm:py-15">
      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.06em] text-[#e86f00]">CLASS TIME</p>
        <h2 className="mt-2 text-[clamp(1.625rem,2.8vw,2.25rem)] font-bold tracking-[-0.045em] text-[#222222]">연령별 수업시간</h2>
        <p className="mt-2 text-sm font-medium text-[#6a6256]">월 4회 기준, 아이 나이에 맞춰 수업 시간이 달라집니다.</p>
      </div>
      <div className="mx-auto mt-6 max-w-[520px] overflow-hidden rounded-[22px] border border-[#eadfc9] bg-white shadow-[0_12px_34px_rgba(95,67,18,0.06)]">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">연령별 수업시간 안내</caption>
          <thead>
            <tr className="border-b border-[#eadfc9] bg-[#fff9ec]">
              <th scope="col" className="px-6 py-4 text-sm font-bold text-[#514839]">연령</th>
              <th scope="col" className="px-6 py-4 text-sm font-bold text-[#514839]">수업시간</th>
            </tr>
          </thead>
          <tbody>
            {classTimes.map((row, index) => (
              <tr key={row.age} className={index < classTimes.length - 1 ? 'border-b border-[#eee6d9]' : ''}>
                <td className="px-6 py-4 text-[15px] font-bold text-[#2b271f]">
                  {row.age}
                  {row.note && <span className="block text-xs font-medium text-[#8a8175]">{row.note}</span>}
                </td>
                <td className="px-6 py-4 text-[15px] font-bold text-[#e86f00]">{row.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-xs text-[#8a8175]">* 월 4회 수업 기준입니다.</p>
    </section>
  )
}
