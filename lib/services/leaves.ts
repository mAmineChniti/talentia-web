import type { LeaveRequest, LeaveResponse } from '@/lib/types/leaves';

import { request } from './http';

export const leavesApi = {
  list: () => request<LeaveResponse[]>('/leaves'),
  listPending: () => request<LeaveResponse[]>('/leaves/pending'),
  listByEmployee: (employeeId: number) =>
    request<LeaveResponse[]>(`/leaves/employee/${employeeId}`),
  request: (body: LeaveRequest) =>
    request<LeaveResponse>('/leaves', { method: 'POST', json: body }),
  approve: (leaveId: number, userId: number) => {
    return request<LeaveResponse>(`/leaves/${leaveId}/approve/${userId}`, {
      method: 'PUT',
    });
  },
  reject: (leaveId: number, userId: number) => {
    return request<LeaveResponse>(`/leaves/${leaveId}/reject/${userId}`, {
      method: 'PUT',
    });
  },
  cancel: (leaveId: number) =>
    request<LeaveResponse>(`/leaves/${leaveId}/cancel`, { method: 'PUT' }),
};
