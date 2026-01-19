import React from 'react';

// Helper function to format date from YYYY-MM to "Month YYYY"
const formatDate = (dateString: string): string => {
    if (!dateString || dateString === "Present") return dateString;
    const [year, month] = dateString.split('-');
    if (!year || !month) return dateString;
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const monthIndex = parseInt(month) - 1;
    if (monthIndex < 0 || monthIndex > 11) return dateString;
    return `${monthNames[monthIndex]} ${year}`;
};

interface Experience {
    type: string;
    title: string;
    organization: string;
    description: string;
    startDate: string;
    endDate: string;
    location?: string;
    isCurrent?: boolean;
}

interface Certification {
    name: string;
    issuer?: string;
    dateIssued?: string;
}

interface LiveResumePreviewProps {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    headline?: string;
    aboutText?: string;
    highSchool?: string;
    graduationYear?: string;
    skills?: string[];
    experiences?: Experience[];
    certifications?: Certification[];
    photoUrl?: string | null;
    showPhoto?: boolean;
    isPaid?: boolean;
    variant?: 'preview' | 'document';
}

export function LiveResumePreview({
    fullName,
    email,
    phone,
    location,
    linkedin,
    headline,
    aboutText,
    highSchool,
    graduationYear,
    skills,
    experiences,
    certifications,
    photoUrl: _photoUrl,
    showPhoto: _showPhoto = true,
    isPaid = false,
    variant = 'preview',
}: LiveResumePreviewProps) {
    const containerClasses = variant === 'preview'
        ? "relative bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 max-w-3xl"
        : "relative bg-white p-8 w-full h-full";

    return (
        <div className={containerClasses}>
            {/* Watermark Overlay - NOT visible if paid */}
            {!isPaid && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-10">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-4xl font-bold text-gray-300 opacity-20 transform -rotate-45"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            FirstCareerSteps.com
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                {/* Header - Centered */}
                <div className="text-center mb-4 pb-4">

                    <h1 className="text-4xl font-bold text-gray-900 uppercase tracking-wide mb-2">
                        {fullName || 'YOUR NAME'}
                    </h1>
                    {headline && (
                        <p className="text-sm font-semibold text-gray-700 mb-3">{headline}</p>
                    )}
                    <div className="text-xs text-gray-600 flex justify-center items-center gap-2 flex-wrap">
                        {location && <span>{location}</span>}
                        {location && (email || phone || linkedin) && <span>|</span>}
                        {email && <span>{email}</span>}
                        {email && (phone || linkedin) && <span>|</span>}
                        {phone && <span>{phone}</span>}
                        {phone && linkedin && <span>|</span>}
                        {linkedin && <span>{linkedin}</span>}
                    </div>
                </div>

                {/* Professional Summary */}
                {aboutText && (
                    <div className="mb-5">
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            PROFESSIONAL SUMMARY
                        </h2>
                        <p className="text-xs text-gray-800 leading-relaxed">
                            {aboutText}
                        </p>
                    </div>
                )}

                {/* Work Experience */}
                {experiences && experiences.length > 0 && (
                    <div className="mb-5">
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            WORK EXPERIENCE
                        </h2>
                        <div className="space-y-4">
                            {experiences.map((exp, index) => (
                                <div key={index}>
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                                            <p className="text-xs text-gray-700">
                                                {exp.organization}{exp.location ? `, ${exp.location}` : ''}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-600 whitespace-nowrap ml-4">
                                            {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                                        </p>
                                    </div>
                                    {exp.description && (
                                        <div className="text-xs text-gray-800 mt-2">
                                            {exp.description.split('\n').map((line, i) => (
                                                line.trim() && (
                                                    <div key={i} className="flex gap-2 mb-1">
                                                        <span className="text-gray-600">•</span>
                                                        <span className="flex-1">{line.trim().replace(/^[•\-]\s*/, '')}</span>
                                                    </div>
                                                )
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
                    <div className="mb-5">
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            EDUCATION
                        </h2>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">High School Diploma</h3>
                                <p className="text-xs text-gray-700">{highSchool}</p>
                            </div>
                            {graduationYear && (
                                <p className="text-xs text-gray-600 whitespace-nowrap ml-4">
                                    Graduated: {graduationYear}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Certifications */}
                {certifications && certifications.length > 0 && (
                    <div className="mb-5">
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            CERTIFICATIONS
                        </h2>
                        <div className="space-y-2">
                            {certifications.map((cert, index) => (
                                <div key={index} className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900">{cert.name}</p>
                                        {cert.issuer && <p className="text-xs text-gray-700">{cert.issuer}</p>}
                                    </div>
                                    {cert.dateIssued && (
                                        <p className="text-xs text-gray-600 whitespace-nowrap ml-4">
                                            {cert.dateIssued}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Skills */}
                {skills && skills.length > 0 && (
                    <div className="mb-5">
                        <h2 className="text-base font-bold uppercase tracking-wide text-gray-900 border-b-2 border-gray-900 pb-1 mb-3">
                            SKILLS
                        </h2>
                        <div className="space-y-1">
                            {skills.map((skill, index) => (
                                <div key={index} className="flex gap-2 text-xs text-gray-800">
                                    <span className="text-gray-600">•</span>
                                    <span>{skill}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}



                {/* Empty State */}
                {!fullName && !headline && !aboutText && !skills?.length && !experiences?.length && !highSchool && !certifications?.length && (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-sm">Your resume preview will appear here</p>
                        <p className="text-xs mt-1">Start filling in your information →</p>
                    </div>
                )}
            </div>
        </div>
    );
}
