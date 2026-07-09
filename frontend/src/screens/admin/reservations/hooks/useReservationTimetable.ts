import { useMemo, useCallback } from "react";
import { Reservation } from "../../../../api/schemas/reservation.schema";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { DayOfWeek } from "../types";
import { ADMIN_ROW_MINUTES, isGroupJoinableForReservation } from "../utils/reservationAdminUtils";

export type CellData = {
  waitingInCell: Reservation[];
  groupedInCell: Reservation[];
  rowSpan: number;
  skipRender: boolean;
};

function createEmptyCell(): CellData {
  return {
    waitingInCell: [],
    groupedInCell: [],
    rowSpan: 1,
    skipRender: false,
  };
}

function getCell(map: Map<string, CellData>, day: string, rowStart: number): CellData {
  const key = `${day}-${rowStart}`;

  if (!map.has(key)) {
    map.set(key, createEmptyCell());
  }

  return map.get(key)!;
}

function getRowRange(startMinute: number, endMinute: number) {
  const startRow = Math.floor(startMinute / ADMIN_ROW_MINUTES) * ADMIN_ROW_MINUTES;

  const endRow = Math.ceil(endMinute / ADMIN_ROW_MINUTES) * ADMIN_ROW_MINUTES;

  return {
    startRow,
    endRow,
    span: (endRow - startRow) / ADMIN_ROW_MINUTES,
  };
}

function addUniqueReservation(reservations: Reservation[], reservation: Reservation) {
  if (!reservations.some((existing) => existing.id === reservation.id)) {
    reservations.push(reservation);
  }
}

function findRenderableCell(map: Map<string, CellData>, day: string, rowStart: number): CellData {
  let targetRowStart = rowStart;
  let targetCell = getCell(map, day, targetRowStart);

  while (targetCell.skipRender && targetRowStart >= 0) {
    targetRowStart -= ADMIN_ROW_MINUTES;
    targetCell = getCell(map, day, targetRowStart);
  }

  return targetCell;
}

function addConfirmedGroupsToCellMap(map: Map<string, CellData>, groups: ReservationGroup[]) {
  for (const group of groups) {
    if (group.status !== "CONFIRMED") continue;

    const groupReservations = group.reservations ?? [];

    for (const slot of group.slots) {
      const { startRow, span } = getRowRange(slot.startMinute, slot.endMinute);

      if (span <= 0) continue;

      const firstCell = getCell(map, slot.dayOfWeek, startRow);

      firstCell.rowSpan = Math.max(firstCell.rowSpan, span);

      for (const reservation of groupReservations) {
        addUniqueReservation(firstCell.groupedInCell, reservation);
      }

      for (let i = 1; i < span; i++) {
        const nextRowStart = startRow + i * ADMIN_ROW_MINUTES;
        const nextCell = getCell(map, slot.dayOfWeek, nextRowStart);

        nextCell.skipRender = true;
      }
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

  addConfirmedGroupsToCellMap(map, groups);
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
