import * as z from 'zod';

import type { ValidationMessages } from './messages';

export function createEmployeeSchema(m: ValidationMessages) {
  return z.object({
    userId: z.int().positive(m.selectUser),
    department: z.string().trim().min(1, m.departmentRequired),
    position: z.string().trim().min(1, m.positionRequired),
    contractType: z.string().trim().min(1, m.contractTypeRequired),
    salary: z.number().min(0, m.salaryNotNegative),
  });
}
