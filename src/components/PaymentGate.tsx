'use client';

import { useState } from 'react';
import { Target, Palette, BookOpen, Save, FileText, Linkedin, Check } from 'lucide-react';

interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface PaymentGateProps {
    title?: string;
    description?: string;
    features?: Feature[];
    buttonText?: string;
    checkoutEndpoint?: string;
}

export default function PaymentGate({
    title = "Unlock Your Career Roadmap",
    description = "Get unlimited access to AI-powered career roadmaps with professional infographics, personalized learning paths, and curated free courses.",
    features,
    buttonText = "Unlock Career Roadmaps",
    checkoutEndpoint = "/api/create-roadmap-checkout"
}: PaymentGateProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const defaultFeatures: Feature[] = [
        {
            icon: <Target className="w-6 h-6 text-career-blue" />,
            title: 'Unlimited Roadmaps',
            description: 'Generate as many career roadmaps as you want',
        },
        {
            icon: <Palette className="w-6 h-6 text-optimism-orange" />,
            title: 'Professional Infographics',
            description: 'Beautiful visual roadmaps created by AI',
        },
        {
            icon: <BookOpen className="w-6 h-6 text-step-green" />,
            title: 'Free Course Links',
            description: '5+ curated free courses for each career',
        },
        {
            icon: <Save className="w-6 h-6 text-purple-600" />,
            title: 'Save & Access Anytime',
            description: 'All your roadmaps saved in your dashboard',
        },
    ];

    const displayFeatures = features || defaultFeatures;

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            setError(null);

            // Create checkout session
            const response = await fetch(checkoutEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create checkout session');
            }

            // Redirect to Stripe checkout URL
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err: unknown) {
            console.error('Payment error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to start payment';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-brand rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-career-blue/20">
                    <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-poppins font-bold text-charcoal mb-4">
                    {title}
                </h2>

                {/* Description */}
                <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
                    {description}
                </p>

                {/* Features */}
                <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
                    {displayFeatures.map((feature, index) => (
                        <div key={index} className="flex gap-3 p-4 bg-soft-sky/30 rounded-xl hover:bg-soft-sky/50 transition-colors">
                            <span className="flex-shrink-0 mt-1">{feature.icon}</span>
                            <div>
                                <h3 className="font-semibold text-charcoal mb-1">{feature.title}</h3>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price */}
                <div className="bg-gradient-brand text-white rounded-xl p-6 mb-6 shadow-lg">
                    <p className="text-sm font-medium mb-2 opacity-90">One-Time Payment</p>
                    <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold">$9.99</span>
                        <span className="text-lg opacity-90">forever</span>
                    </div>
                    <p className="text-sm mt-2 opacity-90">Unlocks everything: Resume Builder + Career Roadmap + LinkedIn Tools</p>
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full px-8 py-4 bg-career-blue text-white font-semibold text-lg rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] shadow-lg shadow-career-blue/25 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <span className="flex items-center justify-center gap-2">
                        {loading ? 'Processing...' : buttonText}
                        {!loading && <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    </span>
                </button>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Trust Badge */}
                <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
                    <span>🔒</span> Secure payment powered by Stripe
                </p>
            </div>
        </div>
    );
}
