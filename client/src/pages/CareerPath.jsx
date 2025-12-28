import React, { useState } from 'react';
import axios from 'axios'; // Hoặc import api from '../services/api' nếu bạn đã cấu hình
import api from '../services/api'; // Sử dụng instance api đã cấu hình token
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate

const CareerPath = () => {
    const [cvText, setCvText] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [useFileUpload, setUseFileUpload] = useState(false);
    const navigate = useNavigate(); // Hook điều hướng
    const [saving, setSaving] = useState(false); // State loading khi save

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

        try {
            let response;

            if (useFileUpload && cvFile) {
                // Upload file
                const formData = new FormData();
                formData.append('cv', cvFile);

                response = await api.post('/career/generate', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else if (!useFileUpload && cvText.trim()) {
                // Send text
                response = await api.post('/career/generate', {
                    cvText: cvText
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

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getMatchColor = (match) => {
        if (match >= 80) return 'text-green-600';
        if (match >= 60) return 'text-blue-600';
        return 'text-orange-600';
    };

    // --- HÀM MỚI: APPLY ROADMAP ---
    const handleApplyRoadmap = async () => {
        if (!result) return;
        setSaving(true);
        try {
            await api.post('/career/save', {
                target_role: result.current_positioning.role,
                roadmap: result.roadmap,
                current_positioning: result.current_positioning,  // 👈 THÊM
                skill_gap: result.skill_gap                       // 👈 THÊM
            });
            // Chuyển hướng sang trang My Roadmap
            navigate('/my-roadmap');
        } catch (error) {
            console.error("Failed to save roadmap", error);
            alert("Failed to save roadmap. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-block">
                    ← Back to Home
                </Link>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">🚀 AI Career Path Analyzer</h1>
                <p className="text-gray-600">
                    Upload your CV and get personalized career recommendations, skill gap analysis, and a roadmap to your dream job
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Provide Your CV</h2>

                {/* Toggle between text and file */}
                <div className="flex items-center space-x-4 mb-6">
                    <button
                        onClick={() => setUseFileUpload(false)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            !useFileUpload
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        📝 Paste Text
                    </button>
                    <button
                        onClick={() => setUseFileUpload(true)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            useFileUpload
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        📄 Upload File
                    </button>
                </div>

                {/* Text Input */}
                {!useFileUpload && (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Paste your CV text here:
                        </label>
                        <textarea
                            value={cvText}
                            onChange={(e) => setCvText(e.target.value)}
                            rows="10"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Paste your CV content here... (Education, Experience, Skills, Projects, etc.)"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            {cvText.length} characters
                        </p>
                    </div>
                )}

                {/* File Upload */}
                {useFileUpload && (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload your CV (PDF, DOCX, TXT):
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.docx,.txt"
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
                            <p className="mt-2 text-sm text-green-600 flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {cvFile.name}
                            </p>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Analyze Button */}
                <button
                    onClick={handleAnalyze}
                    disabled={loading || (!useFileUpload && !cvText.trim()) || (useFileUpload && !cvFile)}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition shadow-lg ${
                        loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing Your Career Path...
                        </span>
                    ) : (
                        '🚀 Analyze My Career Path'
                    )}
                </button>
            </div>

            {/* Results Section */}
            {result && (
                <div className="space-y-6">
                    {/* Current Positioning */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                                📍
                            </span>
                            Current Positioning
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Role</p>
                                <p className="text-lg font-bold text-gray-900">{result.current_positioning.role}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Level</p>
                                <p className="text-lg font-bold text-gray-900">{result.current_positioning.level}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Salary Potential</p>
                                <p className="text-lg font-bold text-gray-900">{result.current_positioning.salary_potential}</p>
                            </div>
                        </div>
                        <p className="text-gray-700">{result.current_positioning.summary}</p>
                    </div>

                    {/* Skill Gap */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="bg-orange-100 text-orange-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                                📊
                            </span>
                            Skill Gap Analysis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.skill_gap.map((skill, index) => (
                                <div key={index} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-gray-900">{skill.skill}</h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(skill.priority)}`}>
                                            {skill.priority} Priority
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Status: <span className="font-semibold text-orange-700">{skill.status}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Career Paths */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                            <span className="bg-green-100 text-green-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                                🎯
                            </span>
                            Recommended Career Paths
                        </h3>
                        <div className="space-y-4">
                            {result.paths.map((path, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="text-xl font-bold text-gray-900">{path.name}</h4>
                                        <div className="text-right">
                                            <div className={`text-3xl font-bold ${getMatchColor(path.match)}`}>
                                                {path.match}%
                                            </div>
                                            <p className="text-sm text-gray-500">Match</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        ⏱️ Timeline: <span className="font-semibold">{path.time}</span>
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <h5 className="font-semibold text-green-800 mb-2">✅ Pros:</h5>
                                            <ul className="space-y-1">
                                                {path.pros.map((pro, i) => (
                                                    <li key={i} className="text-sm text-gray-700">• {pro}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <h5 className="font-semibold text-red-800 mb-2">⚠️ Cons:</h5>
                                            <ul className="space-y-1">
                                                {path.cons.map((con, i) => (
                                                    <li key={i} className="text-sm text-gray-700">• {con}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Roadmap */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <span className="bg-purple-100 text-purple-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                                🗺️
                            </span>
                            Your Career Roadmap
                        </h3>
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                            
                            {result.roadmap.map((phase, index) => (
                                <div key={index} className="relative pl-20 pb-8 last:pb-0">
                                    {/* Timeline dot */}
                                    <div className="absolute left-5 top-0 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-lg"></div>
                                    
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-l-4 border-blue-500">
                                        <h4 className="text-xl font-bold text-gray-900 mb-4">
                                            📅 {phase.phase}
                                        </h4>
                                        <div className="space-y-3">
                                            {phase.actions.map((action, i) => (
                                                <div key={i} className="flex items-start bg-white p-3 rounded-lg shadow-sm">
                                                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded mr-3 mt-0.5">
                                                        {action.type}
                                                    </span>
                                                    <p className="text-gray-700 flex-1">{action.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons - CẬP NHẬT PHẦN NÀY */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-center text-white">
                        <h3 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h3>
                        <p className="mb-6 text-blue-100">
                            Apply this roadmap to your personal dashboard and track your daily progress!
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                            <Link
                                to="/"
                                className="inline-block bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-3 rounded-lg font-bold hover:bg-white/20 transition"
                            >
                                Browse Jobs
                            </Link>
                            
                            {/* Nút Apply Roadmap Mới */}
                            <button
                                onClick={handleApplyRoadmap}
                                disabled={saving}
                                className="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow-lg disabled:opacity-70"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        🚀 Start This Journey
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => window.print()}
                                className="inline-block bg-blue-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-800 transition shadow-lg"
                            >
                                📄 Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareerPath;