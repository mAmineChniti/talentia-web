import type { Role } from '@/lib/types/users';

const ROLE_HIERARCHY: Record<Role, number> = {
  CANDIDATE: 0,
  EMPLOYEE: 1,
  HR: 2,
  ADMIN: 3,
};

const ROUTE_ROLES: Record<string, Role[]> = {
  dashboard: ['EMPLOYEE', 'HR', 'ADMIN'],
  employees: ['HR', 'ADMIN'],
  attendance: ['HR', 'ADMIN'],
  leaves: ['EMPLOYEE', 'HR', 'ADMIN'],
  contracts: ['HR', 'ADMIN'],
  payroll: ['ADMIN'],
  payslips: ['ADMIN'],
  trainings: ['EMPLOYEE', 'HR', 'ADMIN'],
  recruitment: ['HR', 'ADMIN'],
  candidates: ['HR', 'ADMIN'],
  forum: ['CANDIDATE', 'EMPLOYEE', 'HR', 'ADMIN'],
  profile: ['CANDIDATE', 'EMPLOYEE', 'HR', 'ADMIN'],
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
