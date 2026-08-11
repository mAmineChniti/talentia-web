import type {
  Training,
  TrainingEnrollment,
  TrainingRequest,
} from '@/lib/types/trainings';

import { request } from './http';

export const trainingsApi = {
  list: () => request<Training[]>('/trainings'),
  get: (id: number) => request<Training>(`/trainings/${id}`),
  create: (body: TrainingRequest) =>
    request<Training>('/trainings', { method: 'POST', json: body }),
  remove: (id: number) =>
    request<string>(`/trainings/${id}`, { method: 'DELETE' }),
  enroll: (trainingId: number, employeeId: number) => {
    return request<TrainingEnrollment>(
      `/trainings/${trainingId}/employees/${employeeId}`,
      {
        method: 'POST',
      }
    );
  },
  complete: (enrollmentId: number, score: number) => {
    return request<TrainingEnrollment>(`/trainings/complete/${enrollmentId}`, {
      method: 'PUT',
      searchParams: { score },
    });
  },
  listByEmployee: (employeeId: number) =>
    request<TrainingEnrollment[]>(`/trainings/employee/${employeeId}`),
};
