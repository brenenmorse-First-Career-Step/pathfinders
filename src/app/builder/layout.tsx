'use client';

import { ResumeProvider } from '@/contexts/ResumeContext';
import { useEffect, useState } from 'react';
import PaymentGate from '@/components/PaymentGate';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function ProtectedBuilder({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [hasPaid, setHasPaid] = useState<boolean | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkPayment = async () => {
            if (!user) return;

            const supabase = createBrowserClient();
            const { data } = await supabase
                .from('user_payments')
                .select('has_paid')
                .eq('user_id', user.id)
                .maybeSingle();

            setHasPaid(data?.has_paid || false);
            setChecking(false);
        };

        if (!authLoading) {
            if (user) {
                checkPayment();
            } else {
                setChecking(false);
            }
        }
    }, [user, authLoading]);

    if (authLoading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-career-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking access...</p>
                </div>
            </div>
        );
    }

    if (!hasPaid) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-grow flex items-center justify-center bg-gray-50 py-12">
                    <PaymentGate />
                </div>
                <Footer />
            </div>
        );
    }

    return <>{children}</>;
}

export default function BuilderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ResumeProvider>
            <ProtectedBuilder>
                {children}
            </ProtectedBuilder>
        </ResumeProvider>
    );
}
