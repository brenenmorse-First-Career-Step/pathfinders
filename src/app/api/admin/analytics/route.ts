import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
        const [
            { count: totalUsers },
            { count: newSignups7d },
            { count: blockedCount },
            { count: totalResumes },
            { count: totalRoadmaps },
            { count: activeSubscriptions },
            { data: recentSignups },
        ] = await Promise.all([
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }).gte('date_created', sevenDaysAgo),
            supabase.from('users').select('*', { count: 'exact', head: true }).not('blocked_at', 'is', null),
            supabase.from('resumes').select('*', { count: 'exact', head: true }),
            supabase.from('career_roadmaps').select('*', { count: 'exact', head: true }),
            supabase.from('subscriptions').select('*', { count: 'exact', head: true }).in('status', ['active', 'trialing']),
            supabase.from('users').select('id, email, full_name, date_created').order('date_created', { ascending: false }).limit(5),
        ]);

        let totalRevenue = 0;
        let paymentsSuccess = 0;
        let paymentsFailed = 0;
        const recentPayments: { id: string; email: string; amount: number; status: string; created_at: string }[] = [];

        try {
            const stripe = getStripe();
            const sessions = await stripe.checkout.sessions.list({
                limit: 100,
                expand: ['data.customer_details'],
            });
            for (const s of sessions.data) {
                if (s.status === 'complete' && s.payment_status === 'paid' && s.amount_total) {
                    totalRevenue += s.amount_total;
                    paymentsSuccess += 1;
                } else if (s.status === 'complete' && s.payment_status !== 'paid') {
                    paymentsFailed += 1;
                }
                recentPayments.push({
                    id: s.id ?? '',
                    email: (s.customer_details?.email ?? s.customer_email) ?? '',
                    amount: s.amount_total ?? 0,
                    status: s.payment_status ?? 'unknown',
                    created_at: new Date((s.created ?? 0) * 1000).toISOString(),
                });
            }
            recentPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch {
            // Stripe not configured or error – leave revenue/payments as default
        }

        return NextResponse.json({
            totalUsers: totalUsers ?? 0,
            newSignups7d: newSignups7d ?? 0,
            blockedCount: blockedCount ?? 0,
            totalResumes: totalResumes ?? 0,
            totalRoadmaps: totalRoadmaps ?? 0,
            activeSubscriptions: activeSubscriptions ?? 0,
            totalRevenue: totalRevenue ?? 0,
            paymentsSuccess,
            paymentsFailed,
            recentPayments: recentPayments.slice(0, 10),
            recentSignups: recentSignups ?? [],
        });
    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
    }
}
