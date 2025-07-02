import Stripe from 'stripe';
import { stripe } from './config';
import { getUserProfileByAdmin, updateUserProfileByAdmin } from '../supabase/admin/profiles';
import { sendWelcomeEmail, sendTrialEndingEmail } from '../resend/emails';

/**
 * Handle Stripe webhook events for subscription trials
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
    console.log(`[Stripe Webhook] Processing event: ${event.type}`);

    switch (event.type) {
        case 'customer.subscription.trial_will_end':
            await handleTrialWillEnd(event.data.object as Stripe.Subscription);
            break;
        
        case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
            break;
        
        case 'invoice.payment_failed':
            await handlePaymentFailed(event.data.object as Stripe.Invoice);
            break;
        
        case 'customer.subscription.created':
            await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
            break;
        
        default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
}

/**
 * Handle trial ending soon - send reminder email
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    console.log(`[Stripe Webhook] Trial will end for subscription: ${subscription.id}`);
    
    try {
        const userId = subscription.metadata.user_id;
        if (!userId) {
            console.warn(`[Stripe Webhook] No user_id in subscription metadata: ${subscription.id}`);
            return;
        }

        const userProfile = await getUserProfileByAdmin(userId);
        if (!userProfile?.email) {
            console.warn(`[Stripe Webhook] No email found for user: ${userId}`);
            return;
        }

        // Send trial ending reminder email
        await sendTrialEndingEmail({
            email: userProfile.email,
            firstName: userProfile.first_name || 'there',
            trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000) : new Date(),
        });

        console.log(`[Stripe Webhook] Trial ending email sent to: ${userProfile.email}`);
    } catch (error) {
        console.error('[Stripe Webhook] Error handling trial_will_end:', error);
    }
}

/**
 * Handle subscription updates - track trial status changes
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log(`[Stripe Webhook] Subscription updated: ${subscription.id}, status: ${subscription.status}`);
    
    try {
        const userId = subscription.metadata.user_id;
        if (!userId) {
            console.warn(`[Stripe Webhook] No user_id in subscription metadata: ${subscription.id}`);
            return;
        }

        // Update user profile with subscription status
        await updateUserProfileByAdmin(userId, {
            stripe_subscription_key: subscription.id,
        });

        // Log trial status for monitoring
        if (subscription.status === 'trialing') {
            console.log(`[Stripe Webhook] User ${userId} is in trial period until ${subscription.trial_end ? new Date(subscription.trial_end * 1000) : 'unknown'}`);
        } else if (subscription.status === 'active') {
            console.log(`[Stripe Webhook] User ${userId} trial ended, subscription now active`);
        } else if (subscription.status === 'canceled') {
            console.log(`[Stripe Webhook] User ${userId} subscription canceled`);
        }

    } catch (error) {
        console.error('[Stripe Webhook] Error handling subscription updated:', error);
    }
}

/**
 * Handle payment failures after trial ends
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log(`[Stripe Webhook] Payment failed for invoice: ${invoice.id}`);
    
    try {
        if (!invoice.subscription) {
            console.log(`[Stripe Webhook] Invoice ${invoice.id} not associated with subscription`);
            return;
        }

        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.user_id;
        
        if (!userId) {
            console.warn(`[Stripe Webhook] No user_id in subscription metadata: ${subscription.id}`);
            return;
        }

        console.log(`[Stripe Webhook] Payment failed for user ${userId}, subscription: ${subscription.id}`);
        
        // Additional handling can be added here (e.g., send payment failed email)
        
    } catch (error) {
        console.error('[Stripe Webhook] Error handling payment failed:', error);
    }
}

/**
 * Handle new subscription creation with trial
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log(`[Stripe Webhook] Subscription created: ${subscription.id}, status: ${subscription.status}`);
    
    try {
        const userId = subscription.metadata.user_id;
        if (!userId) {
            console.warn(`[Stripe Webhook] No user_id in subscription metadata: ${subscription.id}`);
            return;
        }

        // Update user profile with subscription info
        await updateUserProfileByAdmin(userId, {
            stripe_subscription_key: subscription.id,
        });

        // If subscription starts with trial, log it
        if (subscription.status === 'trialing' && subscription.trial_end) {
            const trialEndDate = new Date(subscription.trial_end * 1000);
            console.log(`[Stripe Webhook] User ${userId} started 7-day trial, ends: ${trialEndDate.toISOString()}`);
            
            const userProfile = await getUserProfileByAdmin(userId);
            if (userProfile?.email) {
                // Send welcome email with trial information
                await sendWelcomeEmail({
                    email: userProfile.email,
                    firstName: userProfile.first_name || 'there',
                    trialEndDate: trialEndDate,
                });
            }
        }

    } catch (error) {
        console.error('[Stripe Webhook] Error handling subscription created:', error);
    }
}

/**
 * Verify webhook signature for security
 */
export function verifyWebhookSignature(body: string, signature: string, endpointSecret: string): Stripe.Event {
    try {
        return stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (error) {
        console.error('[Stripe Webhook] Signature verification failed:', error);
        throw new Error('Invalid webhook signature');
    }
}