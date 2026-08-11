export type LeaveType =
  'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'EXCEPTIONAL';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  employeeId: number;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface LeaveResponse {
  id: number;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  status: LeaveStatus;
  reason?: string;
}
