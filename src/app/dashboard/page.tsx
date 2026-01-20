'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { createBrowserClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const [resumeCount, setResumeCount] = useState(0);

    const fullName = user?.user_metadata?.full_name || profile?.fullName || 'User';
    const email = user?.email || '';

    useEffect(() => {
        const fetchResumeCount = async () => {
            if (!user) return;

            const supabase = createBrowserClient();
            const { count } = await supabase
                .from('resumes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'paid');

            setResumeCount(count || 0);
        };

        fetchResumeCount();
    }, [user]);

    return (
        <div className="p-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
                <h1 className="text-3xl font-bold text-charcoal mb-2">
                    Welcome back, {fullName}! 👋
                </h1>
                <p className="text-gray-600">{email}</p>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Link
                    href="/builder/step-1"
                    className="bg-gradient-to-br from-career-blue to-career-blue-dark text-white rounded-2xl p-8 hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Create New Resume</h2>
                            <p className="text-white/90">Start building your professional resume</p>
                        </div>
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </Link>

                <Link
                    href="/dashboard/resumes"
                    className="bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-career-blue transition-all duration-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-charcoal mb-2">My Resumes</h2>
                            <p className="text-gray-600">View and manage your resumes</p>
                        </div>
                        <div className="text-4xl font-bold text-career-blue">{resumeCount}</div>
                    </div>
                </Link>
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-charcoal">Profile Information</h2>
                    <Link
                        href="/dashboard/profile"
                        className="text-career-blue font-semibold hover:text-career-blue-dark transition-colors"
                    >
                        Edit Profile →
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <p className="text-gray-900">{fullName}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <p className="text-gray-900">{email}</p>
                    </div>

                    {profile?.highSchool && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">High School</label>
                            <p className="text-gray-900">{profile.highSchool}</p>
                        </div>
                    )}

                    {profile?.graduationYear && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Graduation Year</label>
                            <p className="text-gray-900">{profile.graduationYear}</p>
                        </div>
                    )}

                    {profile?.interests && profile.interests.length > 0 && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Interests</label>
                            <div className="flex flex-wrap gap-2">
                                {profile.interests.map((interest, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-soft-sky text-career-blue rounded-full text-sm font-medium"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
