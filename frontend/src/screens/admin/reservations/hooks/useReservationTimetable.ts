import { useMemo, useCallback } from "react";
import { Reservation } from "../../../../api/schemas/reservation.schema";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { DayOfWeek } from "../types";
import { isGroupJoinableForReservation } from "../utils/groupJoinability";
import { ADMIN_ROW_MINUTES } from "../utils/reservationAdminUtils";
import {
  CellData,
  createEmptyCell,
  getRowRange,
  addUniqueReservation,
  addUniqueGroup,
  findRenderableCell,
  placeInCellMap,
} from "../utils/cellMap";

export type { CellData } from "../utils/cellMap";

function addActiveGroupsToCellMap(map: Map<string, CellData>, groups: ReservationGroup[]) {
  for (const group of groups) {
    if (group.status !== "CONFIRMED" && group.status !== "EMPTY") continue;

    const groupReservations = group.reservations ?? [];

    for (const slot of group.slots) {
      const { startRow, endRow, span } = getRowRange(slot.startMinute, slot.endMinute);

      if (span <= 0) continue;

      placeInCellMap(map, slot.dayOfWeek, startRow, endRow, (cell) => {
        if (groupReservations.length === 0) {
          addUniqueGroup(cell.emptyGroupsInCell, group);
        } else {
          for (const reservation of groupReservations) {
            addUniqueReservation(cell.groupedInCell, reservation);
          }
        }
      });
    }

    if (
      groupReservations.length === 0 &&
      group.slots.length === 0 &&
      group.scheduleDayOfWeek &&
      typeof group.scheduleStartMinute === "number" &&
      typeof group.scheduleEndMinute === "number"
    ) {
      const { startRow, endRow, span } = getRowRange(group.scheduleStartMinute, group.scheduleEndMinute);
      if (span <= 0) continue;

      placeInCellMap(map, group.scheduleDayOfWeek, startRow, endRow, (cell) => {
        addUniqueGroup(cell.emptyGroupsInCell, group);
      });
    }
  }
}

function addWaitingReservationsToCellMap(map: Map<string, CellData>, waiting: Reservation[]) {
  for (const reservation of waiting) {
    for (const slot of reservation.preferredSlots) {
      const { startRow, endRow } = getRowRange(slot.startMinute, slot.endMinute);

      for (let rowStart = startRow; rowStart < endRow; rowStart += ADMIN_ROW_MINUTES) {
        const isOverlapping = rowStart < slot.endMinute && rowStart + ADMIN_ROW_MINUTES > slot.startMinute;

        if (!isOverlapping) continue;

        const targetCell = findRenderableCell(map, slot.dayOfWeek, rowStart);

        addUniqueReservation(targetCell.waitingInCell, reservation);
      }
    }
  }
}

function createCellMap(waiting: Reservation[], groups: ReservationGroup[]): Map<string, CellData> {
  const map = new Map<string, CellData>();

  addActiveGroupsToCellMap(map, groups);
  addWaitingReservationsToCellMap(map, waiting);

  return map;
}

function createGroupMap(groups: ReservationGroup[]): Map<string, ReservationGroup> {
  const map = new Map<string, ReservationGroup>();

  for (const group of groups) {
    for (const reservation of group.reservations ?? []) {
      map.set(reservation.id, group);
    }
  }

  return map;
}

export function useReservationTimetable(waiting: Reservation[], groups: ReservationGroup[]) {
  const cellMap = useMemo(() => createCellMap(waiting, groups), [waiting, groups]);

  const getCellReservations = useCallback(
    (day: string, rowStart: number): CellData => {
      const key = `${day}-${rowStart}`;
      return cellMap.get(key) ?? createEmptyCell();
    },
    [cellMap],
  );

  const groupByReservationId = useMemo(() => createGroupMap(groups), [groups]);

  const joinableGroupsForReservation = useCallback(
    (reservation: Reservation, day: DayOfWeek) =>
      groups.filter((group) => isGroupJoinableForReservation(group, reservation, day)),
    [groups],
  );

  return {
    getCellReservations,
    groupByReservationId,
    joinableGroupsForReservation,
  };
}
