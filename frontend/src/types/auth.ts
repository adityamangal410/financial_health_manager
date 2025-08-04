export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  verified: boolean;
  created: string;
  updated: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  passwordConfirm: string;
  name?: string;
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  resetPassword: (credentials: ResetPasswordCredentials) => Promise<void>;
  refreshAuth: () => Promise<void>;
}