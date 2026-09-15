import type { RoleChangeProvisioning, User } from '@/lib/types/users';

import { request } from './http';

export const usersApi = {
  list: () => request<User[]>('/users'),
  get: (id: number) => request<User>(`/users/${id}`),
  getByEmail: (email: string) =>
    request<User>(`/users/email/${encodeURIComponent(email)}`),
  create: (user: Partial<User>) =>
    request<User>('/users', { method: 'POST', json: user }),
  update: (id: number, user: Partial<User>, image?: File) => {
    const form = new FormData();
    form.append(
      'user',
      new Blob([JSON.stringify(user)], { type: 'application/json' })
    );
    if (image) form.append('image', image);
    return request<User>(`/users/${id}`, { method: 'PUT', body: form });
  },
  uploadPhoto: (id: number, image: File) => {
    const form = new FormData();
    form.append('image', image);
    return request<User>(`/users/${id}/photo`, { method: 'POST', body: form });
  },
  remove: (id: number) => request<string>(`/users/${id}`, { method: 'DELETE' }),
  changeRole: (
    id: number,
    role: User['role'],
    provisioning?: RoleChangeProvisioning
  ) =>
    request<User>(`/users/${id}/role`, {
      method: 'PUT',
      searchParams: { role },
      ...(provisioning && { json: provisioning }),
    }),
  ban: (id: number) => request<User>(`/users/${id}/ban`, { method: 'PUT' }),
  unban: (id: number) => request<User>(`/users/${id}/unban`, { method: 'PUT' }),
};
