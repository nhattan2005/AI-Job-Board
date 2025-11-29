import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const EmployerApplications = () => {
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [viewingCV, setViewingCV] = useState(null); // For CV modal

    useEffect(() => {
        fetchJobAndApplications();
    }, [jobId]);

    const fetchJobAndApplications = async () => {
        try {
            setLoading(true);
            
            const jobResponse = await axios.get(`/api/jobs/${jobId}`);
            setJob(jobResponse.data);
            
            const appsResponse = await axios.get(`/api/jobs/${jobId}/applications`);
            setApplications(appsResponse.data.applications);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const updateApplicationStatus = async (applicationId, newStatus) => {
        try {
            await axios.patch(`/api/applications/${applicationId}/status`, {
                status: newStatus
            });
            fetchJobAndApplications();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update application status');
        }
    };

    const downloadCV = (app) => {
        // Create a Blob from CV text
        const blob = new Blob([app.cv_text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${app.candidate_name || 'candidate'}_CV_${app.cv_filename || 'cv.txt'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
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

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
                    {error}
                </div>
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

                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Applications for: {job?.title}
                </h1>
                <p className="text-gray-600">
                    {applications.length} total application{applications.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Stats Cards */}
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

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No {filter !== 'all' ? filter : ''} applications
                    </h3>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map(app => (
                        <div key={app.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-xl font-bold text-blue-600">
                                                {(app.candidate_name || 'C').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {app.candidate_name || 'Candidate'}
                                            </h3>
                                            <p className="text-gray-600">{app.candidate_email}</p>
                                        </div>
                                        {app.match_score && (
                                            <span className={`ml-auto text-2xl ${getMatchScoreColor(app.match_score)}`}>
                                                {app.match_score}%
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                        <span className="flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Applied: {new Date(app.applied_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                        {app.candidate_skills && app.candidate_skills.length > 0 && (
                                            <span className="flex items-center">
                                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                </svg>
                                                Skills: {app.candidate_skills.slice(0, 3).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(app.status)}`}>
                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                </span>
                            </div>

                            {/* CV Actions */}
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="font-semibold text-gray-700">CV Document</span>
                                        <span className="text-sm text-gray-500">
                                            ({app.cv_filename || 'cv.txt'})
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setViewingCV(app)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center"
                                        >
                                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View CV
                                        </button>
                                        <button
                                            onClick={() => downloadCV(app)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold flex items-center"
                                        >
                                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* AI Advice */}
                            {app.ai_advice && app.ai_advice.length > 0 && (
                                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        AI Insights
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-purple-700 space-y-1">
                                        {app.ai_advice.slice(0, 3).map((advice, idx) => (
                                            <li key={idx}>{advice}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Cover Letter */}
                            {app.cover_letter && (
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold text-blue-800 mb-2">Cover Letter:</h4>
                                    <p className="text-sm text-blue-700 whitespace-pre-wrap">{app.cover_letter}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                                {app.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => updateApplicationStatus(app.id, 'reviewed')}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                                        >
                                            Mark as Reviewed
                                        </button>
                                        <button
                                            onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}

                                {app.status === 'reviewed' && (
                                    <>
                                        <button
                                            onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}

                                {(app.status === 'accepted' || app.status === 'rejected') && (
                                    <button
                                        onClick={() => updateApplicationStatus(app.id, 'reviewed')}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
                                    >
                                        Move to Reviewed
                                    </button>
                                )}

                                <a
                                    href={`mailto:${app.candidate_email}`}
                                    className="ml-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                                >
                                    Contact Candidate
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CV Viewing Modal */}
            {viewingCV && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {viewingCV.candidate_name}'s CV
                                </h2>
                                <p className="text-gray-600">{viewingCV.candidate_email}</p>
                            </div>
                            <button
                                onClick={() => setViewingCV(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg border border-gray-200">
                                {viewingCV.cv_text}
                            </pre>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => downloadCV(viewingCV)}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                            >
                                Download CV
                            </button>
                            <button
                                onClick={() => setViewingCV(null)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployerApplications;