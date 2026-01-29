import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
    try {
        const cookieStore = await cookies();

        // Create a Supabase client with cookies for server-side auth
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', hasSubscription: false },
                { status: 401 }
            );
        }

        // Use admin client so RLS does not block subscription read (reliable for review page)
        const adminSupabase = createAdminClient();
        const { data: allSubscriptions, error: allError } = await adminSupabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id);

        if (allError) {
            console.error('Error fetching subscriptions:', allError);
            return NextResponse.json({
                hasSubscription: false,
                error: allError.message,
                debug: {
                    userId: user.id,
                    errorCode: allError.code,
                    errorDetails: allError.details,
                },
            });
        }

        // Check for active subscription (admin client for reliable read)
        const { data: activeSubscription, error: activeError } = await adminSupabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

        if (activeError) {
            console.error('Error fetching active subscription:', activeError);
        }

        // If we have an active subscription, check if it's still valid
        if (activeSubscription) {
            const now = new Date();
            const periodEnd = new Date(activeSubscription.current_period_end);
            const isActive = periodEnd > now && !activeSubscription.cancel_at_period_end;

            return NextResponse.json({
                hasSubscription: isActive,
                subscription: {
                    id: activeSubscription.id,
                    status: activeSubscription.status,
                    current_period_end: activeSubscription.current_period_end,
                    cancel_at_period_end: activeSubscription.cancel_at_period_end,
                    isActive,
                    periodEnd: periodEnd.toISOString(),
                    now: now.toISOString(),
                },
                debug: {
                    userId: user.id,
                    allSubscriptions: allSubscriptions?.length || 0,
                    allSubscriptionStatuses: allSubscriptions?.map(s => s.status) || [],
                },
            });
        }

        // No active subscription found
        return NextResponse.json({
            hasSubscription: false,
            debug: {
                userId: user.id,
                allSubscriptions: allSubscriptions?.length || 0,
                allSubscriptionStatuses: allSubscriptions?.map(s => ({ id: s.id, status: s.status })) || [],
            },
        });

    } catch (error) {
        console.error('Check subscription API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', hasSubscription: false },
            { status: 500 }
        );
    }
}
