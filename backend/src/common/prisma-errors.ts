export function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === code;
}

export function isPrismaNotFoundError(error: unknown): boolean {
  return hasPrismaErrorCode(error, 'P2025');
}
