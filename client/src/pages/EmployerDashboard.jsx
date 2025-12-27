import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EmployerDashboard = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({
        totalJobs: 0,
        totalApplications: 0,
        pendingApplications: 0,
        todayApplications: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 👇 THÊM STATE CHO PAGINATION
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const jobsPerPage = 5; // Số jobs mỗi trang

    useEffect(() => {
        fetchDashboardData();
    }, [page]); // 👈 THÊM page VÀO DEPENDENCY

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch jobs
            const jobsResponse = await api.get('/jobs/my-jobs');
            const allJobs = jobsResponse.data;
            
            // 👇 TÍNH TOÁN PAGINATION
            setTotalPages(Math.ceil(allJobs.length / jobsPerPage));
            const startIndex = (page - 1) * jobsPerPage;
            const endIndex = startIndex + jobsPerPage;
            const paginatedJobs = allJobs.slice(startIndex, endIndex);
            
            setJobs(paginatedJobs);

            // Fetch stats
            const statsResponse = await api.get('/employer/stats');
            setStats(statsResponse.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Welcome back, {user?.company_name}!
                </h1>
                <p className="text-gray-600">Manage your job postings and applications</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{stats.totalJobs}</p>
                            <p className="text-gray-600">Active Jobs</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{stats.totalApplications}</p>
                            <p className="text-gray-600">Total Applications</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{stats.pendingApplications}</p>
                            <p className="text-gray-600">Pending Review</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{stats.todayApplications}</p>
                            <p className="text-gray-600">Today's Applications</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/employer/post-job"
                        className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                        <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-gray-800">Post New Job</h3>
                            <p className="text-sm text-gray-600">Create a new job posting</p>
                        </div>
                    </Link>

                    <Link
                        to="/employer/all-applications"
                        className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                        <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-gray-800">View All Applications</h3>
                            <p className="text-sm text-gray-600">Review all candidate applications</p>
                        </div>
                    </Link>

                    <Link
                        to="/my-interviews"
                        className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                        <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                            <h3 className="font-semibold text-gray-800">My Interviews</h3>
                            <p className="text-sm text-gray-600">Manage scheduled interviews</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Job Postings</h2>
                
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {jobs.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs posted yet</h3>
                        <p className="text-gray-500 mb-6">Start by creating your first job posting</p>
                        <Link
                            to="/employer/post-job"
                            className="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition"
                        >
                            Post Your First Job
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Jobs List */}
                        <div className="space-y-4">
                            {jobs.map(job => (
                                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">{job.title}</h3>
                                            <p className="text-gray-600 text-sm mb-2">{job.location}</p>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <span>{job.application_count || 0} applications</span>
                                                <span>•</span>
                                                <span>{new Date(job.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Link
                                                to={`/employer/jobs/${job.id}/applications`}
                                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition text-sm"
                                            >
                                                View Applications
                                            </Link>
                                            <Link
                                                to={`/employer/edit-job/${job.id}`}
                                                className="p-2 text-gray-600 hover:text-blue-600 transition"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 👇 THÊM PAGINATION - GIỐNG ADMIN USERS */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-gray-700 font-medium">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EmployerDashboard;