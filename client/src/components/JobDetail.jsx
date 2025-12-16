import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const JobDetail = () => {
    const { id } = useParams();
    const { isAuthenticated, isCandidate, user } = useAuth();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Application state
    const [cvFile, setCvFile] = useState(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [loadingApply, setLoadingApply] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    // AI features state
    const [matchScore, setMatchScore] = useState(null);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [loadingScore, setLoadingScore] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        const fetchJobAndStatus = async () => {
            try {
                const jobRes = await api.get(`/jobs/${id}`);
                setJob(jobRes.data);

                if (isAuthenticated && isCandidate) {
                    const checkRes = await api.get(`/applications/check/${id}`);
                    setHasApplied(checkRes.data.hasApplied);
                }
            } catch (err) {
                setError('Failed to load job details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchJobAndStatus();
    }, [id, isAuthenticated, isCandidate]);

    const handleFileChange = (e) => {
        setCvFile(e.target.files[0]);
        // Reset AI results when new file is chosen
        setMatchScore(null);
        setAiSuggestions(null);
    };

    const handleCalculateScore = async () => {
        if (!cvFile) return;
        setLoadingScore(true);
        
        const formData = new FormData();
        formData.append('cv', cvFile);
        formData.append('jobId', id);

        try {
            const res = await api.post('/ai/match', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMatchScore(res.data.matchScore);
        } catch (err) {
            alert('Failed to calculate match score');
            console.error(err);
        } finally {
            setLoadingScore(false);
        }
    };

    const handleGetSuggestions = async () => {
        if (!cvFile) return;
        setLoadingSuggestions(true);

        const formData = new FormData();
        formData.append('cv', cvFile);
        formData.append('jobId', id);

        try {
            const res = await api.post('/ai/tailor-cv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAiSuggestions(res.data.analysis);
        } catch (err) {
            alert('Failed to get AI suggestions');
            console.error(err);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleApply = async () => {
        if (!cvFile) {
            alert('Please upload your CV first');
            return;
        }

        setLoadingApply(true);
        const formData = new FormData();
        formData.append('cv', cvFile);
        formData.append('jobId', id);
        formData.append('coverLetter', coverLetter);
        
        // Include AI data if available
        if (matchScore) formData.append('matchScore', matchScore);
        if (aiSuggestions) formData.append('aiAdvice', JSON.stringify(aiSuggestions));

        try {
            await api.post('/applications/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setHasApplied(true);
            alert('Application submitted successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to apply');
        } finally {
            setLoadingApply(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    if (error) return <div className="text-center py-20 text-red-600">{error}</div>;
    if (!job) return <div className="text-center py-20">Job not found</div>;

    return (
        <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6">
            {/* Breadcrumb */}
            <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-primary-600 mb-6 transition">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Back to Jobs
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-100">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
                                <div className="flex items-center gap-2 text-lg font-medium text-slate-600">
                                    <span className="text-primary-600">{job.company_name}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{job.location}</span>
                                </div>
                            </div>
                            {hasApplied && (
                                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-bold text-sm border border-green-100 flex items-center">
                                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    Applied
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3 mb-8">
                            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium flex items-center">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {job.employment_type}
                            </span>
                            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium flex items-center">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                            </span>
                        </div>

                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Job Description</h3>
                            <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                                {job.description}
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis Section */}
                    {isAuthenticated && isCandidate && (
                        <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-100 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
                            
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                                <svg className="h-6 w-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                AI Application Assistant
                            </h2>

                            {/* Upload Section */}
                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                    1. Upload Your CV (PDF)
                                </label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-3 file:px-6
                                            file:rounded-xl file:border-0
                                            file:text-sm file:font-bold
                                            file:bg-primary-50 file:text-primary-700
                                            hover:file:bg-primary-100
                                            cursor-pointer border border-slate-200 rounded-xl p-1"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={handleCalculateScore}
                                    disabled={!cvFile || loadingScore}
                                    className="p-4 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-left group disabled:opacity-50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-800 group-hover:text-primary-700">Match Score</span>
                                        <span className="text-2xl">🎯</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Calculate compatibility %</p>
                                </button>

                                <button
                                    onClick={handleGetSuggestions}
                                    disabled={!cvFile || loadingSuggestions}
                                    className="p-4 rounded-xl border border-slate-200 hover:border-secondary-500 hover:bg-secondary-50 transition-all text-left group disabled:opacity-50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-800 group-hover:text-secondary-700">AI Suggestions</span>
                                        <span className="text-2xl">💡</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Get improvement tips</p>
                                </button>
                            </div>

                            {/* Results Area */}
                            {matchScore !== null && (
                                <div className="mb-6 p-6 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Match Score</p>
                                        <p className={`text-3xl font-bold ${matchScore >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                                            {matchScore}%
                                        </p>
                                    </div>
                                    <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${matchScore >= 70 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${matchScore}%` }}></div>
                                    </div>
                                </div>
                            )}

                            {/* AI Suggestions List */}
                            {aiSuggestions && (
                                <div className="bg-primary-50/50 rounded-xl p-6 border border-primary-100 space-y-6">
                                    <h3 className="font-bold text-primary-900 text-lg">AI Analysis Results</h3>
                                    
                                    {/* Missing Keywords */}
                                    {aiSuggestions.missingKeywords && aiSuggestions.missingKeywords.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Missing Keywords</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {aiSuggestions.missingKeywords.map((kw, i) => (
                                                    <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md font-medium border border-red-200">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Suggestions */}
                                    {aiSuggestions.suggestions && aiSuggestions.suggestions.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Suggestions</h4>
                                            <ul className="space-y-2">
                                                {aiSuggestions.suggestions.map((s, i) => (
                                                    <li key={i} className="flex items-start text-sm text-slate-700">
                                                        <span className="mr-2 text-primary-500 mt-0.5">•</span> {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Sidebar / Actions */}
                <div className="space-y-6">
                    {/* Apply Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 sticky top-24">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Interested in this job?</h3>
                        
                        {isAuthenticated ? (
                            isCandidate ? (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Cover Letter (Optional)
                                        </label>
                                        <textarea
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                            rows="4"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                            placeholder="Why are you a good fit?"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApply}
                                        disabled={loadingApply || hasApplied || !cvFile}
                                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        {loadingApply ? 'Sending...' : hasApplied ? 'Applied Successfully' : 'Apply Now'}
                                    </button>
                                    {!cvFile && !hasApplied && (
                                        <p className="text-xs text-red-500 mt-2 text-center">Please upload CV in the AI section first</p>
                                    )}
                                </>
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 text-sm">
                                    Employers cannot apply to jobs.
                                </div>
                            )
                        ) : (
                            <Link to="/login" className="block w-full text-center btn-primary">
                                Login to Apply
                            </Link>
                        )}

                        {/* Career Path Promo Sidebar */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-primary-500 rounded-full blur-[40px] opacity-30 group-hover:opacity-50 transition"></div>
                                <h4 className="font-bold mb-2 relative z-10">Plan your career?</h4>
                                <p className="text-xs text-slate-300 mb-4 relative z-10">Get a personalized roadmap with AI.</p>
                                <Link to="/career-path" className="block w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-center text-xs font-bold transition backdrop-blur-sm">
                                    Try Career AI
                                </Link>
                            </div>
                        </div>
                    </div>
                                </div>
        </div>
    </div>
);};

export default JobDetail;