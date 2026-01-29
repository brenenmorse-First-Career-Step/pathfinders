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

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/200fa76e-626f-4194-ae18-4a5b0d59588e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'check-subscription/route.ts:entry',message:'check-subscription called',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,E'})}).catch(()=>{});
        // #endregion

        // Use admin client so RLS does not block subscription read (reliable for review page)
        const adminSupabase = createAdminClient();
        const { data: allSubscriptions, error: allError } = await adminSupabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id);

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/200fa76e-626f-4194-ae18-4a5b0d59588e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'check-subscription/route.ts:allSubs',message:'allSubscriptions result',data:{userId:user.id,count:allSubscriptions?.length??0,statuses:allSubscriptions?.map(s=>s.status)??[],allError:allError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C,E'})}).catch(()=>{});
        // #endregion

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

        // Check for active or trialing subscription (Stripe often uses trialing for new subs)
        const { data: activeSubscription, error: activeError } = await adminSupabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .order('current_period_end', { ascending: false })
            .limit(1)
            .maybeSingle();

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/200fa76e-626f-4194-ae18-4a5b0d59588e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'check-subscription/route.ts:activeQuery',message:'active subscription query',data:{userId:user.id,found:!!activeSubscription,status:activeSubscription?.status,activeError:activeError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,E'})}).catch(()=>{});
        // #endregion

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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/200fa76e-626f-4194-ae18-4a5b0d59588e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'check-subscription/route.ts:noActive',message:'returning hasSubscription false',data:{userId:user.id,allCount:allSubscriptions?.length??0,allStatuses:allSubscriptions?.map(s=>s.status)??[]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,E'})}).catch(()=>{});
        // #endregion
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
