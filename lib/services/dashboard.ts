import type { DashboardResponse } from '@/lib/types/dashboard';

import { request } from './http';

export const dashboardApi = {
  get: () => request<DashboardResponse>('/dashboard'),
};
