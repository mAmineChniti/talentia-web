import type {
  ApplicationResponse,
  ApplicationApplyResponse,
} from '@/lib/types/applications';

import { request } from './http';

export const applicationsApi = {
  list: () => request<ApplicationResponse[]>('/applications'),
  get: (id: number) => request<ApplicationResponse>(`/applications/${id}`),
  apply: (data: {
    cv: File;
    motivationLetter: string;
    poste: string;
    userId: number;
    postId: number;
  }) => {
    const form = new FormData();
    form.append('cv', data.cv);
    form.append('motivationLetter', data.motivationLetter);
    form.append('poste', data.poste);
    form.append('userId', String(data.userId));
    form.append('postId', String(data.postId));
    return request<ApplicationApplyResponse>('/applications/apply', {
      method: 'POST',
      body: form,
    });
  },
};
