export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface UserRow {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface UserDTO {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: UserDTO;
  token: string;
}
