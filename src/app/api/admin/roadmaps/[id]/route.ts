import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: roadmap, error } = await supabase.from('career_roadmaps').select('*').eq('id', id).single();

    if (error || !roadmap) {
        return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    const { data: userRow } = await supabase.from('users').select('id, email, full_name').eq('id', roadmap.user_id).single();
    return NextResponse.json({ ...roadmap, users: userRow ?? null });
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createAdminClient();
    const { error } = await supabase.from('career_roadmaps').delete().eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
