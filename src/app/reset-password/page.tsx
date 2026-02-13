'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { logger } from '@/lib/logger';

function ResetPasswordContent() {
    const router = useRouter();
    const { updatePassword } = useAuth();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and a number';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const { error } = await updatePassword(formData.password);

            if (error) {
                logger.error('Reset Password', error);
                setServerError(error);
                setLoading(false);
                return;
            }

            logger.info('Reset Password', 'Password updated successfully');
            setSuccess(true);

            // Redirect after a short delay
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (error) {
            logger.error('Reset Password', error as Error);
            setServerError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 bg-gradient-hero py-12 px-4 flex items-center">
                    <div className="max-w-md mx-auto w-full">
                        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-poppins font-bold text-charcoal mb-4">
                                Password Updated
                            </h1>
                            <p className="text-gray-600 mb-8">
                                Your password has been successfully reset. Redirecting you to the login page...
                            </p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 bg-gradient-hero py-12 px-4 flex items-center">
                <div className="max-w-md mx-auto w-full">
                    <div className="bg-white rounded-2xl p-8 shadow-card">
                        <h1 className="text-3xl font-poppins font-bold text-charcoal mb-2 text-center">
                            Set New Password
                        </h1>
                        <p className="text-gray-600 text-center mb-8">
                            Please enter your new password below
                        </p>

                        {serverError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 text-sm">{serverError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.password
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-career-blue'
                                        }`}
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-charcoal mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.confirmPassword
                                        ? 'border-red-300 focus:ring-red-500'
                                        : 'border-gray-300 focus:ring-career-blue'
                                        }`}
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 bg-career-blue text-white font-semibold rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
