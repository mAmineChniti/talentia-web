import * as z from 'zod';

import type { ValidationMessages } from './messages';

export function createTrainingSchema(m: ValidationMessages) {
  return z
    .object({
      title: z.string().trim().min(1, m.titleRequired),
      description: z.string().trim().min(1, m.descriptionRequired),
      trainer: z.string().trim().min(1, m.trainerRequired),
      location: z.string().trim().min(1, m.locationRequired),
      startDate: z.string().trim().min(1, m.dateStartRequired),
      endDate: z.string().trim().min(1, m.dateEndRequired),
      capacity: z.int().min(1, m.capacityMin),
    })
    .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
      path: ['endDate'],
      error: m.endAfterStartTraining,
    });
}
