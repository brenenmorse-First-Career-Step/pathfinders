
import { Resend } from 'resend';
import { logger } from '@/lib/logger';

let resend: Resend | null = null;

const getResend = () => {
    if (!resend) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not defined');
        }
        resend = new Resend(apiKey);
    }
    return resend;
};

interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
}

export const sendEmail = async (payload: EmailPayload) => {
    const { to, subject, html } = payload;

    try {
        const resendInstance = getResend();
        const data = await resendInstance.emails.send({
            from: 'First Career Steps <onboarding@resend.dev>', // Update this with your verified domain
            to,
            subject,
            html,
        });

        logger.info('Email', 'Email sent successfully', { messageId: data.error ? null : data.data?.id, to });
        return { success: true, data };
    } catch (error) {
        logger.error('Email', 'Failed to send email', { to, error: error as Error });
        return { success: false, error };
    }
};
