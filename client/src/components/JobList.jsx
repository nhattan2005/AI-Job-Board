import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    // SỬA LẠI HÀM NÀY
    const formatSalary = (job) => {
        // 1. Ưu tiên hiển thị salary_range (chuỗi) nếu có
        if (job.salary_range) return job.salary_range;

        // 2. Fallback sang logic min/max cũ (nếu sau này bạn nâng cấp DB)
        const min = job.salary_min;
        const max = job.salary_max;

        if ((!min && !max) || (min === 0 && max === 0)) return "Negotiable";
        
        const format = (n) => n?.toLocaleString('en-US');
        
        if (min && (!max || max === 0)) return `From $${format(min)}`;
        if ((!min || min === 0) && max) return `Up to $${format(max)}`;
        return `$${format(min)} - $${format(max)}`;
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/jobs');
                // Đảm bảo res.data là mảng, nếu không thì gán mảng rỗng
                setJobs(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                setError('Failed to fetch jobs');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job => {
        // Kiểm tra an toàn null/undefined trước khi gọi toLowerCase()
        const title = job.title || '';
        const company = job.company_name || '';
        const desc = job.description || '';
        const location = job.location || '';

        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            desc.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesLocation = filterLocation === '' || location === filterLocation;
        return matchesSearch && matchesLocation;
    });

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

    // Helper lấy URL ảnh
    const getImageUrl = (path) => path ? `http://localhost:5000${path}` : null;

    return (
        <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6">
            
            {/* Hero Section */}
            <div className="text-center mb-12 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary-500/20 rounded-full blur-[100px] -z-10"></div>
                <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                    Find Your <span className="gradient-text">Dream IT Job</span>
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                    Discover {jobs.length} curated opportunities enhanced by AI matching technology.
                </p>
            </div>

            {/* AI Banner */}
            <div className="mb-10 relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl shadow-primary-900/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-[80px] opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500 rounded-full blur-[80px] opacity-20"></div>
                
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <svg className="h-10 w-10 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">AI Career Path Analyzer</h3>
                            <p className="text-slate-300 text-lg max-w-xl">
                                Stop guessing. Let AI analyze your CV and build a personalized roadmap to your dream salary.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/career-path" className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-primary-50 transition-all hover:scale-105 shadow-lg whitespace-nowrap">
                            Try It →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div id="job-list-section" className="bg-white rounded-2xl shadow-soft p-2 mb-10 flex flex-col md:flex-row gap-2 border border-slate-100">
                <div className="relative flex-1">
                    <svg className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by title, company, or keywords..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-none focus:ring-0 text-slate-700 placeholder-slate-400 bg-transparent outline-none"
                    />
                </div>
                <div className="h-px md:h-12 w-full md:w-px bg-slate-100"></div>
                <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="md:w-48 px-4 py-3 rounded-xl border-none focus:ring-0 text-slate-600 bg-transparent cursor-pointer hover:bg-slate-50 transition outline-none"
                >
                    <option value="">All Locations</option>
                    {[...new Set(jobs.map(job => job.location).filter(Boolean))].map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                    <Link 
                        to={`/jobs/${job.id}`} 
                        key={job.id} 
                        className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                        <div className="flex justify-between items-start mb-4">
                            {/* 👇 THAY THẾ PHẦN HIỂN THỊ LOGO CŨ */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 border border-slate-200 overflow-hidden">
                                {job.avatar_url ? (
                                    <img 
                                        src={getImageUrl(job.avatar_url)} 
                                        alt={job.company_name} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    job.company_name?.charAt(0) || 'C'
                                )}
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100">
                                {job.employment_type || 'Full-time'}
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
                            {job.title || 'Untitled Job'}
                        </h3>
                        <p className="text-slate-500 font-medium mb-4">{job.company_name || 'Unknown Company'}</p>

                        <div className="space-y-2 mb-6 flex-1">
                            <div className="flex items-center text-slate-500 text-sm">
                                <svg className="h-4 w-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location || 'Remote'}
                            </div>
                            <div className="flex items-center text-slate-500 text-sm">
                                <svg className="h-4 w-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {/* THAY THẾ DÒNG CŨ BẰNG DÒNG NÀY */}
                                {formatSalary(job)}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-medium">
                                Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recently'}
                            </span>
                            <span className="text-sm font-semibold text-primary-600 group-hover:translate-x-1 transition-transform flex items-center">
                                View Details →
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
            
            {/* Empty State */}
            {filteredJobs.length === 0 && (
                <div className="text-center py-20">
                    <div className="inline-block p-6 rounded-full bg-slate-50 mb-4">
                        <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No jobs found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
};

export default JobList;