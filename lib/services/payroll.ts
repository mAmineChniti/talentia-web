import type { PayrollRequest, PayrollResponse } from '@/lib/types/payroll';

import { request } from './http';

export const payrollApi = {
  list: () => request<PayrollResponse[]>('/payroll'),
  listByEmployee: (employeeId: number) =>
    request<PayrollResponse[]>(`/payroll/employee/${employeeId}`),
  create: (body: PayrollRequest) =>
    request<PayrollResponse>('/payroll', { method: 'POST', json: body }),
  generate: (month: number, year: number, bonusPercentage: number) => {
    return request<PayrollResponse[]>('/payroll/generate', {
      method: 'POST',
      searchParams: { month, year, bonusPercentage },
    });
  },
};
