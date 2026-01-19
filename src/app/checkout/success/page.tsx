'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
    const searchParams = useSearchParams();
    const [isVerifying, setIsVerifying] = useState(true);
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Give webhook a moment to process, then redirect
        const timer = setTimeout(() => {
            setIsVerifying(false);
            // Force refresh of dashboard when user navigates there
            if (typeof window !== 'undefined') {
                // Store a flag to trigger refresh
                sessionStorage.setItem('payment_completed', 'true');
            }
        }, 3000); // Increased to 3 seconds to ensure webhook processes

        return () => clearTimeout(timer);
    }, []);

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-soft-sky/30 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold text-charcoal mb-2">
                        Processing Payment...
                    </h1>
                    <p className="text-gray-600">
                        Please wait while we confirm your payment
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-soft-sky/30 to-white flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center animate-scale-in">
                {/* Success Icon */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-10 h-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>

                {/* Success Message */}
                <h1 className="text-3xl font-bold text-charcoal mb-3">
                    Payment Successful! 🎉
                </h1>
                <p className="text-gray-600 mb-2">
                    Your resume has been unlocked and is ready to download!
                </p>
                {sessionId && (
                    <p className="text-xs text-gray-400 mb-6">
                        Session ID: {sessionId.slice(0, 20)}...
                    </p>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 mt-8">
                    <Link
                        href="/dashboard/resumes"
                        className="block w-full px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                    >
                        View My Resume
                    </Link>
                    <Link
                        href="/dashboard"
                        className="block w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-career-blue hover:text-career-blue transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-4 bg-soft-sky rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>What&apos;s Next?</strong>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        Your resume is now available in your dashboard. You can download the PDF and share it with your unique link.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-b from-soft-sky/30 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold text-charcoal mb-2">
                        Loading...
                    </h1>
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
