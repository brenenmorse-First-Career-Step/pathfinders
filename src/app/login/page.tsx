'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { logger } from '@/lib/logger';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    logger.info('Login Form', 'Form submission started', {
      email: formData.email,
    });

    if (!validateForm()) {
      logger.warn('Login Form', 'Validation failed', { errors });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        logger.error('Login Form', error, { email: formData.email });
        setServerError(error);
        setLoading(false);
        return;
      }

      logger.info('Login Form', 'Login successful', {
        email: formData.email,
      });

      // Get redirect destination from query params or default to dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      
      // Small delay to ensure session is established before redirect
      setTimeout(() => {
        router.replace(redirectTo);
      }, 100);
    } catch (error) {
      logger.error('Login Form', error as Error, { email: formData.email });
      setServerError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Clear server error when user makes changes
    if (serverError) {
      setServerError('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-hero py-12 px-4 flex items-center">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl p-8 shadow-card">
            <h1 className="text-3xl font-poppins font-bold text-charcoal mb-2 text-center">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Sign in to continue building your resume
            </p>

            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${errors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-career-blue'
                    }`}
                  placeholder="john@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-charcoal mb-2">
                  Password
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
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-career-blue text-white font-semibold rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-career-blue font-semibold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
