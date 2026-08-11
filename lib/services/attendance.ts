import type { Attendance } from '@/lib/types/attendance';

import { request } from './http';

export const attendanceApi = {
  scan: (qrCode: string) => {
    return request<Attendance>(`/attendance/scan`, {
      method: 'POST',
      searchParams: { qrCode },
    });
  },
  get: (id: number) => request<Attendance>(`/attendance/${id}`),
  listByEmployee: (employeeId: number) =>
    request<Attendance[]>(`/attendance/employee/${employeeId}`),
  listByDate: (date: string) =>
    request<Attendance[]>(`/attendance/date/${date}`),
  remove: (id: number) =>
    request<string>(`/attendance/${id}`, { method: 'DELETE' }),
};
