'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Roadmap } from '@/types/roadmap';

export default function RoadmapDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { user } = useAuth();
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        params.then((p) => setId(p.id));
    }, [params]);

    useEffect(() => {
        if (id) {
            fetchRoadmap();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user]);

    const fetchRoadmap = async () => {
        try {
            const response = await fetch(`/api/roadmaps/${id}`);
            const data = await response.json();

            if (response.ok) {
                setRoadmap(data.roadmap);
            } else {
                router.push('/dashboard/roadmaps');
            }
        } catch (error) {
            console.error('Error fetching roadmap:', error);
            router.push('/dashboard/roadmaps');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyStep = (stepText: string) => {
        navigator.clipboard.writeText(stepText);
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-career-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading roadmap...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!roadmap) {
        return null;
    }

    const content = roadmap.roadmap_content;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard/roadmaps"
                    className="inline-flex items-center gap-2 text-career-blue font-semibold hover:text-career-blue-dark mb-4"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to My Roadmaps
                </Link>
                <h1 className="text-3xl font-bold text-charcoal mb-2">{roadmap.career_name} Career Roadmap</h1>
                <p className="text-gray-600">Created {new Date(roadmap.created_at).toLocaleDateString()}</p>
            </div>

            <div className="space-y-8">
                {/* Infographics */}
                {(roadmap.infographic_url || roadmap.milestone_graphic_url) && (
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">Visual Roadmaps</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {roadmap.infographic_url && (
                                <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-100">
                                    <Image
                                        src={roadmap.infographic_url}
                                        alt="Career Timeline Infographic"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            )}
                            {roadmap.milestone_graphic_url && (
                                <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-100">
                                    <Image
                                        src={roadmap.milestone_graphic_url}
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
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-charcoal mb-6">Career Overview</h2>

                    {/* Timeline */}
                    {content.estimatedTimeline && (
                        <div className="mb-6 p-4 bg-soft-sky/30 rounded-xl">
                            <p className="text-lg">
                                <span className="font-semibold text-charcoal">Estimated Timeline:</span>{' '}
                                <span className="text-career-blue font-medium">{content.estimatedTimeline}</span>
                            </p>
                        </div>
                    )}

                    {/* Skills */}
                    {content.skills && content.skills.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-charcoal mb-4">🎯 Key Skills to Learn</h3>
                            <div className="flex flex-wrap gap-3">
                                {content.skills.map((skill, index) => (
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
                    {content.tools && content.tools.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold text-charcoal mb-4">🛠️ Tools & Software</h3>
                            <div className="flex flex-wrap gap-3">
                                {content.tools.map((tool, index) => (
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
                {content.steps && content.steps.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">📋 Step-by-Step Plan</h2>
                        <div className="space-y-6">
                            {content.steps.map((step, index) => (
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
                                                <span className="text-career-blue font-medium">⏱️ {step.timeline}</span>
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
                {content.courses && content.courses.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">📚 Free Online Courses</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {content.courses.map((course, index) => (
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
                {content.projects && content.projects.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">🚀 Starter Projects</h2>
                        <div className="space-y-4">
                            {content.projects.map((project, index) => (
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
                {content.hashtags && content.hashtags.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <h2 className="text-2xl font-bold text-charcoal mb-6">🏷️ Community & Resources</h2>
                        <div className="flex flex-wrap gap-3">
                            {content.hashtags.map((hashtag, index) => (
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
            </div>
        </div>
    );
}
