import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { verifyWebhookSignature } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { logger, paymentLogger } from '@/lib/logger';

// Type definition for resume object from Supabase
interface ResumeRecord {
    id: string;
    user_id: string;
    title: string;
    status: string;
    shareable_link: string | null;
    pdf_url: string | null;
    version?: number;
    stripe_session_id?: string | null;
}

export async function POST(request: NextRequest) {
    try {
        // Log webhook attempt for debugging
        const requestUrl = request.url || 'unknown';
        paymentLogger.info('Webhook endpoint hit', { url: requestUrl });
        
        // Get the raw body
        const body = await request.text();
        const headersList = await headers();
        const signature = headersList.get('stripe-signature');

        if (!signature) {
            paymentLogger.error('Missing Stripe signature header', {
                url: requestUrl,
                headers: Object.fromEntries(headersList.entries()),
            });
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
                const productType = session.metadata?.product_type;

                if (!userId) {
                    paymentLogger.error('Missing userId in session metadata', {
                        sessionId: session.id,
                    });
                    break;
                }

                try {
                    const supabase = createAdminClient();

                    // Handle roadmap access payment
                    if (productType === 'roadmap_access') {
                        paymentLogger.info('Processing roadmap access payment', {
                            userId,
                            sessionId: session.id,
                            amount: session.amount_total,
                        });

                        // Create or update user_payments record
                        const { error: paymentError } = await supabase
                            .from('user_payments')
                            .upsert({
                                user_id: userId,
                                has_paid: true,
                                payment_amount: (session.amount_total || 0) / 100, // Convert cents to dollars
                                stripe_payment_intent_id: session.payment_intent as string,
                                paid_at: new Date().toISOString(),
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any, {
                                onConflict: 'user_id',
                            });

                        if (paymentError) {
                            paymentLogger.error('Failed to update payment record', {
                                error: paymentError,
                                userId,
                                sessionId: session.id,
                            });
                        } else {
                            paymentLogger.info('Roadmap access granted successfully', {
                                userId,
                                sessionId: session.id,
                            });
                        }

                        break;
                    }

                    // Handle resume payment (existing logic)
                    // Get resume ID from metadata
                    const resumeId = session.metadata?.resumeId;

                    // Fetch user's profile to get full_name (not from users table)
                    const { data: profile, error: profileError } = await supabase
                        .from('profile')
                        .select('full_name')
                        .eq('user_id', userId)
                        .single();

                    // Fetch user's email from auth.users table
                    const { data: authUser } = await supabase
                        .from('users')
                        .select('email')
                        .eq('id', userId)
                        .single();

                    if (profileError) {
                        paymentLogger.error('Failed to fetch user profile', {
                            error: profileError,
                            userId,
                            sessionId: session.id,
                        });
                    }

                    // Use profile full_name first, then email, then fallback
                    const userName = (profile as { full_name?: string } | null)?.full_name || 
                                   (authUser as { email?: string } | null)?.email?.split('@')[0] || 
                                   'My';

                    // CRITICAL FIX: Update ALL locked resumes to paid when payment succeeds
                    // Payment is a user-level entitlement (lifetime access), not per-resume
                    const updateData: { status: string } = { status: 'paid' };
                    const { error: updateAllResumesError } = await supabase
                        .from('resumes')
                        // @ts-expect-error - Supabase type inference issue with admin client
                        .update(updateData)
                        .eq('user_id', userId)
                        .eq('status', 'locked');

                    if (updateAllResumesError) {
                        paymentLogger.error('Failed to update all locked resumes', {
                            error: updateAllResumesError,
                            userId,
                            sessionId: session.id,
                        });
                    } else {
                        paymentLogger.info('Updated all locked resumes to paid status', {
                            userId,
                            sessionId: session.id,
                        });
                    }

                    let resume;

                    if (resumeId && resumeId !== 'new-resume') {
                        // Update the specific resume that was paid for
                        // Also update title if it was using email (fix existing resumes)
                        const resumeUpdateData: { status: string; stripe_session_id: string; title?: string } = {
                            status: 'paid',
                            stripe_session_id: session.id,
                        };
                        if (userName !== 'My') {
                            resumeUpdateData.title = `${userName} Resume`;
                        }
                        const { data: updatedResume, error: updateError } = await supabase
                            .from('resumes')
                            // @ts-expect-error - Supabase type inference issue with admin client
                            .update(resumeUpdateData)
                            .eq('id', resumeId)
                            .eq('user_id', userId)
                            .select()
                            .single();

                        if (updateError) {
                            paymentLogger.error('Failed to update resume record', {
                                error: updateError,
                                userId,
                                resumeId,
                                sessionId: session.id,
                            });
                            break;
                        }
                        resume = updatedResume as ResumeRecord;
                    } else {
                        // Create new resume record (fallback if resumeId not provided)
                        const shareableLink = crypto.randomUUID();

                        // Calculate next version number
                        const { data: existingResumes } = await supabase
                            .from('resumes')
                            .select('version')
                            .eq('user_id', userId)
                            .order('version', { ascending: false })
                            .limit(1);

                        const nextVersion = existingResumes && existingResumes.length > 0
                            ? ((existingResumes[0] as { version?: number })?.version || 0) + 1
                            : 1;

                        const insertData = {
                            user_id: userId,
                            title: `${userName} Resume`,
                            status: 'paid',
                            shareable_link: shareableLink,
                            stripe_session_id: session.id,
                            version: nextVersion,
                            linkedin_content: null,
                            pdf_url: null,
                        };
                        const { data: newResume, error: resumeError } = await supabase
                            .from('resumes')
                            // @ts-expect-error - Supabase type inference issue with admin client
                            .insert(insertData)
                            .select()
                            .single();

                        if (resumeError) {
                            paymentLogger.error('Failed to create resume record', {
                                error: resumeError,
                                userId,
                                sessionId: session.id,
                            });
                            break;
                        }
                        resume = newResume as ResumeRecord;
                    }

                    if (resume) {
                        paymentLogger.info('Resume record updated/created successfully', {
                            userId,
                            resumeId: resume?.id || '',
                            sessionId: session.id,
                            shareableLink: resume?.shareable_link || null,
                        });

                        // Trigger PDF generation
                        paymentLogger.info('Starting PDF generation', {
                            userId,
                            resumeId: resume?.id || '',
                        });

                        try {
                            // Import PDF generator dynamically to avoid edge runtime issues
                            const { generateAndUploadResumePDF } = await import('@/lib/pdf/generator');

                            const { pdfUrl, error: pdfError } = await generateAndUploadResumePDF(userId);

                            if (pdfError) {
                                paymentLogger.error('PDF generation failed', {
                                    error: pdfError,
                                    userId,
                                    resumeId: resume?.id || '',
                                });
                            } else if (pdfUrl) {
                                // Update resume with PDF URL
                                const pdfUpdateData = { pdf_url: pdfUrl };
                                const { error: updateError } = await supabase
                                    .from('resumes')
                                    // @ts-expect-error - Supabase type inference issue with admin client
                                    .update(pdfUpdateData)
                                    .eq('id', resume?.id || '');

                                if (updateError) {
                                    paymentLogger.error('Failed to update resume with PDF URL', {
                                        error: updateError,
                                        resumeId: resume?.id || '',
                                    });
                                } else {
                                    paymentLogger.info('PDF generated and uploaded successfully', {
                                        userId,
                                        resumeId: resume?.id || '',
                                        pdfUrl,
                                    });
                                }
                            }
                        } catch (pdfGenError) {
                            paymentLogger.error('PDF generation error', {
                                error: pdfGenError,
                                userId,
                                resumeId: resume?.id || '',
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
