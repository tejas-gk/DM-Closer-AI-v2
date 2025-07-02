import { supabase } from './client';

export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function signupUser(email: string, password: string, metadata?: any) {
    return await supabase.auth.signUp({
        email,
        password,
        options: {
            ...(metadata ? { data: metadata } : {}),
            emailRedirectTo: `${window.location.origin}/membership`
        },
    });
}

export async function loginUser(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
}

export async function logoutUser() {
    return await supabase.auth.signOut();
}

export async function resetPasswordForEmail(email: string, redirectTo?: string) {
    return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
    });
}