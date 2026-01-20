'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';
import Link from 'next/link';
import LinkedInContentModal from '@/components/LinkedInContentModal';
import type { LinkedInContent } from '@/types/linkedin';
import { useProfile } from '@/context/ProfileContext';

interface Resume {
    id: string;
    title: string;
    status: 'draft' | 'locked' | 'paid';
    pdf_url: string | null;
    shareable_link: string | null;
    linkedin_content: string | null;
    created_at: string;
    updated_at: string;
    version: number;
}

export default function ResumesPage() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasPaid, setHasPaid] = useState<boolean>(false);
    const [showLinkedInModal, setShowLinkedInModal] = useState(false);
    const [linkedInContent, setLinkedInContent] = useState<LinkedInContent | null>(null);
    const [generatingLinkedIn, setGeneratingLinkedIn] = useState(false);

    useEffect(() => {
        if (user) {
            fetchResumes();
            checkPaymentStatus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Debug: Log resumes state changes
    useEffect(() => {
        console.log('Resumes state updated:', resumes.length, 'resumes');
        if (resumes.length > 0) {
            console.log('Resumes in state:', resumes);
        }
    }, [resumes]);

    // Refresh payment status when page becomes visible (e.g., after returning from payment)
    useEffect(() => {
        if (!user) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkPaymentStatus();
                fetchResumes();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Check if user just completed payment
        const paymentCompleted = sessionStorage.getItem('payment_completed');
        if (paymentCompleted === 'true') {
            sessionStorage.removeItem('payment_completed');
            // Poll for updates after payment (webhook might take a few seconds)
            let pollCount = 0;
            const maxPolls = 5; // Poll 5 times over 10 seconds
            const pollInterval = setInterval(() => {
                pollCount++;
                checkPaymentStatus();
                fetchResumes();
                
                if (pollCount >= maxPolls) {
                    clearInterval(pollInterval);
                }
            }, 2000); // Poll every 2 seconds
            
            return () => {
                clearInterval(pollInterval);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
        
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const checkPaymentStatus = async () => {
        if (!user) return;

        try {
            const supabase = createBrowserClient();
            const { data, error } = await supabase
                .from('user_payments')
                .select('has_paid')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Error checking payment status:', error);
                return;
            }

            setHasPaid(data?.has_paid || false);
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    };

    const fetchResumes = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const supabase = createBrowserClient();
            
            console.log('Fetching resumes for user:', user.id);
            
            // First, verify user session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                console.error('Session error:', sessionError);
                throw new Error('Not authenticated. Please log in again.');
            }
            
            // Fetch all resumes for the user
            const { data, error } = await supabase
                .from('resumes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching resumes:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                });
                throw error;
            }
            
            // Show all resumes - paid, locked, and draft
            // Log for debugging
            console.log('Fetched resumes:', data?.length || 0, 'resumes found');
            console.log('Resume data:', JSON.stringify(data, null, 2));
            
            if (data && data.length > 0) {
                console.log('First resume:', data[0]);
                console.log('First resume title:', data[0].title);
                console.log('First resume status:', data[0].status);
                console.log('First resume user_id:', data[0].user_id);
            } else {
                console.warn('No resumes found for user:', user.id);
            }
            
            setResumes(data || []);
        } catch (error) {
            console.error('Error fetching resumes:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load resumes';
            console.error('Full error:', error);
            // Show error to user
            alert(`Failed to load resumes: ${errorMessage}. Please refresh the page.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResume = async (resumeId: string) => {
        if (!user) {
            alert('You must be logged in to delete resumes');
            return;
        }

        if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
            return;
        }

        try {
            const supabase = createBrowserClient();
            
            console.log('Attempting to delete resume:', resumeId, 'for user:', user.id);
            
            // Verify session first
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Not authenticated. Please log in again.');
            }
            
            // First verify the resume belongs to the user
            const { data: resume, error: fetchError } = await supabase
                .from('resumes')
                .select('id, user_id')
                .eq('id', resumeId)
                .single();

            if (fetchError) {
                console.error('Error fetching resume for deletion:', fetchError);
                throw new Error(`Resume not found: ${fetchError.message}`);
            }

            if (!resume) {
                throw new Error('Resume not found');
            }

            if (resume.user_id !== user.id) {
                console.error('User mismatch:', {
                    resumeUserId: resume.user_id,
                    currentUserId: user.id,
                });
                throw new Error('You do not have permission to delete this resume');
            }

            console.log('Resume verified, proceeding with deletion...');

            // Delete the resume
            const { error, data: deleteData } = await supabase
                .from('resumes')
                .delete()
                .eq('id', resumeId)
                .eq('user_id', user.id) // Double-check user ownership
                .select();

            if (error) {
                console.error('Delete error:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                });
                throw error;
            }

            console.log('Resume deleted successfully:', deleteData);

            // Remove from local state immediately for better UX
            setResumes(prev => prev.filter(r => r.id !== resumeId));
            
            // Refresh the list to ensure consistency
            await fetchResumes();
        } catch (error) {
            console.error('Error deleting resume:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete resume';
            alert(`Error: ${errorMessage}. Please try again.`);
        }
    };

    const handleGenerateLinkedIn = async (resumeId: string) => {
        setGeneratingLinkedIn(true);
        setShowLinkedInModal(true);

        try {
            // Check if profile data exists
            if (!profile) {
                throw new Error('Profile not loaded. Please refresh the page and try again.');
            }
            
            // Store resumeId for later use if needed
            console.log('Generating LinkedIn for resume:', resumeId);

            // Generate LinkedIn content using profile data from context
            const response = await fetch('/api/ai/generate-linkedin-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    headline: profile.headline || profile.fullName || '',
                    aboutText: profile.generatedAbout || profile.aboutMe || '',
                    experiences: profile.experiences || [],
                    skills: profile.skills || [],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to generate LinkedIn content');
            }

            const data = await response.json();
            setLinkedInContent(data);
        } catch (error) {
            console.error('Error generating LinkedIn content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate LinkedIn content. Please try again.';
            alert(errorMessage);
            setShowLinkedInModal(false);
        } finally {
            setGeneratingLinkedIn(false);
        }
    };

    // All resumes shown are paid, so we can simplify status display

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-charcoal mb-2">My Resumes</h1>
                        <p className="text-gray-600">Manage and download your professional resumes</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setLoading(true);
                                fetchResumes();
                                checkPaymentStatus();
                            }}
                            className="px-4 py-2 border-2 border-career-blue text-career-blue font-semibold rounded-lg hover:bg-soft-sky transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Refreshing...' : '🔄 Refresh'}
                        </button>
                        <Link
                            href="/builder/step-1"
                            className="px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            + Create New Resume
                        </Link>
                    </div>
                </div>

                {/* Resumes List */}
                {resumes.length === 0 ? (
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No resumes yet</h3>
                        <p className="text-gray-600 mb-6">
                            Create your first professional resume to get started
                        </p>
                        <Link
                            href="/builder/step-1"
                            className="inline-block px-6 py-3 bg-career-blue text-white font-semibold rounded-lg hover:bg-career-blue-dark transition-colors"
                        >
                            Create Your First Resume
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {resumes.map((resume) => (
                            <div
                                key={resume.id}
                                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-xl font-bold text-charcoal">{resume.title}</h3>
                                            {/* Check user-level payment entitlement, not resume status */}
                                            {hasPaid ? (
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                                    {resume.pdf_url ? 'Ready to Download' : 'Generating PDF...'}
                                                </span>
                                            ) : resume.status === 'locked' ? (
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                                                    Payment Required
                                                </span>
                                            ) : resume.status === 'draft' ? (
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                                    Draft
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                                                    {resume.pdf_url ? 'Ready to Download' : 'Generating PDF...'}
                                                </span>
                                            )}
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                                v{resume.version || 1}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Created: {new Date(resume.created_at).toLocaleDateString()}
                                        </p>
                                        {resume.updated_at !== resume.created_at && (
                                            <p className="text-sm text-gray-600">
                                                Updated: {new Date(resume.updated_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        {/* Check user-level payment entitlement first */}
                                        {hasPaid ? (
                                            <>
                                                {resume.pdf_url ? (
                                                    <>
                                                        <a
                                                            href={resume.pdf_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors"
                                                        >
                                                            Download PDF
                                                        </a>
                                                        {resume.shareable_link && (
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(
                                                                        `${window.location.origin}/resume/${resume.shareable_link}`
                                                                    );
                                                                    alert('Shareable link copied to clipboard!');
                                                                }}
                                                                className="px-4 py-2 border-2 border-career-blue text-career-blue font-medium rounded-lg hover:bg-soft-sky transition-colors"
                                                            >
                                                                Copy Link
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-career-blue"></div>
                                                        <span className="text-sm">Generating your PDF...</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : resume.status === 'locked' ? (
                                            <Link
                                                href="/checkout"
                                                className="px-4 py-2 bg-step-green text-white font-medium rounded-lg hover:bg-step-green-dark transition-colors"
                                            >
                                                Unlock Resume ($9.99)
                                            </Link>
                                        ) : resume.status === 'draft' ? (
                                            <Link
                                                href="/builder/step-1"
                                                className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors"
                                            >
                                                Continue Building
                                            </Link>
                                        ) : (
                                            // Resume is already paid (legacy)
                                            <>
                                                {resume.pdf_url ? (
                                                    <>
                                                        <a
                                                            href={resume.pdf_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors"
                                                        >
                                                            Download PDF
                                                        </a>
                                                        {resume.shareable_link && (
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(
                                                                        `${window.location.origin}/resume/${resume.shareable_link}`
                                                                    );
                                                                    alert('Shareable link copied to clipboard!');
                                                                }}
                                                                className="px-4 py-2 border-2 border-career-blue text-career-blue font-medium rounded-lg hover:bg-soft-sky transition-colors"
                                                            >
                                                                Copy Link
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-career-blue"></div>
                                                        <span className="text-sm">Generating your PDF...</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {/* Show LinkedIn content button only if user has paid */}
                                        {hasPaid && (
                                            <>
                                                {resume.linkedin_content ? (
                                                    <Link
                                                        href={`/dashboard/resumes/${resume.id}/linkedin`}
                                                        className="px-4 py-2 bg-[#0077B5] text-white font-medium rounded-lg hover:bg-[#006399] transition-colors flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                        </svg>
                                                        View LinkedIn Content
                                                    </Link>
                                                ) : (
                                                    <button
                                                        onClick={() => handleGenerateLinkedIn(resume.id)}
                                                        className="px-4 py-2 bg-[#0077B5] text-white font-medium rounded-lg hover:bg-[#006399] transition-colors flex items-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                        </svg>
                                                        Generate LinkedIn Content
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleDeleteResume(resume.id)}
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

                {/* LinkedIn Content Modal */}
                <LinkedInContentModal
                    isOpen={showLinkedInModal}
                    onClose={() => setShowLinkedInModal(false)}
                    content={linkedInContent}
                    loading={generatingLinkedIn}
                    userName={profile?.fullName || undefined}
                    userPhoto={profile?.photoUrl || undefined}
                />
            </div>
        </div>
    );
}
