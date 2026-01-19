import { pdf } from '@react-pdf/renderer';
import { createAdminClient } from '@/lib/supabase';
import { ProfessionalResumePDF } from './templates/professional';

export interface ResumeData {
    fullName: string;
    email: string;
    linkedinLink?: string;
    headline?: string;
    aboutText?: string;
    highSchool?: string;
    graduationYear?: string;
    skills?: string[];
    experiences?: Array<{
        type: string;
        title: string;
        organization: string;
        bullets: string[];
        start_date?: string;
        end_date?: string;
    }>;
    certifications?: Array<{
        name: string;
        issuer?: string;
        date_issued?: string;
    }>;
    phone?: string;
    location?: string;
}

/**
 * Fetch user data for resume generation
 */
export async function fetchUserResumeData(userId: string): Promise<ResumeData | null> {
    try {
        const supabase = createAdminClient();

        // Fetch user basic info
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('full_name, email, linkedin_link')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user:', userError);
            return null;
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
            .from('profile')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
        }

        // Fetch experiences
        const { data: experiences, error: expError } = await supabase
            .from('experiences')
            .select('*')
            .eq('user_id', userId)
            .order('start_date', { ascending: false });

        if (expError) {
            console.error('Error fetching experiences:', expError);
        }

        // Fetch certifications
        const { data: certifications, error: certError } = await supabase
            .from('certifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (certError) {
            console.error('Error fetching certifications:', certError);
        }

        return {
            fullName: (user as { full_name?: string })?.full_name || 'Your Name',
            email: (user as { email?: string })?.email || '',
            phone: (profile as { phone?: string } | null)?.phone || undefined,
            location: (profile as { location?: string } | null)?.location || undefined,
            linkedinLink: (user as { linkedin_link?: string })?.linkedin_link || undefined,
            headline: (profile as { headline?: string } | null)?.headline || undefined,
            aboutText: (profile as { about_text?: string } | null)?.about_text || undefined,
            highSchool: (profile as { high_school?: string } | null)?.high_school || undefined,
            graduationYear: (profile as { graduation_year?: string } | null)?.graduation_year || undefined,
            skills: (profile as { skills?: string[] } | null)?.skills || [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            experiences: (experiences as any[]) || [],
            certifications: certifications?.map((cert: { name: string; issuer?: string; issuing_organization?: string; issue_date?: string; date_issued?: string }) => ({
                name: cert.name,
                issuer: cert.issuer || cert.issuing_organization,
                date_issued: cert.issue_date || cert.date_issued,
            })) || [],
        };
    } catch (error) {
        console.error('Error fetching resume data:', error);
        return null;
    }
}

/**
 * Generate PDF blob from resume data
 */
export async function generateResumePDF(data: ResumeData): Promise<Blob> {
    const React = await import('react');
    const element = React.createElement(ProfessionalResumePDF, { data });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(element as any).toBlob();
    return blob;
}

/**
 * Upload PDF to Supabase Storage
 */
export async function uploadPDFToStorage(
    userId: string,
    pdfBlob: Blob
): Promise<{ url: string | null; error: Error | null }> {
    try {
        const supabase = createAdminClient();
        const fileName = `resume_${userId}_${Date.now()}.pdf`;

        // Upload to Supabase Storage in user-specific folder for security
        const userFolder = `${userId}/`;
        const filePath = `${userFolder}${fileName}`;
        
        const { error: uploadError } = await supabase.storage
            .from('resume-assets')
            .upload(filePath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return { url: null, error: uploadError };
        }

        // Get signed URL for private bucket (valid for 1 year)
        const { data: urlData, error: urlError } = await supabase.storage
            .from('resume-assets')
            .createSignedUrl(filePath, 31536000); // 1 year expiry

        if (urlError || !urlData) {
            console.error('Error creating signed URL:', urlError);
            return { url: null, error: urlError || new Error('Failed to create signed URL') };
        }

        return { url: urlData.signedUrl, error: null };
    } catch (error) {
        console.error('Error uploading PDF:', error);
        return { url: null, error: error as Error };
    }
}

/**
 * Complete PDF generation workflow
 */
export async function generateAndUploadResumePDF(
    userId: string
): Promise<{ pdfUrl: string | null; error: Error | null }> {
    try {
        // 1. Fetch user data
        const resumeData = await fetchUserResumeData(userId);
        if (!resumeData) {
            return { pdfUrl: null, error: new Error('Failed to fetch user data') };
        }

        // 2. Generate PDF
        const pdfBlob = await generateResumePDF(resumeData);

        // 3. Upload to storage
        const { url, error } = await uploadPDFToStorage(userId, pdfBlob);

        if (error) {
            return { pdfUrl: null, error };
        }

        return { pdfUrl: url, error: null };
    } catch (error) {
        console.error('Error in PDF generation workflow:', error);
        return { pdfUrl: null, error: error as Error };
    }
}
