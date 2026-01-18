import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// GET - Check if user has paid
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { hasPaid: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data, error } = await supabase
            .from('user_payments')
            .select('has_paid, paid_at, payment_amount')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching payment status:', error);
            return NextResponse.json(
                { hasPaid: false, error: 'Failed to fetch payment status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            hasPaid: data?.has_paid || false,
            paidAt: data?.paid_at || null,
            amount: data?.payment_amount || null,
        });
    } catch (error: any) {
        console.error('Error in payment status:', error);
        return NextResponse.json(
            { hasPaid: false, error: error.message },
            { status: 500 }
        );
    }
}
