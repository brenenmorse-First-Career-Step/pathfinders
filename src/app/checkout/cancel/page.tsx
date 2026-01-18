'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutCancelPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-b from-soft-sky/30 to-white flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                {/* Cancel Icon */}
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-10 h-10 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                {/* Cancel Message */}
                <h1 className="text-3xl font-bold text-charcoal mb-3">
                    Payment Cancelled
                </h1>
                <p className="text-gray-600 mb-6">
                    No worries! Your payment was not processed. You can try again whenever you&apos;re ready.
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/builder/review')}
                        className="w-full px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/dashboard"
                        className="block w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-career-blue hover:text-career-blue transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                {/* Help Text */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                        <strong>Need Help?</strong>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        If you&apos;re experiencing issues with payment, please contact our support team.
                    </p>
                </div>
            </div>
        </div>
    );
}
