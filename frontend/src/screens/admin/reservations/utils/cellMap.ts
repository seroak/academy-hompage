import { Reservation } from "../../../../api/schemas/reservation.schema";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { ADMIN_ROW_MINUTES } from "./reservationAdminUtils";

export type CellData = {
  waitingInCell: Reservation[];
  groupedInCell: Reservation[];
  emptyGroupsInCell: ReservationGroup[];
  rowSpan: number;
  skipRender: boolean;
};

export function createEmptyCell(): CellData {
  return {
    waitingInCell: [],
    groupedInCell: [],
    emptyGroupsInCell: [],
    rowSpan: 1,
    skipRender: false,
  };
}

export function getCell(map: Map<string, CellData>, day: string, rowStart: number): CellData {
  const key = `${day}-${rowStart}`;

  if (!map.has(key)) {
    map.set(key, createEmptyCell());
  }

  return map.get(key)!;
}

export function getRowRange(startMinute: number, endMinute: number) {
  const startRow = Math.floor(startMinute / ADMIN_ROW_MINUTES) * ADMIN_ROW_MINUTES;

  const endRow = Math.ceil(endMinute / ADMIN_ROW_MINUTES) * ADMIN_ROW_MINUTES;

  return {
    startRow,
    endRow,
    span: (endRow - startRow) / ADMIN_ROW_MINUTES,
  };
}

export function addUniqueReservation(reservations: Reservation[], reservation: Reservation) {
  if (!reservations.some((existing) => existing.id === reservation.id)) {
    reservations.push(reservation);
  }
}

export function addUniqueGroup(groups: ReservationGroup[], group: ReservationGroup) {
  if (!groups.some((existing) => existing.id === group.id)) {
    groups.push(group);
  }
}

/** rowStart 행이 다른 그룹의 rowSpan에 덮여 있으면, 실제로 렌더되는(=skipRender가 아닌) 진짜 앵커 행 번호를 찾는다. */
export function findRenderableRowStart(map: Map<string, CellData>, day: string, rowStart: number): number {
  let targetRowStart = rowStart;

  while (getCell(map, day, targetRowStart).skipRender && targetRowStart >= 0) {
    targetRowStart -= ADMIN_ROW_MINUTES;
  }

  return targetRowStart;
}

export function findRenderableCell(map: Map<string, CellData>, day: string, rowStart: number): CellData {
  return getCell(map, day, findRenderableRowStart(map, day, rowStart));
}

/** (day, startRow~endRow) 구간을 셀 맵에 배치한다. 그룹 간 시간 겹침은 백엔드 검증으로 차단되므로,
 * 앵커 행은 항상 startRow 자신이다. */
export function placeInCellMap(
  map: Map<string, CellData>,
  day: string,
  startRow: number,
  endRow: number,
  apply: (cell: CellData) => void,
) {
  const cell = getCell(map, day, startRow);
  cell.rowSpan = Math.max(cell.rowSpan, (endRow - startRow) / ADMIN_ROW_MINUTES);
  apply(cell);

  for (let row = startRow + ADMIN_ROW_MINUTES; row < endRow; row += ADMIN_ROW_MINUTES) {
    getCell(map, day, row).skipRender = true;
  }
}
