import type { EmployeeResponse } from './employees';

export interface TrainingRequest {
  title: string;
  description: string;
  trainer: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number;
}

export type TrainingStatus = 'PLANNED' | 'DONE' | 'CANCELLED';

// entity/Training.java
export interface Training {
  id: number;
  title: string;
  description: string;
  trainer: string;
  location: string;
  startDate: string;
  endDate: string;
  capacity: number;
  status: TrainingStatus;
  numberOfParticipants?: number;
}

export type TrainingEnrollmentStatus = 'REGISTERED' | 'COMPLETED' | 'FAILED';

// entity/TrainingEnrollment.java
export interface TrainingEnrollment {
  id: number;
  employee?: EmployeeResponse;
  training?: Training;
  enrollmentDate: string;
  status: TrainingEnrollmentStatus;
  score?: number;
  certificateIssued: boolean;
}
