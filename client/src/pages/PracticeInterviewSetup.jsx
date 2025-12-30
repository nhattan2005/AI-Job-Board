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
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        Practice Interview AI
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Simulate a real interview experience tailored to your CV and target job description.
                        Get instant feedback and improve your confidence.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Setup Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Step 1: Upload CV */}
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                                    1. Upload Your CV
                                </label>
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${cvFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'}`}>
                                    <input
                                        type="file"
                                        id="cv-upload"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label htmlFor="cv-upload" className="cursor-pointer w-full h-full block">
                                        {cvFile ? (
                                            <div className="flex flex-col items-center text-green-700">
                                                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-bold text-lg">{cvFile.name}</span>
                                                <span className="text-sm mt-1">Click to change file</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-500">
                                                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <span className="font-semibold text-lg text-slate-700">Click to upload CV</span>
                                                <span className="text-sm mt-1">PDF or DOCX (Max 5MB)</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Step 2: Job Description */}
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                                    2. Job Description
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        rows="6"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none bg-slate-50 focus:bg-white"
                                        placeholder="Paste the job description here..."
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium bg-white/80 px-2 py-1 rounded">
                                        {jobDescription.length} chars
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Interview Type */}
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
                                    3. Select Interview Type
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setInterviewType('HR')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                                            interviewType === 'HR'
                                                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-lg ${interviewType === 'HR' ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            </div>
                                            <span className={`font-bold ${interviewType === 'HR' ? 'text-blue-900' : 'text-slate-700'}`}>HR Round</span>
                                        </div>
                                        <p className="text-xs text-slate-500 pl-1">Behavioral questions, culture fit, and soft skills.</p>
                                        {interviewType === 'HR' && (
                                            <div className="absolute top-2 right-2 text-blue-600">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setInterviewType('Tech_Lead')}
                                        className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                                            interviewType === 'Tech_Lead'
                                                ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600'
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-2 rounded-lg ${interviewType === 'Tech_Lead' ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                            </div>
                                            <span className={`font-bold ${interviewType === 'Tech_Lead' ? 'text-purple-900' : 'text-slate-700'}`}>Technical Round</span>
                                        </div>
                                        <p className="text-xs text-slate-500 pl-1">System design, coding concepts, and technical depth.</p>
                                        {interviewType === 'Tech_Lead' && (
                                            <div className="absolute top-2 right-2 text-purple-600">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Start Button */}
                            <button
                                onClick={handleStartInterview}
                                disabled={loading || !cvFile || !jobDescription.trim()}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        Preparing Room...
                                    </>
                                ) : (
                                    <>
                                        <span>Start Practice Session</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Info / Tips */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className="text-xl font-bold mb-4 flex items-center relative z-10">
                                <span className="mr-2">💡</span> Why Practice?
                            </h3>
                            <ul className="space-y-4 text-slate-300 text-sm relative z-10">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    <span><strong>AI-Powered Questions:</strong> Generated specifically based on your CV and the job description.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    <span><strong>Voice Interaction:</strong> Practice speaking confidently with speech-to-text technology.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    <span><strong>Instant Feedback:</strong> Receive detailed analysis on your answers after the session.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-4">Tips for Success</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                                    <p className="text-sm text-slate-600">Paste the <strong>exact job description</strong> you are applying for to get relevant questions.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                                    <p className="text-sm text-slate-600">Ensure your <strong>CV is up-to-date</strong> so the AI can ask about your recent projects.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                                    <p className="text-sm text-slate-600">Find a <strong>quiet place</strong> if you plan to use voice mode.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticeInterviewSetup;