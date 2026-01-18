import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { linkedInContent } = await request.json();
        const { id: resumeId } = await params;

        // Get user from session
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create Supabase client with service role for admin operations
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify user owns this resume
        const { data: resume, error: fetchError } = await supabase
            .from('resumes')
            .select('user_id')
            .eq('id', resumeId)
            .single();

        if (fetchError || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        // Update the resume with LinkedIn content
        const { data, error } = await supabase
            .from('resumes')
            .update({
                linkedin_content: JSON.stringify(linkedInContent),
                updated_at: new Date().toISOString(),
            })
            .eq('id', resumeId)
            .select()
            .single();

        if (error) {
            console.error('Error updating LinkedIn content:', error);
            return NextResponse.json(
                { error: 'Failed to save LinkedIn content' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error saving LinkedIn content:', error);
        return NextResponse.json(
            { error: 'Failed to save LinkedIn content' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: resumeId } = await params;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: resume, error } = await supabase
            .from('resumes')
            .select('linkedin_content, status')
            .eq('id', resumeId)
            .single();

        if (error || !resume) {
            return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
        }

        // Parse LinkedIn content if it exists
        let linkedInContent = null;
        if (resume.linkedin_content) {
            try {
                linkedInContent = JSON.parse(resume.linkedin_content);
            } catch {
                linkedInContent = resume.linkedin_content;
            }
        }

        return NextResponse.json({ linkedInContent });
    } catch (error) {
        console.error('Error fetching LinkedIn content:', error);
        return NextResponse.json(
            { error: 'Failed to fetch LinkedIn content' },
            { status: 500 }
        );
    }
}
