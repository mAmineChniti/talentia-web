export type AttendanceStatus = 'PRESENT' | 'RETARD' | 'ABSENT';

// entity/Attendance.java
export interface Attendance {
  id: number;
  date: string;
  checkIn?: string;
  checkOut?: string;
  delayMinutes?: number;
  workedHours?: number;
  lateMinutes?: number;
  status: AttendanceStatus;
  employee?: {
    id: number;
    employeeCode?: string;
    position?: string;
    department?: string;
    user?: {
      id: number;
      name?: string;
      lastname?: string;
      email?: string;
      profileImageUrl?: string;
    };
  };
}
