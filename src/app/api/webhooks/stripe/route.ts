import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { verifyWebhookSignature } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { logger, paymentLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        // Get the raw body
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            paymentLogger.error('Missing Stripe signature header');
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // Verify webhook signature
        const event = verifyWebhookSignature(body, signature);

        if (!event) {
            paymentLogger.error('Invalid webhook signature');
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            );
        }

        paymentLogger.info('Webhook received', {
            type: event.type,
            id: event.id,
        });

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                paymentLogger.info('Checkout session completed', {
                    sessionId: session.id,
                    customerId: session.customer,
                    amount: session.amount_total,
                });

                // Extract metadata
                const userId = session.metadata?.userId;

                if (!userId) {
                    paymentLogger.error('Missing userId in session metadata', {
                        sessionId: session.id,
                    });
                    break;
                }

                try {
                    const supabase = createAdminClient();

                    // Fetch user's profile data
                    const { data: profile, error: profileError } = await supabase
                        .from('profile')
                        .select('*')
                        .eq('user_id', userId)
                        .single();

                    if (profileError) {
                        paymentLogger.error('Failed to fetch user profile', {
                            error: profileError,
                            userId,
                            sessionId: session.id,
                        });
                        break;
                    }

                    // Fetch user's basic info
                    const { data: user, error: userError } = await supabase
                        .from('users')
                        .select('full_name, email')
                        .eq('id', userId)
                        .single();

                    if (userError) {
                        paymentLogger.error('Failed to fetch user info', {
                            error: userError,
                            userId,
                            sessionId: session.id,
                        });
                    }

                    // Generate unique shareable link
                    const shareableLink = crypto.randomUUID();

                    // Calculate next version number (restarts from 1 if all resumes deleted)
                    const { data: existingResumes } = await supabase
                        .from('resumes')
                        .select('version')
                        .eq('user_id', userId)
                        .order('version', { ascending: false })
                        .limit(1);

                    const nextVersion = existingResumes && existingResumes.length > 0
                        ? (existingResumes[0].version || 0) + 1
                        : 1;

                    // Create resume record with status 'paid'
                    const { data: resume, error: resumeError } = await supabase
                        .from('resumes')
                        .insert({
                            user_id: userId,
                            title: `${user?.full_name || 'My'} Resume`,
                            status: 'paid',
                            shareable_link: shareableLink,
                            stripe_session_id: session.id,
                            version: nextVersion,
                            linkedin_content: null, // Will be generated later
                            pdf_url: null, // Will be generated later
                        })
                        .select()
                        .single();

                    if (resumeError) {
                        paymentLogger.error('Failed to create resume record', {
                            error: resumeError,
                            userId,
                            sessionId: session.id,
                        });
                    } else {
                        paymentLogger.info('Resume record created successfully', {
                            userId,
                            resumeId: resume.id,
                            sessionId: session.id,
                            shareableLink,
                        });

                        // Trigger PDF generation
                        paymentLogger.info('Starting PDF generation', {
                            userId,
                            resumeId: resume.id,
                        });

                        try {
                            // Import PDF generator dynamically to avoid edge runtime issues
                            const { generateAndUploadResumePDF } = await import('@/lib/pdf/generator');

                            const { pdfUrl, error: pdfError } = await generateAndUploadResumePDF(userId);

                            if (pdfError) {
                                paymentLogger.error('PDF generation failed', {
                                    error: pdfError,
                                    userId,
                                    resumeId: resume.id,
                                });
                            } else if (pdfUrl) {
                                // Update resume with PDF URL
                                const { error: updateError } = await supabase
                                    .from('resumes')
                                    .update({ pdf_url: pdfUrl })
                                    .eq('id', resume.id);

                                if (updateError) {
                                    paymentLogger.error('Failed to update resume with PDF URL', {
                                        error: updateError,
                                        resumeId: resume.id,
                                    });
                                } else {
                                    paymentLogger.info('PDF generated and uploaded successfully', {
                                        userId,
                                        resumeId: resume.id,
                                        pdfUrl,
                                    });
                                }
                            }
                        } catch (pdfGenError) {
                            paymentLogger.error('PDF generation error', {
                                error: pdfGenError,
                                userId,
                                resumeId: resume.id,
                            });
                        }
                    }

                } catch (error) {
                    paymentLogger.error('Error processing payment', {
                        error: error as Error,
                        userId,
                        sessionId: session.id,
                    });
                }

                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object as Stripe.Checkout.Session;

                paymentLogger.info('Checkout session expired', {
                    sessionId: session.id,
                });

                // Optionally update resume status to expired
                break;
            }

            default:
                logger.info('Webhook', `Unhandled event type: ${event.type}`, {
                    eventId: event.id,
                });
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        logger.error('Webhook Handler', error as Error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

// Disable body parsing for webhook
export const config = {
    api: {
        bodyParser: false,
    },
};
