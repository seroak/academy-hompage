export const queryKeys = {
  children: {
    all: ['children'] as const,
  },
  notices: {
    all: ['notices'] as const,
    detail: (id: string) => ['notices', id] as const,
  },
  reservations: {
    all: ['reservations'] as const,
    list: (filters: unknown) => ['reservations', filters] as const,
    detail: (id: string) => ['reservations', id] as const,
  },
  myReservations: {
    all: ['myReservations'] as const,
  },
  reservationGroups: {
    all: ['reservationGroups'] as const,
    detail: (id: string) => ['reservationGroups', id] as const,
  },
  joinableGroups: {
    all: ['joinableGroups'] as const,
  },
  confirmedSlots: {
    all: ['confirmedSlots'] as const,
  },
  members: {
    all: ['members'] as const,
  },
  admins: {
    all: ['admins'] as const,
  },
  adminMe: {
    all: ['adminMe'] as const,
  },
  classSchedules: {
    all: ['classSchedules'] as const,
    published: ['classSchedules', 'published'] as const,
  },
}
