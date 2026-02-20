'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserDetail {
    user: { id: string; email: string; full_name: string | null; role: string; blocked_at: string | null; date_created: string; linkedin_link: string | null };
    profile: Record<string, unknown> | null;
    resumes: { id: string; title: string; status: string; created_at: string }[];
    roadmaps: { id: string; career_name: string; created_at: string }[];
    subscription: { status: string } | null;
}

export default function AdminUserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [data, setData] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState('');
    const [editForm, setEditForm] = useState({ full_name: '', email: '', role: 'user', linkedin_link: '' });

    const fetchUser = async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/users/${id}`);
            if (!res.ok) {
                setError(res.status === 404 ? 'User not found' : 'Failed to load user');
                return;
            }
            const json = await res.json();
            setData(json);
            setEditForm({
                full_name: json.user?.full_name ?? '',
                email: json.user?.email ?? '',
                role: json.user?.role ?? 'user',
                linkedin_link: json.user?.linkedin_link ?? '',
            });
        } catch {
            setError('Failed to load user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err.error || 'Failed to update user');
                setSaving(false);
                return;
            }
            await fetchUser();
        } catch {
            setError('Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleBlock = async () => {
        if (!id || !confirm('Block this user? They will not be able to access the app.')) return;
        setActionLoading('block');
        try {
            const res = await fetch(`/api/admin/users/${id}/block`, { method: 'POST' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err.error || 'Failed to block user');
            } else {
                await fetchUser();
            }
        } catch {
            setError('Failed to block user');
        } finally {
            setActionLoading('');
        }
    };

    const handleUnblock = async () => {
        if (!id) return;
        setActionLoading('unblock');
        try {
            const res = await fetch(`/api/admin/users/${id}/unblock`, { method: 'POST' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err.error || 'Failed to unblock user');
            } else {
                await fetchUser();
            }
        } catch {
            setError('Failed to unblock user');
        } finally {
            setActionLoading('');
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('Permanently delete this user and all their data? This cannot be undone.')) return;
        setActionLoading('delete');
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err.error || 'Failed to delete user');
                setActionLoading('');
                return;
            }
            router.push('/admin/users');
        } catch {
            setError('Failed to delete user');
            setActionLoading('');
        }
    };

    if (loading || !data) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[40vh]">
                {loading ? <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /> : <p className="text-gray-500">{error || 'User not found'}</p>}
            </div>
        );
    }

    const { user, resumes, roadmaps, subscription } = data;

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/users" className="text-blue-600 hover:underline text-sm font-medium">← Users</Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">User: {user.email}</h1>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Edit user</h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                            <input
                                type="text"
                                value={editForm.full_name}
                                onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                value={editForm.role}
                                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn link</label>
                            <input
                                type="text"
                                value={editForm.linkedin_link}
                                onChange={(e) => setEditForm((f) => ({ ...f, linkedin_link: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </form>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Info</h2>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>ID: <code className="text-gray-800">{user.id}</code></li>
                        <li>Created: {new Date(user.date_created).toLocaleString()}</li>
                        <li>Blocked: {user.blocked_at ? new Date(user.blocked_at).toLocaleString() : 'No'}</li>
                        <li>Subscription: {subscription?.status ?? 'None'}</li>
                    </ul>
                    <div className="mt-6 flex flex-wrap gap-2">
                        {user.blocked_at ? (
                            <button
                                type="button"
                                onClick={handleUnblock}
                                disabled={!!actionLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {actionLoading === 'unblock' ? '...' : 'Unblock'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleBlock}
                                disabled={!!actionLoading}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                            >
                                {actionLoading === 'block' ? '...' : 'Block'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={!!actionLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {actionLoading === 'delete' ? '...' : 'Delete user'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <h2 className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900">Resumes ({resumes.length})</h2>
                    <ul className="divide-y divide-gray-200">
                        {resumes.length === 0 ? <li className="px-4 py-3 text-sm text-gray-500">None</li> : resumes.map((r) => (
                            <li key={r.id} className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-gray-900">{r.title}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{r.status}</span>
                                    <Link href={`/admin/resumes/${r.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <h2 className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900">Roadmaps ({roadmaps.length})</h2>
                    <ul className="divide-y divide-gray-200">
                        {roadmaps.length === 0 ? <li className="px-4 py-3 text-sm text-gray-500">None</li> : roadmaps.map((r) => (
                            <li key={r.id} className="px-4 py-3 flex justify-between items-center">
                                <span className="text-sm text-gray-900">{r.career_name}</span>
                                <Link href={`/admin/roadmaps/${r.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
