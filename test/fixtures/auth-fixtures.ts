// Test fixtures for authentication testing

export const mockUsers = {
  validUser: {
    id: 'user-valid-123',
    email: 'valid@example.com',
    password: 'validpassword123',
    first_name: 'Valid',
    last_name: 'User',
    created_at: '2025-06-20T10:00:00Z',
    updated_at: '2025-06-20T10:00:00Z'
  },
  
  newUser: {
    id: 'user-new-456',
    email: 'newuser@example.com',
    password: 'newpassword123',
    first_name: 'New',
    last_name: 'User',
    created_at: '2025-06-20T11:00:00Z',
    updated_at: '2025-06-20T11:00:00Z'
  },

  adminUser: {
    id: 'user-admin-789',
    email: 'admin@example.com',
    password: 'adminpassword123',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    created_at: '2025-06-20T09:00:00Z',
    updated_at: '2025-06-20T09:00:00Z'
  }
};

export const mockProfiles = {
  complete: {
    id: 'user-complete-123',
    first_name: 'Complete',
    last_name: 'Profile',
    email: 'complete@example.com',
    stripe_customer_id: 'cus_complete123',
    stripe_subscription_key: 'sub_complete456',
    updated_at: '2025-06-20T12:00:00Z',
    created_at: '2025-06-20T10:00:00Z'
  },

  minimal: {
    id: 'user-minimal-456',
    first_name: 'Minimal',
    last_name: 'Profile',
    email: 'minimal@example.com',
    stripe_customer_id: null,
    stripe_subscription_key: null,
    updated_at: '2025-06-20T12:00:00Z',
    created_at: '2025-06-20T10:00:00Z'
  }
};

export const mockSupabaseResponses = {
  successfulSignup: {
    data: {
      user: {
        id: 'user-new-456',
        email: 'newuser@example.com',
        user_metadata: {
          first_name: 'New',
          last_name: 'User'
        }
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000
      }
    },
    error: null
  },

  successfulLogin: {
    data: {
      user: {
        id: 'user-valid-123',
        email: 'valid@example.com',
        role: 'authenticated'
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000
      }
    },
    error: null
  },

  invalidCredentials: {
    data: { user: null, session: null },
    error: { message: 'Invalid login credentials', code: 'invalid_credentials' }
  },

  successfulLogout: {
    error: null
  }
};

export const createMockSupabaseClient = () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    admin: {
      getUserById: jest.fn()
    }
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
});