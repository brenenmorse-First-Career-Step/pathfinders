import Link from 'next/link';

export default function BlockedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Account suspended</h1>
                <p className="text-gray-600 mb-6">
                    Your account has been suspended. You cannot access the app at this time. If you believe this is an error, please contact support.
                </p>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Back to home
                </Link>
            </div>
        </div>
    );
}
