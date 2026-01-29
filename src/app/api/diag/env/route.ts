import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
    let supabaseHost: string | null = null;
    try {
        supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : null;
    } catch {
        supabaseHost = supabaseUrl;
    }

    return NextResponse.json({
        vercel: {
            gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
            gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
            env: process.env.VERCEL_ENV || null,
        },
        supabase: {
            urlHost: supabaseHost,
        },
        stripe: {
            webhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
        },
    });
}

