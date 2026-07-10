'use client'

import Link from 'next/link'
import { useReservationAdminState } from './hooks/useReservationAdminState'
import GroupManagementCard from './components/GroupManagementCard'
import GroupDetailModal from './components/GroupDetailModal'

export default function GroupManagementAdminPage() {
  const admin = useReservationAdminState()

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[28px] bg-white px-6 py-6 shadow-[0_18px_46px_rgba(95,67,18,0.08)] sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <div className="mb-2">
            <Link
              href="/admin/reservations"
              className="text-sm font-semibold text-[#6f6253] transition hover:text-[#e86f00]"
            >
              &larr; 예약 관리로 돌아가기
            </Link>
          </div>
          <p className="text-sm font-black text-[#e86f00]">학원 수업 운영</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-[-0.01em] text-[#222222]">
            수업 관리
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#6f6253]">
            시간표 선택 없이 독립적인 그룹을 직접 만들고 삭제할 수 있습니다.
          </p>
        </div>
      </section>

      <GroupManagementCard
        groups={admin.groups}
        fieldErrors={admin.blankGroupFieldErrors}
        submitError={admin.blankGroupSubmitError}
        isCreating={admin.isCreating}
        onCreateBlankGroup={admin.handleCreateBlankGroup}
        onDeleteGroup={admin.handleCancelGroup}
        onOpenGroupDetail={admin.openGroupDetail}
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
