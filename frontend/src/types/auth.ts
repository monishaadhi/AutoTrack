export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  created_at?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}
