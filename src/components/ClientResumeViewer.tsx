"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LiveResumePreview, type Experience, type Certification } from "./LiveResumePreview";

interface ClientResumeViewerProps {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    headline: string;
    aboutText: string;
    highSchool: string;
    graduationYear: string;
    skills: string[];
    experiences: Experience[];
    certifications: Certification[];
    isPaid: boolean;
    title: string;
}

export function ClientResumeViewer(props: ClientResumeViewerProps) {
    const searchParams = useSearchParams();
    const downloadParam = searchParams.get('download');
    const resumeRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (downloadParam === 'true' && resumeRef.current && !isGenerating) {
            handleDownload();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [downloadParam]);

    const handleDownload = async () => {
        if (!resumeRef.current || isGenerating) return;

        setIsGenerating(true);
        try {
            // Dynamically import html2pdf to avoid SSR issues
            const html2pdf = (await import('html2pdf.js')).default;

            const element = resumeRef.current;
            const opt = {
                margin: 0,
                filename: `${props.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            await html2pdf().set(opt).from(element).save();

            // If it was auto-triggered by a new tab, we can try to close it after a brief delay
            if (downloadParam === 'true') {
                setTimeout(() => {
                    window.close();
                }, 1000);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="relative">
            {isGenerating && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue mb-4"></div>
                    <p className="text-lg font-medium text-charcoal">Generating your high-quality PDF...</p>
                    <p className="text-sm text-gray-500">Please wait a moment</p>
                </div>
            )}

            {/* The actual resume container that gets printed. 
                A4 proportions: 210mm x 297mm. 
                We use an ID for html2pdf to accurately grab it. */}
            <div
                id="resume-pdf-content"
                ref={resumeRef}
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: 0,
                    margin: '0 auto',
                    background: 'white',
                    boxShadow: downloadParam !== 'true' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                className="print:shadow-none print:m-0"
            >
                <LiveResumePreview
                    fullName={props.fullName}
                    email={props.email}
                    phone={props.phone}
                    location={props.location}
                    linkedin={props.linkedin}
                    headline={props.headline}
                    aboutText={props.aboutText}
                    highSchool={props.highSchool}
                    graduationYear={props.graduationYear}
                    skills={props.skills}
                    experiences={props.experiences}
                    certifications={props.certifications}
                    isPaid={props.isPaid}
                    variant="document"
                />
            </div>

            {/* Manual download button if just viewing the link directly */}
            {downloadParam !== 'true' && (
                <div className="mt-8 flex justify-center pb-8 print:hidden">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {isGenerating ? 'Generating...' : 'Download PDF'}
                    </button>
                </div>
            )}
        </div>
    );
}
