import * as z from 'zod';

import type { ValidationMessages } from './messages';

export function createGeneratePayrollSchema(m: ValidationMessages) {
  return z.object({
    month: z.int().min(1).max(12),
    year: z.int().min(2000).max(2100),
    bonusPercentage: z.number().min(0, m.bonusNotNegative),
  });
}

export function createPayrollSchema(m: ValidationMessages) {
  return z.object({
    employeeId: z.int().positive(m.selectEmployee),
    month: z.int().min(1).max(12),
    year: z.int().min(2000).max(2100),
    bonus: z.number().min(0, m.bonusNotNegative),
  });
}
