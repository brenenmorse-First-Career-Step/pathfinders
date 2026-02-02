'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminLoginPage() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [unauthorized, setUnauthorized] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setUnauthorized(false);
        if (!email.trim() || !password) {
            setError('Email and password are required.');
            return;
        }
        setLoading(true);
        try {
            const { error: signInError } = await signIn(email.trim(), password);
            if (signInError) {
                setError(signInError);
                setLoading(false);
                return;
            }
            const supabase = createBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Could not verify session.');
                setLoading(false);
                return;
            }
            const { data: row } = await supabase.from('users').select('role').eq('id', user.id).single();
            if (row?.role !== 'admin') {
                setUnauthorized(true);
                await supabase.auth.signOut();
                setLoading(false);
                return;
            }
            window.location.assign('/admin/dashboard');
        } catch {
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                        Admin Login
                    </h1>
                    <p className="text-gray-600 text-center text-sm mb-6">
                        FirstCareerSteps admin panel. Sign in with an admin account.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    {unauthorized && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                            Unauthorized. This area is for admin users only. Your account does not have admin access.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="admin-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="admin@example.com"
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                id="admin-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                                disabled={loading}
                                autoComplete="current-password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        <Link href="/" className="text-blue-600 hover:underline">Back to main site</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
