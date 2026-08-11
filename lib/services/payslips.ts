import type { PayslipResponse } from '@/lib/types/payslips';

import { API_BASE, request } from './http';

export const payslipsApi = {
  list: () => request<PayslipResponse[]>('/payslips'),
  generate: (payrollId: number) => {
    return request<PayslipResponse>(`/payslips/generate/${payrollId}`, {
      method: 'POST',
    });
  },
  downloadUrl: (filename: string) =>
    `${API_BASE}/payslips/download/${encodeURIComponent(filename)}`,
};
