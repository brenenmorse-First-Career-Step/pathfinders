'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ResumeDetail {
    id: string;
    user_id: string;
    title: string;
    status: string;
    pdf_url: string | null;
    shareable_link: string | null;
    created_at: string;
    updated_at: string;
    users?: { id: string; email: string; full_name: string | null };
}

export default function AdminResumeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [data, setData] = useState<ResumeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const res = await fetch(`/api/admin/resumes/${id}`);
                if (!res.ok) {
                    setError(res.status === 404 ? 'Resume not found' : 'Failed to load resume');
                    return;
                }
                const json = await res.json();
                setData(json);
            } catch {
                setError('Failed to load resume');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleDelete = async () => {
        if (!id || !confirm('Delete this resume? This cannot be undone.')) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/resumes/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setError(err.error || 'Failed to delete resume');
            } else {
                router.push('/admin/resumes');
            }
        } catch {
            setError('Failed to delete resume');
        } finally {
            setDeleting(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[40vh]">
                {loading ? <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /> : <p className="text-gray-500">{error || 'Resume not found'}</p>}
            </div>
        );
    }

    const user = data.users as { id: string; email: string; full_name: string | null } | undefined;

    return (
        <div className="p-8">
            <div className="mb-6">
                <Link href="/admin/resumes" className="text-blue-600 hover:underline text-sm font-medium">← Resumes</Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{data.title}</h1>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <ul className="space-y-2 text-sm text-gray-600">
                    <li>ID: <code className="text-gray-800">{data.id}</code></li>
                    <li>Status: <span className="font-medium">{data.status}</span></li>
                    <li>Created: {new Date(data.created_at).toLocaleString()}</li>
                    <li>User: {user?.email ?? data.user_id} {user?.full_name && `(${user.full_name})`}</li>
                    {data.pdf_url && <li><a href={data.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">PDF</a></li>}
                    {data.shareable_link && <li>Share: <a href={`/resume/${data.shareable_link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View shared</a></li>}
                </ul>
                <div className="mt-6">
                    <Link href={`/admin/users/${data.user_id}`} className="text-blue-600 hover:underline text-sm font-medium mr-4">View user</Link>
                    <button type="button" onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {deleting ? 'Deleting...' : 'Delete resume'}
                    </button>
                </div>
            </div>
        </div>
    );
}
