import type { ContractRequest, ContractResponse } from '@/lib/types/contracts';

import { request } from './http';

export const contractsApi = {
  list: () => request<ContractResponse[]>('/contracts'),
  get: (id: number) => request<ContractResponse>(`/contracts/${id}`),
  listByEmployee: (employeeId: number) =>
    request<ContractResponse[]>(`/contracts/employee/${employeeId}`),
  create: (employeeId: number, body: ContractRequest) => {
    return request<ContractResponse>(`/contracts/employee/${employeeId}`, {
      method: 'POST',
      json: body,
    });
  },
  update: (id: number, body: ContractRequest) => {
    return request<ContractResponse>(`/contracts/${id}`, {
      method: 'PUT',
      json: body,
    });
  },
  remove: (id: number) =>
    request<string>(`/contracts/${id}`, { method: 'DELETE' }),
};
