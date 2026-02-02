'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface RoadmapDetail {
    id: string;
    user_id: string;
    career_name: string;
    roadmap_data: Record<string, unknown>;
    infographic_url: string | null;
    milestone_roadmap_url: string | null;
    created_at: string;
    updated_at: string;
    users?: { id: string; email: string; full_name: string | null };
}

export default function AdminRoadmapDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [data, setData] = useState<RoadmapDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/admin/roadmaps/${id}`);
                if (!res.ok) {
                    setError(res.status === 404 ? 'Roadmap not found' : 'Failed to load roadmap');
                    return;
                }
                const json = await res.json();
                setData(json);
            } catch {
                setError('Failed to load roadmap');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleDelete = async () => {
        if (!id || !confirm('Delete this roadmap? This cannot be undone.')) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/roadmaps/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err.error || 'Failed to delete roadmap');
            } else {
                router.push('/admin/roadmaps');
            }
        } catch {
            setError('Failed to delete roadmap');
        } finally {
            setDeleting(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[40vh]">
                {loading ? <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /> : <p className="text-gray-500">{error || 'Roadmap not found'}</p>}
            </div>
        );
    }

    const user = data.users as { id: string; email: string; full_name: string | null } | undefined;

    return (
        <div className="p-8">
            <div className="mb-6">
                <Link href="/admin/roadmaps" className="text-blue-600 hover:underline text-sm font-medium">← Roadmaps</Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{data.career_name}</h1>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <ul className="space-y-2 text-sm text-gray-600">
                    <li>ID: <code className="text-gray-800">{data.id}</code></li>
                    <li>Created: {new Date(data.created_at).toLocaleString()}</li>
                    <li>User: {user?.email ?? data.user_id} {user?.full_name && `(${user.full_name})`}</li>
                    {data.infographic_url && <li><a href={data.infographic_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Infographic</a></li>}
                    {data.milestone_roadmap_url && <li><a href={data.milestone_roadmap_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Milestone roadmap</a></li>}
                </ul>
                <div className="mt-6 flex gap-2">
                    <Link href={`/admin/users/${data.user_id}`} className="text-blue-600 hover:underline text-sm font-medium">View user</Link>
                    <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {deleting ? 'Deleting...' : 'Delete roadmap'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-2">Roadmap data (JSON)</h2>
                <pre className="text-xs text-gray-700 overflow-auto max-h-96 p-4 bg-gray-50 rounded-lg">
                    {JSON.stringify(data.roadmap_data, null, 2)}
                </pre>
            </div>
        </div>
    );
}
