import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const JobDetail = () => {
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
    const [loadingScore, setLoadingScore] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                // 1. Lấy thông tin Job (QUAN TRỌNG NHẤT)
                const jobRes = await api.get(`/jobs/${id}`);
                
                // Xử lý nếu backend trả về mảng thay vì object
                let jobData = jobRes.data;
                if (Array.isArray(jobData)) {
                    jobData = jobData[0];
                }
                
                if (!jobData) throw new Error("Job data is empty");
                setJob(jobData);

                // 2. Kiểm tra trạng thái ứng tuyển (Tách riêng ra để không gây lỗi trang)
                if (isAuthenticated && isCandidate) {
                    checkApplicationStatus(id);
                }

            } catch (err) {
                console.error("Error fetching job:", err);
                setError('Failed to load job details');
            } finally {
                setLoading(false);
            }
        };

        // Hàm kiểm tra ứng tuyển riêng biệt, có try/catch riêng
        const checkApplicationStatus = async (jobId) => {
            try {
                const checkRes = await api.get(`/applications/check/${jobId}`);
                setHasApplied(checkRes.data.hasApplied);
            } catch (err) {
                // Nếu lỗi 404 nghĩa là chưa apply hoặc API chưa có, ta chỉ log warning chứ không chặn UI
                console.warn("Application check failed (ignoring):", err.message);
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

            console.log("AI Response:", res.data); // Xem log để biết chính xác backend trả về gì

            // FIX: Kiểm tra cả 2 trường hợp tên biến phổ biến và làm tròn số
            // Backend có thể trả về 'matchScore' hoặc 'score'
            const rawScore = res.data.matchScore !== undefined ? res.data.matchScore : res.data.score;
            
            if (rawScore !== undefined) {
                // Làm tròn thành số nguyên (ví dụ: 42.45 -> 42)
                setMatchScore(Math.round(Number(rawScore)));
            } else {
                alert("Could not retrieve score from response");
            }

        } catch (err) {
            console.error("AI Match Error:", err);
            alert('Failed to calculate match score');
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
    if (error) return <div className="text-center py-20 text-red-600 font-bold">{error}</div>;
    if (!job) return <div className="text-center py-20">Job not found</div>;

    return (
        <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6">
            <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-primary-600 mb-6 transition">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Back to Jobs
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-8">
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
                                💼 {job.employment_type}
                            </span>
                            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium flex items-center">
                                💰 ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                            </span>
                        </div>

                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Job Description</h3>
                            <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                                {job.description}
                            </div>
                        </div>
                    </div>

                    {/* AI Section */}
                    {isAuthenticated && isCandidate && (
                        <div className="bg-white rounded-2xl p-8 shadow-soft border border-slate-100 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500"></div>
                            <h2 className="text-xl font-bold text-slate-900 mb-6">✨ AI Application Assistant</h2>

                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-slate-700 mb-3">1. Upload Your CV (PDF)</label>
                                <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-slate-200 rounded-xl p-1" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <button onClick={handleCalculateScore} disabled={!cvFile || loadingScore} className="p-4 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50 transition-all text-left group disabled:opacity-50">
                                    <div className="font-bold text-slate-800 group-hover:text-primary-700">🎯 Match Score</div>
                                </button>
                                <button onClick={handleGetSuggestions} disabled={!cvFile || loadingSuggestions} className="p-4 rounded-xl border border-slate-200 hover:border-secondary-500 hover:bg-secondary-50 transition-all text-left group disabled:opacity-50">
                                    <div className="font-bold text-slate-800 group-hover:text-secondary-700">💡 AI Suggestions</div>
                                </button>
                            </div>

                            {matchScore !== null && (
                                <div className="mb-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-sm font-medium text-slate-500">Match Score</p>
                                    <p className={`text-3xl font-bold ${matchScore >= 70 ? 'text-green-600' : 'text-orange-500'}`}>{matchScore}%</p>
                                </div>
                            )}

                            {aiSuggestions && (
                                <div className="bg-primary-50/50 rounded-xl p-6 border border-primary-100 space-y-4">
                                    <h3 className="font-bold text-primary-900">AI Analysis</h3>
                                    <ul className="space-y-2">
                                        {aiSuggestions.suggestions?.map((s, i) => (
                                            <li key={i} className="flex items-start text-sm text-slate-700"><span className="mr-2 text-primary-500">•</span> {s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 sticky top-24">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Interested?</h3>
                        {isAuthenticated ? (
                            isCandidate ? (
                                <>
                                    <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows="4" className="w-full px-4 py-3 rounded-xl border border-slate-200 mb-4 text-sm" placeholder="Cover Letter (Optional)" />
                                    <button onClick={handleApply} disabled={loadingApply || hasApplied || !cvFile} className="w-full btn-primary disabled:opacity-50">
                                        {loadingApply ? 'Sending...' : hasApplied ? 'Applied' : 'Apply Now'}
                                    </button>
                                    {!cvFile && !hasApplied && <p className="text-xs text-red-500 mt-2 text-center">Upload CV first</p>}
                                </>
                            ) : <div className="p-4 bg-slate-50 rounded-xl text-center text-sm">Employers cannot apply.</div>
                        ) : (
                            <Link to="/login" className="block w-full text-center btn-primary">Login to Apply</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetail;