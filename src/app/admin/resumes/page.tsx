'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ResumeRow {
    id: string;
    user_id: string;
    title: string;
    status: string;
    pdf_url: string | null;
    shareable_link: string | null;
    created_at: string;
    user_email: string | null;
    user_name: string | null;
}

export default function AdminResumesPage() {
    const [resumes, setResumes] = useState<ResumeRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const perPage = 20;
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError('');
            try {
                const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
                if (status) params.set('status', status);
                const res = await fetch(`/api/admin/resumes?${params}`);
                if (!res.ok) {
                    setError(res.status === 403 ? 'Forbidden' : 'Failed to load resumes');
                    return;
                }
                const data = await res.json();
                setResumes(data.resumes ?? []);
                setTotal(data.total ?? 0);
            } catch {
                setError('Failed to load resumes');
            } finally {
                setLoading(false);
            }
        })();
    }, [page, status]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Resumes</h1>

            <div className="flex gap-2 mb-6">
                <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="">All statuses</option>
                    <option value="draft">draft</option>
                    <option value="locked">locked</option>
                    <option value="paid">paid</option>
                </select>
            </div>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {resumes.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{r.title}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{r.user_email ?? r.user_id}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/admin/resumes/${r.id}`} className="text-blue-600 hover:underline text-sm font-medium">View</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {resumes.length === 0 && !loading && <p className="px-4 py-8 text-center text-gray-500">No resumes found.</p>}
                    {total > perPage && (
                        <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                            <p className="text-sm text-gray-600">Total: {total}</p>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">Previous</button>
                                <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page * perPage >= total} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
