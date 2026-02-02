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

    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (userError || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [
        { data: profile },
        { data: resumes },
        { data: roadmaps },
        { data: sub },
    ] = await Promise.all([
        supabase.from('profile').select('*').eq('user_id', id).maybeSingle(),
        supabase.from('resumes').select('id, title, status, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
        supabase.from('career_roadmaps').select('id, career_name, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
        supabase.from('subscriptions').select('*').eq('user_id', id).maybeSingle(),
    ]);

    return NextResponse.json({
        user,
        profile: profile ?? null,
        resumes: resumes ?? [],
        roadmaps: roadmaps ?? [],
        subscription: sub ?? null,
    });
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { full_name, email, role, linkedin_link } = body;

    const supabase = createAdminClient();
    const updates: Record<string, unknown> = {};
    if (typeof full_name === 'string') updates.full_name = full_name;
    if (typeof email === 'string') updates.email = email;
    if (role === 'user' || role === 'admin') updates.role = role;
    if (typeof linkedin_link === 'string') updates.linkedin_link = linkedin_link;

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
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
    if (id === admin.id) {
        return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
