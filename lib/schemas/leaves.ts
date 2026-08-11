import * as z from 'zod';

import type { LeaveType } from '@/lib/types/leaves';

import type { ValidationMessages } from './messages';

export const LEAVE_TYPES: LeaveType[] = [
  'ANNUAL',
  'SICK',
  'MATERNITY',
  'PATERNITY',
  'UNPAID',
  'EXCEPTIONAL',
];

export function createLeaveSchema(m: ValidationMessages) {
  return z
    .object({
      employeeId: z.int().positive(m.selectEmployee),
      type: z.enum(LEAVE_TYPES, { message: m.selectLeaveType }),
      startDate: z.string().trim().min(1, m.dateStartRequired),
      endDate: z.string().trim().min(1, m.dateEndRequired),
      reason: z.string().trim().optional(),
    })
    .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
      path: ['endDate'],
      error: m.endAfterStart,
    });
}
