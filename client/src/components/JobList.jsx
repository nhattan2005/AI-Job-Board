import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/jobs');
                setJobs(response.data);
            } catch (error) {
                console.error('Error fetching jobs:', error);
                setError('Failed to load jobs');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

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
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Available Jobs</h2>
                <p className="text-gray-600">
                    {jobs.length} {jobs.length === 1 ? 'position' : 'positions'} available
                </p>
            </div>
            
            {jobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <svg 
                        className="mx-auto h-16 w-16 text-gray-400 mb-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs available yet</h3>
                    <p className="text-gray-500 mb-6">Be the first to post a job!</p>
                    <Link 
                        to="/post-job"
                        className="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition"
                    >
                        Post a Job
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map(job => (
                        <Link
                            key={job.id}
                            to={`/jobs/${job.id}`}
                            className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-300"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    {/* Left: Job Info */}
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition mb-2">
                                            {job.title}
                                        </h3>
                                        
                                        {job.company && (
                                            <p className="text-lg text-gray-600 font-medium mb-3 flex items-center">
                                                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                {job.company}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                            {/* Location */}
                                            {job.location && (
                                                <span className="flex items-center">
                                                    <svg className="h-4 w-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {job.location}
                                                </span>
                                            )}

                                            {/* Salary Range */}
                                            {job.salary_range && (
                                                <span className="flex items-center font-semibold text-green-600">
                                                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {job.salary_range}
                                                </span>
                                            )}

                                            {/* Employment Type */}
                                            {job.employment_type && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                                                    {job.employment_type.replace('-', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Posted Date */}
                                    <div className="ml-6 text-right">
                                        <p className="text-xs text-gray-500 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(job.created_at).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* View Details Link */}
                                <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-100">
                                    <span className="text-blue-600 hover:text-blue-800 font-semibold flex items-center group">
                                        View Details & Apply
                                        <svg className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JobList;