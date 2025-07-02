import { getUserProfileByAdmin, getUserEmailByAdmin, updateUserProfileByAdmin, Profile } from '../profiles';

// Mock admin client
jest.mock('../client', () => ({
  createSupabaseAdminClient: jest.fn(() => ({
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
    })),
    auth: {
      admin: {
        getUserById: jest.fn()
      }
    }
  }))
}));

const mockCreateSupabaseAdminClient = require('../client').createSupabaseAdminClient;

describe('Admin Profile Service', () => {
  let mockSupabaseAdmin: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseAdmin = mockCreateSupabaseAdminClient();
  });

  describe('getUserProfileByAdmin', () => {
    it('should fetch profile using admin privileges', async () => {
      const mockProfile: Profile = {
        id: 'user-123',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com',
        stripe_customer_id: 'cus_admin123',
        stripe_subscription_key: 'sub_admin123',
        updated_at: '2025-06-20T12:00:00Z',
        created_at: '2025-06-20T10:00:00Z'
      };

      const mockResponse = {
        data: mockProfile,
        error: null
      };

      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue(mockResponse);

      const result = await getUserProfileByAdmin('user-123');

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual(mockProfile);
    });

    it('should handle non-existent user IDs', async () => {
      const mockErrorResponse = {
        data: null,
        error: { message: 'No rows found' }
      };

      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue(mockErrorResponse);

      await expect(getUserProfileByAdmin('non-existent')).rejects.toThrow('Error fetching profile: No rows found');
    });

    it('should validate admin client initialization', async () => {
      expect(mockCreateSupabaseAdminClient).toHaveBeenCalled();
    });

    it('should handle row-level security bypass', async () => {
      const mockProfile: Profile = {
        id: 'restricted-user',
        first_name: 'Restricted',
        last_name: 'User',
        email: 'restricted@example.com',
        stripe_customer_id: null,
        stripe_subscription_key: null,
        updated_at: '2025-06-20T12:00:00Z',
        created_at: '2025-06-20T10:00:00Z'
      };

      const mockResponse = {
        data: mockProfile,
        error: null
      };

      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue(mockResponse);

      const result = await getUserProfileByAdmin('restricted-user');

      expect(result).toEqual(mockProfile);
    });
  });

  describe('getUserEmailByAdmin', () => {
    it('should retrieve email from auth.users table', async () => {
      const mockAuthResponse = {
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            email_confirmed_at: '2025-06-20T10:00:00Z'
          }
        },
        error: null
      };

      mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue(mockAuthResponse);

      const result = await getUserEmailByAdmin('user-123');

      expect(mockSupabaseAdmin.auth.admin.getUserById).toHaveBeenCalledWith('user-123');
      expect(result).toBe('user@example.com');
    });

    it('should handle users without email addresses', async () => {
      const mockAuthResponse = {
        data: {
          user: {
            id: 'user-123',
            email: null
          }
        },
        error: null
      };

      mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue(mockAuthResponse);

      await expect(getUserEmailByAdmin('user-123')).rejects.toThrow('User user-123 has no email address');
    });

    it('should throw descriptive errors for non-existent users', async () => {
      const mockErrorResponse = {
        data: { user: null },
        error: { message: 'User not found' }
      };

      mockSupabaseAdmin.auth.admin.getUserById.mockResolvedValue(mockErrorResponse);

      await expect(getUserEmailByAdmin('non-existent')).rejects.toThrow('Error fetching user: User not found');
    });
  });

  describe('updateUserProfileByAdmin', () => {
    it('should update profiles with admin privileges', async () => {
      const updatedProfile: Profile = {
        id: 'user-123',
        first_name: 'Updated',
        last_name: 'Admin',
        email: 'updated@example.com',
        stripe_customer_id: 'cus_updated',
        stripe_subscription_key: 'sub_updated',
        updated_at: '2025-06-20T12:30:00Z',
        created_at: '2025-06-20T10:00:00Z'
      };

      const mockResponse = {
        data: updatedProfile,
        error: null
      };

      mockSupabaseAdmin.from().update().eq().select().single.mockResolvedValue(mockResponse);

      const updates = {
        first_name: 'Updated',
        stripe_customer_id: 'cus_updated'
      };

      const result = await updateUserProfileByAdmin('user-123', updates);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual(updatedProfile);
    });

    it('should bypass row-level security restrictions', async () => {
      const restrictedProfile: Profile = {
        id: 'restricted-user',
        first_name: 'Restricted',
        last_name: 'Updated',
        email: 'restricted@example.com',
        stripe_customer_id: 'cus_restricted',
        stripe_subscription_key: null,
        updated_at: '2025-06-20T12:30:00Z',
        created_at: '2025-06-20T10:00:00Z'
      };

      const mockResponse = {
        data: restrictedProfile,
        error: null
      };

      mockSupabaseAdmin.from().update().eq().select().single.mockResolvedValue(mockResponse);

      const result = await updateUserProfileByAdmin('restricted-user', { 
        last_name: 'Updated',
        stripe_customer_id: 'cus_restricted'
      });

      expect(result).toEqual(restrictedProfile);
    });

    it('should handle database constraint violations', async () => {
      const mockErrorResponse = {
        data: null,
        error: { 
          message: 'duplicate key value violates unique constraint',
          code: '23505'
        }
      };

      mockSupabaseAdmin.from().update().eq().select().single.mockResolvedValue(mockErrorResponse);

      const updates = { email: 'duplicate@example.com' };

      await expect(updateUserProfileByAdmin('user-123', updates)).rejects.toThrow('Error updating profile: duplicate key value violates unique constraint');
    });
  });
});