import Stripe from 'stripe';

import { stripe } from './config';

export interface GetPricesWithProductParams {
    priceLookupKeys: string[];
}

// Useful for getting all available subscription plans
export async function getSubscriptionPricesFromLookups({
    priceLookupKeys,
}: GetPricesWithProductParams): Promise<Stripe.Price[]> {
    const prices = await stripe.prices.list({
        lookup_keys: priceLookupKeys,
        expand: ['data.product'],
        active: true
    });
    return prices.data;
}

export interface GetActiveCustomerSubscriptionsParams {
    customerId: string;
}

// Useful for checking if a customer has an active subscription
export async function getActiveCustomerSubscriptions({
    customerId,
}: GetActiveCustomerSubscriptionsParams): Promise<Stripe.Subscription[]> {
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10
    });
    return subscriptions.data.filter(subscription =>
        ['active', 'past_due', 'unpaid', 'paused'].includes(subscription.status)
    );
}
