import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getUser, signupUser, loginUser, logoutUser, resetPasswordForEmail } from '../auth';
import { supabase } from '../client';

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('should return user data when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { first_name: 'Test', last_name: 'User' },
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getUser();

      expect(result).toEqual(mockUser);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUser();

      expect(result).toBeNull();
    });

    it('should throw error when authentication check fails', async () => {
      const mockError = { message: 'Auth check failed' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      await expect(getUser()).rejects.toThrow('Auth check failed');
    });
  });

  describe('signupUser', () => {
    it('should successfully create new user with metadata', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const metadata = { first_name: 'New', last_name: 'User' };

      const mockResponse = {
        data: {
          user: { id: 'user-456', email },
          session: { access_token: 'token123' },
        },
        error: null,
      };

      mockSupabase.auth.signUp.mockResolvedValue(mockResponse);

      const result = await signupUser(email, password, metadata);

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email,
        password,
        options: {
          data: metadata,
        },
      });
    });

    it('should handle signup errors', async () => {
      const mockError = { message: 'Email already registered' };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await signupUser('existing@example.com', 'password');

      expect(result.error).toEqual(mockError);
    });
  });

  describe('loginUser', () => {
    it('should successfully authenticate user', async () => {
      const email = 'user@example.com';
      const password = 'password123';

      const mockResponse = {
        data: {
          user: { id: 'user-123', email },
          session: { access_token: 'token123' },
        },
        error: null,
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockResponse);

      const result = await loginUser(email, password);

      expect(result).toEqual(mockResponse);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password,
      });
    });

    it('should handle invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await loginUser('wrong@example.com', 'wrongpass');

      expect(result.error).toEqual(mockError);
    });
  });

  describe('logoutUser', () => {
    it('should successfully sign out user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await logoutUser();

      expect(result).toEqual({ error: null });
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should handle logout errors', async () => {
      const mockError = { message: 'Logout failed' };
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError });

      const result = await logoutUser();

      expect(result.error).toEqual(mockError);
    });
  });

  describe('resetPasswordForEmail', () => {
    it('should send password reset email', async () => {
      const email = 'user@example.com';
      const redirectTo = 'https://app.example.com/reset';

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await resetPasswordForEmail(email, redirectTo);

      expect(result.error).toBeNull();
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        email,
        { redirectTo }
      );
    });

    it('should handle invalid email for password reset', async () => {
      const mockError = { message: 'Email not found' };
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: mockError,
      });

      const result = await resetPasswordForEmail('nonexistent@example.com');

      expect(result.error).toEqual(mockError);
    });
  });
});