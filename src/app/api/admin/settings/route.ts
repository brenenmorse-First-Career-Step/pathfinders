import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resendConfigured = !!process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? '';
    const fromName = process.env.RESEND_FROM_NAME ?? '';

    return NextResponse.json({
        email: {
            resendConfigured,
            fromEmail,
            fromName,
            emailVerificationEnabled: process.env.EMAIL_VERIFICATION_ENABLED !== 'false',
            emailInvoiceEnabled: process.env.EMAIL_INVOICE_ENABLED !== 'false',
            emailBanEnabled: process.env.EMAIL_BAN_ENABLED !== 'false',
            emailDeleteEnabled: process.env.EMAIL_DELETE_ENABLED !== 'false',
        },
    });
}

export async function PATCH(request: NextRequest) {
    const admin = await getAdminUser();
    if (!admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await request.json().catch(() => ({}));
    // For v1 we only read from env; toggles could be stored in DB (admin_settings) later
    return NextResponse.json({
        message: 'Settings are read from environment. To change email config, set RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME and optional EMAIL_*_ENABLED in your deployment.',
        email: {
            resendConfigured: !!process.env.RESEND_API_KEY,
            fromEmail: process.env.RESEND_FROM_EMAIL ?? '',
            fromName: process.env.RESEND_FROM_NAME ?? '',
            emailVerificationEnabled: process.env.EMAIL_VERIFICATION_ENABLED !== 'false',
            emailInvoiceEnabled: process.env.EMAIL_INVOICE_ENABLED !== 'false',
            emailBanEnabled: process.env.EMAIL_BAN_ENABLED !== 'false',
            emailDeleteEnabled: process.env.EMAIL_DELETE_ENABLED !== 'false',
        },
    });
}
