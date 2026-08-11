import * as z from 'zod';

import type { ValidationMessages } from './messages';

export function createScanSchema(m: ValidationMessages) {
  return z.object({
    qrCode: z.string().trim().min(1, m.qrCodeRequired),
  });
}
