export interface PayslipResponse {
  id: number;
  employeeName: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  overtime: number;
  deduction: number;
  netSalary: number;
  generatedDate: string;
  pdfPath: string;
  status: string;
}
