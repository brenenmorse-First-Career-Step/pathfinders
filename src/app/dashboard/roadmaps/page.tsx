'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import type { CareerRoadmap } from '@/types/roadmap';

interface RoadmapRecord {
    id: string;
    career_name: string;
    roadmap_data: CareerRoadmap;
    infographic_url: string | null;
    milestone_roadmap_url: string | null;
    created_at: string;
    updated_at: string;
}

export default function RoadmapsPage() {
    const { user } = useAuth();
    const [roadmaps, setRoadmaps] = useState<RoadmapRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapRecord | null>(null);

    useEffect(() => {
        fetchRoadmaps();
    }, [user]);

    const fetchRoadmaps = async () => {
        if (!user) return;

        try {
            const supabase = createBrowserClient();
            const { data, error } = await supabase
                .from('career_roadmaps')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRoadmaps(data || []);
        } catch (error) {
            console.error('Error fetching roadmaps:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoadmap = async (roadmapId: string) => {
        if (!confirm('Are you sure you want to delete this roadmap? This action cannot be undone.')) {
            return;
        }

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase
                .from('career_roadmaps')
                .delete()
                .eq('id', roadmapId);

            if (error) throw error;

            // Refresh the list
            fetchRoadmaps();
            if (selectedRoadmap?.id === roadmapId) {
                setSelectedRoadmap(null);
            }
        } catch (error) {
            console.error('Error deleting roadmap:', error);
            alert('Failed to delete roadmap. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
                </div>
            </div>
        );
    }

    if (selectedRoadmap) {
        return (
            <RoadmapDetailView
                roadmap={selectedRoadmap}
                onBack={() => setSelectedRoadmap(null)}
                onDelete={handleDeleteRoadmap}
            />
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal mb-2">My Career Roadmaps</h1>
                        <p className="text-gray-600">View and manage your personalized career roadmaps</p>
                    </div>
                    <Link
                        href="/career-roadmap"
                        className="px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                    >
                        + Create New Roadmap
                    </Link>
                </div>

                {/* Roadmaps List */}
                {roadmaps.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <svg
                            className="w-16 h-16 text-gray-300 mx-auto mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No roadmaps yet</h3>
                        <p className="text-gray-600 mb-6">
                            Create your first career roadmap to get started on your journey
                        </p>
                        <Link
                            href="/career-roadmap"
                            className="inline-block px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            Create Your First Roadmap
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {roadmaps.map((roadmap) => (
                            <div
                                key={roadmap.id}
                                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-charcoal mb-2">
                                            {roadmap.career_name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Created: {new Date(roadmap.created_at).toLocaleDateString()}
                                        </p>
                                        {roadmap.infographic_url && (
                                            <img
                                                src={roadmap.infographic_url}
                                                alt={`${roadmap.career_name} Infographic`}
                                                className="w-full max-w-md rounded-lg mb-4"
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap ml-4">
                                        <button
                                            onClick={() => setSelectedRoadmap(roadmap)}
                                            className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors"
                                        >
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRoadmap(roadmap.id)}
                                            className="px-4 py-2 border-2 border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function RoadmapDetailView({
    roadmap,
    onBack,
    onDelete,
}: {
    roadmap: RoadmapRecord;
    onBack: () => void;
    onDelete: (id: string) => void;
}) {
    const { roadmap_data: roadmapData, infographic_url, milestone_roadmap_url } = roadmap;

    return (
        <div className="p-8">
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
                        Back to Roadmaps
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-charcoal mb-2">
                                {roadmapData.careerName} Career Roadmap
                            </h1>
                            <p className="text-gray-600">
                                Created: {new Date(roadmap.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <button
                            onClick={() => onDelete(roadmap.id)}
                            className="px-4 py-2 border-2 border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                {/* Images */}
                {(infographic_url || milestone_roadmap_url) && (
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        {infographic_url && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-2xl font-bold text-charcoal mb-4">
                                    Career Roadmap Infographic
                                </h2>
                                <img
                                    src={infographic_url}
                                    alt={`${roadmapData.careerName} Career Roadmap Infographic`}
                                    className="w-full rounded-lg"
                                />
                            </div>
                        )}
                        {milestone_roadmap_url && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-2xl font-bold text-charcoal mb-4">
                                    Milestone Roadmap
                                </h2>
                                <img
                                    src={milestone_roadmap_url}
                                    alt={`${roadmapData.careerName} Milestone Roadmap`}
                                    className="w-full rounded-lg"
                                />
                            </div>
                        )}
                    </div>
                )}

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
                        href="/career-roadmap"
                        className="px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                    >
                        Create Another Roadmap
                    </Link>
                    <button
                        onClick={onBack}
                        className="px-6 py-3 border-2 border-career-blue text-career-blue font-semibold rounded-lg hover:bg-soft-sky transition-colors"
                    >
                        Back to All Roadmaps
                    </button>
                </div>
            </div>
        </div>
    );
}
