import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

// Mock external services
jest.mock('@supabase/supabase-js');
jest.mock('openai');
jest.mock('stripe');

describe('API Endpoints Integration', () => {
  let app: express.Application;
  let server: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
    jest.clearAllMocks();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/signup', () => {
      it('should create new user account', async () => {
        const userData = {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User'
        };

        const response = await request(app)
          .post('/api/auth/signup')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('session');
        expect(response.body.user.email).toBe(userData.email);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/auth/signup')
          .send({ email: 'invalid' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('validation');
      });

      it('should handle duplicate email registration', async () => {
        const userData = {
          email: 'existing@example.com',
          password: 'SecurePass123!',
          firstName: 'Existing',
          lastName: 'User'
        };

        // First registration should succeed
        await request(app)
          .post('/api/auth/signup')
          .send(userData)
          .expect(201);

        // Second registration should fail
        const response = await request(app)
          .post('/api/auth/signup')
          .send(userData)
          .expect(409);

        expect(response.body.error).toContain('already exists');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should authenticate valid credentials', async () => {
        const credentials = {
          email: 'user@example.com',
          password: 'ValidPass123!'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(credentials)
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('session');
        expect(response.body.user.email).toBe(credentials.email);
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'wrong@example.com',
            password: 'wrongpassword'
          })
          .expect(401);

        expect(response.body.error).toContain('Invalid credentials');
      });

      it('should validate email format', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'invalid-email',
            password: 'password123'
          })
          .expect(400);

        expect(response.body.error).toContain('valid email');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should successfully logout authenticated user', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(response.body.message).toContain('Successfully logged out');
      });

      it('should handle logout without authentication', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .expect(401);

        expect(response.body.error).toContain('Not authenticated');
      });
    });
  });

  describe('Conversation Endpoints', () => {
    const authHeaders = { Authorization: 'Bearer valid-token' };

    describe('GET /api/conversations', () => {
      it('should return user conversations with pagination', async () => {
        const response = await request(app)
          .get('/api/conversations?page=1&limit=10')
          .set(authHeaders)
          .expect(200);

        expect(response.body).toHaveProperty('conversations');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.conversations)).toBe(true);
      });

      it('should filter conversations by search query', async () => {
        const response = await request(app)
          .get('/api/conversations?search=fitness')
          .set(authHeaders)
          .expect(200);

        expect(response.body.conversations).toBeDefined();
        // Verify search functionality
        if (response.body.conversations.length > 0) {
          expect(response.body.conversations[0]).toHaveProperty('participantName');
        }
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/conversations')
          .expect(401);

        expect(response.body.error).toContain('authentication');
      });

      it('should handle invalid pagination parameters', async () => {
        const response = await request(app)
          .get('/api/conversations?page=-1&limit=0')
          .set(authHeaders)
          .expect(400);

        expect(response.body.error).toContain('Invalid pagination');
      });
    });

    describe('GET /api/conversations/:id', () => {
      it('should return conversation with messages', async () => {
        const conversationId = 'conv_123';
        const response = await request(app)
          .get(`/api/conversations/${conversationId}`)
          .set(authHeaders)
          .expect(200);

        expect(response.body).toHaveProperty('conversation');
        expect(response.body.conversation).toHaveProperty('messages');
        expect(Array.isArray(response.body.conversation.messages)).toBe(true);
      });

      it('should return 404 for non-existent conversation', async () => {
        const response = await request(app)
          .get('/api/conversations/non-existent')
          .set(authHeaders)
          .expect(404);

        expect(response.body.error).toContain('not found');
      });

      it('should prevent access to other users conversations', async () => {
        const response = await request(app)
          .get('/api/conversations/other-user-conv')
          .set({ Authorization: 'Bearer other-user-token' })
          .expect(403);

        expect(response.body.error).toContain('access denied');
      });
    });

    describe('POST /api/conversations/:id/messages', () => {
      it('should create new message in conversation', async () => {
        const messageData = {
          content: 'Hello, this is a test message',
          senderType: 'user'
        };

        const response = await request(app)
          .post('/api/conversations/conv_123/messages')
          .set(authHeaders)
          .send(messageData)
          .expect(201);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message.content).toBe(messageData.content);
        expect(response.body.message.senderType).toBe(messageData.senderType);
      });

      it('should validate message content', async () => {
        const response = await request(app)
          .post('/api/conversations/conv_123/messages')
          .set(authHeaders)
          .send({ content: '', senderType: 'user' })
          .expect(400);

        expect(response.body.error).toContain('Message content cannot be empty');
      });

      it('should validate sender type', async () => {
        const response = await request(app)
          .post('/api/conversations/conv_123/messages')
          .set(authHeaders)
          .send({ content: 'Test message', senderType: 'invalid' })
          .expect(400);

        expect(response.body.error).toContain('Invalid sender type');
      });
    });
  });

  describe('AI Integration Endpoints', () => {
    const authHeaders = { Authorization: 'Bearer valid-token' };

    describe('POST /api/ai/generate-response', () => {
      it('should generate AI response with conversation context', async () => {
        const requestData = {
          conversationId: 'conv_123',
          tone: 'friendly',
          customInstructions: 'Be helpful and professional'
        };

        const response = await request(app)
          .post('/api/ai/generate-response')
          .set(authHeaders)
          .send(requestData)
          .expect(200);

        expect(response.body).toHaveProperty('response');
        expect(response.body).toHaveProperty('tone');
        expect(response.body.tone).toBe(requestData.tone);
      });

      it('should handle invalid conversation ID', async () => {
        const response = await request(app)
          .post('/api/ai/generate-response')
          .set(authHeaders)
          .send({
            conversationId: 'invalid-conv',
            tone: 'friendly'
          })
          .expect(404);

        expect(response.body.error).toContain('Conversation not found');
      });

      it('should validate tone parameter', async () => {
        const response = await request(app)
          .post('/api/ai/generate-response')
          .set(authHeaders)
          .send({
            conversationId: 'conv_123',
            tone: 'invalid-tone'
          })
          .expect(400);

        expect(response.body.error).toContain('Invalid tone');
      });

      it('should handle OpenAI API failures', async () => {
        // Mock OpenAI API failure
        const mockOpenAI = require('openai');
        mockOpenAI.prototype.chat = {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API unavailable'))
          }
        };

        const response = await request(app)
          .post('/api/ai/generate-response')
          .set(authHeaders)
          .send({
            conversationId: 'conv_123',
            tone: 'friendly'
          })
          .expect(503);

        expect(response.body.error).toContain('AI service temporarily unavailable');
      });
    });

    describe('GET /api/ai/settings/:userId', () => {
      it('should return user AI configuration', async () => {
        const response = await request(app)
          .get('/api/ai/settings/user_123')
          .set(authHeaders)
          .expect(200);

        expect(response.body).toHaveProperty('settings');
        expect(response.body.settings).toHaveProperty('tone');
        expect(response.body.settings).toHaveProperty('customInstructions');
      });

      it('should prevent access to other users settings', async () => {
        const response = await request(app)
          .get('/api/ai/settings/other_user')
          .set({ Authorization: 'Bearer other-user-token' })
          .expect(403);

        expect(response.body.error).toContain('Access denied');
      });
    });

    describe('PUT /api/ai/settings/:userId', () => {
      it('should update user AI settings', async () => {
        const settingsUpdate = {
          tone: 'professional',
          customInstructions: 'Always include call-to-action in responses'
        };

        const response = await request(app)
          .put('/api/ai/settings/user_123')
          .set(authHeaders)
          .send(settingsUpdate)
          .expect(200);

        expect(response.body).toHaveProperty('settings');
        expect(response.body.settings.tone).toBe(settingsUpdate.tone);
        expect(response.body.settings.customInstructions).toBe(settingsUpdate.customInstructions);
      });

      it('should validate settings parameters', async () => {
        const response = await request(app)
          .put('/api/ai/settings/user_123')
          .set(authHeaders)
          .send({
            tone: 'invalid-tone',
            customInstructions: 'a'.repeat(2001) // Too long
          })
          .expect(400);

        expect(response.body.error).toContain('validation');
      });
    });
  });

  describe('Subscription Endpoints', () => {
    const authHeaders = { Authorization: 'Bearer valid-token' };

    describe('POST /api/create-checkout-session', () => {
      it('should create Stripe checkout session', async () => {
        const checkoutData = {
          priceId: 'price_monthly_29',
          userId: 'user_123'
        };

        const response = await request(app)
          .post('/api/create-checkout-session')
          .set(authHeaders)
          .send(checkoutData)
          .expect(200);

        expect(response.body).toHaveProperty('sessionId');
        expect(response.body).toHaveProperty('url');
      });

      it('should validate price ID', async () => {
        const response = await request(app)
          .post('/api/create-checkout-session')
          .set(authHeaders)
          .send({
            priceId: 'invalid-price',
            userId: 'user_123'
          })
          .expect(400);

        expect(response.body.error).toContain('Invalid price ID');
      });
    });

    describe('GET /api/subscription-status', () => {
      it('should return user subscription status', async () => {
        const response = await request(app)
          .get('/api/subscription-status?userId=user_123')
          .set(authHeaders)
          .expect(200);

        expect(response.body).toHaveProperty('subscription');
        expect(response.body).toHaveProperty('usage');
        expect(response.body.subscription).toHaveProperty('status');
      });

      it('should handle user without subscription', async () => {
        const response = await request(app)
          .get('/api/subscription-status?userId=user_no_sub')
          .set(authHeaders)
          .expect(200);

        expect(response.body.subscription).toBeNull();
        expect(response.body.usage).toBeDefined();
      });
    });

    describe('POST /api/create-portal-session', () => {
      it('should create Stripe customer portal session', async () => {
        const response = await request(app)
          .post('/api/create-portal-session')
          .set(authHeaders)
          .send({ customerId: 'cus_123456' })
          .expect(200);

        expect(response.body).toHaveProperty('url');
      });

      it('should validate customer ID', async () => {
        const response = await request(app)
          .post('/api/create-portal-session')
          .set(authHeaders)
          .send({ customerId: '' })
          .expect(400);

        expect(response.body.error).toContain('Customer ID required');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body.error).toContain('Not found');
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.error).toContain('Invalid JSON');
    });

    it('should handle large request payloads', async () => {
      const largePayload = {
        content: 'a'.repeat(100000) // 100KB of content
      };

      const response = await request(app)
        .post('/api/conversations/conv_123/messages')
        .set({ Authorization: 'Bearer valid-token' })
        .send(largePayload)
        .expect(413);

      expect(response.body.error).toContain('Payload too large');
    });
  });
});