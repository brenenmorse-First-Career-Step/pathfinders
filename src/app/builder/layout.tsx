'use client';

import { ResumeProvider } from '@/contexts/ResumeContext';

export default function BuilderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ResumeProvider>
            {children}
        </ResumeProvider>
    );
}
