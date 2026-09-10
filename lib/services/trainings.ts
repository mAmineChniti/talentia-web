import type {
  Training,
  TrainingEnrollment,
  TrainingEnrollmentStatus,
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
  enroll: (
    trainingId: number,
    employeeId: number,
    status: TrainingEnrollmentStatus = 'REGISTERED'
  ) => {
    return request<TrainingEnrollment>(
      `/trainings/${trainingId}/employees/${employeeId}/${status}`,
      { method: 'POST' }
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
  listEnrollments: (trainingId: number) =>
    request<TrainingEnrollment[]>(`/trainings/${trainingId}/enrollments`),
  updateEnrollmentStatus: (
    enrollmentId: number,
    status: TrainingEnrollmentStatus
  ) =>
    request<TrainingEnrollment>(
      `/trainings/enrollments/${enrollmentId}/status`,
      { method: 'PUT', searchParams: { status } }
    ),
  removeEnrollment: (enrollmentId: number) =>
    request<string>(`/trainings/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    }),
};
