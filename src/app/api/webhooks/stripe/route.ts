import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { verifyWebhookSignature } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { logger, paymentLogger } from '@/lib/logger';

// Helper function to create resume for subscription
async function createResumeForSubscription(
    supabase: ReturnType<typeof createAdminClient>,
    userId: string,
    subscriptionId: string
) {
    try {
        // Fetch user's basic info
        const { data: user } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', userId)
            .single();

        // Generate unique shareable link
        const shareableLink = crypto.randomUUID();

        // Calculate next version number
        const { data: existingResumes } = await supabase
            .from('resumes')
            .select('version')
            .eq('user_id', userId)
            .order('version', { ascending: false })
            .limit(1);

        const nextVersion = existingResumes && existingResumes.length > 0
            ? (existingResumes[0].version || 0) + 1
            : 1;

        // Create resume record
        const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .insert({
                user_id: userId,
                title: `${user?.full_name || 'My'} Resume`,
                status: 'paid',
                shareable_link: shareableLink,
                stripe_session_id: null,
                version: nextVersion,
                linkedin_content: null,
                pdf_url: null,
            })
            .select()
            .single();

        if (resumeError) {
            paymentLogger.error('Failed to create resume for subscription', {
                error: resumeError,
                userId,
                subscriptionId,
            });
            return { success: false, error: resumeError };
        }

        paymentLogger.info('Resume created for subscription', {
            userId,
            resumeId: resume.id,
            subscriptionId,
        });

        // Trigger PDF generation
        try {
            const { generateAndUploadResumePDF } = await import('@/lib/pdf/generator');
            const { pdfUrl, error: pdfError } = await generateAndUploadResumePDF(userId);
            
            if (pdfError) {
                paymentLogger.error('PDF generation failed', {
                    error: pdfError,
                    userId,
                    resumeId: resume.id,
                });
            } else if (pdfUrl) {
                await supabase
                    .from('resumes')
                    .update({ pdf_url: pdfUrl })
                    .eq('id', resume.id);
                
                paymentLogger.info('PDF generated and uploaded successfully', {
                    userId,
                    resumeId: resume.id,
                    pdfUrl,
                });
            }
        } catch (pdfGenError) {
            paymentLogger.error('PDF generation error', {
                error: pdfGenError,
                resumeId: resume.id,
            });
        }

        return { success: true, resumeId: resume.id };
    } catch (error) {
        paymentLogger.error('Error in createResumeForSubscription', {
            error: error as Error,
            userId,
            subscriptionId,
        });
        return { success: false, error };
    }
}

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
            paymentLogger.error('Invalid webhook signature', {
                hasSignature: !!signature,
                hasBody: !!body,
                bodyLength: body?.length,
                webhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
            });
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
                    mode: session.mode,
                    subscriptionId: session.subscription,
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

                    // If this is a subscription checkout, create subscription record immediately
                    // This ensures subscription is created even if customer.subscription.created doesn't fire
                    if (session.mode === 'subscription' && session.subscription) {
                        paymentLogger.info('Subscription checkout completed, creating subscription record', {
                            sessionId: session.id,
                            subscriptionId: session.subscription,
                            userId,
                        });
                        
                        try {
                            const stripe = (await import('@/lib/stripe')).getStripe();
                            const subscriptionObj = await stripe.subscriptions.retrieve(session.subscription as string);
                            
                            const subData = subscriptionObj as unknown as Stripe.Subscription & {
                                current_period_start: number;
                                current_period_end: number;
                                cancel_at_period_end: boolean | null;
                            };
                            
                            const customerId = typeof subData.customer === 'string' 
                                ? subData.customer 
                                : subData.customer.id;

                            // Ensure user exists in public.users (FK for subscriptions/resumes) – new signups may only be in auth.users
                            const customer = await stripe.customers.retrieve(customerId);
                            if (!customer.deleted && 'email' in customer && customer.email) {
                                const { error: userUpsertError } = await supabase
                                    .from('users')
                                    .upsert(
                                        {
                                            id: userId,
                                            email: customer.email,
                                            full_name: (customer as { name?: string }).name ?? null,
                                        },
                                        { onConflict: 'id' }
                                    );
                                if (userUpsertError) {
                                    paymentLogger.error('Failed to ensure user in public.users', {
                                        error: userUpsertError,
                                        userId,
                                    });
                                }
                            }

                            // Create subscription record
                            const { error: subError } = await supabase
                                .from('subscriptions')
                                .upsert({
                                    user_id: userId,
                                    stripe_subscription_id: subData.id,
                                    stripe_customer_id: customerId,
                                    status: subData.status,
                                    current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
                                    current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
                                    cancel_at_period_end: subData.cancel_at_period_end || false,
                                    updated_at: new Date().toISOString(),
                                }, {
                                    onConflict: 'stripe_subscription_id',
                                });

                            if (subError) {
                                paymentLogger.error('Failed to create subscription record in checkout.session.completed', {
                                    error: subError,
                                    userId,
                                    subscriptionId: subscriptionObj.id,
                                });
                            } else {
                                paymentLogger.info('Subscription record created successfully in checkout.session.completed', {
                                    userId,
                                    subscriptionId: subscriptionObj.id,
                                    status: subscriptionObj.status,
                                });
                            }
                            
                            // Create first resume when subscription is active or trialing (new paid user)
                            const statusOk = subscriptionObj.status === 'active' || subscriptionObj.status === 'trialing';
                            if (statusOk) {
                                const { data: existingResume } = await supabase
                                    .from('resumes')
                                    .select('id')
                                    .eq('user_id', userId)
                                    .order('created_at', { ascending: false })
                                    .limit(1);

                                if (!existingResume || existingResume.length === 0) {
                                    const result = await createResumeForSubscription(supabase, userId, subscriptionObj.id);
                                    if (!result.success) {
                                        paymentLogger.error('createResumeForSubscription failed in checkout.session.completed', {
                                            userId,
                                            subscriptionId: subscriptionObj.id,
                                            error: result.error,
                                        });
                                    }
                                } else {
                                    paymentLogger.info('Resume already exists, skipping creation', {
                                        userId,
                                        resumeId: existingResume[0].id,
                                    });
                                }
                            } else {
                                paymentLogger.info('Subscription status not active/trialing yet, will try fallback', {
                                    userId,
                                    status: subscriptionObj.status,
                                });
                            }

                            // Fallback: if we still have no resume for this user (e.g. status was incomplete), create one
                            const { data: resumeCheck } = await supabase
                                .from('resumes')
                                .select('id')
                                .eq('user_id', userId)
                                .limit(1);
                            if (!resumeCheck || resumeCheck.length === 0) {
                                paymentLogger.info('Fallback: creating first resume for user after subscription checkout', {
                                    userId,
                                    subscriptionId: session.subscription,
                                });
                                await createResumeForSubscription(
                                    supabase,
                                    userId,
                                    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? ''
                                );
                            }
                        } catch (subError) {
                            paymentLogger.error('Error processing subscription checkout', {
                                error: subError,
                                userId,
                                sessionId: session.id,
                            });
                            // Fallback: try to create resume anyway so new paid user gets one
                            try {
                                const { data: resumeCheck } = await supabase
                                    .from('resumes')
                                    .select('id')
                                    .eq('user_id', userId)
                                    .limit(1);
                                if (!resumeCheck || resumeCheck.length === 0) {
                                    await createResumeForSubscription(
                                        supabase,
                                        userId,
                                        typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? ''
                                    );
                                }
                            } catch (fallbackErr) {
                                paymentLogger.error('Fallback resume creation failed', {
                                    error: fallbackErr,
                                    userId,
                                });
                            }
                        }
                        break;
                    }

                    // Legacy one-time payment handling (for backward compatibility)
                    // Verify profile exists (but don't need to use the data)
                    const { error: profileError } = await supabase
                        .from('profile')
                        .select('id')
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

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;

                paymentLogger.info('Subscription event', {
                    eventType: event.type,
                    subscriptionId: subscription.id,
                    customerId: subscription.customer,
                    status: subscription.status,
                });

                try {
                    const supabase = createAdminClient();

                    // Get customer to find userId
                    const stripe = (await import('@/lib/stripe')).getStripe();
                    const customer = await stripe.customers.retrieve(subscription.customer as string);

                    if (customer.deleted || !('metadata' in customer)) {
                        paymentLogger.error('Customer not found or deleted', {
                            customerId: subscription.customer,
                        });
                        break;
                    }

                    const userId = customer.metadata?.userId || subscription.metadata?.userId;

                    if (!userId) {
                        paymentLogger.error('Missing userId in customer or subscription metadata', {
                            subscriptionId: subscription.id,
                            customerId: subscription.customer,
                        });
                        break;
                    }

                    // Ensure user exists in public.users (FK for subscriptions/resumes)
                    if (!customer.deleted && 'email' in customer && customer.email) {
                        const { error: userUpsertError } = await supabase
                            .from('users')
                            .upsert(
                                {
                                    id: userId,
                                    email: customer.email,
                                    full_name: (customer as { name?: string }).name ?? null,
                                },
                                { onConflict: 'id' }
                            );
                        if (userUpsertError) {
                            paymentLogger.error('Failed to ensure user in public.users (subscription event)', {
                                error: userUpsertError,
                                userId,
                            });
                        }
                    }

                    // Upsert subscription record
                    // Use subscription object directly from event (it has all properties)
                    // Type assertion needed because Stripe types may not expose all properties
                    const subData = subscription as Stripe.Subscription & {
                        current_period_start: number;
                        current_period_end: number;
                        cancel_at_period_end: boolean | null;
                    };
                    
                    const customerId = typeof subData.customer === 'string' 
                        ? subData.customer 
                        : subData.customer.id;
                    
                    const { error: subError } = await supabase
                        .from('subscriptions')
                        .upsert({
                            user_id: userId,
                            stripe_subscription_id: subData.id,
                            stripe_customer_id: customerId,
                            status: subData.status,
                            current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
                            cancel_at_period_end: subData.cancel_at_period_end || false,
                            updated_at: new Date().toISOString(),
                        }, {
                            onConflict: 'stripe_subscription_id',
                        });

                    if (subError) {
                        paymentLogger.error('Failed to upsert subscription', {
                            error: subError,
                            userId,
                            subscriptionId: subscription.id,
                        });
                    } else {
                        paymentLogger.info('Subscription record updated successfully', {
                            userId,
                            subscriptionId: subscription.id,
                            status: subscription.status,
                        });

                        // If subscription is newly created and active/trialing, create first resume
                        if (event.type === 'customer.subscription.created' && (subscription.status === 'active' || subscription.status === 'trialing')) {
                            // Check if resume already exists (in case checkout.session.completed already created it)
                            const { data: existingResume } = await supabase
                                .from('resumes')
                                .select('id')
                                .eq('user_id', userId)
                                .order('created_at', { ascending: false })
                                .limit(1);
                            
                            // Only create if no resume exists
                            if (!existingResume || existingResume.length === 0) {
                                await createResumeForSubscription(supabase, userId, subscription.id);
                            } else {
                                paymentLogger.info('Resume already exists from checkout.session.completed', {
                                    userId,
                                    resumeId: existingResume[0].id,
                                    subscriptionId: subscription.id,
                                });
                            }
                        }
                    }
                } catch (error) {
                    paymentLogger.error('Error processing subscription', {
                        error: error as Error,
                        subscriptionId: subscription.id,
                    });
                }

                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                paymentLogger.info('Subscription deleted', {
                    subscriptionId: subscription.id,
                    customerId: subscription.customer,
                });

                try {
                    const supabase = createAdminClient();

                    // Update subscription status to canceled
                    const { error: updateError } = await supabase
                        .from('subscriptions')
                        .update({
                            status: 'canceled',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('stripe_subscription_id', subscription.id);

                    if (updateError) {
                        paymentLogger.error('Failed to update subscription status', {
                            error: updateError,
                            subscriptionId: subscription.id,
                        });
                    } else {
                        paymentLogger.info('Subscription marked as canceled', {
                            subscriptionId: subscription.id,
                        });
                    }
                } catch (error) {
                    paymentLogger.error('Error processing subscription deletion', {
                        error: error as Error,
                        subscriptionId: subscription.id,
                    });
                }

                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                // Type assertion for invoice properties that may not be in type definition
                const invoiceData = invoice as Stripe.Invoice & {
                    subscription?: string | Stripe.Subscription | null;
                    customer?: string | Stripe.Customer | null;
                };
                
                // Invoice.subscription can be a string ID or a Subscription object
                // Use type guards to safely access properties
                const subscriptionId = invoiceData.subscription 
                    ? (typeof invoiceData.subscription === 'string' 
                        ? invoiceData.subscription 
                        : (invoiceData.subscription as Stripe.Subscription)?.id)
                    : null;
                const customerId = invoiceData.customer
                    ? (typeof invoiceData.customer === 'string' 
                        ? invoiceData.customer 
                        : (invoiceData.customer as Stripe.Customer)?.id)
                    : null;

                paymentLogger.info('Invoice payment succeeded', {
                    invoiceId: invoice.id,
                    subscriptionId: subscriptionId,
                    customerId: customerId,
                });

                // Subscription renewals are handled automatically by Stripe
                // We just log this for tracking purposes
                if (subscriptionId) {
                    paymentLogger.info('Subscription renewal payment succeeded', {
                        invoiceId: invoice.id,
                        subscriptionId: subscriptionId,
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

// Configure route for webhook handling
// Note: In App Router, we handle raw body in the route itself
export const runtime = 'nodejs';
