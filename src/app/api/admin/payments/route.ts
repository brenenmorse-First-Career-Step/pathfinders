import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('perPage') ?? '20', 10)));
    const status = searchParams.get('status')?.trim() ?? '';
    const limit = Math.min(100, perPage * 3);
    const startingAfter = searchParams.get('starting_after') ?? undefined;

    try {
        const stripe = getStripe();
        const sessions = await stripe.checkout.sessions.list({
            limit,
            starting_after: startingAfter || undefined,
            expand: ['data.customer_details'],
        });

        type Session = (typeof sessions.data)[0];
        let list = sessions.data.map((s: Session) => ({
            id: s.id,
            email: (s.customer_details?.email ?? s.customer_email) ?? '',
            amount: s.amount_total ?? 0,
            currency: s.currency ?? 'usd',
            status: s.payment_status ?? s.status ?? 'unknown',
            created_at: new Date((s.created ?? 0) * 1000).toISOString(),
        }));

        if (status) {
            list = list.filter((p) => p.status === status);
        }

        const total = list.length;
        const from = (page - 1) * perPage;
        const paginated = list.slice(from, from + perPage);

        return NextResponse.json({
            payments: paginated,
            total,
            page,
            perPage,
        });
    } catch (err) {
        console.error('Admin payments error:', err);
        return NextResponse.json({ payments: [], total: 0, page: 1, perPage: 20 });
    }
}
