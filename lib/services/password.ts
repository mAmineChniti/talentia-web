import { request } from './http';

export const passwordApi = {
  forgot: (email: string) =>
    request<string>('/password/forgot', { method: 'POST', json: { email } }),
  reset: (token: string, newPassword: string) => {
    return request<string>('/password/reset', {
      method: 'POST',
      json: { token, newPassword },
    });
  },
  validate: (token: string) => request<boolean>(`/password/validate/${token}`),
};
