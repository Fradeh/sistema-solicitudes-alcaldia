import { AppRole } from './app-role.enum';

const ROLE_ALIASES: Record<string, AppRole> = {
  recepcionista: AppRole.RECEPTIONIST,
  receptionist: AppRole.RECEPTIONIST,
  revisor: AppRole.OFFICER,
  officer: AppRole.OFFICER,
  supervisor: AppRole.SUPERVISOR,
  admin: AppRole.ADMIN,
  alcalde: AppRole.MAYOR,
  mayor: AppRole.MAYOR,
};

export function normalizeRoleName(role?: string | null): AppRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.trim().toLowerCase();

  if (Object.values(AppRole).includes(normalized.toUpperCase() as AppRole)) {
    return normalized.toUpperCase() as AppRole;
  }

  return ROLE_ALIASES[normalized] ?? null;
}

