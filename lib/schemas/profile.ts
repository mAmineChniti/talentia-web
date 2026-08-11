import * as z from 'zod';

import type { ValidationMessages } from './messages';

function optionalUrl(m: ValidationMessages) {
  return z
    .string()
    .trim()
    .refine((v) => !v || z.url().safeParse(v).success, {
      error: m.urlInvalid,
    });
}

export function createProfileSchema(m: ValidationMessages) {
  return z.object({
    name: z.string().trim().min(1, m.nameRequired),
    lastname: z.string().trim().min(1, m.lastnameRequired),
    email: z.email(m.emailInvalid),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
    telephone: z
      .string()
      .trim()
      .refine((v) => !v || /^\d+$/.test(v), {
        error: m.telephoneInvalid,
      })
      .optional(),
    profession: z.string().trim().optional(),
    posteActuel: z.string().trim().optional(),
    entreprise: z.string().trim().optional(),
    niveauExperience: z.string().trim().optional(),
    aboutme: z.string().trim().optional(),
    cvUrl: optionalUrl(m),
    linkedinUrl: optionalUrl(m),
    githubUrl: optionalUrl(m),
    newPassword: z
      .string()
      .trim()
      .refine((v) => !v || v.length >= 6, {
        error: m.passwordMin,
      }),
  });
}

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>;
