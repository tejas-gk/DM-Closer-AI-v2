import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { createTestConversation, createTestMessage, mockStripeCustomer, mockStripeSubscription } from '../../test/factories';

// Mock external dependencies
jest.mock('../lib/stripe/checkout');
jest.mock('../lib/stripe/subscriptions');
jest.mock('../lib/stripe/customers');
jest.mock('../lib/openai/ai-responses');

const mockCreateCheckoutSession = require('../lib/stripe/checkout').createCheckoutSession;
const mockGetSubscriptionPrices = require('../lib/stripe/subscriptions').getSubscriptionPricesFromLookups;
const mockGetActiveSubscriptions = require('../lib/stripe/subscriptions').getActiveCustomerSubscriptions;
const mockFindOrCreateCustomer = require('../lib/stripe/customers').findOrCreateStripeCustomer;
const mockGenerateAIResponse = require('../lib/openai/ai-responses').generateAIResponse;

describe('API Routes Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'Instagram AI DM Assistant'
      });
    });
  });

  describe('Conversation endpoints', () => {
    describe('GET /api/conversations', () => {
      it('should return paginated conversations', async () => {
        const response = await request(app)
          .get('/api/conversations')
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body).toHaveProperty('conversations');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.conversations).toBeInstanceOf(Array);
        expect(response.body.pagination).toMatchObject({
          page: 1,
          limit: 10,
          total: expect.any(Number)
        });
      });

      it('should filter conversations by search query', async () => {
        const response = await request(app)
          .get('/api/conversations')
          .query({ search: 'sarah', page: 1, limit: 10 })
          .expect(200);

        expect(response.body.conversations).toBeInstanceOf(Array);
        // Mock data should include Sarah Martinez
        expect(response.body.conversations.length).toBeGreaterThan(0);
      });

      it('should handle invalid pagination parameters', async () => {
        const response = await request(app)
          .get('/api/conversations')
          .query({ page: -1, limit: 1000 })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/conversations/:id', () => {
      it('should return conversation with messages', async () => {
        const response = await request(app)
          .get('/api/conversations/conv_1')
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('messages');
        expect(response.body.messages).toBeInstanceOf(Array);
      });

      it('should return 404 for non-existent conversation', async () => {
        const response = await request(app)
          .get('/api/conversations/non-existent')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('AI endpoints', () => {
    describe('POST /api/ai/generate-response', () => {
      it('should generate AI response with valid input', async () => {
        mockGenerateAIResponse.mockResolvedValue('Thank you for your interest in our services!');

        const response = await request(app)
          .post('/api/ai/generate-response')
          .send({
            conversationId: 'conv_1',
            tone: 'friendly',
            customInstructions: 'Be helpful and professional'
          })
          .expect(200);

        expect(response.body).toHaveProperty('response');
        expect(response.body.response).toBe('Thank you for your interest in our services!');
        expect(mockGenerateAIResponse).toHaveBeenCalledWith({
          conversationContext: expect.objectContaining({
            messages: expect.any(Array),
            customerName: expect.any(String)
          }),
          toneSettings: {
            type: 'friendly',
            customInstructions: 'Be helpful and professional'
          },
          userId: expect.any(String)
        });
      });

      it('should handle invalid tone parameter', async () => {
        const response = await request(app)
          .post('/api/ai/generate-response')
          .send({
            conversationId: 'conv_1',
            tone: 'invalid-tone'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should handle missing conversation ID', async () => {
        const response = await request(app)
          .post('/api/ai/generate-response')
          .send({
            tone: 'friendly'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should handle AI generation errors', async () => {
        mockGenerateAIResponse.mockRejectedValue(new Error('OpenAI API error'));

        const response = await request(app)
          .post('/api/ai/generate-response')
          .send({
            conversationId: 'conv_1',
            tone: 'friendly'
          })
          .expect(500);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/ai/settings', () => {
      it('should update AI tone settings', async () => {
        const response = await request(app)
          .post('/api/ai/settings')
          .send({
            tone: 'professional',
            customInstructions: 'Always mention our premium services'
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });

      it('should validate tone settings', async () => {
        const response = await request(app)
          .post('/api/ai/settings')
          .send({
            tone: 'invalid-tone'
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Subscription endpoints', () => {
    describe('GET /api/subscription/plans', () => {
      it('should return available subscription plans', async () => {
        const mockPlans = [
          {
            id: 'price_starter',
            nickname: 'Starter Plan',
            unit_amount: 2900,
            currency: 'usd',
            product: {
              name: 'AI DM Assistant - Starter',
              description: '100 AI responses per month'
            }
          }
        ];

        mockGetSubscriptionPrices.mockResolvedValue(mockPlans);

        const response = await request(app)
          .get('/api/subscription/plans')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body[0]).toMatchObject({
          id: 'price_starter',
          nickname: 'Starter Plan',
          unit_amount: 2900
        });
      });

      it('should handle Stripe API errors', async () => {
        mockGetSubscriptionPrices.mockRejectedValue(new Error('Stripe API error'));

        const response = await request(app)
          .get('/api/subscription/plans')
          .expect(500);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/subscription/create-checkout', () => {
      it('should create checkout session', async () => {
        mockCreateCheckoutSession.mockResolvedValue({
          status: 'success',
          url: 'https://checkout.stripe.com/session_123'
        });

        const response = await request(app)
          .post('/api/subscription/create-checkout')
          .send({
            priceId: 'price_starter',
            successUrl: 'https://example.com/success',
            cancelUrl: 'https://example.com/cancel'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'success',
          url: 'https://checkout.stripe.com/session_123'
        });
      });

      it('should handle already subscribed users', async () => {
        mockCreateCheckoutSession.mockResolvedValue({
          status: 'already_subscribed',
          url: null
        });

        const response = await request(app)
          .post('/api/subscription/create-checkout')
          .send({
            priceId: 'price_starter',
            successUrl: 'https://example.com/success',
            cancelUrl: 'https://example.com/cancel'
          })
          .expect(200);

        expect(response.body).toMatchObject({
          status: 'already_subscribed',
          url: null
        });
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/subscription/create-checkout')
          .send({
            priceId: 'price_starter'
            // Missing successUrl and cancelUrl
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/subscription/status', () => {
      it('should return subscription status', async () => {
        mockFindOrCreateCustomer.mockResolvedValue(mockStripeCustomer);
        mockGetActiveSubscriptions.mockResolvedValue([mockStripeSubscription]);

        const response = await request(app)
          .get('/api/subscription/status')
          .expect(200);

        expect(response.body).toMatchObject({
          hasSubscription: true,
          subscriptions: [mockStripeSubscription],
          customerId: mockStripeCustomer.id
        });
      });

      it('should handle users without subscriptions', async () => {
        mockFindOrCreateCustomer.mockResolvedValue(mockStripeCustomer);
        mockGetActiveSubscriptions.mockResolvedValue([]);

        const response = await request(app)
          .get('/api/subscription/status')
          .expect(200);

        expect(response.body).toMatchObject({
          hasSubscription: false,
          subscriptions: [],
          customerId: mockStripeCustomer.id
        });
      });
    });
  });

  describe('Analytics endpoints', () => {
    describe('GET /api/analytics/dashboard', () => {
      it('should return dashboard analytics', async () => {
        const response = await request(app)
          .get('/api/analytics/dashboard')
          .expect(200);

        expect(response.body).toHaveProperty('overview');
        expect(response.body).toHaveProperty('usage');
        expect(response.body).toHaveProperty('performance');
        expect(response.body.overview).toMatchObject({
          totalConversations: expect.any(Number),
          aiResponsesGenerated: expect.any(Number),
          averageResponseTime: expect.any(String),
          customerEngagementRate: expect.any(Number)
        });
      });
    });

    describe('GET /api/analytics/usage', () => {
      it('should return usage analytics', async () => {
        const response = await request(app)
          .get('/api/analytics/usage')
          .query({ period: '30d' })
          .expect(200);

        expect(response.body).toHaveProperty('usage');
        expect(response.body.usage).toBeInstanceOf(Array);
      });

      it('should validate period parameter', async () => {
        const response = await request(app)
          .get('/api/analytics/usage')
          .query({ period: 'invalid' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/ai/generate-response')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle large payloads', async () => {
      const largePayload = {
        conversationId: 'conv_1',
        tone: 'friendly',
        customInstructions: 'A'.repeat(10000) // Very long string
      };

      const response = await request(app)
        .post('/api/ai/generate-response')
        .send(largePayload)
        .expect(413);

      expect(response.body).toHaveProperty('error');
    });
  });
});