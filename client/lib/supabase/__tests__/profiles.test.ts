import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getUserProfile, updateUserProfile, type Profile } from '../profiles';
import { supabase } from '../client';

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Profiles Service', () => {
  const mockProfile: Profile = {
    id: 'user-123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    stripe_customer_id: 'cus_123456',
    stripe_subscription_key: 'sub_789012',
    updated_at: '2025-06-20T12:00:00Z',
    created_at: '2025-06-20T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile data', async () => {
      const mockQuery = {
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockQuery),
        }),
      } as any);

      const result = await getUserProfile('user-123');

      expect(result).toEqual(mockProfile);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should return null when profile not found', async () => {
      const mockQuery = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'The result contains 0 rows' },
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockQuery),
        }),
      } as any);

      const result = await getUserProfile('nonexistent-user');

      expect(result).toBeNull();
    });

    it('should throw error for database failures', async () => {
      const mockError = { message: 'Database connection failed' };
      const mockQuery = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue(mockQuery),
        }),
      } as any);

      await expect(getUserProfile('user-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('updateUserProfile', () => {
    it('should successfully update profile fields', async () => {
      const updates = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
      };

      const updatedProfile = {
        ...mockProfile,
        ...updates,
        updated_at: '2025-06-20T13:00:00Z',
      };

      const mockQuery = {
        single: jest.fn().mockResolvedValue({
          data: updatedProfile,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(mockQuery),
          }),
        }),
      } as any);

      const result = await updateUserProfile('user-123', updates);

      expect(result).toEqual(updatedProfile);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should handle partial updates', async () => {
      const updates = { first_name: 'UpdatedName' };
      const updatedProfile = {
        ...mockProfile,
        first_name: 'UpdatedName',
        updated_at: '2025-06-20T13:00:00Z',
      };

      const mockQuery = {
        single: jest.fn().mockResolvedValue({
          data: updatedProfile,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(mockQuery),
          }),
        }),
      } as any);

      const result = await updateUserProfile('user-123', updates);

      expect(result.first_name).toBe('UpdatedName');
      expect(result.last_name).toBe(mockProfile.last_name); // unchanged
    });

    it('should handle Stripe-related updates', async () => {
      const updates = {
        stripe_customer_id: 'cus_new123',
        stripe_subscription_key: 'sub_new456',
      };

      const updatedProfile = {
        ...mockProfile,
        ...updates,
      };

      const mockQuery = {
        single: jest.fn().mockResolvedValue({
          data: updatedProfile,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(mockQuery),
          }),
        }),
      } as any);

      const result = await updateUserProfile('user-123', updates);

      expect(result.stripe_customer_id).toBe('cus_new123');
      expect(result.stripe_subscription_key).toBe('sub_new456');
    });

    it('should throw error when update fails', async () => {
      const mockError = { message: 'Update failed' };
      const mockQuery = {
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(mockQuery),
          }),
        }),
      } as any);

      await expect(updateUserProfile('user-123', { first_name: 'Test' }))
        .rejects.toThrow('Update failed');
    });

    it('should handle empty updates object', async () => {
      const mockQuery = {
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue(mockQuery),
          }),
        }),
      } as any);

      const result = await updateUserProfile('user-123', {});

      expect(result).toEqual(mockProfile);
    });
  });
});