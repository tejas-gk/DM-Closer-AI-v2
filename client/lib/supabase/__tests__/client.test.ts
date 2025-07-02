/**
 * @jest-environment jsdom
 */

// Mock environment variables before importing
const mockEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key-12345'
};

Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true
});

// Mock createClient from Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url, key) => ({
    url,
    key,
    auth: {},
    from: jest.fn(),
    storage: {}
  }))
}));

const { createClient } = require('@supabase/supabase-js');

describe('Supabase Client Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should initialize with correct environment variables', async () => {
    const { supabase } = await import('../client');
    
    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key-12345'
    );
    expect(supabase).toBeDefined();
    expect(supabase.url).toBe('https://test.supabase.co');
    expect(supabase.key).toBe('test-anon-key-12345');
  });

  it('should throw error when SUPABASE_URL is missing', async () => {
    // Mock missing URL
    Object.defineProperty(import.meta, 'env', {
      value: {
        VITE_SUPABASE_URL: undefined,
        VITE_SUPABASE_ANON_KEY: 'test-anon-key-12345'
      },
      writable: true
    });

    await expect(async () => {
      await import('../client');
    }).rejects.toThrow('Missing Supabase environment variables');
  });

  it('should throw error when SUPABASE_ANON_KEY is missing', async () => {
    // Mock missing anon key
    Object.defineProperty(import.meta, 'env', {
      value: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: undefined
      },
      writable: true
    });

    await expect(async () => {
      await import('../client');
    }).rejects.toThrow('Missing Supabase environment variables');
  });

  it('should create valid Supabase client instance', async () => {
    const { supabase } = await import('../client');
    
    expect(supabase).toHaveProperty('auth');
    expect(supabase).toHaveProperty('from');
    expect(supabase).toHaveProperty('storage');
  });

  it('should handle invalid URL formats gracefully', async () => {
    // Mock invalid URL format
    Object.defineProperty(import.meta, 'env', {
      value: {
        VITE_SUPABASE_URL: 'invalid-url-format',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key-12345'
      },
      writable: true
    });

    const { supabase } = await import('../client');
    
    expect(createClient).toHaveBeenCalledWith(
      'invalid-url-format',
      'test-anon-key-12345'
    );
    expect(supabase).toBeDefined();
  });

  it('should handle empty string environment variables', async () => {
    Object.defineProperty(import.meta, 'env', {
      value: {
        VITE_SUPABASE_URL: '',
        VITE_SUPABASE_ANON_KEY: ''
      },
      writable: true
    });

    await expect(async () => {
      await import('../client');
    }).rejects.toThrow('Missing Supabase environment variables');
  });

  it('should handle whitespace-only environment variables', async () => {
    Object.defineProperty(import.meta, 'env', {
      value: {
        VITE_SUPABASE_URL: '   ',
        VITE_SUPABASE_ANON_KEY: '   '
      },
      writable: true
    });

    await expect(async () => {
      await import('../client');
    }).rejects.toThrow('Missing Supabase environment variables');
  });

  it('should work with production-like environment variables', async () => {
    Object.defineProperty(import.meta, 'env', {
      value: {
        VITE_SUPABASE_URL: 'https://xyzcompany.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzY4NDA5MiwiZXhwIjoxOTYzMjYwMDkyfQ.test'
      },
      writable: true
    });

    const { supabase } = await import('../client');
    
    expect(createClient).toHaveBeenCalledWith(
      'https://xyzcompany.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NzY4NDA5MiwiZXhwIjoxOTYzMjYwMDkyfQ.test'
    );
    expect(supabase).toBeDefined();
  });
});