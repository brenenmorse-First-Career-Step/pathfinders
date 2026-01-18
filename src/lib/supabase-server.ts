import { createServerClient as createServerSupabaseClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseLogger } from './supabase';

// Environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side Supabase client (for use in Server Components and API routes)
export async function createServerClient() {
    try {
        const cookieStore = await cookies();
        const client = createServerSupabaseClient(
            supabaseUrl!,
            supabaseAnonKey!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options);
                            });
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );
        supabaseLogger.info('Client Creation', 'Server client created successfully');
        return client;
    } catch (error) {
        supabaseLogger.error('Client Creation', error, { type: 'server' });
        throw error;
    }
}
