'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase';
import { authLogger } from '@/lib/logger';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, fullName: string, linkedinLink?: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createBrowserClient();

    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                authLogger.info('Initializing auth session');

                const {
                    data: { session: initialSession },
                    error,
                } = await supabase.auth.getSession();

                if (error) {
                    authLogger.error(error, { context: 'getSession' });
                } else {
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);

                    if (initialSession?.user) {
                        authLogger.info('User session found', {
                            userId: initialSession.user.id,
                            email: initialSession.user.email,
                        });
                    }
                }
            } catch (error) {
                authLogger.error(error as Error, { context: 'initializeAuth' });
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event: string, currentSession: Session | null) => {
            authLogger.info(`Auth state changed: ${event}`, {
                userId: currentSession?.user?.id,
                email: currentSession?.user?.email,
            });

            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase.auth]);

    const signUp = async (
        email: string,
        password: string,
        fullName: string,
        linkedinLink?: string
    ): Promise<{ error: string | null }> => {
        try {
            authLogger.info('Sign up attempt', { email, hasLinkedin: !!linkedinLink });

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        linkedin_link: linkedinLink || null,
                    },
                },
            });

            if (error) {
                authLogger.error(error, { context: 'signUp', email });

                if (error.message.includes('User already registered')) {
                    return { error: 'An account with this email already exists.' };
                }

                return { error: error.message };
            }

            if (data.user) {
                authLogger.info('Sign up successful', {
                    userId: data.user.id,
                    email: data.user.email,
                });

                // Create user record in users table
                const { error: userError } = await supabase.from('users').insert({
                    id: data.user.id,
                    email: data.user.email!,
                    full_name: fullName,
                    linkedin_link: linkedinLink || null,
                });

                if (userError) {
                    authLogger.error(userError, { context: 'createUserRecord', userId: data.user.id });
                }

                // Create profile record
                const { error: profileError } = await supabase.from('profile').insert({
                    user_id: data.user.id,
                });

                if (profileError) {
                    authLogger.error(profileError, { context: 'createProfile', userId: data.user.id });
                }
            }

            return { error: null };
        } catch (error) {
            authLogger.error(error as Error, { context: 'signUp', email });
            return { error: 'An unexpected error occurred. Please try again.' };
        }
    };

    const signIn = async (
        email: string,
        password: string
    ): Promise<{ error: string | null }> => {
        try {
            authLogger.info('Sign in attempt', { email });

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                authLogger.error(error, { context: 'signIn', email });

                if (error.message.includes('Invalid login credentials')) {
                    return { error: 'Invalid email or password.' };
                }

                return { error: error.message };
            }

            if (data.user) {
                authLogger.info('Sign in successful', {
                    userId: data.user.id,
                    email: data.user.email,
                });
            }

            return { error: null };
        } catch (error) {
            authLogger.error(error as Error, { context: 'signIn', email });
            return { error: 'An unexpected error occurred. Please try again.' };
        }
    };

    const signOut = async () => {
        try {
            authLogger.info('Sign out attempt', { userId: user?.id });

            const { error } = await supabase.auth.signOut();

            if (error) {
                authLogger.error(error, { context: 'signOut', userId: user?.id });
                throw error;
            }

            authLogger.info('Sign out successful', { userId: user?.id });
        } catch (error) {
            authLogger.error(error as Error, { context: 'signOut', userId: user?.id });
            throw error;
        }
    };

    const value = {
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
