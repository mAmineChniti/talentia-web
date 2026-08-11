import * as z from 'zod';

import type {
  LoginValidationMessages,
  RegisterValidationMessages,
} from './messages';

export function createLoginSchema(m: LoginValidationMessages) {
  return z.object({
    email: z.email(m.email),
    password: z.string().trim().min(1, m.passwordRequired),
  });
}

export function createRegisterSchema(m: RegisterValidationMessages) {
  return z
    .object({
      firstName: z.string().trim().min(1, m.firstNameRequired),
      lastName: z.string().trim().min(1, m.lastNameRequired),
      email: z.email(m.email),
      password: z.string().trim().min(6, m.passwordMin),
      confirmPassword: z.string().trim(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      error: m.confirmMatch,
      path: ['confirmPassword'],
    });
}
