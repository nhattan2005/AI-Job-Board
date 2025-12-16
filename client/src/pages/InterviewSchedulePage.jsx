import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const InterviewSchedulePage = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isCandidate } = useAuth();
    
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !isCandidate) {
            navigate('/login');
            return;
        }
        fetchInterviewDetails();
    }, [applicationId, isAuthenticated, isCandidate]);

    const fetchInterviewDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/interviews/application/${applicationId}`);
            setInterview(response.data.interview);
            
            const confirmedSlot = response.data.interview.timeSlots.find(s => s.is_selected);
            if (confirmedSlot) {
                setSelectedSlotId(confirmedSlot.id);
            }
        } catch (err) {
            console.error('Error fetching interview:', err);
            setError(err.response?.data?.error || 'Failed to load interview details');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedSlotId) {
            setError('Please select a time slot');
            return;
        }

        setConfirming(true);
        setError(null);

        try {
            await axios.post('/api/interviews/confirm', {
                interviewId: interview.id,
                slotId: selectedSlotId
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/my-interviews');
            }, 2000);

        } catch (err) {
            console.error('Error confirming interview:', err);
            setError(err.response?.data?.error || 'Failed to confirm interview');
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error && !interview) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
                <Link to="/my-applications" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                    ← Back to My Applications
                </Link>
            </div>
        );
    }

    const isAlreadyConfirmed = interview?.status === 'confirmed';

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link to="/my-applications" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center mb-4">
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to My Applications
                </Link>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                        <svg className="h-8 w-8 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Interview Invitation
                    </h1>
                    <p className="text-lg text-gray-700">
                        <strong>{interview?.company_name}</strong> has invited you for an interview for{' '}
                        <strong>{interview?.job_title}</strong>
                    </p>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg flex items-center animate-pulse">
                    <svg className="h-8 w-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="text-lg font-bold text-green-800">Interview Confirmed!</p>
                        <p className="text-green-700">Redirecting to My Interviews...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {isAlreadyConfirmed && (
                <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-lg font-bold text-blue-800">Interview Already Confirmed</p>
                            <p className="text-blue-700">You have already confirmed your interview time.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Interview Details */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Interview Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                        <svg className="h-5 w-5 text-purple-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="font-semibold text-gray-800">{interview?.duration_minutes} minutes</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <svg className="h-5 w-5 text-purple-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                            <p className="text-sm text-gray-600">Location</p>
                            <p className="font-semibold text-gray-800">{interview?.location}</p>
                        </div>
                    </div>

                    {interview?.meeting_link && (
                        <div className="md:col-span-2 flex items-start">
                            <svg className="h-5 w-5 text-purple-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <div>
                                <p className="text-sm text-gray-600">Meeting Link</p>
                                <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer"
                                   className="font-semibold text-blue-600 hover:text-blue-800 hover:underline break-all">
                                    {interview.meeting_link}
                                </a>
                            </div>
                        </div>
                    )}

                    {interview?.notes && (
                        <div className="md:col-span-2 flex items-start">
                            <svg className="h-5 w-5 text-purple-600 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                                <p className="text-sm text-gray-600">Additional Notes</p>
                                <p className="text-gray-800 whitespace-pre-wrap">{interview.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Time Slots Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {isAlreadyConfirmed ? 'Your Confirmed Time' : 'Select Your Preferred Time'}
                </h2>
                
                {interview?.timeSlots && interview.timeSlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {interview.timeSlots.map((slot) => {
                            const slotDate = new Date(slot.slot_date);
                            const isSelected = selectedSlotId === slot.id;
                            const isConfirmedSlot = slot.is_selected;

                            return (
                                <button
                                    key={slot.id}
                                    onClick={() => !isAlreadyConfirmed && setSelectedSlotId(slot.id)}
                                    disabled={isAlreadyConfirmed}
                                    className={`p-4 rounded-lg border-2 transition text-left ${
                                        isConfirmedSlot
                                            ? 'border-green-500 bg-green-50'
                                            : isSelected
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                                    } ${isAlreadyConfirmed ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="font-bold text-gray-800">
                                                    {slotDate.toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-gray-700">
                                                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-semibold">
                                                    {slotDate.toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        {isConfirmedSlot && (
                                            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                        {isSelected && !isConfirmedSlot && (
                                            <div className="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center">
                                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-600">No time slots available</p>
                )}

                {!isAlreadyConfirmed && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedSlotId || confirming}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                        >
                            {confirming ? (
                                <>
                                    <svg className="animate-spin h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Confirm Interview Time
                                </>
                            )}
                        </button>
                        <p className="text-sm text-gray-600 mt-2 text-center">
                            💡 You will receive a confirmation email after confirming
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600">
                    <strong>Need help?</strong> Contact the employer at{' '}
                    <a href={`mailto:${interview?.employer_email}`} className="text-blue-600 hover:text-blue-800">
                        {interview?.employer_email}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default InterviewSchedulePage;