import { Reservation } from "../../../../api/schemas/reservation.schema";
import { ReservationGroup } from "../../../../api/schemas/reservation-group.schema";
import { DragPayload } from "../utils/reservationAdminUtils";

export function parseDragPayload(raw: string): DragPayload | null {
  try {
    const payload: unknown = JSON.parse(raw);
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'reservationId' in payload &&
      'fromGroupId' in payload &&
      typeof payload.reservationId === 'string' &&
      typeof payload.fromGroupId === 'string'
    ) {
      return { reservationId: payload.reservationId, fromGroupId: payload.fromGroupId };
    }
  } catch {
    return null;
  }
  return null;
}

export function groupReservationsByGroup(
  reservations: Reservation[],
  groupByReservationId: Map<string, ReservationGroup>,
): Map<string, { group: ReservationGroup | null; reservations: Reservation[] }> {
  const map = new Map<string, { group: ReservationGroup | null; reservations: Reservation[] }>();

  for (const reservation of reservations) {
    const group = groupByReservationId.get(reservation.id) ?? null;
    const key = group?.id ?? "unknown";

    if (!map.has(key)) {
      map.set(key, { group, reservations: [] });
    }
    map.get(key)!.reservations.push(reservation);
  }

  return map;
}
