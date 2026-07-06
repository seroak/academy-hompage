export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    detail: (id: string) => ['courses', id] as const,
  },
  notices: {
    all: ['notices'] as const,
    detail: (id: string) => ['notices', id] as const,
  },
  instructors: {
    all: ['instructors'] as const,
    detail: (id: string) => ['instructors', id] as const,
  },
  reservations: {
    all: ['reservations'] as const,
    list: (filters: unknown) => ['reservations', filters] as const,
    detail: (id: string) => ['reservations', id] as const,
  },
  reservationGroups: {
    all: ['reservationGroups'] as const,
    detail: (id: string) => ['reservationGroups', id] as const,
  },
}
