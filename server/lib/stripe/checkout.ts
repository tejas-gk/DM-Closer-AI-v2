import { stripe } from './config';
import { getActiveCustomerSubscriptions } from './subscriptions';
import { findOrCreateStripeCustomer } from './customers';

export interface CreateCheckoutSessionParams {
    userId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
}

export interface CheckoutSessionResult {
    url: string | null;
    status: "success" | "already_subscribed";
}

export async function createCheckoutSession({
    userId,
    priceId,
    successUrl,
    cancelUrl,
}: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
    // Find or create customer to avoid duplicates
    const customer = await findOrCreateStripeCustomer(userId);

    // Check for existing active subscriptions to prevent duplicates
    const activeSubscriptions = await getActiveCustomerSubscriptions({
        customerId: customer.id,
    });
    if (activeSubscriptions.length > 0) {
        console.log(
            `User ${userId} attempted to create checkout session but already has ${activeSubscriptions.length} active subscription(s)`,
        );
        return { url: null, status: "already_subscribed" };
    }

    const session = await stripe.checkout.sessions.create({
        billing_address_collection: "auto",
        customer: customer.id,
        metadata: {
            user_id: userId,
            price_id: priceId,
        },
        subscription_data: {
            trial_period_days: 7,
            trial_settings: {
                end_behavior: {
                    missing_payment_method: "cancel"
                }
            },
            metadata: {
                user_id: userId,
                price_id: priceId,
            },
        },
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
    });
    return { url: session.url!, status: "success" };
}
