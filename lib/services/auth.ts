import type { LoginRequest, LoginResponse } from '@/lib/types/auth';

import { request } from './http';

export const authApi = {
  login: (body: LoginRequest) =>
    request<LoginResponse>('/auth/login', { method: 'POST', json: body }),
  logout: () => request<string>('/auth/logout', { method: 'POST' }),
  me: async (): Promise<number | undefined> => {
    try {
      return await request<number>('/auth/me');
    } catch {
      return undefined;
    }
  },
};
