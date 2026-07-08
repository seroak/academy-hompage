export type ReservationTab = 'requests' | 'confirmed'

type Props = {
  activeTab: ReservationTab
  confirmedGroupCount: number
  onChangeTab: (tab: ReservationTab) => void
}

function tabButtonClass(isActive: boolean) {
  return `rounded-full px-5 py-2.5 text-sm font-black transition duration-200 ${
    isActive
      ? 'bg-[#fff0cf] text-[#e86f00]'
      : 'bg-white text-[#3f3a31] hover:bg-[#fff4dc] hover:text-[#e86f00]'
  }`
}

export default function ReservationTabNav({ activeTab, confirmedGroupCount, onChangeTab }: Props) {
  return (
    <nav className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChangeTab('requests')}
        className={tabButtonClass(activeTab === 'requests')}
      >
        예약 신청
      </button>
      <button
        type="button"
        onClick={() => onChangeTab('confirmed')}
        className={tabButtonClass(activeTab === 'confirmed')}
      >
        확정된 그룹 ({confirmedGroupCount})
      </button>
    </nav>
  )
}
