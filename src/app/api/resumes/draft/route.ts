import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();

        // Create a Supabase client with cookies for server-side auth
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        const adminSupabase = createAdminClient();

        // Fetch user's basic info for the title
        const { data: userData } = await adminSupabase
            .from('users')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        // Calculate next version number
        const { data: existingResumes } = await adminSupabase
            .from('resumes')
            .select('version')
            .eq('user_id', user.id)
            .order('version', { ascending: false })
            .limit(1);

        const nextVersion = existingResumes && existingResumes.length > 0
            ? (existingResumes[0].version || 0) + 1
            : 1;

        const userName = userData?.full_name || (userData?.email ? userData.email.split('@')[0].charAt(0).toUpperCase() + userData.email.split('@')[0].slice(1) : 'My');
        // Generate a random link so the schema requirement is met
        const shareableLink = crypto.randomUUID();

        // Create resume record with status 'draft'
        const { data: resume, error: resumeError } = await adminSupabase
            .from('resumes')
            .insert({
                user_id: user.id,
                title: `${userName} Resume (Draft)`,
                status: 'draft',
                shareable_link: shareableLink,
                stripe_session_id: null,
                version: nextVersion,
                linkedin_content: null,
                pdf_url: null,
            })
            .select()
            .single();

        if (resumeError) {
            console.error('Failed to save draft:', resumeError);
            return NextResponse.json(
                { error: 'Failed to save draft', details: resumeError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            resumeId: resume.id,
            version: nextVersion,
            message: 'Draft saved successfully',
        });

    } catch (error) {
        console.error('Draft API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
