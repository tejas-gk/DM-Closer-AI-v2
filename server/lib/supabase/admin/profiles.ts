import { createSupabaseAdminClient } from './client';

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

export async function getUserProfileByAdmin(userId: string) {
    const supabase = createSupabaseAdminClient();
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

export async function getUserEmailByAdmin(userId: string): Promise<string> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
        throw new Error(`Error fetching user: ${error?.message || 'User not found'}`);
    }
    if (!data.user.email) {
        throw new Error(`User ${userId} has no email address`);
    }

    return data.user.email;
}

export async function updateUserProfileByAdmin(userId: string, updates: Partial<Pick<Profile, 'first_name' | 'last_name' | 'email' | 'stripe_customer_id' | 'stripe_subscription_key'>>) {
    const supabase = createSupabaseAdminClient();
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
