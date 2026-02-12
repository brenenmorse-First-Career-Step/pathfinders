import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { WelcomeEmailTemplate } from '@/components/emails/templates';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const { email, fullName } = await request.json();

        if (!email || !fullName) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await sendEmail({
            to: email,
            subject: 'Welcome to First Career Steps!',
            html: WelcomeEmailTemplate(fullName),
        });

        if (!result.success) {
            throw result.error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Email', error as Error, { message: 'Failed to send welcome email via API' });
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
