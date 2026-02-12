
import { Resend } from 'resend';
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailPayload {
    to: string | string[];
    subject: string;
    html: string;
}

export const sendEmail = async (payload: EmailPayload) => {
    const { to, subject, html } = payload;

    try {
        const data = await resend.emails.send({
            from: 'First Career Steps <onboarding@resend.dev>', // Update this with your verified domain
            to,
            subject,
            html,
        });

        logger.info('Email sent successfully', { messageId: data.error ? null : data.data?.id, to });
        return { success: true, data };
    } catch (error) {
        logger.error('Failed to send email', error as Error, { to });
        return { success: false, error };
    }
};
