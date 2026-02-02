'use client';

import { useState, useEffect } from 'react';

interface Settings {
    email: {
        resendConfigured: boolean;
        fromEmail: string;
        fromName: string;
        emailVerificationEnabled: boolean;
        emailInvoiceEnabled: boolean;
        emailBanEnabled: boolean;
        emailDeleteEnabled: boolean;
    };
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch('/api/admin/settings');
                if (!res.ok) {
                    setError(res.status === 403 ? 'Forbidden' : 'Failed to load settings');
                    return;
                }
                const json = await res.json();
                setSettings(json);
            } catch {
                setError('Failed to load settings');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading || !settings) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[40vh]">
                {loading ? <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /> : <p className="text-gray-500">{error || 'No settings'}</p>}
            </div>
        );
    }

    const { email } = settings;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
                <h2 className="font-semibold text-gray-900 mb-4">Email (Resend.com)</h2>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li>
                        <strong>Resend configured:</strong>{' '}
                        {email.resendConfigured ? (
                            <span className="text-green-600">Yes</span>
                        ) : (
                            <span className="text-amber-600">No — set RESEND_API_KEY in environment</span>
                        )}
                    </li>
                    <li><strong>From email:</strong> {email.fromEmail || '—'}</li>
                    <li><strong>From name:</strong> {email.fromName || '—'}</li>
                    <li><strong>Account verification emails:</strong> {email.emailVerificationEnabled ? 'On' : 'Off'}</li>
                    <li><strong>Payment invoice emails:</strong> {email.emailInvoiceEnabled ? 'On' : 'Off'}</li>
                    <li><strong>Account ban emails:</strong> {email.emailBanEnabled ? 'On' : 'Off'}</li>
                    <li><strong>Account delete emails:</strong> {email.emailDeleteEnabled ? 'On' : 'Off'}</li>
                </ul>
                <p className="mt-4 text-xs text-gray-500">
                    To change these, set RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME and optional EMAIL_VERIFICATION_ENABLED, EMAIL_INVOICE_ENABLED, EMAIL_BAN_ENABLED, EMAIL_DELETE_ENABLED in your deployment environment.
                </p>
            </div>
        </div>
    );
}
