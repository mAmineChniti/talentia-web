export interface ContractRequest {
  contractType: string;
  startDate: string;
  endDate: string;
  salary: number;
  workingHours: number;
}

export interface ContractResponse {
  id: number;
  employeeId: number;
  contractType: string;
  startDate: string;
  endDate: string;
  salary: number;
  workingHours: number;
  status: string;
}
