import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MyCareerRoadmap = () => {
    const [roadmap, setRoadmap] = useState(null);
    const [targetRole, setTargetRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        fetchRoadmap();
    }, []);

    const fetchRoadmap = async () => {
        try {
            const res = await api.get('/career/my-roadmap');
            if (res.data.roadmap) {
                setRoadmap(res.data.roadmap);
                setTargetRole(res.data.target_role);
                calculateProgress(res.data.roadmap);
            }
        } catch (error) {
            console.error("Failed to fetch roadmap", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = (data) => {
        let total = 0;
        let completed = 0;
        data.forEach(phase => {
            phase.actions.forEach(action => {
                total++;
                if (action.completed) completed++;
            });
        });
        setProgress(total === 0 ? 0 : Math.round((completed / total) * 100));
    };

    const toggleAction = async (phaseIndex, actionIndex) => {
        const newRoadmap = [...roadmap];
        const newStatus = !newRoadmap[phaseIndex].actions[actionIndex].completed;
        newRoadmap[phaseIndex].actions[actionIndex].completed = newStatus;
        
        setRoadmap(newRoadmap);
        calculateProgress(newRoadmap);

        try {
            await api.patch('/career/progress', {
                phaseIndex,
                actionIndex,
                completed: newStatus
            });
        } catch (error) {
            console.error("Failed to update progress", error);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    if (!roadmap) return (
        <div className="max-w-4xl mx-auto py-20 text-center">
            <div className="bg-white rounded-2xl shadow-sm p-10 border border-slate-100">
                <div className="text-6xl mb-4">🗺️</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No Active Roadmap Found</h2>
                <p className="text-slate-500 mb-6">You haven't started a career journey yet. Use our AI to generate one!</p>
                <Link to="/career-path" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
                    Generate Career Path
                </Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pt-10 pb-20 px-4">
            <Link to="/career-path" className="text-slate-500 hover:text-blue-600 font-medium mb-6 inline-flex items-center transition">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Back to Generator
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* LEFT COLUMN: Header & Roadmap Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Career Roadmap</h1>
                        <p className="text-slate-600 text-lg">Target Role: <span className="font-bold text-blue-600">{targetRole}</span></p>
                    </div>

                    {/* Roadmap List */}
                    <div className="space-y-6">
                        {roadmap.map((phase, pIndex) => (
                            <div key={pIndex} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition hover:shadow-md">
                                {/* Phase Header */}
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3">
                                            {pIndex + 1}
                                        </span>
                                        {phase.phase}
                                    </h3>
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {phase.actions.filter(a => a.completed).length} / {phase.actions.length} Done
                                    </span>
                                </div>

                                {/* Actions List */}
                                <div className="divide-y divide-slate-50">
                                    {phase.actions.map((action, aIndex) => (
                                        <div 
                                            key={aIndex} 
                                            className={`group flex items-start p-5 transition-colors cursor-pointer hover:bg-blue-50/30 ${action.completed ? 'bg-slate-50/50' : ''}`}
                                            onClick={() => toggleAction(pIndex, aIndex)}
                                        >
                                            {/* Custom Checkbox */}
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 mr-4 flex items-center justify-center transition-all duration-200 ${
                                                action.completed 
                                                    ? 'bg-green-500 border-green-500' 
                                                    : 'border-slate-300 group-hover:border-blue-400 bg-white'
                                            }`}>
                                                {action.completed && (
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>

                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                                        action.type === 'Learn' 
                                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                                    }`}>
                                                        {action.type}
                                                    </span>
                                                </div>
                                                <p className={`text-slate-700 transition-all duration-200 ${action.completed ? 'line-through text-slate-400' : ''}`}>
                                                    {action.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: Sticky Progress Card */}
                {/* 'sticky top-24' giúp nó dính lại khi cuộn */}
                <div className="lg:col-span-1 sticky top-24 order-first lg:order-last mb-6 lg:mb-0">
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 text-lg">Your Progress</h3>
                        
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Completed</span>
                            <span className="text-3xl font-extrabold text-blue-600">{progress}%</span>
                        </div>
                        
                        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-4">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <p className="text-sm text-slate-500 leading-relaxed">
                            {progress === 100 
                                ? "🎉 Congratulations! You've completed your roadmap!" 
                                : "Keep going! Every step brings you closer to your dream job."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyCareerRoadmap;