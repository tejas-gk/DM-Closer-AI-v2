import { createCheckoutSession } from '../checkout';
import { mockStripeCustomer, mockStripeSubscription } from '../../../../test/factories';

// Mock Stripe
jest.mock('../config', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn()
      }
    },
    customers: {
      retrieve: jest.fn()
    },
    subscriptions: {
      list: jest.fn()
    }
  }
}));

// Mock customer utilities
jest.mock('../customers', () => ({
  findOrCreateStripeCustomer: jest.fn()
}));

const mockStripe = require('../config').stripe;
const mockFindOrCreateStripeCustomer = require('../customers').findOrCreateStripeCustomer;

describe('Stripe Checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    const mockParams = {
      userId: 'user-123',
      priceId: 'price_123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    };

    it('should create checkout session for new subscription', async () => {
      mockFindOrCreateStripeCustomer.mockResolvedValue(mockStripeCustomer);
      mockStripe.subscriptions.list.mockResolvedValue({ data: [] });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_123'
      });

      const result = await createCheckoutSession(mockParams);

      expect(mockFindOrCreateStripeCustomer).toHaveBeenCalledWith('user-123');
      expect(mockStripe.subscriptions.list).toHaveBeenCalledWith({
        customer: mockStripeCustomer.id,
        status: 'active'
      });
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: mockStripeCustomer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_123',
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        allow_promotion_codes: true,
        billing_address_collection: 'required'
      });
      expect(result.status).toBe('success');
      expect(result.url).toBe('https://checkout.stripe.com/session_123');
    });

    it('should return already_subscribed when user has active subscription', async () => {
      mockFindOrCreateStripeCustomer.mockResolvedValue(mockStripeCustomer);
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [mockStripeSubscription]
      });

      const result = await createCheckoutSession(mockParams);

      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
      expect(result.status).toBe('already_subscribed');
      expect(result.url).toBeNull();
    });

    it('should handle Stripe API errors', async () => {
      mockFindOrCreateStripeCustomer.mockResolvedValue(mockStripeCustomer);
      mockStripe.subscriptions.list.mockResolvedValue({ data: [] });
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('Payment method not available')
      );

      await expect(createCheckoutSession(mockParams)).rejects.toThrow(
        'Payment method not available'
      );
    });

    it('should handle customer creation failure', async () => {
      mockFindOrCreateStripeCustomer.mockRejectedValue(
        new Error('Failed to create customer')
      );

      await expect(createCheckoutSession(mockParams)).rejects.toThrow(
        'Failed to create customer'
      );
    });

    it('should include metadata in checkout session', async () => {
      mockFindOrCreateStripeCustomer.mockResolvedValue(mockStripeCustomer);
      mockStripe.subscriptions.list.mockResolvedValue({ data: [] });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session_123'
      });

      await createCheckoutSession(mockParams);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user-123'
          }
        })
      );
    });

    it('should handle multiple active subscriptions', async () => {
      mockFindOrCreateStripeCustomer.mockResolvedValue(mockStripeCustomer);
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [mockStripeSubscription, { ...mockStripeSubscription, id: 'sub_test456' }]
      });

      const result = await createCheckoutSession(mockParams);

      expect(result.status).toBe('already_subscribed');
      expect(result.url).toBeNull();
    });

    it('should handle invalid price ID', async () => {
      mockFindOrCreateStripeCustomer.mockResolvedValue(mockStripeCustomer);
      mockStripe.subscriptions.list.mockResolvedValue({ data: [] });
      mockStripe.checkout.sessions.create.mockRejectedValue(
        new Error('No such price: price_invalid')
      );

      await expect(createCheckoutSession({
        ...mockParams,
        priceId: 'price_invalid'
      })).rejects.toThrow('No such price: price_invalid');
    });
  });
});