import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import EmailTemplateModal from '../components/EmailTemplateModal';
import InterviewInvitationModal from '../components/InterviewInvitationModal';

const EmployerApplications = () => {
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    
    // UI States
    const [viewingCV, setViewingCV] = useState(null);
    const [expandedAppId, setExpandedAppId] = useState(null);
    const [selectedApplications, setSelectedApplications] = useState([]);
    
    // Modals
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [selectedApplicationForInterview, setSelectedApplicationForInterview] = useState(null);

    useEffect(() => {
        fetchJobAndApplications();
    }, [jobId]);

    const fetchJobAndApplications = async () => {
        try {
            setLoading(true);
            const jobResponse = await axios.get(`/api/jobs/${jobId}`);
            setJob(jobResponse.data);
            
            const appsResponse = await axios.get(`/api/jobs/${jobId}/applications`);
            setApplications(appsResponse.data.applications);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const updateApplicationStatus = async (applicationId, newStatus) => {
        try {
            await axios.patch(`/api/applications/${applicationId}/status`, {
                status: newStatus
            });
            // Optimistic update
            setApplications(apps => apps.map(app => 
                app.id === applicationId ? { ...app, status: newStatus } : app
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update application status');
        }
    };

    const openInterviewModal = (app) => {
        setSelectedApplicationForInterview(app);
        setIsInterviewModalOpen(true);
    };

    const downloadCV = (app) => {
        if (!app.cv_text) {
            alert('No CV text available');
            return;
        }
        const blob = new Blob([app.cv_text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${app.candidate_name || 'candidate'}_CV_${app.cv_filename || 'cv.txt'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const toggleExpand = (id) => {
        setExpandedAppId(expandedAppId === id ? null : id);
    };

    // --- HELPER FUNCTIONS FOR UI ---

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

    // --- FILTER LOGIC ---
    const filteredApplications = applications.filter(app => 
        filter === 'all' ? true : app.status === filter
    );

    // --- SELECTION LOGIC ---
    const toggleSelect = (appId) => {
        setSelectedApplications(prev => {
            if (prev.includes(appId)) return prev.filter(id => id !== appId);
            return [...prev, appId];
        });
    };

    const clearSelection = () => setSelectedApplications([]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header Section */}
            <div className="mb-8">
                <Link to="/employer/dashboard" className="text-slate-500 hover:text-blue-600 font-medium flex items-center mb-4 transition">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Back to Dashboard
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{job?.title}</h1>
                        <p className="text-slate-500">{applications.length} Total Applications</p>
                    </div>
                    <div className="flex gap-3">
                        {/* Stats Cards Mini */}
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

            {/* Toolbar: Filter & Bulk Actions */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-20 z-10">
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                    {['all', 'pending', 'reviewed', 'interview_scheduled', 'accepted', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${
                                filter === status
                                    ? 'bg-slate-800 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {status === 'all' ? 'All Candidates' : status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>

                {/* Bulk Actions */}
                {selectedApplications.length > 0 && (
                    <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 animate-fade-in">
                        <span className="text-sm font-bold text-blue-800">{selectedApplications.length} selected</span>
                        <button onClick={() => setIsEmailModalOpen(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-semibold shadow-sm">
                            Send Email
                        </button>
                        <button onClick={clearSelection} className="text-slate-400 hover:text-slate-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Applications List */}
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
                                {/* Main Card Row */}
                                <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    
                                    {/* Checkbox */}
                                    <div className="pt-1 md:pt-0">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected}
                                            onChange={() => toggleSelect(app.id)}
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>

                                    {/* Candidate Info */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-slate-900 truncate">{app.candidate_name}</h3>
                                            {getStatusBadge(app.status)}
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

                                    {/* Primary Actions - Context Aware */}
                                    <div className="flex items-center gap-2 min-w-[200px] justify-end">
                                        
                                        {/* LOGIC MỚI: Pending -> Accept / Reject */}
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
                                        
                                        {/* LOGIC MỚI: Reviewed (Đã Accept) -> Interview */}
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
                                            <button 
                                                onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                                className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 shadow-sm transition"
                                            >
                                                Hire
                                            </button>
                                        )}

                                        {/* Expand Toggle */}
                                        <button 
                                            onClick={() => toggleExpand(app.id)}
                                            className={`p-2 rounded-lg transition ${isExpanded ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details Section */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-fade-in rounded-b-xl">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Left: AI Insights & Skills */}
                                            <div className="space-y-6">
                                                {/* AI Advice */}
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

                                                {/* Skills */}
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

                                            {/* Right: Cover Letter & Secondary Actions */}
                                            <div className="space-y-6">
                                                {/* Cover Letter */}
                                                {app.cover_letter && (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cover Letter</h4>
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                                                            {app.cover_letter}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Secondary Actions Grid */}
                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <button onClick={() => setViewingCV(app)} className="flex items-center justify-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        View CV
                                                    </button>
                                                    <button onClick={() => downloadCV(app)} className="flex items-center justify-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
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

            {/* Modals */}
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
                    setSelectedApplicationForInterview(null);
                }}
                application={selectedApplicationForInterview}
                jobTitle={job?.title}
                onSent={(result) => {
                    fetchJobAndApplications();
                }}
            />
        </div>
    );
};

export default EmployerApplications;