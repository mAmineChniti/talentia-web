export interface EmployeeRequest {
  userId: number;
  department: string;
  position: string;
  contractType: string;
  salary: number;
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
}
