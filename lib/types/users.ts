export type Role = 'CANDIDATE' | 'EMPLOYEE' | 'HR' | 'ADMIN';

// entity/users.java
export interface User {
  id: number;
  name: string;
  lastname: string;
  email: string;
  password?: string;
  role: Role;
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
