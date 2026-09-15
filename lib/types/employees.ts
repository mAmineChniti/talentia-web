import type { User } from './users';

export interface EmployeeRequest {
  userId: number;
  department: string;
  position: string;
  contractType: string;
  salary: number;
  // Initial contract, created with the employee record
  contractStartDate?: string;
  contractEndDate?: string;
  workingHours?: number;
}

export interface EmployeeResponse {
  id: number;
  userId: number;
  employeeCode: string;
  department: string;
  position: string;
  hireDate: string;
  contractType: string;
  salary: number;
  active: boolean;
  qrImageUrl?: string;
  user?: User;
}
