'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';

export default function ProfilePage() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        highSchool: '',
        graduationYear: '',
        headline: '',
        about: '',
        skills: [] as string[],
        interests: [] as string[],
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                fullName: profile.fullName || user?.user_metadata?.full_name || '',
                highSchool: profile.highSchool || '',
                graduationYear: profile.graduationYear || '',
                headline: profile.headline || '',
                about: profile.aboutMe || '',
                skills: profile.skills || [],
                interests: profile.interests || [],
            });
        }
    }, [profile, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const supabase = createBrowserClient();

            // Update profile table
            const { error: profileError } = await supabase
                .from('profile')
                .upsert({
                    user_id: user?.id,
                    full_name: formData.fullName,
                    high_school: formData.highSchool,
                    graduation_year: formData.graduationYear,
                    headline: formData.headline,
                    about_text: formData.about,
                    skills: formData.skills,
                    interests: formData.interests,
                });

            if (profileError) throw profileError;

            // Update users table
            const { error: userError } = await supabase
                .from('users')
                .update({ full_name: formData.fullName })
                .eq('id', user?.id);

            if (userError) throw userError;

            setMessage('Profile updated successfully! ✅');
            // Reload page to refresh profile data
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            setMessage(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleArrayInput = (field: 'skills' | 'interests', value: string) => {
        const items = value.split(',').map(item => item.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, [field]: items }));
    };

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-charcoal mb-2">Profile Management</h1>
                    <p className="text-gray-600">Update your personal information and preferences</p>
                </div>

                {/* Success/Error Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message}
                    </div>
                )}

                {/* Profile Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-career-blue focus:border-transparent"
                            required
                        />
                    </div>

                    {/* High School */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            High School
                        </label>
                        <input
                            type="text"
                            value={formData.highSchool}
                            onChange={(e) => setFormData(prev => ({ ...prev, highSchool: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-career-blue focus:border-transparent"
                        />
                    </div>

                    {/* Graduation Year */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Graduation Year
                        </label>
                        <input
                            type="text"
                            value={formData.graduationYear}
                            onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                            placeholder="e.g., 2025"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-career-blue focus:border-transparent"
                        />
                    </div>

                    {/* Headline */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Headline
                        </label>
                        <input
                            type="text"
                            value={formData.headline}
                            onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                            placeholder="e.g., Aspiring Software Developer"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-career-blue focus:border-transparent"
                        />
                    </div>

                    {/* About */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            About / Summary
                        </label>
                        <textarea
                            value={formData.about}
                            onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                            rows={4}
                            placeholder="Tell us about yourself..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-career-blue focus:border-transparent"
                        />
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Skills
                        </label>
                        <input
                            type="text"
                            value={formData.skills.join(', ')}
                            onChange={(e) => handleArrayInput('skills', e.target.value)}
                            placeholder="e.g., JavaScript, Python, Communication (comma-separated)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-career-blue focus:border-transparent"
                        />
                        {formData.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {formData.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-career-blue text-white rounded-full text-sm font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Interests */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Interests
                        </label>
                        <input
                            type="text"
                            value={formData.interests.join(', ')}
                            onChange={(e) => handleArrayInput('interests', e.target.value)}
                            placeholder="e.g., Coding, Sports, Music (comma-separated)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-career-blue focus:border-transparent"
                        />
                        {formData.interests.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {formData.interests.map((interest, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-soft-sky text-career-blue rounded-full text-sm font-medium"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <Link
                            href="/dashboard"
                            className="text-gray-600 hover:text-gray-900 font-medium"
                        >
                            ← Back to Dashboard
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
