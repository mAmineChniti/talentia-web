import * as z from 'zod';

import type { ValidationMessages } from './messages';

export function createInterviewSchema(m: ValidationMessages) {
  return z
    .object({
      applicationId: z.int().positive(m.selectApplication),
      interviewDate: z.string().trim().min(1, m.dateTimeRequired),
      type: z.enum(['ONLINE', 'ONSITE'], {
        message: m.selectInterviewType,
      }),
      location: z.string().trim().optional(),
    })
    .refine(
      (v) => v.type !== 'ONSITE' || (v.location?.trim()?.length ?? 0) > 0,
      {
        path: ['location'],
        error: m.onsiteLocationRequired,
      }
    );
}
