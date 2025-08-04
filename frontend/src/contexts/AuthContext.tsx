import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AuthService } from '../services/auth';
import type { AuthContextType, AuthState, LoginCredentials, RegisterCredentials, ResetPasswordCredentials } from '../types/auth';

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context provider props
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state from PocketBase
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        
        // First, try to get current auth state without refreshing
        if (AuthService.isAuthenticated()) {
          const user = AuthService.getCurrentUser();
          const token = AuthService.getToken();
          
          if (user && token) {
            // We have valid current auth, try to refresh to ensure it's still valid
            try {
              const authData = await AuthService.refreshAuth();
              if (authData) {
                setAuthState({
                  user: authData.user,
                  token: authData.token,
                  isLoading: false,
                  isAuthenticated: true,
                });
                return;
              }
            } catch (refreshError) {
              // If refresh fails, fall back to current auth if it exists
              console.debug('Auth refresh failed, using current auth state');
              if (user && token) {
                setAuthState({
                  user,
                  token,
                  isLoading: false,
                  isAuthenticated: true,
                });
                return;
              }
            }
          }
        }

        // No valid session
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const authData = await AuthService.login(credentials);
      
      setAuthState({
        user: authData.user,
        token: authData.token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const authData = await AuthService.register(credentials);
      
      setAuthState({
        user: authData.user,
        token: authData.token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Logout function
  const logout = (): void => {
    AuthService.logout();
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  // Reset password function
  const resetPassword = async (credentials: ResetPasswordCredentials): Promise<void> => {
    await AuthService.resetPassword(credentials);
  };

  // Refresh auth function
  const refreshAuth = async (): Promise<void> => {
    try {
      const authData = await AuthService.refreshAuth();
      if (authData) {
        setAuthState({
          user: authData.user,
          token: authData.token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    resetPassword,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}