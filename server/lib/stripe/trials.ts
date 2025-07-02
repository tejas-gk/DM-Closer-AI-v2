import Stripe from 'stripe';
import { stripe } from './config';

export interface TrialInfo {
    isInTrial: boolean;
    trialEnd: Date | null;
    daysRemaining: number;
    subscriptionId: string | null;
    subscriptionStatus: string | null;
}

/**
 * Get trial information for a customer
 */
export async function getCustomerTrialInfo(customerId: string): Promise<TrialInfo> {
    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 10
        });

        // Find the most recent subscription (active or trialing)
        const activeSubscription = subscriptions.data.find(sub => 
            ['trialing', 'active', 'past_due'].includes(sub.status)
        );

        if (!activeSubscription) {
            return {
                isInTrial: false,
                trialEnd: null,
                daysRemaining: 0,
                subscriptionId: null,
                subscriptionStatus: null
            };
        }

        const isInTrial = activeSubscription.status === 'trialing' && activeSubscription.trial_end !== null;
        const trialEnd = activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1000) : null;
        const daysRemaining = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

        return {
            isInTrial,
            trialEnd,
            daysRemaining,
            subscriptionId: activeSubscription.id,
            subscriptionStatus: activeSubscription.status
        };

    } catch (error) {
        console.error('[Stripe Trials] Error getting trial info:', error);
        throw error;
    }
}

/**
 * End trial early (convert to active subscription)
 */
export async function endTrialEarly(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
        console.log(`[Stripe Trials] Ending trial early for subscription: ${subscriptionId}`);
        
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            trial_end: 'now'
        });

        console.log(`[Stripe Trials] Trial ended early, subscription status: ${subscription.status}`);
        return subscription;

    } catch (error) {
        console.error('[Stripe Trials] Error ending trial early:', error);
        throw error;
    }
}

/**
 * Check if a user has a valid payment method for trial conversion
 */
export async function hasValidPaymentMethod(customerId: string): Promise<boolean> {
    try {
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        
        // Check if customer has a default payment method
        if (customer.default_source || customer.invoice_settings.default_payment_method) {
            return true;
        }

        // Check for attached payment methods
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card'
        });

        return paymentMethods.data.length > 0;

    } catch (error) {
        console.error('[Stripe Trials] Error checking payment method:', error);
        return false;
    }
}