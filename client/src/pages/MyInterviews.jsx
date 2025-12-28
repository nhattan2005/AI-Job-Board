import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyInterviews = () => {
    const { isCandidate, isEmployer } = useAuth();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, past

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            setLoading(true);
            const endpoint = isCandidate 
                ? '/interviews/candidate' 
                : '/interviews/employer';
            
            const response = await api.get(endpoint);
            setInterviews(response.data.interviews);
        } catch (err) {
            console.error('Error fetching interviews:', err);
            setError('Failed to load interviews');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'scheduled': // Added scheduled
            case 'confirmed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'completed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled':
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString, status) => {
        if (!dateString) {
            return (status === 'pending' || status === 'interviewing') ? 'Pending Confirmation' : 'Not scheduled';
        }
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isPastInterview = (dateString) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    const filteredInterviews = interviews.filter(interview => {
        if (filter === 'all') return true;
        if (filter === 'past') return isPastInterview(interview.interview_date);
        if (filter === 'upcoming') return !isPastInterview(interview.interview_date) && (interview.status === 'confirmed' || interview.status === 'scheduled');
        return interview.status === filter;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to={isCandidate ? "/my-applications" : "/employer/dashboard"}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center mb-4"
                >
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to {isCandidate ? 'My Applications' : 'Dashboard'}
                </Link>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                        <svg className="h-8 w-8 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        My Interviews
                    </h1>
                    <p className="text-gray-700">
                        {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? 's' : ''} scheduled or pending
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {['all', 'upcoming', 'pending', 'past', 'cancelled'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                            filter === f
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Interviews List */}
            {filteredInterviews.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No {filter !== 'all' ? filter : ''} interviews
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {isCandidate 
                            ? 'When you receive interview invitations, they will appear here' 
                            : 'Send interview invitations to candidates to schedule interviews'}
                    </p>
                    <Link
                        to={isCandidate ? "/" : "/employer/dashboard"}
                        className="inline-block bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition"
                    >
                        {isCandidate ? 'Browse Jobs' : 'Go to Dashboard'}
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInterviews.map(interview => {
                        const isPast = isPastInterview(interview.interview_date);
                        
                        return (
                            <div key={interview.id} className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition ${isPast ? 'opacity-75' : ''}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                                            {interview.job_title}
                                        </h3>
                                        <p className="text-gray-600 mb-2">
                                            {isCandidate ? interview.company_name : interview.candidate_name}
                                        </p>
                                        {isEmployer && interview.candidate_email && (
                                            <a 
                                                href={`mailto:${interview.candidate_email}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                {interview.candidate_email}
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(interview.status)}`}>
                                            {interview.status.charAt(0).toUpperCase() + interview.status.slice(1).replace('_', ' ')}
                                        </span>
                                        {isPast && (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                                                Past
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center text-gray-700">
                                        <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <div>
                                            <p className="text-xs text-gray-500">Date & Time</p>
                                            <p className={`font-semibold ${!interview.interview_date ? 'text-amber-600' : ''}`}>
                                                {formatDate(interview.interview_date, interview.status)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-700">
                                        <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-xs text-gray-500">Duration</p>
                                            <p className="font-semibold">{interview.duration_minutes} minutes</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-700">
                                        <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-xs text-gray-500">Method / Location</p>
                                            <p className="font-semibold">
                                                {interview.location === 'Online' ? '🌐 Online Meeting' : 
                                                 interview.location === 'Phone' ? '📞 Phone Call' : 
                                                 interview.location ? `🏢 ${interview.location}` : 'Not specified'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Meeting Link - Show for BOTH Candidate and Employer */}
                                {interview.meeting_link && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center">
                                            <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            <div className="overflow-hidden">
                                                <p className="text-sm text-gray-600">Meeting Link:</p>
                                                <a 
                                                    href={interview.meeting_link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 font-semibold hover:underline break-all block"
                                                >
                                                    {interview.meeting_link}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {interview.notes && (
                                    <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                        <p className="text-sm text-gray-600 mb-1">Additional Notes:</p>
                                        <p className="text-gray-800 whitespace-pre-wrap">{interview.notes}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    {isCandidate && (interview.status === 'pending' || interview.status === 'interviewing') && (
                                        <Link
                                            to={`/interview/schedule/${interview.application_id}`}
                                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold flex items-center"
                                        >
                                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Confirm Time
                                        </Link>
                                    )}
                                    
                                    {isEmployer && (
                                        <Link
                                            to={`/employer/jobs/${interview.job_id}/applications`}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                                        >
                                            View Application
                                        </Link>
                                    )}

                                    <a
                                        href={`mailto:${isCandidate ? interview.employer_email : interview.candidate_email}`}
                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-semibold flex items-center ml-auto"
                                    >
                                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Contact
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyInterviews;