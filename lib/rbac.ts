import type { Role } from '@/lib/types/users';

const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 0,
  HR: 1,
  ADMIN: 2,
};

const ROUTE_ROLES: Record<string, Role[]> = {
  dashboard: ['USER', 'HR', 'ADMIN'],
  employees: ['HR', 'ADMIN'],
  attendance: ['HR', 'ADMIN'],
  leaves: ['USER', 'HR', 'ADMIN'],
  contracts: ['HR', 'ADMIN'],
  payroll: ['ADMIN'],
  payslips: ['ADMIN'],
  trainings: ['USER', 'HR', 'ADMIN'],
  recruitment: ['HR', 'ADMIN'],
  forum: ['USER', 'HR', 'ADMIN'],
  profile: ['USER', 'HR', 'ADMIN'],
};

export function canAccessRoute(
  role: Role | undefined,
  pathname: string
): boolean {
  if (!role) return false;

  const segment = pathname.split('/').filter(Boolean).slice(1).find(Boolean);
  if (!segment) return true;

  const allowed = ROUTE_ROLES[segment];
  if (!allowed) return true;

  return allowed.includes(role);
}

export function hasMinimumRole(
  userRole: Role | undefined,
  required: Role
): boolean {
  if (!userRole) return false;
  return (
    (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[required] ?? Infinity)
  );
}
