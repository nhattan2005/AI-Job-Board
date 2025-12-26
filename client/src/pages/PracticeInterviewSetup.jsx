import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PracticeInterviewSetup = () => {
    const navigate = useNavigate();
    const [cvFile, setCvFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [interviewType, setInterviewType] = useState('HR');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }
        if (file && !file.type.match(/pdf|msword|wordprocessingml/)) {
            setError('Only PDF or DOCX files are allowed');
            return;
        }
        setCvFile(file);
        setError(null);
    };

    const handleStartInterview = async () => {
        if (!cvFile) {
            setError('Please upload your CV');
            return;
        }
        if (!jobDescription.trim()) {
            setError('Please provide a job description');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('cv', cvFile);
        formData.append('jobDescription', jobDescription);
        formData.append('interviewType', interviewType);

        try {
            const response = await api.post('/mock-interview/start-practice', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { sessionId } = response.data;
            navigate(`/practice-interview/room/${sessionId}`);
        } catch (err) {
            console.error('Start practice interview error:', err);
            setError(err.response?.data?.error || 'Failed to start interview. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                    <span className="mr-3 text-5xl">🎤</span>
                    Practice Interview
                </h1>
                <p className="text-gray-600 text-lg">
                    Upload your CV and job description to practice answering interview questions
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Setup Form */}
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
                {/* Step 1: Upload CV */}
                <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                        <span className="mr-2">📄</span>
                        Step 1: Upload Your CV
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition">
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-3 file:px-6
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                cursor-pointer"
                        />
                        {cvFile && (
                            <div className="mt-3 flex items-center text-green-600">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {cvFile.name}
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        PDF or DOCX (max. 5MB)
                    </p>
                </div>

                {/* Step 2: Job Description */}
                <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                        <span className="mr-2">💼</span>
                        Step 2: Paste Job Description
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows="10"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Paste the full job description here...

Example:
We are looking for a Senior Frontend Developer with:
- 5+ years of React experience
- Strong TypeScript skills
- Experience with Next.js
- Knowledge of state management (Redux/Zustand)
..."
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        {jobDescription.length} characters
                    </p>
                </div>

                {/* Step 3: Interview Type */}
                <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                        <span className="mr-2">🎯</span>
                        Step 3: Choose Interview Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => setInterviewType('HR')}
                            className={`p-6 rounded-lg border-2 transition ${
                                interviewType === 'HR'
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="text-4xl mb-2">👤</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">HR Interview</h3>
                            <p className="text-sm text-gray-600">
                                Behavioral questions, teamwork, motivation
                            </p>
                        </button>

                        <button
                            onClick={() => setInterviewType('Tech_Lead')}
                            className={`p-6 rounded-lg border-2 transition ${
                                interviewType === 'Tech_Lead'
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="text-4xl mb-2">💻</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Technical Interview</h3>
                            <p className="text-sm text-gray-600">
                                System design, coding, architecture
                            </p>
                        </button>
                    </div>
                </div>

                {/* Start Button */}
                <button
                    onClick={handleStartInterview}
                    disabled={loading || !cvFile || !jobDescription.trim()}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Preparing Interview Room...
                        </>
                    ) : (
                        <>
                            🚀 Start Practice Interview
                        </>
                    )}
                </button>
            </div>

            {/* Info Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="text-3xl mb-2">🤖</div>
                    <h3 className="font-bold text-gray-900 mb-2">AI-Powered</h3>
                    <p className="text-sm text-gray-600">
                        Questions generated based on your CV and target job
                    </p>
                </div>

                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="font-bold text-gray-900 mb-2">Instant Feedback</h3>
                    <p className="text-sm text-gray-600">
                        Get detailed feedback after each practice session
                    </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <div className="text-3xl mb-2">🎯</div>
                    <h3 className="font-bold text-gray-900 mb-2">Realistic Questions</h3>
                    <p className="text-sm text-gray-600">
                        Practice with questions similar to real interviews
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PracticeInterviewSetup;