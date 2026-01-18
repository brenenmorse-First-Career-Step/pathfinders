import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
});

export async function POST() {
    try {
        const supabase = await createServerClient();
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user has already paid
        const { data: existingPayment } = await supabase
            .from('user_payments')
            .select('has_paid')
            .eq('user_id', session.user.id)
            .single();

        if (existingPayment?.has_paid) {
            return NextResponse.json(
                { error: 'You have already purchased access to Career Roadmaps' },
                { status: 400 }
            );
        }

        // Create Stripe checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Career Roadmap Access',
                            description: 'One-time payment for unlimited AI-powered career roadmaps',
                        },
                        unit_amount: 999, // $9.99
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/career-roadmap?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/career-roadmap?payment=cancelled`,
            client_reference_id: session.user.id,
            metadata: {
                user_id: session.user.id,
                product_type: 'roadmap_access',
            },
        });

        return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
    } catch (error: unknown) {
        console.error('Error creating checkout session:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

