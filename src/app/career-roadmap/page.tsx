'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CareerRoadmapContent from './CareerRoadmapContent';

export default function CareerRoadmapPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-career-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading...</p>
                        </div>
                    </div>
                }>
                    <CareerRoadmapContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
