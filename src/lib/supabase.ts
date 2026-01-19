/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { createBrowserClient as createBrowserSupabaseClient } from '@supabase/ssr';

// Environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Logger utility for Supabase operations
export const supabaseLogger = {
    error: (operation: string, error: any, context?: any) => {
        console.error(`[Supabase Error] ${operation}:`, {
            error: error.message || error,
            code: error.code,
            details: error.details,
            hint: error.hint,
            context,
            timestamp: new Date().toISOString(),
        });
    },
    info: (operation: string, message: string, data?: any) => {
        console.log(`[Supabase Info] ${operation}:`, {
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    },
    warn: (operation: string, message: string, data?: any) => {
        console.warn(`[Supabase Warning] ${operation}:`, {
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    },
};

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    supabaseLogger.error('Environment Variables', new Error('Missing required environment variables'), {
        missing: missingVars,
    });

    throw new Error(`Missing Supabase environment variables: ${missingVars.join(', ')}`);
}

// Client-side Supabase client (for use in Client Components)
// Use singleton pattern to avoid excessive client creation
let browserClientInstance: ReturnType<typeof createBrowserSupabaseClient> | null = null;

export function createBrowserClient() {
    try {
        // Return existing client if available (singleton pattern)
        if (browserClientInstance) {
            return browserClientInstance;
        }
        
        browserClientInstance = createBrowserSupabaseClient(
            supabaseUrl!,
            supabaseAnonKey!
        );
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            supabaseLogger.info('Client Creation', 'Browser client created successfully');
        }
        return browserClientInstance;
    } catch (error) {
        supabaseLogger.error('Client Creation', error, { type: 'browser' });
        throw error;
    }
}

// Admin client with service role key (for privileged operations)
// Use singleton pattern to avoid excessive client creation
let adminClientInstance: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
    if (!supabaseServiceKey) {
        const error = new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
        supabaseLogger.error('Admin Client Creation', error);
        throw error;
    }

    if (!supabaseUrl) {
        const error = new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
        supabaseLogger.error('Admin Client Creation', error);
        throw error;
    }

    try {
        // Return existing client if available (singleton pattern)
        if (adminClientInstance) {
            return adminClientInstance;
        }
        
        adminClientInstance = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            supabaseLogger.info('Client Creation', 'Admin client created successfully');
        }
        return adminClientInstance;
    } catch (error) {
        supabaseLogger.error('Client Creation', error, { type: 'admin' });
        throw error;
    }
}

// Helper function to handle Supabase errors consistently
export function handleSupabaseError(operation: string, error: any, context?: any) {
    supabaseLogger.error(operation, error, context);

    // Return user-friendly error messages
    if (error.message?.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please try again.' };
    }

    if (error.message?.includes('User already registered')) {
        return { error: 'An account with this email already exists.' };
    }

    if (error.message?.includes('Email not confirmed')) {
        return { error: 'Please confirm your email address before signing in.' };
    }

    if (error.code === 'PGRST116') {
        return { error: 'No data found. Please try again.' };
    }

    if (error.code === '23505') {
        return { error: 'This record already exists.' };
    }

    // Generic error message
    return { error: 'An unexpected error occurred. Please try again later.' };
}

// Type definitions for database tables
export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    linkedin_link: string | null;
                    full_name: string | null;
                    date_created: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    linkedin_link?: string | null;
                    full_name?: string | null;
                    date_created?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    linkedin_link?: string | null;
                    full_name?: string | null;
                    date_created?: string;
                };
            };
            profile: {
                Row: {
                    id: string;
                    user_id: string;
                    high_school: string | null;
                    graduation_year: string | null;
                    interests: string[] | null;
                    headline: string | null;
                    about_text: string | null;
                    photo_url: string | null;
                    photo_enhanced_url: string | null;
                    skills: string[] | null;
                    date_updated: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    high_school?: string | null;
                    graduation_year?: string | null;
                    interests?: string[] | null;
                    headline?: string | null;
                    about_text?: string | null;
                    photo_url?: string | null;
                    photo_enhanced_url?: string | null;
                    skills?: string[] | null;
                    date_updated?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    high_school?: string | null;
                    graduation_year?: string | null;
                    interests?: string[] | null;
                    headline?: string | null;
                    about_text?: string | null;
                    photo_url?: string | null;
                    photo_enhanced_url?: string | null;
                    skills?: string[] | null;
                    date_updated?: string;
                };
            };
            experiences: {
                Row: {
                    id: string;
                    user_id: string;
                    type: 'job' | 'sport' | 'club' | 'volunteer' | 'project';
                    title: string | null;
                    organization: string | null;
                    bullets: string[] | null;
                    date_created: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: 'job' | 'sport' | 'club' | 'volunteer' | 'project';
                    title?: string | null;
                    organization?: string | null;
                    bullets?: string[] | null;
                    date_created?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: 'job' | 'sport' | 'club' | 'volunteer' | 'project';
                    title?: string | null;
                    organization?: string | null;
                    bullets?: string[] | null;
                    date_created?: string;
                };
            };
            resume: {
                Row: {
                    id: string;
                    user_id: string;
                    pdf_url: string | null;
                    generated_at: string;
                    version: number;
                    stripe_session_id: string | null;
                    payment_status: 'pending' | 'paid';
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    pdf_url?: string | null;
                    generated_at?: string;
                    version?: number;
                    stripe_session_id?: string | null;
                    payment_status?: 'pending' | 'paid';
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    pdf_url?: string | null;
                    generated_at?: string;
                    version?: number;
                    stripe_session_id?: string | null;
                    payment_status?: 'pending' | 'paid';
                };
            };
        };
    };
};
