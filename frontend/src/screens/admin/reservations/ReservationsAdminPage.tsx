'use client'

import { useState } from 'react'
import ReservationDetailModal from '../../../components/ReservationDetailModal'
import { useReservationAdminState } from './hooks/useReservationAdminState'
import ReservationStats from './components/ReservationStats'
import ReservationAgeFilter from './components/ReservationAgeFilter'
import ReservationTimetable from './components/ReservationTimetable'
import GroupConfirmForm from './components/GroupConfirmForm'
import GroupDetailModal from './components/GroupDetailModal'
import WalkInMemberForm from './components/WalkInMemberForm'

type PageTab = 'reservations' | 'walkin'

function tabButtonClass(isActive: boolean) {
  return `rounded-full px-5 py-2.5 text-sm font-black transition duration-200 ${
    isActive
      ? 'bg-[#fff0cf] text-[#e86f00]'
      : 'bg-white text-[#3f3a31] hover:bg-[#fff4dc] hover:text-[#e86f00]'
  }`
}

export default function ReservationsAdminPage() {
  const admin = useReservationAdminState()
  const [activeTab, setActiveTab] = useState<PageTab>('reservations')

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[28px] bg-white px-6 py-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="text-sm font-black text-[#e86f00]">상담 예약 운영</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-[-0.01em] text-[#222222]">
            예약 관리
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6253]">
            학부모 상담 신청을 요일과 시간별로 확인하고, 아이들의 수업 그룹을 확정합니다.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff3c8] px-4 py-2 text-sm font-black text-[#9f4d00]">
          총 예약
          <span className="text-lg text-[#e86f00]">{admin.reservations.length}</span>
        </div>
      </section>

      <nav className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={tabButtonClass(activeTab === 'reservations')}
        >
          예약 관리
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('walkin')}
          className={tabButtonClass(activeTab === 'walkin')}
        >
          학생 직접 등록
        </button>
      </nav>

      <div className={activeTab === 'reservations' ? 'flex flex-col gap-8' : 'hidden'}>
        <ReservationStats statCards={admin.statCards} />
        <ReservationAgeFilter
          ageFilter={admin.ageFilter}
          onChangeAgeFilter={admin.setAgeFilter}
        />
        <ReservationTimetable
          isLoading={admin.isLoading}
          error={admin.error}
          selectedSlots={admin.selectedSlots}
          getCellReservations={admin.getCellReservations}
          groupByReservationId={admin.groupByReservationId}
          joinableGroupsForReservation={admin.joinableGroupsForReservation}
          onToggleSlot={admin.toggleSlot}
          onSelectCell={admin.selectCell}
          onOpenDetail={admin.setDetailReservation}
          onCancelReservation={admin.handleCancelReservation}
          onAddToGroup={admin.handleAddToGroup}
          onOpenGroupDetail={admin.openGroupDetail}
        />
        <GroupConfirmForm
          selectedSlots={admin.selectedSlots}
          groupForm={admin.groupForm}
          groupCapacity={admin.groupCapacity}
          groupMinAge={admin.groupMinAge}
          groupMaxAge={admin.groupMaxAge}
          fieldErrors={admin.fieldErrors}
          submitError={admin.submitError}
          createError={admin.createError}
          isCreating={admin.isCreating}
          onChangeGroupForm={admin.setGroupForm}
          onRemoveSlot={admin.removeSlot}
          onSubmit={admin.handleConfirmGroup}
        />
      </div>

      <div className={activeTab === 'walkin' ? 'block' : 'hidden'}>
        <WalkInMemberForm />
      </div>

      <ReservationDetailModal
        reservation={admin.detailReservation}
        onClose={() => admin.setDetailReservation(null)}
      />
      <GroupDetailModal
        group={admin.detailGroup}
        allGroups={admin.groups}
        waitingReservations={admin.reservations.filter((r) => r.status === 'WAITING')}
        requestedReservations={admin.detailGroup ? admin.requestedReservationsForGroup(admin.detailGroup.id) : []}
        onClose={admin.closeGroupDetail}
        onUpdateGroup={admin.handleUpdateGroupInfo}
        onRemoveMember={admin.handleRemoveMember}
        onReplaceMemberSlots={admin.handleReplaceMemberSlots}
        onMoveMember={admin.handleMoveMember}
        onAddMember={admin.handleApproveRequest}
        onCancelGroup={admin.handleCancelGroup}
      />
    </div>
  )
}
