import { createAdminClient } from "@/lib/supabase";
import { LiveResumePreview } from "@/components/LiveResumePreview";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface Props {
    params: Promise<{
        id: string;
    }>;
}

// Disable caching for this dynamic route
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const supabase = createAdminClient();
    const { data: resume } = await supabase
        .from('resumes')
        .select('title, user_id')
        .eq('shareable_link', id)
        .single();

    if (!resume) {
        return {
            title: 'Resume Not Found',
        };
    }

    const { data: user } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', resume.user_id)
        .single();

    return {
        title: `${user?.full_name || 'Professional'} - Resume`,
        description: `View professional resume of ${user?.full_name}`,
    };
}

export default async function ResumeViewPage({ params }: Props) {
    const { id } = await params;
    const supabase = createAdminClient();

    // 1. Get Resume by shareable link
    const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('user_id')
        .eq('shareable_link', id)
        .single();

    if (resumeError || !resume) {
        notFound();
    }

    // 2. Fetch User Data
    const { data: user } = await supabase
        .from('users')
        .select('full_name, email, linkedin_link')
        .eq('id', resume.user_id)
        .single();

    // 3. Fetch Profile Data
    const { data: profile } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', resume.user_id)
        .single();

    // 4. Fetch Experiences
    const { data: experiences } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', resume.user_id)
        .order('start_date', { ascending: false });

    // 5. Fetch Certifications
    const { data: certifications } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', resume.user_id)
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: 0,
                    margin: '0 auto',
                    background: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden', // Prevent spillover
                    display: 'flex',
                    flexDirection: 'column'
                }}
                className="print:shadow-none print:m-0"
            >
                <LiveResumePreview
                    fullName={user?.full_name || ""}
                    email={user?.email || ""}
                    phone={profile?.phone || ""}
                    location={profile?.location || ""}
                    linkedin={user?.linkedin_link || ""}
                    headline={profile?.headline || ""}
                    aboutText={profile?.about_text || ""}
                    highSchool={profile?.high_school || ""}
                    graduationYear={profile?.graduation_year || ""}
                    skills={profile?.skills || []}
                    experiences={experiences || []}
                    certifications={certifications?.map(c => ({
                        name: c.name,
                        issuer: c.issuer || "",
                        dateIssued: c.date_issued || ""
                    })) || []}
                    isPaid={true}
                    variant="document"
                />
            </div>
            <div className="mt-8 text-center text-sm text-gray-500 pb-8">
                <p>Created with FirstCareerSteps.com</p>
            </div>
        </div>
    );
}
