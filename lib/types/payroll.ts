export interface PayrollRequest {
  employeeId: number;
  month: number;
  year: number;
  bonus: number;
}

export interface PayrollResponse {
  id: number;
  employeeName: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deduction: number;
  overtime: number;
  netSalary: number;
}
