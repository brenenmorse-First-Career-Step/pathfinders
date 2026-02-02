'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Analytics {
    totalUsers: number;
    newSignups7d: number;
    blockedCount: number;
    totalResumes: number;
    totalRoadmaps: number;
    activeSubscriptions: number;
    totalRevenue: number;
    paymentsSuccess: number;
    paymentsFailed: number;
    recentPayments: { id: string; email: string; amount: number; status: string; created_at: string }[];
    recentSignups: { id: string; email: string; full_name: string | null; date_created: string }[];
}

export default function AdminDashboardPage() {
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/admin/analytics');
                if (!res.ok) {
                    setError(res.status === 403 ? 'Forbidden' : 'Failed to load analytics');
                    return;
                }
                const json = await res.json();
                setData(json);
            } catch {
                setError('Failed to load analytics');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[40vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8">
                <p className="text-red-600">{error || 'No data'}</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total users</p>
                    <p className="text-2xl font-bold text-gray-900">{data.totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">New signups (7d)</p>
                    <p className="text-2xl font-bold text-gray-900">{data.newSignups7d}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Blocked users</p>
                    <p className="text-2xl font-bold text-gray-900">{data.blockedCount}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Active subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{data.activeSubscriptions}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500 mb-2">Content</p>
                    <p className="text-lg font-semibold text-gray-900">Resumes: {data.totalResumes}</p>
                    <p className="text-lg font-semibold text-gray-900">Roadmaps: {data.totalRoadmaps}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-500 mb-2">Payments</p>
                    <p className="text-lg font-semibold text-gray-900">Total revenue: ${(data.totalRevenue / 100).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Successful: {data.paymentsSuccess} · Failed: {data.paymentsFailed}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-900">Recent signups</h2>
                        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">View all</Link>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {data.recentSignups.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-gray-500">No signups yet</li>
                        ) : (
                            data.recentSignups.slice(0, 5).map((u) => (
                                <li key={u.id} className="px-4 py-3 flex justify-between text-sm">
                                    <span className="text-gray-900 truncate">{u.email}</span>
                                    <span className="text-gray-500 shrink-0 ml-2">{new Date(u.date_created).toLocaleDateString()}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-900">Recent payments</h2>
                        <Link href="/admin/payments" className="text-sm text-blue-600 hover:underline">View all</Link>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {data.recentPayments.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-gray-500">No payments yet</li>
                        ) : (
                            data.recentPayments.slice(0, 5).map((p) => (
                                <li key={p.id} className="px-4 py-3 flex justify-between items-center text-sm">
                                    <span className="text-gray-900 truncate">{p.email}</span>
                                    <span className="shrink-0 ml-2 font-medium">${(p.amount / 100).toFixed(2)}</span>
                                    <span className={`shrink-0 ml-2 px-2 py-0.5 rounded text-xs ${p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                        {p.status}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
