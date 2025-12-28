import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MyFollowing = () => {
    const [employers, setEmployers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFollowedEmployers();
    }, []);

    const fetchFollowedEmployers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/employer/following');
            setEmployers(res.data.employers);
        } catch (err) {
            console.error('Error fetching followed employers:', err);
            setError('Failed to load followed companies');
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async (employerId) => {
        if (!confirm('Are you sure you want to unfollow this company?')) return;

        try {
            await api.delete(`/employer/unfollow/${employerId}`);
            // Optimistic update
            setEmployers(prev => prev.filter(emp => emp.id !== employerId));
        } catch (err) {
            console.error('Unfollow error:', err);
            alert('Failed to unfollow');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Following</h1>
                <p className="text-gray-600">
                    Companies you are following ({employers.length})
                </p>
            </div>

            {/* Empty State */}
            {employers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Not following any companies yet</h3>
                    <p className="text-gray-500 mb-6">Start following companies to get updates on new job postings</p>
                    <Link
                        to="/"
                        className="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition"
                    >
                        Browse Jobs
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {employers.map(employer => (
                        <div key={employer.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
                            <div className="flex items-start justify-between mb-4">
                                {/* Avatar + Info */}
                                <div className="flex items-center space-x-4">
                                    {employer.avatar_url ? (
                                        <img
                                            src={employer.avatar_url}
                                            alt={employer.company_name}
                                            className="w-16 h-16 rounded-lg object-cover border-2 border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-gray-100">
                                            <span className="text-2xl font-bold text-white">
                                                {employer.company_name?.charAt(0) || 'C'}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <Link
                                            to={`/employer/${employer.id}`}
                                            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition"
                                        >
                                            {employer.company_name}
                                        </Link>
                                        {employer.company_industry && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                                    {employer.company_industry}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Unfollow Button */}
                                <button
                                    onClick={() => handleUnfollow(employer.id)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-semibold"
                                >
                                    Unfollow
                                </button>
                            </div>

                            {/* Description */}
                            {employer.company_description && (
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {employer.company_description}
                                </p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        {employer.follower_count || 0} followers
                                    </span>

                                    <span>•</span>

                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {employer.active_jobs || 0} open jobs
                                    </span>
                                </div>

                                <Link
                                    to={`/employer/${employer.id}`}
                                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center"
                                >
                                    View Profile
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>

                            {/* Followed Date */}
                            <p className="text-xs text-gray-400 mt-3">
                                Following since {new Date(employer.followed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyFollowing;