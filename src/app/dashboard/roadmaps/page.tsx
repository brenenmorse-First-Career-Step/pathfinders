'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Roadmap } from '@/types/roadmap';

export default function MyRoadmapsPage() {
    const { user } = useAuth();
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchRoadmaps();
    }, [user]);

    const fetchRoadmaps = async () => {
        try {
            const response = await fetch('/api/roadmaps');
            const data = await response.json();
            setRoadmaps(data.roadmaps || []);
        } catch (error) {
            console.error('Error fetching roadmaps:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this roadmap?')) return;

        try {
            setDeleting(id);
            const response = await fetch(`/api/roadmaps/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setRoadmaps(roadmaps.filter((r) => r.id !== id));
            } else {
                alert('Failed to delete roadmap');
            }
        } catch (error) {
            console.error('Error deleting roadmap:', error);
            alert('Failed to delete roadmap');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-career-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading roadmaps...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-charcoal mb-2">My Career Roadmaps</h1>
                    <p className="text-gray-600">View and manage your AI-generated career roadmaps</p>
                </div>
                <Link
                    href="/career-roadmap"
                    className="px-6 py-3 bg-gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 active:scale-[0.98] shadow-lg"
                >
                    ✨ Create New Roadmap
                </Link>
            </div>

            {/* Roadmaps Grid */}
            {roadmaps.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-soft-sky rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-career-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-charcoal mb-3">No Roadmaps Yet</h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Start creating AI-powered career roadmaps to plan your professional journey
                    </p>
                    <Link
                        href="/career-roadmap"
                        className="inline-block px-8 py-3 bg-career-blue text-white font-semibold rounded-xl hover:bg-career-blue-dark transition-colors"
                    >
                        Create Your First Roadmap
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roadmaps.map((roadmap) => (
                        <div
                            key={roadmap.id}
                            className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:border-career-blue transition-all duration-200 overflow-hidden"
                        >
                            {/* Roadmap Card Content */}
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-charcoal mb-3 line-clamp-2">
                                    {roadmap.career_name}
                                </h3>

                                {/* Stats */}
                                <div className="flex flex-wrap gap-3 mb-4 text-sm">
                                    {roadmap.roadmap_content.steps && (
                                        <span className="px-3 py-1 bg-career-blue/10 text-career-blue rounded-full font-medium">
                                            {roadmap.roadmap_content.steps.length} Steps
                                        </span>
                                    )}
                                    {roadmap.roadmap_content.courses && (
                                        <span className="px-3 py-1 bg-step-green/10 text-step-green rounded-full font-medium">
                                            {roadmap.roadmap_content.courses.length} Courses
                                        </span>
                                    )}
                                    {roadmap.roadmap_content.estimatedTimeline && (
                                        <span className="px-3 py-1 bg-optimism-orange/10 text-optimism-orange rounded-full font-medium">
                                            {roadmap.roadmap_content.estimatedTimeline}
                                        </span>
                                    )}
                                </div>

                                {/* Skills Preview */}
                                {roadmap.roadmap_content.skills && roadmap.roadmap_content.skills.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">KEY SKILLS</p>
                                        <div className="flex flex-wrap gap-2">
                                            {roadmap.roadmap_content.skills.slice(0, 3).map((skill, index) => (
                                                <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                    {skill}
                                                </span>
                                            ))}
                                            {roadmap.roadmap_content.skills.length > 3 && (
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                                    +{roadmap.roadmap_content.skills.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Created Date */}
                                <p className="text-xs text-gray-500 mb-4">
                                    Created {new Date(roadmap.created_at).toLocaleDateString()}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Link
                                        href={`/dashboard/roadmaps/${roadmap.id}`}
                                        className="flex-1 px-4 py-2 bg-career-blue text-white text-center font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                                    >
                                        View Details
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(roadmap.id)}
                                        disabled={deleting === roadmap.id}
                                        className="px-4 py-2 border-2 border-red-200 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete roadmap"
                                    >
                                        {deleting === roadmap.id ? (
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
