import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// GET - Get specific roadmap by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
            .eq('id', id)
            .eq('user_id', session.user.id)
            .single();

        if (error) {
            console.error('Error fetching roadmap:', error);
            return NextResponse.json(
                { error: 'Roadmap not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ roadmap: data });
    } catch (error: unknown) {
        console.error('Error in GET roadmap:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// DELETE - Delete a roadmap
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const { error } = await supabase
            .from('roadmaps')
            .delete()
            .eq('id', id)
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Error deleting roadmap:', error);
            return NextResponse.json(
                { error: 'Failed to delete roadmap' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error in DELETE roadmap:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
