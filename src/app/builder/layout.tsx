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
                    <PaymentGate
                        title="Unlock AI Resume Builder"
                        description="Create professional, ATS-optimized resumes and LinkedIn content in minutes. Get unlimited downloads and AI-powered writing assistance."
                        buttonText="Unlock Resume Builder"
                        features={[
                            {
                                icon: <svg className="w-6 h-6 text-career-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                                title: 'AI Resume Builder',
                                description: 'Professional templates & AI writing help'
                            },
                            {
                                icon: <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>,
                                title: 'LinkedIn Content',
                                description: 'AI-optimized headlines and bio'
                            },
                            {
                                icon: <svg className="w-6 h-6 text-step-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
                                title: 'ATS Optimized',
                                description: 'Designed to pass hiring filters'
                            },
                            {
                                icon: <svg className="w-6 h-6 text-optimism-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
                                title: 'Unlimited Downloads',
                                description: 'Download as PDF anytime'
                            }
                        ]}
                    />
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
