import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout'; // 👈 IMPORT

const AdminJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: 'all', hidden: 'all' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hideModal, setHideModal] = useState({ open: false, job: null, reason: '' });

    useEffect(() => {
        fetchJobs();
    }, [filter, page]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/jobs', { params: { ...filter, page, limit: 20 } });
            setJobs(res.data.jobs);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHideToggle = async (job) => {
        if (job.is_hidden) {
            // Unhide directly
            if (window.confirm(`Unhide job: ${job.title}?`)) {
                try {
                    await api.patch(`/admin/jobs/${job.id}/hide`, { reason: 'Restored by admin' });
                    fetchJobs();
                } catch (error) {
                    alert('Failed to unhide job');
                }
            }
        } else {
            // Open modal for hide reason
            setHideModal({ open: true, job, reason: '' });
        }
    };

    const confirmHide = async () => {
        try {
            await api.patch(`/admin/jobs/${hideModal.job.id}/hide`, { reason: hideModal.reason });
            setHideModal({ open: false, job: null, reason: '' });
            fetchJobs();
        } catch (error) {
            alert('Failed to hide job');
        }
    };

    return (
        <AdminLayout 
            title="Job Management" 
            subtitle="Review and moderate job postings"
        >
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex gap-4">
                <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                </select>

                <select
                    value={filter.hidden}
                    onChange={(e) => setFilter({ ...filter, hidden: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="all">All Visibility</option>
                    <option value="false">Visible</option>
                    <option value="true">Hidden</option>
                </select>
            </div>

            {/* Job Cards */}
            <div className="space-y-4">
                {jobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {job.status}
                                    </span>
                                    {job.is_hidden && (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                            Hidden
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-600 mb-2">{job.company_name}</p>
                                <p className="text-sm text-gray-500 mb-3">{job.location} • {job.salary_range}</p>
                                <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                                {job.is_hidden && (
                                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                        <strong>Hidden Reason:</strong> {job.hidden_reason}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                                <Link
                                    to={`/jobs/${job.id}`}
                                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 text-center"
                                >
                                    View
                                </Link>
                                <button
                                    onClick={() => handleHideToggle(job)}
                                    className={`px-4 py-2 rounded-lg font-semibold ${
                                        job.is_hidden
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                >
                                    {job.is_hidden ? 'Unhide' : 'Hide'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center gap-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="px-4 py-2">Page {page} of {totalPages}</span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            {/* Hide Modal */}
            {hideModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Hide Job: {hideModal.job.title}</h3>
                        <textarea
                            value={hideModal.reason}
                            onChange={(e) => setHideModal({ ...hideModal, reason: e.target.value })}
                            placeholder="Reason for hiding..."
                            rows="4"
                            className="w-full px-3 py-2 border rounded-lg mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={confirmHide}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold"
                            >
                                Confirm Hide
                            </button>
                            <button
                                onClick={() => setHideModal({ open: false, job: null, reason: '' })}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminJobs;