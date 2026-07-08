'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import ReservationDetailModal from '../../../components/ReservationDetailModal'
import { useReservationAdminState } from './hooks/useReservationAdminState'
import ReservationStats from './components/ReservationStats'
import ReservationAgeFilter from './components/ReservationAgeFilter'
import ReservationTimetable from './components/ReservationTimetable'
import GroupConfirmForm from './components/GroupConfirmForm'
import ConfirmedGroupList from './components/ConfirmedGroupList'
import GroupDetailModal from './components/GroupDetailModal'
import ReservationTabNav, { ReservationTab } from './components/ReservationTabNav'

export default function ReservationsAdminPage() {
  const admin = useReservationAdminState()
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab: ReservationTab = searchParams.get('tab') === 'confirmed' ? 'confirmed' : 'requests'

  function handleChangeTab(tab: ReservationTab) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'requests') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const query = params.toString()
    router.push(`/admin/reservations${query ? `?${query}` : ''}`)
  }

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

      <ReservationTabNav
        activeTab={activeTab}
        confirmedGroupCount={admin.groups.length}
        onChangeTab={handleChangeTab}
      />

      {activeTab === 'requests' && (
        <>
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
            groupLabelByReservationId={admin.groupLabelByReservationId}
            joinableGroupsForReservation={admin.joinableGroupsForReservation}
            onToggleSlot={admin.toggleSlot}
            onSelectCell={admin.selectCell}
            onOpenDetail={admin.setDetailReservation}
            onCancelReservation={admin.handleCancelReservation}
            onAddToGroup={admin.handleAddToGroup}
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
            walkInMembers={admin.walkInMembers}
            onChangeGroupForm={admin.setGroupForm}
            onRemoveSlot={admin.removeSlot}
            onAddWalkInMember={admin.addWalkInMember}
            onRemoveWalkInMember={admin.removeWalkInMember}
            onSubmit={admin.handleConfirmGroup}
          />
        </>
      )}

      {activeTab === 'confirmed' && (
        <ConfirmedGroupList
          groups={admin.groups}
          requestedReservationsForGroup={admin.requestedReservationsForGroup}
          onCancelGroup={admin.handleCancelGroup}
          onApproveRequest={admin.handleApproveRequest}
          onOpenGroupDetail={admin.openGroupDetail}
        />
      )}

      <ReservationDetailModal
        reservation={admin.detailReservation}
        onClose={() => admin.setDetailReservation(null)}
      />
      <GroupDetailModal
        group={admin.detailGroup}
        allGroups={admin.groups}
        waitingReservations={admin.reservations.filter((r) => r.status === 'WAITING')}
        onClose={admin.closeGroupDetail}
        onUpdateGroup={admin.handleUpdateGroupInfo}
        onRemoveMember={admin.handleRemoveMember}
        onReplaceMemberSlots={admin.handleReplaceMemberSlots}
        onMoveMember={admin.handleMoveMember}
        onAddMember={admin.handleApproveRequest}
      />
    </div>
  )
}
