const measurementRows = [
  {
    section: "노출·링크 클릭·광고비",
    method: "Meta Marketing API에서 광고별 일일 데이터 동기화",
    unit: "Meta 집계 횟수",
  },
  {
    section: "랜딩 방문",
    method: "광고 랜딩이 열리면 view_ad_landing 이벤트를 자체 서버에 전송",
    unit: "30분 기준 고유 세션",
  },
  {
    section: "CTA 클릭",
    method: "‘무료 상담 신청’ 버튼을 누르면 consultation_cta_click 전송",
    unit: "클릭 횟수",
  },
  {
    section: "폼 시작",
    method: "폼 안의 입력칸을 처음 건드리면 lead_form_start 전송",
    unit: "페이지 로드당 최대 1회",
  },
  {
    section: "제출 시도·차단·오류",
    method: "제출 클릭, 필수 입력·Turnstile 차단, API 실패를 자체 서버에 각각 전송",
    unit: "이벤트 발생 횟수",
  },
  {
    section: "상담 신청",
    method: "Turnstile 검증을 통과하고 실제 Lead DB 행이 생성된 수",
    unit: "저장된 신청 건수",
  },
  {
    section: "유효 상담·예약·방문·등록",
    method: "관리자가 상담 상태를 변경",
    unit: "Lead 상태별 건수",
  },
] as const;

const mobileLabelClass = "mb-1 block text-[11px] font-black text-[#9a6438] sm:hidden";

export default function MarketingMeasurementGuide() {
  return (
    <details className="mt-10 border-y border-[#ead9b7] bg-[#fffdf7]">
      <summary className="cursor-pointer px-5 py-5 text-base font-black text-[#29251f] marker:text-[#d96000]">
        측정 기준 보기
      </summary>
      <div className="border-t border-[#ead9b7] px-4 py-5 sm:px-5">
        <p className="rounded-xl bg-[#fff1c7] px-4 py-3 text-sm font-bold leading-6 text-[#765421]">
          클릭·세션·이벤트·DB 건수는 서로 다른 집계 단위이며 실제 고유 인원과 같지 않을 수 있습니다.
        </p>
        <table aria-label="광고 분석 측정 기준" className="mt-5 w-full table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">광고 분석 구간별 측정 방식과 집계 단위</caption>
          <colgroup>
            <col className="w-1/4" />
            <col className="w-1/2" />
            <col className="w-1/4" />
          </colgroup>
          <thead className="hidden border-y border-[#ead9b7] bg-[#fff9ec] sm:table-header-group">
            <tr>
              <th scope="col" className="px-4 py-3 font-black text-[#6a604f]">구간</th>
              <th scope="col" className="px-4 py-3 font-black text-[#6a604f]">측정 방식</th>
              <th scope="col" className="px-4 py-3 font-black text-[#6a604f]">집계 단위</th>
            </tr>
          </thead>
          <tbody className="block sm:table-row-group">
            {measurementRows.map((row) => (
              <tr key={row.section} className="block border-t border-[#ead9b7] first:border-t-0 sm:table-row sm:first:border-t">
                <td className="block px-4 pt-4 font-black text-[#29251f] sm:table-cell sm:py-4 sm:align-top">
                  <span className={mobileLabelClass}>구간</span>
                  {row.section}
                </td>
                <td className="block px-4 pt-3 font-medium leading-6 text-[#655b4c] sm:table-cell sm:py-4 sm:align-top">
                  <span className={mobileLabelClass}>측정 방식</span>
                  {row.method}
                </td>
                <td className="block px-4 pb-4 pt-3 font-bold text-[#4f463a] sm:table-cell sm:py-4 sm:align-top">
                  <span className={mobileLabelClass}>집계 단위</span>
                  {row.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
