'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { RoadmapResponse } from '@/types/roadmap';
import Link from 'next/link';

export default function CareerRoadmapPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [careerGoal, setCareerGoal] = useState('');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);

    const handleGenerate = async () => {
        if (!careerGoal.trim()) {
            setError('Please enter your career goal');
            return;
        }

        if (!user) {
            router.push('/login');
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/generate-roadmap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    careerGoal: careerGoal.trim(),
                    userId: user.id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to generate roadmap');
            }

            const data: RoadmapResponse = await response.json();
            setRoadmap(data);
        } catch (err) {
            console.error('Error generating roadmap:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate roadmap. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
            </div>
        );
    }

    if (roadmap) {
        return <RoadmapDisplay roadmap={roadmap} onBack={() => setRoadmap(null)} />;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center bg-gradient-hero px-4 py-12">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                        <h1 className="text-4xl sm:text-5xl font-poppins font-bold text-charcoal mb-4 text-center">
                            Career Roadmap Generator
                        </h1>
                        <p className="text-lg text-charcoal-light mb-8 text-center">
                            Tell us what you want to be when you grow up, and we&apos;ll create a personalized career roadmap just for you!
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="mb-6">
                            <label htmlFor="career-goal" className="block text-sm font-medium text-gray-700 mb-2">
                                What do you want to be when you grow up?
                            </label>
                            <input
                                id="career-goal"
                                type="text"
                                value={careerGoal}
                                onChange={(e) => setCareerGoal(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !generating) {
                                        handleGenerate();
                                    }
                                }}
                                placeholder="e.g., Software Engineer, Doctor, Graphic Designer, Data Scientist..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-career-blue focus:border-transparent text-lg"
                                disabled={generating}
                            />
                        </div>

                        {!user && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-blue-700 text-sm mb-2">
                                    You need to be logged in to generate a roadmap.
                                </p>
                                <Link
                                    href="/login"
                                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                                >
                                    Login here
                                </Link>
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={generating || !user || !careerGoal.trim()}
                            className="w-full px-6 py-4 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {generating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generating your roadmap...
                                </span>
                            ) : (
                                'Generate My Career Roadmap'
                            )}
                        </button>

                        {user && (
                            <div className="mt-6 text-center">
                                <Link
                                    href="/dashboard/roadmaps"
                                    className="text-career-blue hover:text-career-blue-dark font-medium"
                                >
                                    View my saved roadmaps →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function RoadmapDisplay({ roadmap, onBack }: { roadmap: RoadmapResponse; onBack: () => void }) {
    const { roadmap: roadmapData, infographicUrl, milestoneRoadmapUrl } = roadmap;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />

            <main className="flex-1 px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={onBack}
                            className="mb-4 text-career-blue hover:text-career-blue-dark font-medium flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Create Another Roadmap
                        </button>
                        <h1 className="text-4xl font-bold text-charcoal mb-2">
                            {roadmapData.careerName} Career Roadmap
                        </h1>
                        <p className="text-gray-600">
                            Your personalized career planning guide
                        </p>
                    </div>

                    {/* Images */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-charcoal mb-4">
                                Career Roadmap Infographic
                            </h2>
                            <img
                                src={infographicUrl}
                                alt={`${roadmapData.careerName} Career Roadmap Infographic`}
                                className="w-full rounded-lg"
                            />
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-charcoal mb-4">
                                Milestone Roadmap
                            </h2>
                            <img
                                src={milestoneRoadmapUrl}
                                alt={`${roadmapData.careerName} Milestone Roadmap`}
                                className="w-full rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <div className="prose max-w-none">
                            {/* Key Skills */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-charcoal mb-4">Key Skills to Learn</h2>
                                <ul className="list-disc list-inside space-y-2">
                                    {roadmapData.keySkills.map((skill, index) => (
                                        <li key={index} className="text-gray-700">{skill}</li>
                                    ))}
                                </ul>
                            </section>

                            {/* Tools */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-charcoal mb-4">Tools & Software to Master</h2>
                                <ul className="list-disc list-inside space-y-2">
                                    {roadmapData.tools.map((tool, index) => (
                                        <li key={index} className="text-gray-700">{tool}</li>
                                    ))}
                                </ul>
                            </section>

                            {/* Courses */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-charcoal mb-4">Recommended Free Courses</h2>
                                <div className="space-y-4">
                                    {roadmapData.courses.map((course, index) => (
                                        <div key={index} className="border-l-4 border-career-blue pl-4 py-2">
                                            <h3 className="font-semibold text-lg text-charcoal mb-1">
                                                {index + 1}. {course.name}
                                            </h3>
                                            <a
                                                href={course.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-career-blue hover:text-career-blue-dark underline mb-2 block"
                                            >
                                                {course.link}
                                            </a>
                                            <p className="text-gray-700">{course.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Steps */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-charcoal mb-4">Step-by-Step Plan</h2>
                                <div className="space-y-6">
                                    {roadmapData.steps.map((step) => (
                                        <div key={step.step} className="border rounded-lg p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 w-12 h-12 bg-career-blue text-white rounded-full flex items-center justify-center font-bold text-lg">
                                                    {step.step}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-semibold text-charcoal mb-2">
                                                        {step.title}
                                                    </h3>
                                                    <p className="text-gray-700 mb-2">{step.description}</p>
                                                    {step.hashtags && step.hashtags.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {step.hashtags.map((tag, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                                                >
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Timeline */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-charcoal mb-4">Estimated Timeline</h2>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-lg text-gray-700">{roadmapData.timeline}</p>
                                </div>
                            </section>

                            {/* Starter Projects */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-charcoal mb-4">Starter Projects</h2>
                                <ul className="list-disc list-inside space-y-2">
                                    {roadmapData.starterProjects.map((project, index) => (
                                        <li key={index} className="text-gray-700">{project}</li>
                                    ))}
                                </ul>
                            </section>

                            {/* Communities */}
                            <section className="mb-8">
                                <h2 className="text-2xl font-bold text-charcoal mb-4">Communities & Hashtags</h2>
                                <ul className="list-disc list-inside space-y-2 mb-4">
                                    {roadmapData.communities.map((community, index) => (
                                        <li key={index} className="text-gray-700">{community}</li>
                                    ))}
                                </ul>
                                {roadmapData.hashtags && roadmapData.hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {roadmapData.hashtags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-4 justify-center">
                        <Link
                            href="/dashboard/roadmaps"
                            className="px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            View All My Roadmaps
                        </Link>
                        <button
                            onClick={onBack}
                            className="px-6 py-3 border-2 border-career-blue text-career-blue font-semibold rounded-lg hover:bg-soft-sky transition-colors"
                        >
                            Create Another Roadmap
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
