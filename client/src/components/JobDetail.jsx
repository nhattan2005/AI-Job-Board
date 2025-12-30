import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ReportModal from './ReportModal'; // Đảm bảo đã import

// Helper Component for Accordion Suggestions
const SuggestionAccordion = ({ suggestion, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Hàm xử lý format text: Tìm 'text' hoặc *text* và chuyển thành <strong>text</strong>
    const formatContent = (text) => {
        if (!text) return "";
        
        // Regex để split chuỗi, giữ lại các phần nằm trong '...' hoặc *...*
        // Pattern: ('[^']+') HOẶC (\*[^*]+\*)
        const parts = text.split(/('[^']+'|\*[^*]+\*)/g);
        
        return parts.map((part, i) => {
            // Xử lý 'text' -> in đậm, bỏ dấu nháy
            if (part.startsWith("'") && part.endsWith("'")) {
                return <strong key={i} className="font-bold text-slate-900">{part.slice(1, -1)}</strong>;
            }
            // Xử lý *text* -> in đậm, bỏ dấu sao
            if (part.startsWith("*") && part.endsWith("*")) {
                return <strong key={i} className="font-bold text-slate-900">{part.slice(1, -1)}</strong>;
            }
            // Text thường
            return part;
        });
    };

    return (
        <div className={`border border-slate-200 rounded-xl mb-3 overflow-hidden transition-all hover:shadow-md bg-white ${isOpen ? 'ring-1 ring-blue-200' : ''}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 text-left flex items-start gap-4 bg-white hover:bg-slate-50 transition-colors group"
            >
                {/* Số thứ tự */}
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mt-0.5">
                    {index + 1}
                </span>

                {/* Nội dung chính - Tự động mở rộng khi isOpen = true */}
                <div className={`flex-grow text-slate-700 text-sm leading-relaxed ${!isOpen ? 'line-clamp-1 text-slate-500' : ''}`}>
                    {formatContent(suggestion)}
                </div>

                {/* Mũi tên chỉ xuống */}
                <svg 
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 mt-1 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
    );
};

const JobDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { isAuthenticated, isCandidate } = useAuth();
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
    const [analyzing, setAnalyzing] = useState(false);

    // Favorite & Report state
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    // 👇 THÊM HÀM formatSalary Ở ĐÂY
    const formatSalary = (job) => {
        // 1. Ưu tiên hiển thị salary_range (chuỗi) nếu có
        if (job.salary_range) return job.salary_range;
        
        // 2. Fallback sang logic min/max (nếu có)
        const min = job.salary_min;
        const max = job.salary_max;

        if ((!min && !max) || (min === 0 && max === 0)) return "Negotiable";
        
        const format = (n) => n?.toLocaleString('en-US');
        
        if (min && (!max || max === 0)) return `From $${format(min)}`;
        if ((!min || min === 0) && max) return `Up to $${format(max)}`;
        return `$${format(min)} - $${format(max)}`;
    };

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                const jobRes = await api.get(`/jobs/${id}`);
                let jobData = jobRes.data;
                if (Array.isArray(jobData)) {
                    jobData = jobData[0];
                }
                
                if (!jobData) throw new Error("Job data is empty");
                setJob(jobData);

                if (isAuthenticated && isCandidate) {
                    checkApplicationStatus(id);
                    checkFavoriteStatus(id); // 👈 THÊM
                }

            } catch (err) {
                console.error("Error fetching job:", err);
                setError('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        const checkApplicationStatus = async (jobId) => {
            try {
                const checkRes = await api.get(`/applications/check/${jobId}`);
                setHasApplied(checkRes.data.hasApplied);
            } catch (err) {
                console.warn("Application check failed (ignoring):", err.message);
            }
        };

        // 👇 THÊM HÀM: Kiểm tra favorite status
        const checkFavoriteStatus = async (jobId) => {
            try {
                const checkRes = await api.get(`/favorites/check/${jobId}`);
                setIsFavorite(checkRes.data.isFavorite);
            } catch (err) {
                console.warn("Favorite check failed (ignoring):", err.message);
            }
        };

        if (id) {
            fetchJobData();
        }
    }, [id, isAuthenticated, isCandidate]);

    const handleFileChange = (e) => {
        setCvFile(e.target.files[0]);
        setMatchScore(null);
        setAiSuggestions(null);
    };

    // Unified Analysis Function
    const handleAnalyzeCV = async () => {
        if (!cvFile) return;
        setAnalyzing(true);
        
        const formData = new FormData();
        formData.append('cv', cvFile);
        formData.append('jobId', id);

        try {
            // Run both requests in parallel for better UX
            const [matchRes, suggestRes] = await Promise.all([
                api.post('/ai/match', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
                api.post('/ai/tailor-cv', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            ]);

            // Handle Match Score
            const rawScore = matchRes.data.matchScore !== undefined ? matchRes.data.matchScore : matchRes.data.score;
            if (rawScore !== undefined) {
                setMatchScore(Math.round(Number(rawScore)));
            }

            // Handle Suggestions
            if (suggestRes.data.suggestions) {
                setAiSuggestions(suggestRes.data.suggestions);
            }

        } catch (err) {
            console.error("Analysis Error:", err);
            alert('Failed to analyze CV. Please try again.');
        } finally {
            setAnalyzing(false);
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
        
        // FIX: Đổi 'jobId' thành 'job_id' để khớp với Backend
        formData.append('job_id', id); 
        
        formData.append('coverLetter', coverLetter);
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

    // 👇 THÊM HÀM: Toggle favorite
    const handleToggleFavorite = async () => {
        if (!isAuthenticated || !isCandidate) return;
        
        setFavoriteLoading(true);
        try {
            if (isFavorite) {
                await api.delete(`/favorites/remove/${id}`);
                setIsFavorite(false);
            } else {
                await api.post('/favorites/add', { job_id: id });
                setIsFavorite(true);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
            alert('Failed to update favorite status');
        } finally {
            setFavoriteLoading(false);
        }
    };

    // Helper for progress bar color
    const getScoreColor = (score) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getScoreTextColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    // 👇 XÓA HÀM NÀY (vì avatar_url đã là link Cloudinary đầy đủ)
    // const getImageUrl = (path) => path ? `http://localhost:5000${path}` : null;

    // Helper để kiểm tra deadline
    const isExpired = job?.deadline && new Date(job.deadline) < new Date();
    const isClosed = job?.status === 'closed';
    const canApply = !isExpired && !isClosed;

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    if (error) return <div className="text-center py-20 text-red-600 font-bold">{error}</div>;
    if (!job) return <div className="text-center py-20">Job not found</div>;

    return (
        <div className="max-w-5xl mx-auto pt-24 pb-12 px-4 sm:px-6">
            {/* Report Modal */}
            <ReportModal 
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetType="job"
                targetId={job?.id}
                targetName={job?.title}
            />

            <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-primary-600 mb-6 transition">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Back to Jobs
            </Link>

            {/* Main Content - Single Column Layout */}
            <div className="space-y-8">
                
                {/* Job Header & Description */}
                <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-100">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
                            <div className="flex items-center gap-3">
                                <Link to={`/employer/${job.employer_id}`}>
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 hover:border-blue-500 transition cursor-pointer">
                                        {job.avatar_url ? (
                                            <img 
                                                src={job.avatar_url} 
                                                alt={job.company_name} 
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <span 
                                            style={{ display: job.avatar_url ? 'none' : 'flex' }}
                                            className="w-full h-full flex items-center justify-center font-bold text-slate-500"
                                        >
                                            {job.company_name?.charAt(0)}
                                        </span>
                                    </div>
                                </Link>
                                
                                <div className="flex items-center gap-2 text-lg font-medium text-slate-600">
                                    <Link 
                                        to={`/employer/${job.employer_id}`} 
                                        className="text-primary-600 hover:text-blue-600 transition"
                                    >
                                        {job.company_name}
                                    </Link>
                                    <span className="text-slate-300">•</span>
                                    <span>{job.location}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Badge "APPLIED" */}
                            {isAuthenticated && isCandidate && hasApplied && (
                                <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-bold flex items-center border-2 border-green-200 shadow-sm animate-fade-in">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    APPLIED
                                </span>
                            )}

                            {/* Favorite Button */}
                            {isAuthenticated && isCandidate && (
                                <button
                                    onClick={handleToggleFavorite}
                                    disabled={favoriteLoading}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                        isFavorite 
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200' 
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border-2 border-slate-200'
                                    } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {favoriteLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                                    ) : (
                                        <svg className="w-6 h-6" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Report Button (Nhỏ gọn) */}
                            {isAuthenticated && (
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Report this job"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Job Info Badges */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium flex items-center">
                            💼 {job.employment_type}
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium flex items-center">
                            💰 {formatSalary(job)}
                        </span>
                        
                        {/* Số lượng apply */}
                        <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium flex items-center">
                            👥 {job.application_count || 0} Applicants
                        </span>

                        {/* Deadline */}
                        {job.deadline && (
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center ${isExpired ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                                ⏰ Deadline: {new Date(job.deadline).toLocaleDateString()}
                                {isExpired && ' (Expired)'}
                            </span>
                        )}
                    </div>

                    {/* Job Description */}
                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Job Description</h3>
                        <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                            {job.description}
                        </div>
                    </div>
                </div>

                {/* AI Section & Application Form (Only for Candidates) */}
                {isAuthenticated && isCandidate && (
                    <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden relative">
                        {/* Header Gradient */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                            <h2 className="text-xl font-bold flex items-center relative z-10">
                                <span className="mr-2 text-2xl">✨</span> AI Application Assistant
                            </h2>
                            <p className="text-slate-300 text-sm mt-1 relative z-10">Optimize your CV and Apply directly.</p>
                        </div>

                        <div className="p-8">
                            {/* 1. Upload CV */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-3">1. Upload Your CV (PDF)</label>
                                <div className="relative group">
                                    <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-slate-200 rounded-xl p-1" />
                                </div>
                            </div>

                            {/* 2. Cover Letter (Optional) */}
                            {canApply && (
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-700 mb-3">2. Cover Letter (Optional)</label>
                                    <textarea 
                                        value={coverLetter} 
                                        onChange={(e) => setCoverLetter(e.target.value)} 
                                        rows="3" 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition" 
                                        placeholder="Why are you a good fit for this role?" 
                                    />
                                </div>
                            )}

                            {/* Action Buttons Row */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                {/* Analyze Button */}
                                <button 
                                    onClick={handleAnalyzeCV} 
                                    disabled={!cvFile || analyzing} 
                                    className="flex-1 py-4 bg-white border-2 border-primary-600 text-primary-700 hover:bg-primary-50 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {analyzing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            Analyze CV & Match
                                        </>
                                    )}
                                </button>

                                {/* Apply Button */}
                                {canApply ? (
                                    <button 
                                        onClick={handleApply} 
                                        disabled={loadingApply || hasApplied || !cvFile} 
                                        className="flex-1 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                    >
                                        {loadingApply ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Sending...
                                            </>
                                        ) : hasApplied ? (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                Applied
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                                Apply Now
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="flex-1 py-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold flex items-center justify-center">
                                        {isClosed ? 'Job Closed' : 'Deadline Passed'}
                                    </div>
                                )}
                            </div>

                            {/* Results Section */}
                            {(matchScore !== null || aiSuggestions) && (
                                <div className="space-y-8 animate-fade-in pt-6 border-t border-slate-100">
                                    
                                    {/* 1. Match Score Progress Bar */}
                                    {matchScore !== null && (
                                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="font-bold text-slate-700 text-lg">Match Score</span>
                                                <span className={`text-3xl font-extrabold ${getScoreTextColor(matchScore)}`}>
                                                    {matchScore}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getScoreColor(matchScore)}`}
                                                    style={{ width: `${matchScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Skill Gap Analysis */}
                                    {aiSuggestions && (
                                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                                            <h3 className="font-bold text-slate-800 mb-4 flex items-center text-lg">
                                                <svg className="w-6 h-6 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                Skill Gap Analysis
                                            </h3>
                                            
                                            <div className="space-y-4">
                                                {aiSuggestions.missingSkills?.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Missing Hard Skills</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {aiSuggestions.missingSkills.map((skill, i) => (
                                                                <span key={i} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 flex items-center">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {aiSuggestions.missingKeywords?.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Missing Keywords</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {aiSuggestions.missingKeywords.map((k, i) => (
                                                                <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg border border-slate-200">
                                                                    {k}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Smart Suggestions */}
                                    {aiSuggestions?.suggestions?.length > 0 && (
                                        <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                                            <h3 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
                                                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                                Smart Suggestions
                                            </h3>
                                            <div>
                                                {aiSuggestions.suggestions.map((s, i) => (
                                                    <SuggestionAccordion key={i} suggestion={s} index={i} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Login Prompt for Non-Auth Users */}
                {!isAuthenticated && (
                    <div className="bg-white p-8 rounded-2xl shadow-soft text-center border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Interested in this job?</h3>
                        <p className="text-slate-600 mb-6">Sign in to access AI features and apply directly.</p>
                        <Link to="/login" className="inline-block px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-500/30">
                            Login to Apply
                        </Link>
                    </div>
                )}

                {/* AI Mock Interview Card */}
                {isAuthenticated && isCandidate && (
                    <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl shadow-soft overflow-hidden relative text-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="p-8 relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center mb-2">
                                        <span className="mr-3 text-3xl">🎙️</span> 
                                        AI Mock Interview
                                    </h3>
                                    <p className="text-indigo-200 max-w-xl text-sm md:text-base">
                                        Practice answering real interview questions generated from this specific Job Description. 
                                        Get instant feedback on your answers and speaking confidence.
                                    </p>
                                </div>
                                <div className="hidden md:block bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                    <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate(`/ai-interview/${id}/HR`)}
                                    className="group relative flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-500/20 p-2 rounded-lg">
                                            <span className="text-2xl">👤</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">HR Round</div>
                                            <div className="text-xs text-indigo-200">Behavioral & Culture Fit</div>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-white/50 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>

                                <button
                                    onClick={() => navigate(`/ai-interview/${id}/Tech_Lead`)}
                                    className="group relative flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/20 p-2 rounded-lg">
                                            <span className="text-2xl">💻</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">Technical Round</div>
                                            <div className="text-xs text-indigo-200">Coding & System Design</div>
                                        </div>
                                    </div>
                                    <svg className="w-5 h-5 text-white/50 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetail;