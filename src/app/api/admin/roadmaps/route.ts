import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('perPage') ?? '20', 10)));
    const userId = searchParams.get('userId')?.trim() ?? '';
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = createAdminClient();
    let q = supabase
        .from('career_roadmaps')
        .select('id, user_id, career_name, infographic_url, milestone_roadmap_url, created_at, updated_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (userId) q = q.eq('user_id', userId);

    const { data: rows, error, count } = await q;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const roadmapsList = rows ?? [];
    const userIds = [...new Set(roadmapsList.map((r: { user_id: string }) => r.user_id))];
    const userMap: Record<string, { email: string; full_name: string | null }> = {};
    if (userIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('id, email, full_name').in('id', userIds);
        for (const u of usersData ?? []) {
            userMap[u.id] = { email: u.email, full_name: u.full_name ?? null };
        }
    }

    const list = roadmapsList.map((r: { user_id: string }) => ({
        ...r,
        user_email: userMap[r.user_id]?.email ?? null,
        user_name: userMap[r.user_id]?.full_name ?? null,
    }));

    return NextResponse.json({
        roadmaps: list,
        total: count ?? 0,
        page,
        perPage,
    });
}
