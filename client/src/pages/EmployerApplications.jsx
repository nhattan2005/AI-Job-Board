import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import EmailTemplateModal from '../components/EmailTemplateModal';
import InterviewInvitationModal from '../components/InterviewInvitationModal';

const EmployerApplications = () => {
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        keyword: '',
        sortBy: 'date' // 👈 THÊM: Mặc định sắp xếp theo ngày
    });
    const [searchKeyword, setSearchKeyword] = useState(''); 
    
    const [viewingCV, setViewingCV] = useState(null);
    const [expandedAppId, setExpandedAppId] = useState(null);
    const [selectedApplications, setSelectedApplications] = useState([]);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    // 👇 SỬA: Đổi thành mảng để chứa nhiều application
    const [selectedApplicationsForInterview, setSelectedApplicationsForInterview] = useState([]);

    useEffect(() => {
        fetchJobAndApplications();
    }, [jobId]);

    const fetchJobAndApplications = async () => {
        try {
            setLoading(true);
            const [jobRes, appsRes] = await Promise.all([
                api.get(`/jobs/${jobId}`),
                api.get(`/jobs/${jobId}/applications`, {
                    params: {
                        status: filters.status === 'all' ? undefined : filters.status
                    }
                })
            ]);
            setJob(jobRes.data);
            setApplications(appsRes.data.applications);
        } catch (err) {
            console.error('Error:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (jobId) {
            fetchJobAndApplications();
        }
    }, [jobId, filters]);

    const updateApplicationStatus = async (applicationId, newStatus) => {
        try {
            await api.patch(`/applications/${applicationId}/status`, {
                status: newStatus
            });
            setApplications(apps => apps.map(app => 
                app.id === applicationId ? { ...app, status: newStatus } : app
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            fetchJobAndApplications();
        }
    };

    const openInterviewModal = (app) => {
        // Nếu truyền vào 1 app (từ nút Interview trên card), tạo mảng chứa 1 phần tử
        setSelectedApplicationsForInterview([app]);
        setIsInterviewModalOpen(true);
    };

    // 👇 THÊM: Hàm mở modal cho nhiều người (từ nút Bulk Action)
    const openBulkInterviewModal = () => {
        // Lấy danh sách object application từ danh sách ID đang chọn
        const selectedAppsObjects = applications.filter(app => selectedApplications.includes(app.id));
        setSelectedApplicationsForInterview(selectedAppsObjects);
        setIsInterviewModalOpen(true);
    };

    const downloadCV = async (app) => {
        try {
            const response = await api.get(`/applications/${app.id}/download-cv`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const extension = app.cv_filename ? app.cv_filename.split('.').pop().toLowerCase() : 'pdf';
            const link = document.createElement('a');
            link.href = url;
            link.download = `${app.candidate_name}_CV.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download CV. Please try again.');
        }
    };

    const handleDownloadCV = async (applicationId) => {
        try {
            const response = await api.get(`/applications/${applicationId}/download-cv`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `CV_${applicationId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download CV error:', error);
            alert('Failed to download CV');
        }
    };

    const toggleExpand = (appId) => {
        setExpandedAppId(prev => prev === appId ? null : appId);
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
            accepted: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            interview_scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
            interview_confirmed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };
        const label = status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${styles[status] || 'bg-gray-100'}`}>
                {label}
            </span>
        );
    };

    // ✅ CLIENT-SIDE FILTERING & SORTING
    const filteredApplications = applications.filter(app => {
        const matchesStatus = filters.status === 'all' || app.status === filters.status;
        
        let matchesKeyword = true;
        if (filters.keyword.trim()) {
            const keywords = filters.keyword.toLowerCase().split(',').map(k => k.trim()).filter(k => k);
            const cvText = (app.cv_text || '').toLowerCase();
            // 👇 SỬA: Đổi .some() (OR) thành .every() (AND)
            matchesKeyword = keywords.every(keyword => cvText.includes(keyword));
        }
        
        return matchesStatus && matchesKeyword;
    }).sort((a, b) => {
        // 👇 THÊM LOGIC SẮP XẾP TẠI ĐÂY
        if (filters.sortBy === 'match_score_desc') {
            return (b.match_score || 0) - (a.match_score || 0); // Cao -> Thấp
        }
        if (filters.sortBy === 'match_score_asc') {
            return (a.match_score || 0) - (b.match_score || 0); // Thấp -> Cao
        }
        // Mặc định: Mới nhất lên đầu
        return new Date(b.applied_at) - new Date(a.applied_at);
    });

    const toggleSelect = (appId) => {
        setSelectedApplications(prev => {
            if (prev.includes(appId)) return prev.filter(id => id !== appId);
            return [...prev, appId];
        });
    };

    const clearSelection = () => setSelectedApplications([]);

    // 👇 Hàm xử lý khi nhấn Enter
    const handleKeywordSearch = (e) => {
        if (e.key === 'Enter') {
            setFilters({ ...filters, keyword: searchKeyword });
        }
    };

    // 👇 Hàm reset search
    const handleClearSearch = () => {
        setSearchKeyword('');
        setFilters({ ...filters, keyword: '' });
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

    return (
        // 👇 THÊM: pt-8 px-4 (giữ nguyên pb-20 cũ)
        <div className="max-w-6xl mx-auto pt-8 pb-20 px-4">
            <div className="mb-8">
                
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{job?.title}</h1>
                        <p className="text-slate-500">{applications.length} Total Applications</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
                            <span className="block text-xl font-bold text-slate-800">{applications.filter(a => a.status === 'pending').length}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold">Pending</span>
                        </div>
                        <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
                            <span className="block text-xl font-bold text-purple-600">{applications.filter(a => a.status.includes('interview')).length}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold">Interview</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Filter Candidates</h3>
                
                {/* 👇 SỬA: Đổi grid-cols-2 thành grid-cols-3 để chứa thêm ô Sort */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                            <option value="interview_scheduled">Interview Scheduled</option>
                        </select>
                    </div>

                    {/* 👇 THÊM: Ô Sort By */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="date">Newest First</option>
                            <option value="match_score_desc">Match Score (High to Low)</option>
                            <option value="match_score_asc">Match Score (Low to High)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Keyword in CV</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyDown={handleKeywordSearch}
                                placeholder="Type keywords and press Enter..."
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searchKeyword && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">
                                {filters.keyword ? (
                                    <>
                                        <span className="text-green-600 font-semibold">✓</span> Searching: "{filters.keyword}"
                                    </>
                                ) : (
                                    "Press Enter to search"
                                )}
                            </p>
                            {filters.keyword && (
                                <button
                                    onClick={handleClearSearch}
                                    className="text-xs text-blue-600 hover:underline font-semibold"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {/* 👇 SỬA: Cập nhật hướng dẫn cho người dùng */}
                            <span className="font-semibold">Tip:</span> Use comma for AND search (e.g. "React, Python" finds CVs with BOTH)
                        </p>
                    </div>
                </div>

                {(filters.status !== 'all' || filters.keyword.trim()) && (
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                setFilters({ status: 'all', keyword: '' });
                                setSearchKeyword(''); // 👈 Reset input
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-20 z-10">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                    {['all', 'pending', 'reviewed', 'interview_scheduled', 'accepted', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilters(prev => ({ ...prev, status }))}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${
                                filters.status === status
                                    ? 'bg-slate-800 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {status === 'all' ? 'All Candidates' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredApplications.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <div className="text-slate-300 mb-4 text-6xl">📭</div>
                        <h3 className="text-lg font-bold text-slate-600">No applications found</h3>
                        <p className="text-slate-400">Try changing the filter status.</p>
                    </div>
                ) : (
                    filteredApplications.map(app => {
                        const isExpanded = expandedAppId === app.id;
                        const isSelected = selectedApplications.includes(app.id);

                        return (
                            <div key={app.id} className={`bg-white rounded-xl border transition-all duration-200 ${isSelected ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}>
                                <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    
                                    <div className="pt-1 md:pt-0">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected}
                                            onChange={() => toggleSelect(app.id)}
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-slate-900 truncate">{app.candidate_name}</h3>
                                            {getStatusBadge(app.status)}

                                            {/* 👇 THÊM ĐOẠN NÀY: Hiển thị Match Score */}
                                            {app.match_score && (
                                                <span className={`flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                                    app.match_score >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                                                    app.match_score >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                    </svg>
                                                    {app.match_score}%>
                                                </span>
                                            )}
                                            {/* 👆 KẾT THÚC ĐOẠN THÊM */}

                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span className="flex items-center truncate">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                {app.candidate_email}
                                            </span>
                                            <span className="hidden md:flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {new Date(app.applied_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 min-w-[200px] justify-end">
                                        
                                        {app.status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => updateApplicationStatus(app.id, 'reviewed')}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition"
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm('Are you sure you want to reject this candidate?')) {
                                                            updateApplicationStatus(app.id, 'rejected');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        
                                        {app.status === 'reviewed' && (
                                            <button 
                                                onClick={() => openInterviewModal(app)}
                                                className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 shadow-sm transition flex items-center"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                Interview
                                            </button>
                                        )}

                                        {(app.status.includes('interview')) && (
                                            <>
                                                <button 
                                                    onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition"
                                                >
                                                    Hire
                                                </button>
                                                
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm('Are you sure you want to reject this candidate?')) {
                                                            updateApplicationStatus(app.id, 'rejected');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-bold rounded-lg hover:bg-red-100 transition"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}

                                        <button 
                                            onClick={() => toggleExpand(app.id)}
                                            className={`p-2 rounded-lg transition ${isExpanded ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-fade-in rounded-b-xl">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                {app.ai_advice && app.ai_advice.length > 0 && (
                                                    <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                                        <h4 className="font-bold text-purple-900 mb-3 flex items-center">
                                                            <span className="mr-2">✨</span> AI Insights
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {app.ai_advice.slice(0, 3).map((advice, idx) => (
                                                                <li key={idx} className="text-sm text-slate-700 flex items-start">
                                                                    <span className="text-purple-400 mr-2">•</span>
                                                                    {advice}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detected Skills</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {app.candidate_skills && app.candidate_skills.length > 0 ? (
                                                            app.candidate_skills.map((skill, i) => (
                                                                <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600">
                                                                    {skill}
                                                                </span>
                                                            ))
                                                        ) : <span className="text-sm text-slate-400 italic">No skills detected</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {app.cover_letter && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cover Letter</h4>
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                                                            {app.cover_letter}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <button onClick={() => setViewingCV(app)} className="flex items-center justify-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        View CV
                                                    </button>
                                                    <button onClick={() => downloadCV(app)} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {viewingCV && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{viewingCV.candidate_name}'s CV</h2>
                                <p className="text-sm text-slate-500">Preview Mode</p>
                            </div>
                            <button onClick={() => setViewingCV(null)} className="p-2 hover:bg-slate-100 rounded-full transition">
                                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                            <div className="bg-white p-8 shadow-sm min-h-full whitespace-pre-wrap font-mono text-sm text-slate-700 rounded-lg border border-slate-200">
                                {viewingCV.cv_text}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EmailTemplateModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                selectedApplicationIds={selectedApplications}
                onSent={(result) => {
                    clearSelection();
                    fetchJobAndApplications();
                }}
            />

            <InterviewInvitationModal
                isOpen={isInterviewModalOpen}
                onClose={() => {
                    setIsInterviewModalOpen(false);
                    setSelectedApplicationsForInterview([]); // Reset về mảng rỗng
                }}
                applications={selectedApplicationsForInterview} // 👇 Truyền mảng vào prop mới
                jobTitle={job?.title}
                onSent={(result) => {
                    fetchJobAndApplications();
                    clearSelection(); // Xóa selection sau khi gửi thành công
                }}
            />

            {/* 👇 THÊM ĐOẠN NÀY: Thanh thao tác nổi ở dưới cùng (Floating Bar) */}
            {selectedApplications.length > 0 && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-fade-in-up border border-slate-700 backdrop-blur-sm bg-opacity-95">
                    <div className="flex items-center gap-2">
                        <span className="bg-white text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                            {selectedApplications.length}
                        </span>
                        <span className="font-semibold text-sm">Selected</span>
                    </div>
                    
                    <div className="h-4 w-px bg-slate-600"></div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={openBulkInterviewModal} 
                            className="flex items-center gap-2 text-sm font-bold hover:text-purple-300 transition group"
                        >
                            <span className="p-1.5 bg-purple-600 rounded-full group-hover:bg-purple-500 transition">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </span>
                            <span>Interview</span>
                        </button>

                        <button 
                            onClick={() => setIsEmailModalOpen(true)} 
                            className="flex items-center gap-2 text-sm font-bold hover:text-blue-300 transition group ml-2"
                        >
                            <span className="p-1.5 bg-blue-600 rounded-full group-hover:bg-blue-500 transition">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </span>
                            <span>Email</span>
                        </button>
                    </div>

                    <div className="h-4 w-px bg-slate-600"></div>

                    <button 
                        onClick={clearSelection}
                        className="text-slate-400 hover:text-white transition flex items-center gap-1 text-xs font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel
                    </button>
                </div>
            )}
            {/* 👆 KẾT THÚC ĐOẠN THÊM */}

            <div className="bg-white p-8 shadow-sm min-h-full whitespace-pre-wrap font-mono text-sm text-slate-700 rounded-lg border border-slate-200">
                {viewingCV?.cv_text}
            </div>
        </div>
    );
};

export default EmployerApplications;