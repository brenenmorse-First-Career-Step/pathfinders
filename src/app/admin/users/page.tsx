'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserRow {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    blocked_at: string | null;
    date_created: string;
    resumesCount: number;
    roadmapsCount: number;
    subscriptionStatus: string | null;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
            if (search) params.set('search', search);
            const res = await fetch(`/api/admin/users?${params}`);
            if (!res.ok) {
                setError(res.status === 403 ? 'Forbidden' : 'Failed to load users');
                return;
            }
            const data = await res.json();
            setUsers(data.users ?? []);
            setTotal(data.total ?? 0);
        } catch {
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by email or name..."
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-md"
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Search
                </button>
            </form>

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
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resumes</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roadmaps</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{u.email}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{u.full_name ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.blocked_at ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Blocked</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{u.resumesCount}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{u.roadmapsCount}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{u.subscriptionStatus ?? '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.date_created).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/admin/users/${u.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && !loading && (
                        <p className="px-4 py-8 text-center text-gray-500">No users found.</p>
                    )}
                    {total > perPage && (
                        <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                            <p className="text-sm text-gray-600">Total: {total}</p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page * perPage >= total}
                                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
