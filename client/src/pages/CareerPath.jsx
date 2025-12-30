import React, { useState, useRef } from 'react'; // 👈 THÊM useRef
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const CareerPath = () => {
    const [cvText, setCvText] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [targetGoal, setTargetGoal] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    
    // 👇 THÊM: State để quản lý việc chọn Path và Roadmap riêng
    const [selectedPath, setSelectedPath] = useState(null);
    const [roadmapResult, setRoadmapResult] = useState(null);
    const [loadingRoadmap, setLoadingRoadmap] = useState(false);
    const roadmapRef = useRef(null); // Để scroll xuống roadmap khi có kết quả

    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [useFileUpload, setUseFileUpload] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setCvFile(file);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        setError(null);
        setLoading(true);
        setResult(null);
        
        // 👇 Reset roadmap khi phân tích mới
        setRoadmapResult(null);
        setSelectedPath(null);

        try {
            let response;

            if (useFileUpload && cvFile) {
                const formData = new FormData();
                formData.append('cv', cvFile);
                // 👇 THÊM: Gửi targetGoal kèm theo file
                formData.append('targetGoal', targetGoal);

                response = await api.post('/career/generate', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else if (!useFileUpload && cvText.trim()) {
                // 👇 THÊM: Gửi targetGoal kèm theo text
                response = await api.post('/career/generate', { 
                    cvText: cvText,
                    targetGoal: targetGoal 
                });
            } else {
                setError('Please provide CV text or upload a file');
                setLoading(false);
                return;
            }

            setResult(response.data.data);
        } catch (err) {
            console.error('Career path error:', err);
            setError(err.response?.data?.error || 'Failed to generate career path. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 👇 THÊM: Hàm xử lý khi chọn một Path cụ thể
    const handleSelectPath = async (pathName) => {
        setSelectedPath(pathName);
        setLoadingRoadmap(true);
        setRoadmapResult(null);
        setError(null);

        try {
            let response;
            // Gọi lại API nhưng lần này truyền pathName vào targetGoal
            // để AI vẽ roadmap cụ thể cho vị trí này
            if (useFileUpload && cvFile) {
                const formData = new FormData();
                formData.append('cv', cvFile);
                formData.append('targetGoal', pathName); // 👈 Quan trọng

                response = await api.post('/career/generate', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else if (!useFileUpload && cvText.trim()) {
                response = await api.post('/career/generate', { 
                    cvText: cvText,
                    targetGoal: pathName // 👈 Quan trọng
                });
            }

            // Chỉ lấy phần roadmap và skill_gap mới từ kết quả
            setRoadmapResult(response.data.data);
            
            // Scroll xuống phần roadmap
            setTimeout(() => {
                roadmapRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err) {
            console.error("Error generating specific roadmap:", err);
            setError("Failed to generate roadmap for this path.");
        } finally {
            setLoadingRoadmap(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getMatchColor = (match) => {
        if (match >= 80) return 'text-green-600';
        if (match >= 60) return 'text-blue-600';
        return 'text-orange-600';
    };

    const handleApplyRoadmap = async () => {
        // 👇 SỬA: Dùng roadmapResult thay vì result
        if (!roadmapResult) return;
        setSaving(true);
        try {
            await api.post('/career/save', {
                target_role: selectedPath || result.current_positioning.role,
                roadmap: roadmapResult.roadmap, // Lấy roadmap chi tiết
                current_positioning: result.current_positioning,
                skill_gap: roadmapResult.skill_gap // Lấy skill gap chi tiết theo path
            });
            navigate('/my-roadmap');
        } catch (error) {
            console.error("Failed to save roadmap", error);
            alert("Failed to save roadmap. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        AI Career Path Analyzer
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Upload your CV to get personalized career recommendations, skill gap analysis, and a roadmap to your dream job.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Left Column: Input Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            {/* Toggle Buttons */}
                            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                                <button
                                    onClick={() => setUseFileUpload(false)}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!useFileUpload ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    📝 Paste Text
                                </button>
                                <button
                                    onClick={() => setUseFileUpload(true)}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${useFileUpload ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    📄 Upload File
                                </button>
                            </div>

                            {/* Input Area */}
                            <div className="mb-8">
                                {!useFileUpload ? (
                                    <div className="relative">
                                        <textarea
                                            value={cvText}
                                            onChange={(e) => setCvText(e.target.value)}
                                            rows="8"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none bg-slate-50 focus:bg-white"
                                            placeholder="Paste your CV content here... (Education, Experience, Skills, Projects, etc.)"
                                        />
                                        <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium bg-white/80 px-2 py-1 rounded">
                                            {cvText.length} chars
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${cvFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'}`}>
                                        <input
                                            type="file"
                                            id="cv-upload"
                                            accept=".pdf,.docx,.txt"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <label htmlFor="cv-upload" className="cursor-pointer w-full h-full block">
                                            {cvFile ? (
                                                <div className="flex flex-col items-center text-green-700">
                                                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-bold text-lg">{cvFile.name}</span>
                                                    <span className="text-sm mt-1">Click to change file</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-500">
                                                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <span className="font-semibold text-lg text-slate-700">Click to upload CV</span>
                                                    <span className="text-sm mt-1">PDF, DOCX or TXT (Max 5MB)</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* 👇 THÊM: Ô nhập Target Role / JD */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Target Role or Job Description (Optional)
                                </label>
                                <textarea
                                    value={targetGoal}
                                    onChange={(e) => setTargetGoal(e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none bg-slate-50 focus:bg-white"
                                    placeholder="e.g. Senior React Developer, or paste a specific Job Description here to get a tailored roadmap..."
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Leave empty for general career advice based on your current skills.
                                </p>
                            </div>

                            {/* Analyze Button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || (!useFileUpload && !cvText.trim()) || (useFileUpload && !cvFile)}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        Analyzing Your Profile...
                                    </>
                                ) : (
                                    <>
                                        <span>Analyze Career Path</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Info */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className="text-xl font-bold mb-4 flex items-center relative z-10">
                                <span className="mr-2">🚀</span> Unlock Your Potential
                            </h3>
                            <ul className="space-y-4 text-indigo-100 text-sm relative z-10">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    <span><strong>Current Positioning:</strong> Understand where you stand in the market.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    <span><strong>Skill Gap Analysis:</strong> Identify missing skills to reach the next level.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    <span><strong>Personalized Roadmap:</strong> Get a step-by-step plan to achieve your goals.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {result && (
                    <div className="space-y-8 animate-fade-in">
                        
                        {/* 1. Current Positioning */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                                <span className="bg-blue-100 text-blue-600 rounded-xl w-10 h-10 flex items-center justify-center mr-3 text-xl">
                                    📍
                                </span>
                                Current Positioning
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                                    <p className="text-sm text-slate-500 mb-1 font-medium uppercase tracking-wide">Role</p>
                                    <p className="text-xl font-bold text-slate-900">{result.current_positioning.role}</p>
                                </div>
                                <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                                    <p className="text-sm text-slate-500 mb-1 font-medium uppercase tracking-wide">Level</p>
                                    <p className="text-xl font-bold text-slate-900">{result.current_positioning.level}</p>
                                </div>
                                <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                                    <p className="text-sm text-slate-500 mb-1 font-medium uppercase tracking-wide">Salary Potential</p>
                                    <p className="text-xl font-bold text-slate-900">{result.current_positioning.salary_potential}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <p className="text-sm text-slate-500 mb-2 font-bold uppercase tracking-wide">Professional Summary</p>
                                <p className="text-slate-700 leading-relaxed">{result.current_positioning.summary}</p>
                            </div>
                        </div>

                        {/* 2. Skill Gaps */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                                <span className="bg-amber-100 text-amber-600 rounded-xl w-10 h-10 flex items-center justify-center mr-3 text-xl">
                                    ⚡
                                </span>
                                Skill Gap Analysis
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {result.skill_gap.map((skill, index) => (
                                    <div key={index} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition bg-white">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-slate-900 text-lg">{skill.skill}</h4>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getPriorityColor(skill.priority)}`}>
                                                {skill.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            Status: <span className="font-semibold text-slate-900">{skill.status}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Career Paths */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                                <span className="bg-green-100 text-green-600 rounded-xl w-10 h-10 flex items-center justify-center mr-3 text-xl">
                                    🎯
                                </span>
                                Recommended Career Paths
                            </h3>
                            <p className="text-slate-600 mb-6">Select a path below to generate a detailed roadmap:</p>
                            
                            <div className="space-y-6">
                                {result.paths.map((path, index) => (
                                    <div 
                                        key={index} 
                                        className={`border-2 rounded-xl p-6 transition cursor-pointer relative overflow-hidden ${
                                            selectedPath === path.name 
                                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                                : 'border-slate-200 hover:border-blue-300 hover:shadow-md bg-white'
                                        }`}
                                        onClick={() => handleSelectPath(path.name)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900 flex items-center">
                                                    {path.name}
                                                    {selectedPath === path.name && (
                                                        <span className="ml-3 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Selected</span>
                                                    )}
                                                </h4>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    ⏱️ Timeline: <span className="font-semibold text-slate-700">{path.time}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                                                <div className={`text-2xl font-bold mr-2 ${getMatchColor(path.match)}`}>
                                                    {path.match}%
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 uppercase">Match</span>
                                            </div>
                                        </div>
                                        
                                        {/* Pros & Cons */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                                <h5 className="font-bold text-green-800 mb-3 flex items-center text-sm uppercase tracking-wide">
                                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                    Pros
                                                </h5>
                                                <ul className="space-y-2">
                                                    {path.pros.map((pro, i) => (
                                                        <li key={i} className="text-sm text-slate-700 flex items-start">
                                                            <span className="mr-2 text-green-500">•</span> {pro}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                                                <h5 className="font-bold text-red-800 mb-3 flex items-center text-sm uppercase tracking-wide">
                                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    Cons
                                                </h5>
                                                <ul className="space-y-2">
                                                    {path.cons.map((con, i) => (
                                                        <li key={i} className="text-sm text-slate-700 flex items-start">
                                                            <span className="mr-2 text-red-500">•</span> {con}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Button Action */}
                                        <div className="mt-4 text-center">
                                            <button 
                                                className={`w-full py-2 rounded-lg font-semibold transition ${
                                                    selectedPath === path.name 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                                                }`}
                                            >
                                                {selectedPath === path.name && loadingRoadmap ? 'Generating Roadmap...' : 'View Roadmap for this Path →'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Loading Indicator for Roadmap */}
                        {loadingRoadmap && (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-slate-600 font-medium">Designing your personalized roadmap for <span className="text-blue-600 font-bold">{selectedPath}</span>...</p>
                            </div>
                        )}

                        {/* 4. Roadmap (CHỈ HIỆN KHI ĐÃ CÓ ROADMAP RESULT) */}
                        {roadmapResult && (
                            <div ref={roadmapRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in-up">
                                <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
                                    <span className="bg-purple-100 text-purple-600 rounded-xl w-10 h-10 flex items-center justify-center mr-3 text-xl">
                                        🗺️
                                    </span>
                                    Roadmap to {selectedPath}
                                </h3>
                                <div className="relative pl-4 md:pl-8">
                                    {/* Timeline line */}
                                    <div className="absolute left-4 md:left-8 top-4 bottom-4 w-0.5 bg-slate-200"></div>
                                    
                                    {roadmapResult.roadmap.map((phase, index) => (
                                        <div key={index} className="relative pl-8 md:pl-12 pb-10 last:pb-0">
                                            {/* Timeline dot */}
                                            <div className="absolute left-2 md:left-6 top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm z-10 -translate-x-1/2"></div>
                                            
                                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition">
                                                <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                                    <span className="text-blue-600 mr-2">📅</span> {phase.phase}
                                                </h4>
                                                <div className="space-y-3">
                                                    {phase.actions.map((action, i) => (
                                                        <div key={i} className="flex items-start bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold mr-3 mt-0.5 border ${
                                                                action.type === 'Learn' 
                                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                                            }`}>
                                                                {action.type}
                                                            </span>
                                                            <p className="text-slate-700 text-sm leading-relaxed">{action.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-12 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-xl p-8 text-center text-white relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 pattern-dots"></div>
                                    <h3 className="text-2xl font-bold mb-4 relative z-10">Ready to Start Your Journey?</h3>
                                    <p className="mb-8 text-slate-300 max-w-2xl mx-auto relative z-10">
                                        Save this roadmap to your personal dashboard to track your daily progress and achieve your goal of becoming a {selectedPath}.
                                    </p>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                                        <button
                                            onClick={handleApplyRoadmap}
                                            disabled={saving}
                                            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none flex items-center justify-center"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="mr-2">🚀</span> Start This Journey
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => window.print()}
                                            className="w-full sm:w-auto px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-bold hover:bg-white/20 transition flex items-center justify-center"
                                        >
                                            <span className="mr-2">🖨️</span> Print Roadmap
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CareerPath;