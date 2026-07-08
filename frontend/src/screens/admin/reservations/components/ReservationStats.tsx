type StatCard = {
  label: string
  count: number
  className: string
}

export default function ReservationStats({ statCards }: { statCards: StatCard[] }) {
  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="rounded-[24px] border border-[#f2dfb9] bg-white p-5 shadow-[0_14px_36px_rgba(95,67,18,0.07)]"
        >
          <p className={`w-fit rounded-full px-3 py-1 text-xs font-black ${card.className}`}>
            {card.label}
          </p>
          <p className="mt-4 text-3xl font-black text-[#222222]">{card.count}</p>
        </div>
      ))}
    </section>
  )
}
