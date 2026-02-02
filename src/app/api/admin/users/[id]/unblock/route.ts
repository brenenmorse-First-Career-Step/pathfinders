import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('users')
        .update({ blocked_at: null })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}
