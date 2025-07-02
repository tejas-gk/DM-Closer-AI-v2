import { 
  InsertConversation, 
  InsertMessage, 
  InsertUserUsage, 
  InsertUserPreferences,
  Conversation,
  Message,
  UserUsage,
  UserPreferences
} from '../shared/schema';

// Factory functions for creating test data
export const createTestConversation = (overrides: Partial<InsertConversation> = {}): InsertConversation => ({
  userId: 'user-123',
  instagramThreadId: 'thread-123',
  participantUsername: 'test_user',
  participantName: 'Test User',
  participantAvatarUrl: 'https://example.com/avatar.jpg',
  lastMessageAt: new Date(),
  isRead: false,
  isArchived: false,
  messageCount: 1,
  ...overrides
});

export const createTestMessage = (overrides: Partial<InsertMessage> = {}): InsertMessage => ({
  conversationId: 'conv-123',
  instagramMessageId: 'msg-123',
  senderType: 'customer',
  content: 'Test message content',
  messageType: 'text',
  isRead: false,
  aiGenerated: false,
  toneUsed: null,
  responseStatus: 'pending',
  sentAt: new Date(),
  deliveredAt: null,
  ...overrides
});

export const createTestUserUsage = (overrides: Partial<InsertUserUsage> = {}): InsertUserUsage => ({
  userId: 'user-123',
  month: new Date(),
  aiResponsesUsed: 10,
  quotaLimit: 100,
  ...overrides
});

export const createTestUserPreferences = (overrides: Partial<InsertUserPreferences> = {}): InsertUserPreferences => ({
  userId: 'user-123',
  aiTone: 'friendly',
  customInstructions: 'Be helpful and professional',
  notificationPreferences: '{"email": true, "push": false}',
  ...overrides
});

// Full objects with IDs for select operations
export const createFullConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-123',
  userId: 'user-123',
  instagramThreadId: 'thread-123',
  participantUsername: 'test_user',
  participantName: 'Test User',
  participantAvatarUrl: 'https://example.com/avatar.jpg',
  lastMessageAt: new Date(),
  isRead: false,
  isArchived: false,
  messageCount: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createFullMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-123',
  conversationId: 'conv-123',
  instagramMessageId: 'msg-123',
  senderType: 'customer',
  content: 'Test message content',
  messageType: 'text',
  isRead: false,
  aiGenerated: false,
  toneUsed: null,
  responseStatus: 'pending',
  sentAt: new Date(),
  deliveredAt: null,
  createdAt: new Date(),
  ...overrides
});

export const createFullUserUsage = (overrides: Partial<UserUsage> = {}): UserUsage => ({
  id: 'usage-123',
  userId: 'user-123',
  month: new Date(),
  aiResponsesUsed: 10,
  quotaLimit: 100,
  createdAt: new Date(),
  ...overrides
});

export const createFullUserPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  id: 'pref-123',
  userId: 'user-123',
  aiTone: 'friendly',
  customInstructions: 'Be helpful and professional',
  notificationPreferences: '{"email": true, "push": false}',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Mock API responses
export const mockStripeCustomer = {
  id: 'cus_test123',
  email: 'test@example.com',
  created: Date.now() / 1000,
  metadata: {}
};

export const mockStripeSubscription = {
  id: 'sub_test123',
  customer: 'cus_test123',
  status: 'active',
  current_period_start: Date.now() / 1000,
  current_period_end: (Date.now() / 1000) + (30 * 24 * 60 * 60),
  items: {
    data: [{
      price: {
        id: 'price_test123',
        unit_amount: 2900,
        currency: 'usd'
      }
    }]
  }
};

export const mockOpenAIResponse = {
  choices: [{
    message: {
      role: 'assistant',
      content: 'Thank you for your interest! I\'d be happy to help you with our fitness coaching services.'
    }
  }],
  usage: {
    prompt_tokens: 50,
    completion_tokens: 20,
    total_tokens: 70
  }
};