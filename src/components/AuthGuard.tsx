'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export default function AuthGuard({ children, redirectTo }: AuthGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            const currentPath = window.location.pathname;
            const redirectPath = redirectTo || `/login?redirect=${encodeURIComponent(currentPath)}`;
            router.push(redirectPath);
        }
    }, [user, loading, router, redirectTo]);

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
            </div>
        );
    }

    // Don't render children if not authenticated (will redirect)
    if (!user) {
        return null;
    }

    return <>{children}</>;
}
