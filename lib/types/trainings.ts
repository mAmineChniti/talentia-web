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
  status: string;
  numberOfParticipants?: number;
}

// entity/TrainingEnrollment.java
export interface TrainingEnrollment {
  id: number;
  employee?: EmployeeResponse;
  training?: Training;
  enrollmentDate: string;
  status: string;
  score?: number;
  certificateIssued: boolean;
}
