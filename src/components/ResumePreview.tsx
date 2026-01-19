import React from 'react';

interface Experience {
    type: string;
    title: string;
    organization: string;
    description: string;
}

interface ResumePreviewProps {
    fullName: string;
    email: string;
    linkedinLink?: string;
    headline?: string;
    aboutText?: string;
    highSchool?: string;
    graduationYear?: string;
    skills?: string[];
    experiences?: Experience[];
}

export function ResumePreview({
    fullName,
    email,
    linkedinLink,
    headline,
    aboutText,
    highSchool,
    graduationYear,
    skills,
    experiences,
}: ResumePreviewProps) {
    return (
        <div className="relative bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto border-2 border-gray-200">
            {/* Watermark Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-gray-200 font-bold text-2xl opacity-10 select-none"
                        style={{
                            transform: `rotate(-45deg)`,
                            top: `${(i % 5) * 20}%`,
                            left: `${Math.floor(i / 5) * 25}%`,
                        }}
                    >
                        FirstCareerSteps
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="border-b-2 border-gray-900 pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide mb-2">
                        {fullName || 'Your Name'}
                    </h1>
                    {headline && (
                        <p className="text-lg font-semibold text-gray-700 mb-3">{headline}</p>
                    )}
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>{email}</p>
                        {linkedinLink && <p>{linkedinLink}</p>}
                    </div>
                </div>

                {/* Professional Summary */}
                {aboutText && (
                    <div className="mb-6">
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b border-gray-900 pb-1 mb-3">
                            Professional Summary
                        </h2>
                        <p className="text-sm text-gray-800 leading-relaxed text-justify">
                            {aboutText}
                        </p>
                    </div>
                )}

                {/* Skills */}
                {skills && skills.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b border-gray-900 pb-1 mb-3">
                            Skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Experience */}
                {experiences && experiences.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b border-gray-900 pb-1 mb-3">
                            Experience
                        </h2>
                        <div className="space-y-4">
                            {experiences.map((exp, index) => (
                                <div key={index}>
                                    <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                                    <p className="text-sm italic text-gray-700 mb-2">
                                        {exp.organization} • {exp.type.charAt(0).toUpperCase() + exp.type.slice(1)}
                                    </p>
                                    {exp.description && (
                                        <div className="text-sm text-gray-800 ml-4 space-y-1">
                                            {exp.description.split('\n').map((line: string, i: number) => (
                                                <div key={i} className="flex items-start">
                                                    <span className="mr-2">•</span>
                                                    <span>{line}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {highSchool && (
                    <div className="mb-6">
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b border-gray-900 pb-1 mb-3">
                            Education
                        </h2>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">{highSchool}</h3>
                            {graduationYear && (
                                <p className="text-sm text-gray-600">Graduated: {graduationYear}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
