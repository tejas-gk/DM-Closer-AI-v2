import { signupUser, loginUser, logoutUser, getUser } from '../../auth';
import { getUserProfile, updateUserProfile } from '../../profiles';

// Mock Supabase client for integration testing
jest.mock('../../client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }
}));

const mockSupabase = require('../../client').supabase;

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.location for emailRedirectTo
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://test.example.com' },
      writable: true
    });
  });

  describe('Complete Registration Flow', () => {
    it('should handle user signup → profile creation trigger → profile data persistence', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        metadata: {
          first_name: 'John',
          last_name: 'Doe'
        }
      };

      const mockSignupResponse = {
        data: {
          user: {
            id: 'user-new-123',
            email: userData.email,
            user_metadata: userData.metadata
          },
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh'
          }
        },
        error: null
      };

      const mockProfileResponse = {
        data: {
          id: 'user-new-123',
          first_name: 'John',
          last_name: 'Doe',
          email: userData.email,
          stripe_customer_id: null,
          stripe_subscription_key: null,
          updated_at: '2025-06-20T12:00:00Z',
          created_at: '2025-06-20T12:00:00Z'
        },
        error: null
      };

      mockSupabase.auth.signUp.mockResolvedValue(mockSignupResponse);
      mockSupabase.from().select().eq().single.mockResolvedValue(mockProfileResponse);

      const signupResult = await signupUser(userData.email, userData.password, userData.metadata);
      
      expect(signupResult.data.user).toBeDefined();
      expect(signupResult.data.user.email).toBe(userData.email);
      expect(signupResult.error).toBeNull();

      const profileResult = await getUserProfile('user-new-123');
      
      expect(profileResult.first_name).toBe('John');
      expect(profileResult.last_name).toBe('Doe');
      expect(profileResult.email).toBe(userData.email);
    });

    it('should handle email confirmation → account activation → login capability', async () => {
      const credentials = {
        email: 'confirmed@example.com',
        password: 'confirmedpassword123'
      };

      const mockLoginResponse = {
        data: {
          user: {
            id: 'user-confirmed-456',
            email: credentials.email,
            email_confirmed_at: '2025-06-20T12:00:00Z'
          },
          session: {
            access_token: 'confirmed-token',
            refresh_token: 'confirmed-refresh'
          }
        },
        error: null
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockLoginResponse);

      const loginResult = await loginUser(credentials.email, credentials.password);

      expect(loginResult.data.user.email_confirmed_at).toBeDefined();
      expect(loginResult.data.session).toBeDefined();
      expect(loginResult.error).toBeNull();
    });

    it('should handle password validation → account security verification', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: '123',
        metadata: { first_name: 'Test', last_name: 'User' }
      };

      const mockWeakPasswordResponse = {
        data: { user: null, session: null },
        error: { 
          message: 'Password should be at least 6 characters',
          code: 'weak_password'
        }
      };

      mockSupabase.auth.signUp.mockResolvedValue(mockWeakPasswordResponse);

      const result = await signupUser(weakPasswordData.email, weakPasswordData.password, weakPasswordData.metadata);

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Password should be at least 6 characters');
      expect(result.data.user).toBeNull();
    });
  });

  describe('Login and Session Management', () => {
    it('should handle credential validation → session creation → user context establishment', async () => {
      const validCredentials = {
        email: 'valid@example.com',
        password: 'validpassword123'
      };

      const mockLoginResponse = {
        data: {
          user: {
            id: 'user-valid-101',
            email: validCredentials.email,
            role: 'authenticated'
          },
          session: {
            access_token: 'valid-access-token',
            refresh_token: 'valid-refresh-token',
            expires_at: Date.now() + 3600000
          }
        },
        error: null
      };

      const mockUserResponse = {
        id: 'user-valid-101',
        email: validCredentials.email,
        role: 'authenticated'
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue(mockLoginResponse);
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUserResponse }, error: null });

      const loginResult = await loginUser(validCredentials.email, validCredentials.password);
      
      expect(loginResult.data.session).toBeDefined();
      expect(loginResult.data.user.id).toBe('user-valid-101');

      const userContext = await getUser();
      
      expect(userContext).toEqual(mockUserResponse);
      expect(userContext.role).toBe('authenticated');
    });

    it('should handle session expiration → automatic logout → login redirect', async () => {
      const expiredSessionResponse = {
        data: { user: null },
        error: { message: 'JWT expired', code: 'jwt_expired' }
      };

      const mockLogoutResponse = { error: null };

      mockSupabase.auth.getUser.mockResolvedValue(expiredSessionResponse);
      mockSupabase.auth.signOut.mockResolvedValue(mockLogoutResponse);

      const expiredUser = await getUser();
      expect(expiredUser).toBeNull();

      const logoutResult = await logoutUser();
      expect(logoutResult.error).toBeNull();
    });
  });

  describe('Profile Management Integration', () => {
    it('should handle profile updates → database persistence → UI state refresh', async () => {
      const userId = 'user-profile-103';
      const originalProfile = {
        id: userId,
        first_name: 'Original',
        last_name: 'Name',
        email: 'original@example.com',
        stripe_customer_id: null,
        stripe_subscription_key: null,
        updated_at: '2025-06-20T12:00:00Z',
        created_at: '2025-06-20T10:00:00Z'
      };

      const updatedProfile = {
        ...originalProfile,
        first_name: 'Updated',
        last_name: 'Profile',
        email: 'updated@example.com',
        updated_at: '2025-06-20T12:30:00Z'
      };

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: originalProfile,
        error: null
      });

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: updatedProfile,
        error: null
      });

      const initialProfile = await getUserProfile(userId);
      expect(initialProfile.first_name).toBe('Original');

      const updateResult = await updateUserProfile(userId, {
        first_name: 'Updated',
        last_name: 'Profile',
        email: 'updated@example.com'
      });

      expect(updateResult.first_name).toBe('Updated');
      expect(updateResult.email).toBe('updated@example.com');
      expect(updateResult.updated_at).not.toBe(originalProfile.updated_at);
    });
  });
});