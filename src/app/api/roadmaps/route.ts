import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// GET - Get all roadmaps for authenticated user
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data, error } = await supabase
            .from('roadmaps')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching roadmaps:', error);
            return NextResponse.json(
                { error: 'Failed to fetch roadmaps' },
                { status: 500 }
            );
        }

        return NextResponse.json({ roadmaps: data });
    } catch (error: any) {
        console.error('Error in GET roadmaps:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST - Save a new roadmap
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { careerName, roadmapContent, infographicUrl, milestoneGraphicUrl } = body;

        if (!careerName || !roadmapContent) {
            return NextResponse.json(
                { error: 'Career name and roadmap content are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('roadmaps')
            .insert({
                user_id: session.user.id,
                career_name: careerName,
                roadmap_content: roadmapContent,
                infographic_url: infographicUrl || null,
                milestone_graphic_url: milestoneGraphicUrl || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving roadmap:', error);
            return NextResponse.json(
                { error: 'Failed to save roadmap' },
                { status: 500 }
            );
        }

        return NextResponse.json({ roadmap: data });
    } catch (error: any) {
        console.error('Error in POST roadmap:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
