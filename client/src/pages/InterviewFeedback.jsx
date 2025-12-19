import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const InterviewFeedback = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateFeedback = async () => {
            try {
                const res = await api.post('/mock-interview/end', { sessionId });
                setFeedback(res.data);
            } catch (err) {
                console.error(err);
                alert('Failed to generate feedback');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        generateFeedback();
    }, [sessionId, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-slate-600">Analyzing your interview performance...</p>
            </div>
        );
    }

    if (!feedback) return null;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h1 className="text-3xl font-bold mb-2">Interview Feedback Report</h1>
                    <p className="text-indigo-100">Session ID: {sessionId.substring(0, 8)}...</p>
                </div>

                {/* Score Card */}
                <div className="p-8 border-b bg-slate-50">
                    <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                            <div className={`text-6xl font-extrabold ${
                                feedback.overall_score >= 80 ? 'text-green-600' :
                                feedback.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {feedback.overall_score}
                            </div>
                            <p className="text-slate-500 font-medium mt-2">Overall Score</p>
                        </div>
                        <div className="text-4xl">
                            {feedback.overall_score >= 80 ? '🌟' :
                             feedback.overall_score >= 60 ? '👍' : '💪'}
                        </div>
                    </div>
                </div>

                {/* Strengths */}
                <div className="p-8 border-b">
                    <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center">
                        <span className="mr-2">✅</span> Strengths
                    </h2>
                    <ul className="space-y-2">
                        {feedback.strengths?.map((item, i) => (
                            <li key={i} className="flex items-start text-slate-700">
                                <span className="text-green-500 mr-2 mt-1">•</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Weaknesses */}
                <div className="p-8 border-b">
                    <h2 className="text-xl font-bold text-amber-700 mb-4 flex items-center">
                        <span className="mr-2">⚠️</span> Areas for Improvement
                    </h2>
                    <ul className="space-y-2">
                        {feedback.weaknesses?.map((item, i) => (
                            <li key={i} className="flex items-start text-slate-700">
                                <span className="text-amber-500 mr-2 mt-1">•</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Recommendation */}
                <div className="p-8 bg-indigo-50">
                    <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center">
                        <span className="mr-2">📋</span> Final Recommendation
                    </h2>
                    <div className={`p-4 rounded-lg font-semibold text-center text-lg ${
                        feedback.recommendation === 'Hire' ? 'bg-green-100 text-green-800' :
                        feedback.recommendation === 'Maybe' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {feedback.recommendation}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-8 flex gap-4">
                    <Link to="/" className="flex-1 py-3 bg-slate-200 text-slate-700 text-center font-bold rounded-xl hover:bg-slate-300 transition">
                        Back to Jobs
                    </Link>
                    <button 
                        onClick={() => window.print()}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
                    >
                        Download Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewFeedback;