'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        // TODO: Implement account deletion
        alert('Account deletion will be implemented in the next phase.');
        setLoading(false);
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-charcoal mb-2">Account Settings</h1>
                    <p className="text-gray-600">Manage your account preferences and security</p>
                </div>

                {/* Account Information */}
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                    <h2 className="text-xl font-bold text-charcoal mb-6">Account Information</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                            <p className="text-gray-900">{user?.email}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">User ID</label>
                            <p className="text-gray-600 text-sm font-mono">{user?.id}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Account Created</label>
                            <p className="text-gray-900">
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                    <h2 className="text-xl font-bold text-charcoal mb-6">Actions</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-4 border-b border-gray-200">
                            <div>
                                <h3 className="font-semibold text-gray-900">Change Password</h3>
                                <p className="text-sm text-gray-600">Update your account password</p>
                            </div>
                            <button
                                className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-career-blue hover:text-career-blue transition-colors"
                                onClick={() => alert('Password change will be implemented in the next phase.')}
                            >
                                Change Password
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-4 border-b border-gray-200">
                            <div>
                                <h3 className="font-semibold text-gray-900">Sign Out</h3>
                                <p className="text-sm text-gray-600">Sign out of your account</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
                    <h2 className="text-xl font-bold text-red-700 mb-6">Danger Zone</h2>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-red-900">Delete Account</h3>
                            <p className="text-sm text-red-700">
                                Permanently delete your account and all associated data
                            </p>
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Delete Account'}
                        </button>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8">
                    <Link
                        href="/dashboard"
                        className="text-career-blue hover:text-career-blue-dark font-medium"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
