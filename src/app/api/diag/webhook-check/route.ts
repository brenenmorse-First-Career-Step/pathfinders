import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// Diagnostic endpoint - check webhook configuration and DB state
// Access via: GET /api/diag/webhook-check
// IMPORTANT: Remove or protect this endpoint after debugging!

export async function GET() {
    const results: Record<string, unknown> = {};

    // 1. Check env vars are set (don't expose actual values)
    results.env = {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY ? `set (${process.env.STRIPE_SECRET_KEY?.substring(0, 7)}...)` : 'MISSING',
        STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET ? `set (${process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10)}...)` : 'MISSING',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? `set (${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7)}...)` : 'MISSING',
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING',
        RESEND_API_KEY: !!process.env.RESEND_API_KEY ? `set (length: ${process.env.RESEND_API_KEY?.length}, ends with: "${process.env.RESEND_API_KEY?.slice(-3)}")` : 'MISSING',
        NODE_ENV: process.env.NODE_ENV,
    };

    // 2. Check if Stripe keys are test vs live
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    results.stripeMode = {
        secretKeyMode: stripeKey.startsWith('sk_test_') ? 'TEST' : stripeKey.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN',
        publishableKeyMode: pubKey.startsWith('pk_test_') ? 'TEST' : pubKey.startsWith('pk_live_') ? 'LIVE' : 'UNKNOWN',
        webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 6) || 'MISSING',
    };

    // 3. Check DB connectivity and table existence
    try {
        const supabase = createAdminClient();

        // Check resumes table
        const { data: resumeCount, error: resumeErr } = await supabase
            .from('resumes')
            .select('id', { count: 'exact', head: true });
        results.db_resumes = resumeErr
            ? { error: resumeErr.message, code: resumeErr.code, hint: resumeErr.hint }
            : { ok: true, count: resumeCount };

        // Check users table
        const { data: userCount, error: userErr } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true });
        results.db_users = userErr
            ? { error: userErr.message, code: userErr.code, hint: userErr.hint }
            : { ok: true, count: userCount };

        // Check subscriptions table
        const { data: subCount, error: subErr } = await supabase
            .from('subscriptions')
            .select('id', { count: 'exact', head: true });
        results.db_subscriptions = subErr
            ? { error: subErr.message, code: subErr.code, hint: subErr.hint }
            : { ok: true, count: subCount };

        // Try to insert and immediately delete a test row in resumes (tests service_role write access)
        const testUserId = '00000000-0000-0000-0000-000000000000';
        const { error: insertErr } = await supabase
            .from('resumes')
            .insert({ user_id: testUserId, title: '__diag_test__', status: 'draft' });

        if (insertErr) {
            results.db_resumes_write = {
                canWrite: false,
                error: insertErr.message,
                code: insertErr.code,
                hint: insertErr.hint,
                details: insertErr.details,
            };
        } else {
            // Clean up test row
            await supabase.from('resumes').delete().eq('title', '__diag_test__');
            results.db_resumes_write = { canWrite: true };
        }

        // Try upsert into users table (tests service_role write access)
        const { error: upsertErr } = await supabase
            .from('users')
            .upsert(
                { id: testUserId, email: 'diag-test@example.com', full_name: '__diag_test__' },
                { onConflict: 'id' }
            );
        if (upsertErr) {
            results.db_users_write = {
                canWrite: false,
                error: upsertErr.message,
                code: upsertErr.code,
                hint: upsertErr.hint,
                details: upsertErr.details,
            };
        } else {
            await supabase.from('users').delete().eq('email', 'diag-test@example.com');
            results.db_users_write = { canWrite: true };
        }

        // List actual resumes
        const { data: allResumes, error: listErr } = await supabase
            .from('resumes')
            .select('id, user_id, title, status, created_at, version')
            .order('created_at', { ascending: false })
            .limit(5);
        results.recent_resumes = listErr ? { error: listErr.message } : allResumes;

        // List recent subscriptions
        const { data: allSubs, error: subListErr } = await supabase
            .from('subscriptions')
            .select('id, user_id, status, stripe_subscription_id, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        results.recent_subscriptions = subListErr ? { error: subListErr.message } : allSubs;

        // List recent debug logs
        const { data: debugLogs, error: logErr } = await supabase
            .from('debug_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        results.debug_logs = logErr ? { error: logErr.message } : debugLogs;

    } catch (dbError) {
        results.db_error = (dbError as Error).message;
    }

    // 4. Check if email module would crash on import
    try {
        await import('@/lib/email');
        results.email_module = { canImport: true };
    } catch (emailErr) {
        results.email_module = {
            canImport: false,
            error: (emailErr as Error).message,
        };
    }

    return NextResponse.json(results, { status: 200 });
}

export const runtime = 'nodejs';
