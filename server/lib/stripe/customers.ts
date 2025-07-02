import type Stripe from 'stripe';

import { stripe } from './config';
import { updateUserProfileByAdmin, getUserProfileByAdmin, getUserEmailByAdmin } from '../supabase/admin/profiles';
import { createSupabaseAdminClient } from '../supabase/admin/client';

export async function findOrCreateStripeCustomer(userId: string): Promise<Stripe.Customer> {
    // Get user email from auth.users table first
    const userEmail = await getUserEmailByAdmin(userId);
    
    // Try to get user profile - it might not exist yet
    let profile = null;
    try {
        profile = await getUserProfileByAdmin(userId);
    } catch (error) {
        // Profile doesn't exist yet, we'll create it below
    }
    
    // If profile exists and has customer ID, try to retrieve it
    if (profile?.stripe_customer_id) {
        const customer = await stripe.customers.retrieve(profile.stripe_customer_id).catch(() => null);
        if (customer && !customer.deleted) {
            return customer;
        }
    }

    // Look up existing customer by email from auth.users
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customer = existingCustomers.data[0];

    // If no customer found, create new one
    if (!customer) {
        customer = await stripe.customers.create({
            email: userEmail,
            metadata: { user_id: userId }
        });
    }

    // Create or update profile with customer ID
    if (profile) {
        await updateUserProfileByAdmin(userId, { stripe_customer_id: customer.id });
    } else {
        // Create new profile record
        const supabase = createSupabaseAdminClient();
        await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: userEmail,
                stripe_customer_id: customer.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
    }

    return customer;
}
