export type Role = 'CANDIDATE' | 'EMPLOYEE' | 'HR' | 'ADMIN';

// Hiring details sent when promoting a user with no employee record yet.
// The backend creates the employee file (QR + welcome email) and an
// active contract from these.
export interface RoleChangeProvisioning {
  department?: string;
  position?: string;
  contractType?: string;
  salary?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  workingHours?: number;
}

// entity/users.java
export interface User {
  id: number;
  name: string;
  lastname: string;
  email: string;
  password?: string;
  role: Role;
  banned?: boolean;
  city?: string;
  country?: string;
  profileImageUrl?: string;
  telephone?: number;
  aboutme?: string;
  profession?: string;
  entreprise?: string;
  posteActuel?: string;
  niveauExperience?: string;
  cvUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}
