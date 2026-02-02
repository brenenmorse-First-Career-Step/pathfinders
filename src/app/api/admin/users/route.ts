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
    const search = searchParams.get('search')?.trim() ?? '';
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = createAdminClient();
    let q = supabase
        .from('users')
        .select('id, email, full_name, role, blocked_at, date_created', { count: 'exact' })
        .order('date_created', { ascending: false })
        .range(from, to);

    if (search) {
        q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: users, error, count } = await q;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const resumeCounts: Record<string, number> = {};
    const roadmapCounts: Record<string, number> = {};
    const subStatus: Record<string, string> = {};

    if (users && users.length > 0) {
        const ids = users.map((u) => u.id);
        const [resumes, roadmaps, subs] = await Promise.all([
            supabase.from('resumes').select('user_id').in('user_id', ids),
            supabase.from('career_roadmaps').select('user_id').in('user_id', ids),
            supabase.from('subscriptions').select('user_id, status').in('user_id', ids),
        ]);
        for (const r of resumes.data ?? []) {
            resumeCounts[r.user_id] = (resumeCounts[r.user_id] ?? 0) + 1;
        }
        for (const r of roadmaps.data ?? []) {
            roadmapCounts[r.user_id] = (roadmapCounts[r.user_id] ?? 0) + 1;
        }
        for (const s of subs.data ?? []) {
            subStatus[s.user_id] = s.status;
        }
    }

    const list = (users ?? []).map((u) => ({
        ...u,
        resumesCount: resumeCounts[u.id] ?? 0,
        roadmapsCount: roadmapCounts[u.id] ?? 0,
        subscriptionStatus: subStatus[u.id] ?? null,
    }));

    return NextResponse.json({
        users: list,
        total: count ?? 0,
        page,
        perPage,
    });
}
