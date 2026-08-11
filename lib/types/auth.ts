import type { Role } from './users';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  message: string;
}
