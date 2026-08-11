export interface DashboardResponse {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalCandidates: number;
  totalApplications: number;
  totalInterviews: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  activeContracts: number;
  expiredContracts: number;
  totalPayrolls: number;
  totalSalary: number;
  averageSalary: number;
  maxSalary: number;
  minSalary: number;
  bestDepartment: string;
  mostAbsentDepartment: string;
  aiRecommendation: string;
}
