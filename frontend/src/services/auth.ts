import PocketBase from 'pocketbase';
import type { LoginCredentials, RegisterCredentials, ResetPasswordCredentials, User } from '../types/auth';

// PocketBase client instance
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090');

// Auth service class
export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const authData = await pb.collection('users').authWithPassword(
        credentials.email,
        credentials.password
      );

      return {
        user: {
          id: authData.record.id,
          email: authData.record.email,
          name: authData.record.name,
          avatar: authData.record.avatar,
          verified: authData.record.verified,
          created: authData.record.created,
          updated: authData.record.updated,
        },
        token: authData.token,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid email or password');
    }
  }

  /**
   * Register new user
   */
  static async register(credentials: RegisterCredentials): Promise<{ user: User; token: string }> {
    try {
      // Create the user
      await pb.collection('users').create({
        email: credentials.email,
        password: credentials.password,
        passwordConfirm: credentials.passwordConfirm,
        name: credentials.name,
      });

      // Send verification email
      await pb.collection('users').requestVerification(credentials.email);

      // Login the user
      const authData = await pb.collection('users').authWithPassword(
        credentials.email,
        credentials.password
      );

      return {
        user: {
          id: authData.record.id,
          email: authData.record.email,
          name: authData.record.name,
          avatar: authData.record.avatar,
          verified: authData.record.verified,
          created: authData.record.created,
          updated: authData.record.updated,
        },
        token: authData.token,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed. Please check your details and try again.');
    }
  }

  /**
   * Request password reset
   */
  static async resetPassword(credentials: ResetPasswordCredentials): Promise<void> {
    try {
      await pb.collection('users').requestPasswordReset(credentials.email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Logout user
   */
  static logout(): void {
    pb.authStore.clear();
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return pb.authStore.isValid;
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    if (!pb.authStore.isValid || !pb.authStore.model) {
      return null;
    }

    const record = pb.authStore.model;
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      avatar: record.avatar,
      verified: record.verified,
      created: record.created,
      updated: record.updated,
    };
  }

  /**
   * Get current auth token
   */
  static getToken(): string | null {
    return pb.authStore.token || null;
  }

  /**
   * Refresh authentication
   */
  static async refreshAuth(): Promise<{ user: User; token: string } | null> {
    try {
      // Check if we have a valid auth store and token
      if (!pb.authStore.isValid || !pb.authStore.token || !pb.authStore.model) {
        return null;
      }

      await pb.collection('users').authRefresh();
      const user = this.getCurrentUser();
      const token = this.getToken();

      if (user && token) {
        return { user, token };
      }

      return null;
    } catch (error) {
      // Handle auto-cancellation gracefully - it's not a real error
      if (error instanceof Error && error.message.includes('autocancelled')) {
        console.debug('Auth refresh was auto-cancelled by PocketBase (this is normal)');
        // Try to get current auth state without refreshing
        const user = this.getCurrentUser();
        const token = this.getToken();
        if (user && token) {
          return { user, token };
        }
        return null;
      }
      
      console.error('Auth refresh error:', error);
      this.logout();
      return null;
    }
  }
}