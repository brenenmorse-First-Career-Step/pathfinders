import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST() {
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
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options);
                            });
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
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

        // Create or get existing resume record first (with 'locked' status)
        // This ensures resume exists even if payment fails
        let resumeId = 'new-resume';
        
        // Check if user already has a locked resume
        const { data: existingResume } = await supabase
            .from('resumes')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'locked')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!existingResume) {
            // Create new locked resume
            const shareableLink = crypto.randomUUID();
            // Use profile full_name first, then extract name from email, then fallback
            const userName = profile.full_name || (user.email ? user.email.split('@')[0] : 'My');
            const { data: newResume, error: resumeError } = await supabase
                .from('resumes')
                .insert({
                    user_id: user.id,
                    title: `${userName} Resume`,
                    status: 'locked',
                    shareable_link: shareableLink,
                })
                .select('id')
                .single();

            if (resumeError) {
                console.error('Resume creation error:', resumeError);
                return NextResponse.json(
                    { error: 'Failed to create resume record' },
                    { status: 500 }
                );
            }
            resumeId = newResume.id;
        } else {
            resumeId = existingResume.id;
        }

        // Create Stripe checkout session with resume ID
        const result = await createCheckoutSession(user.id, resumeId);

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
