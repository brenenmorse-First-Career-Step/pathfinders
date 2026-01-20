import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
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
            console.error('Auth error:', authError);
            return NextResponse.json(
                { error: 'Unauthorized - Please log in' },
                { status: 401 }
            );
        }

        // Verify user has completed their profile
        const { data: profile, error: profileError } = await supabase
            .from('profile')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile error:', profileError);
            return NextResponse.json(
                { error: 'Profile not found - Please complete the builder first' },
                { status: 400 }
            );
        }

        // Verify profile is reasonably complete
        if (!profile.headline || !profile.about_text) {
            return NextResponse.json(
                { error: 'Please complete your profile before purchasing' },
                { status: 400 }
            );
        }

        // Create Stripe checkout session
        const result = await createCheckoutSession(user.id, 'new-resume');

        if ('error' in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        if (!result.session) {
            return NextResponse.json(
                { error: 'Failed to create checkout session' },
                { status: 500 }
            );
        }

        // Return the checkout URL
        return NextResponse.json({
            url: result.session.url,
            sessionId: result.session.id,
        });

    } catch (error) {
        console.error('Checkout API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
