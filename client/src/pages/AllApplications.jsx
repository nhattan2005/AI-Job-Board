import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const AllApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchAllApplications();
    }, []);

    const fetchAllApplications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/employer/all-applications'); // ← ĐÚNG
            setApplications(response.data.applications);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setError('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const updateApplicationStatus = async (applicationId, newStatus) => {
        try {
            await api.patch(`/applications/${applicationId}/status`, { // ← ĐÚNG
                status: newStatus
            });
            fetchAllApplications();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleDownloadCV = async (applicationId) => {
        try {
            console.log(`📥 Downloading CV for application ${applicationId}`);
            
            const response = await api.get(`/applications/${applicationId}/download-cv`);
            
            const { url, filename } = response.data;
            
            console.log(`✅ CV URL received: ${url}`);
            
            // Mở trong tab mới
            window.open(url, '_blank');
            
        } catch (error) {
            console.error('❌ Download CV error:', error);
            alert('Failed to download CV. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'reviewed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'accepted':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getMatchScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 font-bold';
        if (score >= 60) return 'text-yellow-600 font-semibold';
        return 'text-red-600';
    };

    const filteredApplications = applications.filter(app => 
        filter === 'all' ? true : app.status === filter
    );

    const groupedApplications = filteredApplications.reduce((acc, app) => {
        const jobId = app.job_id;
        if (!acc[jobId]) {
            acc[jobId] = {
                job_title: app.job_title,
                job_location: app.job_location,
                applications: []
            };
        }
        acc[jobId].applications.push(app);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    to="/employer/dashboard"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center mb-4"
                >
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>

                <h1 className="text-3xl font-bold text-gray-800 mb-2">All Applications</h1>
                <p className="text-gray-600">
                    {applications.length} total application{applications.length !== 1 ? 's' : ''} across all jobs
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-gray-800">{applications.length}</p>
                    <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-yellow-600">
                        {applications.filter(a => a.status === 'pending').length}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-blue-600">
                        {applications.filter(a => a.status === 'reviewed').length}
                    </p>
                    <p className="text-sm text-gray-600">Reviewed</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-green-600">
                        {applications.filter(a => a.status === 'accepted').length}
                    </p>
                    <p className="text-sm text-gray-600">Accepted</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-2xl font-bold text-red-600">
                        {applications.filter(a => a.status === 'rejected').length}
                    </p>
                    <p className="text-sm text-gray-600">Rejected</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {['all', 'pending', 'reviewed', 'accepted', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                                filter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Applications grouped by Job */}
            {Object.keys(groupedApplications).length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No {filter !== 'all' ? filter : ''} applications
                    </h3>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedApplications).map(([jobId, jobData]) => (
                        <div key={jobId} className="bg-white rounded-lg shadow-md p-6">
                            <div className="border-b border-gray-200 pb-4 mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">{jobData.job_title}</h2>
                                <p className="text-gray-600">{jobData.job_location}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {jobData.applications.length} application{jobData.applications.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {jobData.applications.map(app => (
                                    <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="text-lg font-bold text-gray-800">
                                                        {app.candidate_name || 'Candidate'}
                                                    </h3>
                                                    {app.match_score && (
                                                        <span className={`text-sm ${getMatchScoreColor(app.match_score)}`}>
                                                            {app.match_score}% Match
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 text-sm">{app.candidate_email}</p>
                                                <p className="text-gray-500 text-xs mt-1">
                                                    Applied: {new Date(app.applied_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(app.status)}`}>
                                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                            </span>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Link
                                                to={`/employer/jobs/${jobId}/applications`}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                                            >
                                                View Details
                                            </Link>
                                            {app.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => updateApplicationStatus(app.id, 'reviewed')}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
                                                    >
                                                        Review
                                                    </button>
                                                    <button
                                                        onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                                                    >
                                                        Accept
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDownloadCV(app.id)}
                                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm font-semibold"
                                            >
                                                Download CV
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllApplications;