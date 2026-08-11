import * as z from 'zod';

import type { ValidationMessages } from './messages';

export function createContractSchema(m: ValidationMessages) {
  return z
    .object({
      employeeId: z.int().positive(m.selectEmployee),
      contractType: z.string().trim().min(1, m.contractTypeRequired),
      startDate: z.string().trim().min(1, m.dateStartRequired),
      endDate: z.string().trim().min(1, m.dateEndRequired),
      salary: z.number().min(0, m.salaryNotNegative),
      workingHours: z.number().min(1, m.hoursMin),
    })
    .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
      path: ['endDate'],
      error: m.endAfterStart,
    });
}
