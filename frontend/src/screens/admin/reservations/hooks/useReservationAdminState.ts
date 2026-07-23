import { useMemo, useState } from 'react'
import { useReservationsQuery } from '../../hooks/useReservationsQuery'
import { useReservationGroupsQuery } from '../../hooks/useReservationGroupsQuery'
import { useReservationMutations } from '../../hooks/useReservationMutations'
import { useReservationGroupMutations } from '../../hooks/useReservationGroupMutations'
import { useReservationTimetable } from './useReservationTimetable'
import { useReservationModals } from './useReservationModals'
import { useGridSelection } from './useGridSelection'
import { useGroupForm } from './useGroupForm'
import { useReservationAdminActions } from './useReservationAdminActions'

export function useReservationAdminState() {
  const [ageFilter, setAgeFilter] = useState<number | undefined>(undefined)
  const { reservations, isLoading, error } = useReservationsQuery(
    ageFilter !== undefined ? { age: ageFilter } : {},
  )
  const { groups, isLoading: isGroupsLoading } = useReservationGroupsQuery()
  
  const reservationMutations = useReservationMutations()
  const groupMutations = useReservationGroupMutations()

  const waiting = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'WAITING'),
    [reservations],
  )

  const { getCellReservations, groupByReservationId, joinableGroupsForReservation } =
    useReservationTimetable(waiting, groups)

  const modals = useReservationModals(reservations, groups)
  const gridSelection = useGridSelection(reservations, getCellReservations)
  const groupForm = useGroupForm(
    gridSelection.selectedSlots,
    gridSelection.selectedAges,
    gridSelection.selectedReservationCount,
    groupMutations.createGroup,
    gridSelection.clearSelection,
    groups,
  )

  const actions = useReservationAdminActions(
    reservations,
    groups,
    {
      updateReservation: reservationMutations.updateReservation,
      deleteReservation: reservationMutations.deleteReservation,
      addMember: groupMutations.addMember,
      deleteGroup: groupMutations.deleteGroup,
      updateGroup: groupMutations.updateGroup,
      removeMember: groupMutations.removeMember,
      replaceMemberSlots: groupMutations.replaceMemberSlots,
      moveMember: groupMutations.moveMember,
    },
    gridSelection.removeReservationSelection
  )

  return {
    ageFilter,
    setAgeFilter,
    isLoading,
    error,
    reservations,
    groups,
    isGroupsLoading,
    
    selectedSlots: gridSelection.selectedSlots,
    groupForm: groupForm.groupForm,
    setGroupForm: groupForm.setGroupForm,
    fieldErrors: groupForm.fieldErrors,
    submitError: groupForm.submitError,
    blankGroupFieldErrors: groupForm.blankGroupFieldErrors,
    blankGroupSubmitError: groupForm.blankGroupSubmitError,
    detailReservation: modals.detailReservation,
    setDetailReservation: modals.setDetailReservation,
    detailGroup: modals.detailGroup,
    
    isUpdating: reservationMutations.isUpdating,
    isCreating: groupMutations.isCreating,
    createError: groupMutations.createError,
    isAddingMember: groupMutations.isAddingMember,
    
    groupCapacity: groupForm.groupCapacity,
    groupMinAge: groupForm.groupMinAge,
    groupMaxAge: groupForm.groupMaxAge,
    selectedReservationCount: gridSelection.selectedReservationCount,
    
    getCellReservations,
    groupByReservationId,
    joinableGroupsForReservation,
    requestedReservationsForGroup: actions.requestedReservationsForGroup,
    
    toggleSlot: gridSelection.toggleSlot,
    removeSlot: gridSelection.removeSlot,
    selectCell: gridSelection.selectCell,
    
    handleConfirmGroup: groupForm.handleConfirmGroup,
    handleCreateBlankGroup: groupForm.handleCreateBlankGroup,
    
    handleUpdateReservation: actions.handleUpdateReservation,
    handleCancelReservation: actions.handleCancelReservation,
    handleCancelGroup: actions.handleCancelGroup,
    handleAddToGroup: actions.handleAddToGroup,
    handleApproveRequest: actions.handleApproveRequest,
    openGroupDetail: modals.openGroupDetail,
    closeGroupDetail: modals.closeGroupDetail,
    handleUpdateGroupInfo: actions.handleUpdateGroupInfo,
    handleRemoveMember: actions.handleRemoveMember,
    handleReplaceMemberSlots: actions.handleReplaceMemberSlots,
    handleMoveMember: actions.handleMoveMember,
    handleMoveMemberById: actions.handleMoveMemberById,
  }
}
