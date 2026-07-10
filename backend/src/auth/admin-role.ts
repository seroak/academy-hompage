import { AdminRole } from '@prisma/client';

export { AdminRole };

export const CONTENT_ROLES = [AdminRole.CONTENT_MANAGER, AdminRole.SUPER_ADMIN];
export const RESERVATION_ROLES = [
  AdminRole.RESERVATION_MANAGER,
  AdminRole.SUPER_ADMIN,
];
export const ASSESSMENT_ROLES = [
  AdminRole.ASSESSMENT_MANAGER,
  AdminRole.SUPER_ADMIN,
];
