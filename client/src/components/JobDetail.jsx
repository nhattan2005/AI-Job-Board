import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, isCandidate } = useAuth();
    
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // CV Upload States
    const [cvFile, setCvFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    
    // Analysis States
    const [matchingScore, setMatchingScore] = useState(null);
    const [tailoredCV, setTailoredCV] = useState(null);
    const [loadingScore, setLoadingScore] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [loadingApply, setLoadingApply] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    // Application States
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationId, setApplicationId] = useState(null);
    const [applySuccess, setApplySuccess] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/jobs/${id}`);
                setJob(response.data);
            } catch (error) {
                console.error('Error fetching job:', error);
                setError('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [id]);

    // Check if user has already applied
    useEffect(() => {
        const checkApplication = async () => {
            if (isAuthenticated && isCandidate) {
                try {
                    const response = await axios.get('/api/applications/my-applications');
                    const existingApp = response.data.applications.find(app => app.job_id === parseInt(id));
                    if (existingApp) {
                        setHasApplied(true);
                        setApplicationId(existingApp.id);
                        if (existingApp.match_score) {
                            setMatchingScore(existingApp.match_score);
                        }
                    }
                } catch (error) {
                    console.error('Error checking application:', error);
                }
            }
        };
        
        if (job) {
            checkApplication();
        }
    }, [job, isAuthenticated, isCandidate, id]);

    // Handle file drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = (file) => {
        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            setUploadError('Please upload a PDF, DOCX, DOC, or TXT file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size must be less than 5MB');
            return;
        }

        setCvFile(file);
        setUploadError(null);
        // Reset results when new file is selected
        setMatchingScore(null);
        setTailoredCV(null);
    };

    // Option 1: Calculate Matching Score
    const handleCalculateScore = async () => {
        if (!cvFile) {
            setUploadError('Please upload your CV first');
            return;
        }

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setLoadingScore(true);
        setUploadError(null);

        try {
            // Extract CV text
            const formData = new FormData();
            formData.append('cv', cvFile);

            // First, we need to extract text from CV
            const extractResponse = await axios.post('/api/cv/extract-text', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const cvText = extractResponse.data.cvText;

            // Calculate score
            const scoreResponse = await axios.post('/api/ai/match', {
                cvText: cvText,
                jobDescription: job.description
            });

            setMatchingScore(scoreResponse.data.matchingScore);
            
        } catch (error) {
            console.error('Error calculating score:', error);
            setUploadError(error.response?.data?.error || 'Failed to calculate matching score');
        } finally {
            setLoadingScore(false);
        }
    };

    // Option 2: Get AI Suggestions
    const handleGetSuggestions = async () => {
        if (!cvFile) {
            setUploadError('Please upload your CV first');
            return;
        }

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setLoadingSuggestions(true);
        setUploadError(null);

        try {
            // Extract CV text
            const formData = new FormData();
            formData.append('cv', cvFile);

            const extractResponse = await axios.post('/api/cv/extract-text', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const cvText = extractResponse.data.cvText;

            // Get tailoring suggestions
            const tailorResponse = await axios.post('/api/ai/tailor-cv', {
                cvText: cvText,
                jobDescription: job.description
            });

            setTailoredCV(tailorResponse.data.tailoredCV);
            
        } catch (error) {
            console.error('Error getting suggestions:', error);
            setUploadError(error.response?.data?.error || 'Failed to get AI suggestions');
        } finally {
            setLoadingSuggestions(false);
        }
    };

    // Option 3: Apply for Job
    const handleApplyJob = async () => {
        if (!cvFile) {
            setUploadError('Please upload your CV first');
            return;
        }

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (hasApplied) {
            setUploadError('You have already applied for this job');
            return;
        }

        setLoadingApply(true);
        setUploadError(null);
        setApplySuccess(false);

        try {
            const formData = new FormData();
            formData.append('cv', cvFile);
            formData.append('job_id', id);

            const response = await axios.post('/api/applications/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            setHasApplied(true);
            setApplicationId(response.data.application.id);
            setApplySuccess(true);
            
            // Auto-hide success message after 3 seconds
            setTimeout(() => setApplySuccess(false), 3000);
            
        } catch (error) {
            console.error('Error applying for job:', error);
            setUploadError(error.response?.data?.error || 'Failed to submit application');
        } finally {
            setLoadingApply(false);
            setUploadProgress(0);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent Match!';
        if (score >= 60) return 'Good Match';
        return 'Needs Improvement';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
                    {error || 'Job not found'}
                </div>
                <div className="mt-4">
                    <button
                        onClick={() => navigate('/')}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                        ← Back to Jobs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className="mb-6 text-blue-600 hover:text-blue-800 font-semibold flex items-center"
            >
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Jobs
            </button>

            {/* Job Details Card */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                <div className="border-b border-gray-200 pb-6 mb-6">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">{job.title}</h1>
                    
                    {job.company && (
                        <p className="text-xl text-gray-600 font-medium mb-2">
                            {job.company}
                        </p>
                    )}
                    
                    {job.location && (
                        <p className="text-gray-500 flex items-center mb-4">
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                        </p>
                    )}
                    
                    <p className="text-gray-500 text-sm flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Posted on: {new Date(job.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Job Description</h2>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {job.description}
                    </div>
                </div>

                {/* Company Contact Information - NEW SECTION */}
                {(job.company_description || job.website) && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">About the Company</h2>
                        
                        {job.company_description && (
                            <p className="text-gray-700 mb-4 leading-relaxed">
                                {job.company_description}
                            </p>
                        )}

                        <div className="space-y-3">
                            {job.website && (
                                <div className="flex items-center text-gray-600">
                                    <svg className="h-5 w-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                    <span className="font-semibold mr-2">Website:</span>
                                    <a 
                                        href={job.website.startsWith('http') ? job.website : `https://${job.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {job.website}
                                    </a>
                                </div>
                            )}

                            {job.company_email && (
                                <div className="flex items-center text-gray-600">
                                    <svg className="h-5 w-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="font-semibold mr-2">Email:</span>
                                    <a 
                                        href={`mailto:${job.company_email}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {job.company_email}
                                    </a>
                                </div>
                            )}

                            {job.company_phone && (
                                <div className="flex items-center text-gray-600">
                                    <svg className="h-5 w-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="font-semibold mr-2">Phone:</span>
                                    <a 
                                        href={`tel:${job.company_phone}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {job.company_phone}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* CV Upload & Analysis Section - Only for Candidates */}
            {isAuthenticated && isCandidate && (
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <svg className="h-7 w-7 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        AI-Powered Job Analysis
                    </h2>

                    {/* Application Status */}
                    {hasApplied && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
                            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            You have already applied for this position
                        </div>
                    )}

                    {/* Success Message */}
                    {applySuccess && (
                        <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 text-green-700 rounded-lg flex items-center animate-pulse">
                            <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-bold">Application Submitted Successfully!</p>
                                <p className="text-sm">You can view your application in "My Applications"</p>
                            </div>
                        </div>
                    )}

                    {/* Step 1: CV Upload Area */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Step 1: Upload Your CV <span className="text-red-500">*</span>
                        </label>
                        
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                                dragActive 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-300 bg-gray-50'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            {!cvFile ? (
                                <>
                                    <svg 
                                        className="mx-auto h-12 w-12 text-gray-400 mb-4" 
                                        stroke="currentColor" 
                                        fill="none" 
                                        viewBox="0 0 48 48"
                                    >
                                        <path 
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                        />
                                    </svg>
                                    
                                    <div className="mb-4">
                                        <label 
                                            htmlFor="cv-upload" 
                                            className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                                        >
                                            Click to upload
                                        </label>
                                        <span className="text-gray-600"> or drag and drop</span>
                                        <input
                                            id="cv-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.txt"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                    
                                    <p className="text-sm text-gray-500">
                                        PDF, DOC, DOCX, or TXT (max. 5MB)
                                    </p>
                                </>
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-800">{cvFile.name}</p>
                                            <p className="text-sm text-gray-600">{formatFileSize(cvFile.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCvFile(null);
                                            setMatchingScore(null);
                                            setTailoredCV(null);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            {/* Upload Progress for Apply */}
                            {loadingApply && uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="mt-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {uploadError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {uploadError}
                        </div>
                    )}

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
                                onClick={handleApplyJob}
                                disabled={!cvFile || hasApplied || loadingScore || loadingSuggestions || loadingApply}
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
                                        {loadingApply ? 'Applying...' : hasApplied ? 'Already Applied' : 'Apply Now'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {hasApplied ? 'You have applied for this job' : 'Submit your application directly'}
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Results Section */}
                    {(matchingScore !== null || tailoredCV !== null) && (
                        <div className="space-y-6">
                            {/* Matching Score Display */}
                            {matchingScore !== null && (
                                <div className={`p-6 rounded-lg border-2 ${getScoreColor(matchingScore)}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold">Matching Score</h3>
                                        <span className="text-4xl font-bold">{matchingScore}%</span>
                                    </div>
                                    <p className="font-semibold text-lg">{getScoreLabel(matchingScore)}</p>
                                    <p className="text-sm mt-2">
                                        {matchingScore >= 80 && "Your CV is an excellent match for this position! Consider applying."}
                                        {matchingScore >= 60 && matchingScore < 80 && "Your CV has good alignment with the job requirements. Review the suggestions below to improve."}
                                        {matchingScore < 60 && "Your CV could be improved to better match this position. Check the AI suggestions for tips."}
                                    </p>
                                </div>
                            )}

                            {/* AI Tailoring Suggestions */}
                            {tailoredCV && (
                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                        <svg className="h-6 w-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        AI CV Improvement Suggestions
                                    </h3>
                                    
                                    {tailoredCV.missingKeywords && tailoredCV.missingKeywords.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-gray-700 mb-2">Missing Keywords:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {tailoredCV.missingKeywords.map((keyword, index) => (
                                                    <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {tailoredCV.missingSkills && tailoredCV.missingSkills.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-gray-700 mb-2">Missing Skills:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {tailoredCV.missingSkills.map((skill, index) => (
                                                    <span key={index} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {tailoredCV.suggestions && tailoredCV.suggestions.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-semibold text-gray-700 mb-2">💡 Suggestions:</h4>
                                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                                {tailoredCV.suggestions.map((suggestion, index) => (
                                                    <li key={index} className="leading-relaxed">{suggestion}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    
                                    {tailoredCV.improvements && tailoredCV.improvements.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-2">✨ Improvements:</h4>
                                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                                {tailoredCV.improvements.map((improvement, index) => (
                                                    <li key={index} className="leading-relaxed">{improvement}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Not Authenticated Message */}
            {!isAuthenticated && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Sign in to Apply</h3>
                    <p className="text-gray-500 mb-6">You need to be logged in to access AI-powered features and apply for this position</p>
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            )}

            {/* Employer View */}
            {isAuthenticated && !isCandidate && (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <svg className="mx-auto h-16 w-16 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Employer Account</h3>
                    <p className="text-gray-500 mb-6">You're viewing this job as an employer. Only candidates can use AI features and apply for positions.</p>
                    <button
                        onClick={() => navigate('/employer/dashboard')}
                        className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default JobDetail;