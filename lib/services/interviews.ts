import type {
  InterviewRequest,
  InterviewResponse,
} from '@/lib/types/interviews';

import { request } from './http';

export const interviewsApi = {
  list: () => request<InterviewResponse[]>('/interviews'),
  get: (id: number) => request<InterviewResponse>(`/interviews/${id}`),
  create: (body: InterviewRequest) =>
    request<InterviewResponse>('/interviews', { method: 'POST', json: body }),
  update: (id: number, body: InterviewRequest) => {
    return request<InterviewResponse>(`/interviews/${id}`, {
      method: 'PUT',
      json: body,
    });
  },
  remove: (id: number) =>
    request<string>(`/interviews/${id}`, { method: 'DELETE' }),
};
