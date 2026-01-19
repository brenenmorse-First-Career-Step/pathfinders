'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentGate from '@/components/PaymentGate';
import type { RoadmapContent } from '@/types/roadmap';
import Image from 'next/image';
import {
    Sparkles,
    Target,
    Wrench,
    List,
    Rocket,
    Download,
    Clock,
    Hash,
    BookOpen
} from 'lucide-react';

export default function CareerRoadmapContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [hasPaid, setHasPaid] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [careerGoal, setCareerGoal] = useState('');
    const [roadmap, setRoadmap] = useState<RoadmapContent | null>(null);
    const [infographicUrl, setInfographicUrl] = useState<string | null>(null);
    const [milestoneGraphicUrl, setMilestoneGraphicUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Check payment status on mount
    useEffect(() => {
        checkPaymentStatus();
    }, []);

    // Handle payment success redirect
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        if (paymentStatus === 'success') {
            setSuccessMessage('Payment successful! You now have unlimited access to Career Roadmaps.');
            checkPaymentStatus();
            // Clear URL parameter
            router.replace('/career-roadmap');
        }
    }, [searchParams, router]);

    const checkPaymentStatus = async () => {
        try {
            const response = await fetch('/api/payment-status');
            const data = await response.json();
            setHasPaid(data.hasPaid);
        } catch (err) {
            console.error('Error checking payment status:', err);
            setHasPaid(false);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!careerGoal.trim()) {
            setError('Please enter a career goal');
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setRoadmap(null);

            const response = await fetch('/api/ai/generate-roadmap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ careerGoal: careerGoal.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate roadmap');
            }

            setRoadmap(data.roadmap);
            setInfographicUrl(data.infographicUrl);
            setMilestoneGraphicUrl(data.milestoneGraphicUrl);
        } catch (err: unknown) {
            console.error('Error generating roadmap:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate roadmap';
            setError(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!roadmap) return;

        try {
            setSaving(true);
            setError(null);

            const response = await fetch('/api/roadmaps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    careerName: roadmap.careerName,
                    roadmapContent: roadmap,
                    infographicUrl,
                    milestoneGraphicUrl,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save roadmap');
            }

            setSuccessMessage('Roadmap saved successfully! View it in your dashboard.');
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: unknown) {
            console.error('Error saving roadmap:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to save roadmap';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleCopyStep = (stepText: string) => {
        navigator.clipboard.writeText(stepText);
        setSuccessMessage('Step copied to clipboard!');
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-career-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (hasPaid === false) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white to-soft-sky/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl font-poppins font-bold text-charcoal mb-4">
                            AI-Powered Career Roadmaps
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Get personalized career guidance with professional infographics and curated learning resources
                        </p>
                    </div>
                    <PaymentGate />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-soft-sky/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-poppins font-bold text-charcoal mb-4">
                        Create Your Career Roadmap
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Tell us your career goal and we&apos;ll create a personalized roadmap with AI
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-green-700 text-center font-medium">{successMessage}</p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-600 text-center">{error}</p>
                    </div>
                )}

                {/* Input Form */}
                <div className="max-w-3xl mx-auto mb-12">
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <label htmlFor="career-goal" className="block text-lg font-semibold text-charcoal mb-4">
                            What do you want to be when you grow up?
                        </label>
                        <input
                            id="career-goal"
                            type="text"
                            value={careerGoal}
                            onChange={(e) => setCareerGoal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                            placeholder="e.g., Software Engineer, Graphic Designer, Doctor..."
                            className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-career-blue focus:outline-none text-lg mb-6"
                            disabled={generating}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={generating || !careerGoal.trim()}
                            className="w-full px-8 py-4 bg-gradient-brand text-white font-semibold text-lg rounded-xl hover:opacity-90 transition-all duration-200 active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Generating Your Roadmap...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    Generate Career Roadmap
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Roadmap Display */}
                {roadmap && (
                    <div className="space-y-8">
                        {/* Infographics */}
                        {(infographicUrl || milestoneGraphicUrl) && (
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <h2 className="text-2xl font-poppins font-bold text-charcoal mb-6">
                                    Visual Roadmaps
                                </h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {infographicUrl && (
                                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-100">
                                            <Image
                                                src={infographicUrl}
                                                alt="Career Timeline Infographic"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    )}
                                    {milestoneGraphicUrl && (
                                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-100">
                                            <Image
                                                src={milestoneGraphicUrl}
                                                alt="Milestone Roadmap"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Career Overview */}
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h2 className="text-3xl font-poppins font-bold text-charcoal mb-6">
                                {roadmap.careerName} Career Roadmap
                            </h2>

                            {/* Timeline */}
                            {roadmap.estimatedTimeline && (
                                <div className="mb-6 p-4 bg-soft-sky/30 rounded-xl">
                                    <p className="text-lg">
                                        <span className="font-semibold text-charcoal">Estimated Timeline:</span>{' '}
                                        <span className="text-career-blue font-medium">{roadmap.estimatedTimeline}</span>
                                    </p>
                                </div>
                            )}

                            {/* Skills */}
                            {roadmap.skills && roadmap.skills.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                                        <Target className="w-6 h-6 text-career-blue" />
                                        Key Skills to Learn
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {roadmap.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-4 py-2 bg-career-blue/10 text-career-blue font-medium rounded-lg"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tools */}
                            {roadmap.tools && roadmap.tools.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
                                        <Wrench className="w-6 h-6 text-step-green" />
                                        Tools & Software
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {roadmap.tools.map((tool, index) => (
                                            <span
                                                key={index}
                                                className="px-4 py-2 bg-step-green/10 text-step-green font-medium rounded-lg"
                                            >
                                                {tool}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Steps */}
                        {roadmap.steps && roadmap.steps.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <h2 className="text-2xl font-poppins font-bold text-charcoal mb-6 flex items-center gap-3">
                                    <List className="w-7 h-7 text-career-blue" />
                                    Step-by-Step Plan
                                </h2>
                                <div className="space-y-6">
                                    {roadmap.steps.map((step, index) => (
                                        <div
                                            key={index}
                                            className="border-l-4 border-career-blue pl-6 py-4 hover:bg-soft-sky/20 transition-colors rounded-r-xl"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="w-8 h-8 bg-career-blue text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                            {step.step}
                                                        </span>
                                                        <h3 className="text-lg font-semibold text-charcoal">{step.title}</h3>
                                                    </div>
                                                    <p className="text-gray-600 mb-2">{step.description}</p>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="text-career-blue font-medium flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {step.timeline}
                                                        </span>
                                                        {step.hashtags && step.hashtags.length > 0 && (
                                                            <span className="text-gray-500">{step.hashtags.join(' ')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleCopyStep(`${step.title}\n${step.description}\nTimeline: ${step.timeline}`)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Copy step"
                                                >
                                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Courses */}
                        {roadmap.courses && roadmap.courses.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <h2 className="text-2xl font-poppins font-bold text-charcoal mb-6 flex items-center gap-3">
                                    <BookOpen className="w-7 h-7 text-career-blue" />
                                    Free Online Courses
                                </h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {roadmap.courses.map((course, index) => (
                                        <div
                                            key={index}
                                            className="p-6 border-2 border-gray-100 rounded-xl hover:border-career-blue hover:shadow-md transition-all"
                                        >
                                            <h3 className="text-lg font-semibold text-charcoal mb-2">{course.name}</h3>
                                            <p className="text-gray-600 text-sm mb-4">{course.reason}</p>
                                            <a
                                                href={course.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-career-blue font-medium hover:underline"
                                            >
                                                Start Learning
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects */}
                        {roadmap.projects && roadmap.projects.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <h2 className="text-2xl font-poppins font-bold text-charcoal mb-6 flex items-center gap-3">
                                    <Rocket className="w-7 h-7 text-optimism-orange" />
                                    Starter Projects
                                </h2>
                                <div className="space-y-4">
                                    {roadmap.projects.map((project, index) => (
                                        <div
                                            key={index}
                                            className="p-6 bg-gradient-to-r from-soft-sky/20 to-transparent rounded-xl border-l-4 border-step-green"
                                        >
                                            <h3 className="text-lg font-semibold text-charcoal mb-2">{project.title}</h3>
                                            <p className="text-gray-600 mb-3">{project.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {project.skills.map((skill, skillIndex) => (
                                                    <span
                                                        key={skillIndex}
                                                        className="px-3 py-1 bg-white text-gray-700 text-sm rounded-full border border-gray-200"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hashtags */}
                        {roadmap.hashtags && roadmap.hashtags.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-8">
                                <h2 className="text-2xl font-poppins font-bold text-charcoal mb-6 flex items-center gap-3">
                                    <Hash className="w-7 h-7 text-gray-500" />
                                    Community & Resources
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {roadmap.hashtags.map((hashtag, index) => (
                                        <span
                                            key={index}
                                            className="px-4 py-2 bg-optimism-orange/10 text-optimism-orange font-medium rounded-lg"
                                        >
                                            {hashtag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-4 bg-step-green text-white font-semibold text-lg rounded-xl hover:bg-step-green/90 transition-all duration-200 active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? 'Saving...' : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Save Roadmap to Dashboard
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
