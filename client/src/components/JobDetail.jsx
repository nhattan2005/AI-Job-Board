import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, isCandidate } = useAuth();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Application states
    const [cvFile, setCvFile] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [loadingApply, setLoadingApply] = useState(false);
    const [applySuccess, setApplySuccess] = useState(false);
    const [applyError, setApplyError] = useState(null);
    const [hasApplied, setHasApplied] = useState(false);
    
    // AI features states
    const [matchScore, setMatchScore] = useState(null);
    const [loadingScore, setLoadingScore] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        fetchJobDetails();
        if (isAuthenticated && isCandidate) {
            checkApplicationStatus();
        }
    }, [id, isAuthenticated, isCandidate]);

    const fetchJobDetails = async () => {
        try {
            const response = await axios.get(`/api/jobs/${id}`);
            setJob(response.data);
        } catch (err) {
            setError('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const checkApplicationStatus = async () => {
        try {
            const response = await axios.get(`/api/applications/check/${id}`);
            setHasApplied(response.data.hasApplied);
        } catch (err) {
            console.error('Error checking application status:', err);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setApplyError('Please upload a PDF file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setApplyError('File size must be less than 5MB');
                return;
            }
            setCvFile(file);
            setUploadedFile(file);
            setApplyError(null);
        }
    };

    const handleCalculateScore = async () => {
        if (!uploadedFile) {
            setApplyError('Please upload a CV first');
            return;
        }

        setLoadingScore(true);
        setApplyError(null);
        setMatchScore(null);

        try {
            const formData = new FormData();
            formData.append('cv', uploadedFile);
            formData.append('jobId', id);

            const response = await axios.post('/api/ai/match', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMatchScore(response.data.score);
        } catch (err) {
            console.error('Calculate score error:', err);
            setApplyError(err.response?.data?.error || 'Failed to calculate match score');
        } finally {
            setLoadingScore(false);
        }
    };

    const handleGetSuggestions = async () => {
        if (!uploadedFile) {
            setApplyError('Please upload a CV first');
            return;
        }

        setLoadingSuggestions(true);
        setApplyError(null);
        setAiSuggestions(null);

        try {
            const formData = new FormData();
            formData.append('cv', uploadedFile);
            formData.append('jobId', id);

            const response = await axios.post('/api/ai/tailor-cv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            let suggestions = response.data.suggestions;
            
            if (typeof suggestions === 'string') {
                try {
                    suggestions = JSON.parse(suggestions);
                } catch (e) {
                    console.error('Failed to parse suggestions:', e);
                    throw new Error('Invalid suggestions format');
                }
            }

            setAiSuggestions(suggestions);
        } catch (err) {
            console.error('Get suggestions error:', err);
            setApplyError(err.response?.data?.error || 'Failed to get AI suggestions');
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleApply = async () => {
        if (!cvFile) {
            setApplyError('Please upload your CV');
            return;
        }

        setLoadingApply(true);
        setApplyError(null);

        try {
            const formData = new FormData();
            formData.append('cv', cvFile);
            formData.append('coverLetter', coverLetter);

            await axios.post(`/api/applications/${id}/apply`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setApplySuccess(true);
            setHasApplied(true);
            setTimeout(() => {
                navigate('/my-applications');
            }, 2000);
        } catch (err) {
            setApplyError(err.response?.data?.error || 'Failed to submit application');
        } finally {
            setLoadingApply(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error || 'Job not found'}</p>
                <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to Jobs
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-block">
                ← Back to Jobs
            </Link>

            {/* Job Details Card */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                        <p className="text-xl text-gray-700">{job.company_name}</p>
                    </div>
                    {hasApplied && (
                        <span className="bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">
                            ✓ Applied
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center text-gray-600">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                    </div>
                    <div className="flex items-center text-gray-600">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {job.job_type}
                    </div>
                    <div className="flex items-center text-gray-600">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Posted {new Date(job.created_at).toLocaleDateString()}
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>

                {job.requirements && (
                    <div className="border-t pt-6 mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                    </div>
                )}
            </div>

            {/* Application Form */}
            {isAuthenticated && isCandidate && !hasApplied && (
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for this position</h2>

                    {applySuccess && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                            Application submitted successfully! Redirecting...
                        </div>
                    )}

                    {applyError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {applyError}
                        </div>
                    )}

                    {/* Step 1: Upload CV */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Step 1: Upload Your CV (PDF) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={loadingApply}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-3 file:px-6
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                cursor-pointer
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {cvFile && (
                            <p className="mt-2 text-sm text-green-600 flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {cvFile.name}
                            </p>
                        )}
                    </div>

                    {/* Step 2: Choose Action */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Step 2: Choose Action
                        </label>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Option 1: Calculate Score */}
                            <button
                                onClick={handleCalculateScore}
                                disabled={!cvFile || loadingScore || loadingSuggestions || loadingApply}
                                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="text-center">
                                    {loadingScore ? (
                                        <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="h-8 w-8 mx-auto mb-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    )}
                                    <h3 className="font-bold text-gray-800 mb-2">
                                        {loadingScore ? 'Calculating...' : 'Calculate Match Score'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        See how well your CV matches this job
                                    </p>
                                </div>
                            </button>

                            {/* Option 2: Get Suggestions */}
                            <button
                                onClick={handleGetSuggestions}
                                disabled={!cvFile || loadingScore || loadingSuggestions || loadingApply}
                                className="p-6 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="text-center">
                                    {loadingSuggestions ? (
                                        <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-purple-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="h-8 w-8 mx-auto mb-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    )}
                                    <h3 className="font-bold text-gray-800 mb-2">
                                        {loadingSuggestions ? 'Analyzing...' : 'Get AI Suggestions'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Receive personalized CV improvement tips
                                    </p>
                                </div>
                            </button>

                            {/* Option 3: Apply Now */}
                            <button
                                onClick={handleApply}
                                disabled={!cvFile || loadingScore || loadingSuggestions || loadingApply}
                                className="p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="text-center">
                                    {loadingApply ? (
                                        <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-green-600" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="h-8 w-8 mx-auto mb-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    <h3 className="font-bold text-gray-800 mb-2">
                                        {loadingApply ? 'Submitting...' : 'Apply Now'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Submit your application directly
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Match Score Display */}
                    {matchScore !== null && (
                        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Match Score</h3>
                                    <p className="text-sm text-gray-600">Your CV compatibility with this job</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-blue-600">{matchScore}%</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {matchScore >= 80 ? '🎉 Excellent Match!' : 
                                         matchScore >= 60 ? '👍 Good Match' : 
                                         matchScore >= 40 ? '⚠️ Fair Match' : 
                                         '❌ Low Match'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Suggestions Display */}
                    {aiSuggestions && (
                        <div className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        💡 AI-Powered CV Enhancement Suggestions
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Our AI analyzed your CV and found these areas for improvement:
                                    </p>

                                    {aiSuggestions.missingKeywords && aiSuggestions.missingKeywords.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                                                <span className="bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Missing Keywords</span>
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {aiSuggestions.missingKeywords.map((keyword, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {aiSuggestions.missingSkills && aiSuggestions.missingSkills.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                                                <span className="bg-orange-100 text-orange-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Missing Skills</span>
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {aiSuggestions.missingSkills.map((skill, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {aiSuggestions.suggestions && aiSuggestions.suggestions.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                                                <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Suggestions</span>
                                            </h4>
                                            <ul className="space-y-2">
                                                {aiSuggestions.suggestions.map((suggestion, idx) => (
                                                    <li key={idx} className="flex items-start">
                                                        <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-gray-700 text-sm">{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {aiSuggestions.improvements && aiSuggestions.improvements.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                                                <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">Improvements</span>
                                            </h4>
                                            <ul className="space-y-2">
                                                {aiSuggestions.improvements.map((improvement, idx) => (
                                                    <li key={idx} className="flex items-start">
                                                        <svg className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-gray-700 text-sm">{improvement}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cover Letter */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Cover Letter (Optional)
                        </label>
                        <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            disabled={loadingApply}
                            rows="6"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            placeholder="Tell us why you're interested in this position..."
                        />
                    </div>
                </div>
            )}

            {!isAuthenticated && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-gray-700 mb-4">Please log in to apply for this job</p>
                    <Link
                        to="/login"
                        state={{ from: `/jobs/${id}` }}
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                        Login to Apply
                    </Link>
                </div>
            )}
        </div>
    );
};

export default JobDetail;