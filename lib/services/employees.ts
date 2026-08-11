import type { EmployeeRequest, EmployeeResponse } from '@/lib/types/employees';

import { request } from './http';

export const employeesApi = {
  list: () => request<EmployeeResponse[]>('/employees'),
  get: (id: number) => request<EmployeeResponse>(`/employees/${id}`),
  create: (body: EmployeeRequest) =>
    request<EmployeeResponse>('/employees', { method: 'POST', json: body }),
  update: (id: number, body: EmployeeRequest) => {
    return request<EmployeeResponse>(`/employees/${id}`, {
      method: 'PUT',
      json: body,
    });
  },
  remove: (id: number) =>
    request<string>(`/employees/${id}`, { method: 'DELETE' }),
};
