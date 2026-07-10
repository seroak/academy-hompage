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
  levelTests: {
    questions: {
      all: ['levelTests', 'questions'] as const,
      list: (age?: number) => ['levelTests', 'questions', age ?? null] as const,
    },
    config: {
      all: ['levelTests', 'config'] as const,
    },
    results: {
      all: ['levelTests', 'results'] as const,
      detail: (id: string) => ['levelTests', 'results', id] as const,
    },
    quiz: (age: number) => ['levelTests', 'quiz', age] as const,
  },
}
