import { supabase } from './client';

export interface Profile {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    stripe_customer_id: string | null
    stripe_subscription_key: string | null
    updated_at: string
    created_at: string
}

export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        throw new Error(`Error fetching profile: ${error.message}`)
    }

    return data as Profile
}

export async function updateUserProfile(userId: string, updates: Partial<Pick<Profile, 'first_name' | 'last_name' | 'email' | 'stripe_customer_id' | 'stripe_subscription_key'>>) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

    if (error) {
        throw new Error(`Error updating profile: ${error.message}`)
    }

    return data as Profile
}
