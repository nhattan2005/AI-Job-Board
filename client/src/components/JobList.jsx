import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    
    // 👇 THÊM STATE CHO BỘ LỌC MỚI
    const [filterEmploymentType, setFilterEmploymentType] = useState('');
    const [filterSalaryMin, setFilterSalaryMin] = useState('');
    const [filterSalaryMax, setFilterSalaryMax] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [jobsPerPage] = useState(9);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [banners, setBanners] = useState([]); // 👈 THAY ĐỔI

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

    // 👇 HÀM EXTRACT SALARY NUMBER TỪ STRING
    const extractSalaryNumber = (salaryString) => {
        if (!salaryString || salaryString.toLowerCase().includes('negotiable')) return null;
        // Extract số từ string như "$120k - $180k" hoặc "$1000 - $2000"
        const matches = salaryString.match(/\d+\.?\d*/g);
        if (!matches) return null;
        
        // Lấy số đầu tiên (min salary)
        let num = parseFloat(matches[0]);
        
        // Nếu có "k" sau số => nhân 1000
        if (salaryString.toLowerCase().includes('k')) {
            num *= 1000;
        }
        
        return num;
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const response = await api.get('/jobs');
                setJobs(response.data);
            } catch (error) {
                setError('Failed to load jobs. Please try again later.');
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchBanners = async () => {
            try {
                const response = await api.get('/banners/active');
                setBanners(response.data);
            } catch (error) {
                console.error('Error fetching banners:', error);
                // Fallback to default banners if API fails
                setBanners([
                    { id: 1, title: 'Find Your Dream Job', subtitle: 'Thousands of opportunities waiting', image_url: '/images/banner1.jpg' },
                    { id: 2, title: 'Career Growth', subtitle: 'Connect with top employers', image_url: '/images/banner2.jpg' },
                    { id: 3, title: 'Your Future Awaits', subtitle: 'Discover opportunities', image_url: '/images/banner3.png' }
                ]);
            }
        };

        fetchJobs();
        fetchBanners(); // 👈 THÊM
    }, []);

    // 👇 RESET TRANG VỀ 1 KHI SEARCH HOẶC FILTER THAY ĐỔI
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterLocation, filterEmploymentType, filterSalaryMin, filterSalaryMax]);

    // 👇 AUTO-SLIDE CAROUSEL
    useEffect(() => {
        if (banners.length === 0) return;
        
        const savedDuration = parseInt(localStorage.getItem('bannerDuration')) || 8;
        
        const timer = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, savedDuration * 1000);

        return () => clearInterval(timer);
    }, [banners.length, currentBanner]);

    // 👇 CẬP NHẬT LOGIC LỌC
    const filteredJobs = jobs.filter(job => {
        // Kiểm tra an toàn null/undefined trước khi gọi toLowerCase()
        const title = job.title || '';
        const company = job.company_name || '';
        const desc = job.description || '';
        const location = job.location || '';
        const employmentType = job.employment_type || '';

        // 1. Search term
        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            desc.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Location filter
        const matchesLocation = filterLocation === '' || location === filterLocation;
        
        // 3. Employment Type filter
        const matchesEmploymentType = filterEmploymentType === '' || employmentType === filterEmploymentType;
        
        // 4. Salary filter
        let matchesSalary = true;
        if (filterSalaryMin || filterSalaryMax) {
            const jobSalary = extractSalaryNumber(job.salary_range);
            
            if (jobSalary === null) {
                // Nếu không parse được lương (Negotiable) => vẫn show
                matchesSalary = true;
            } else {
                const minFilter = filterSalaryMin ? parseFloat(filterSalaryMin) : 0;
                const maxFilter = filterSalaryMax ? parseFloat(filterSalaryMax) : Infinity;
                
                matchesSalary = jobSalary >= minFilter && jobSalary <= maxFilter;
            }
        }

        return matchesSearch && matchesLocation && matchesEmploymentType && matchesSalary;
    });

    // 👇 TÍNH TOÁN PAGINATION
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

    // 👇 HÀM CHUYỂN TRANG
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Cuộn lên đầu danh sách jobs
        document.getElementById('job-list-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    // 👇 HÀM RESET FILTERS
    const resetFilters = () => {
        setSearchTerm('');
        setFilterLocation('');
        setFilterEmploymentType('');
        setFilterSalaryMin('');
        setFilterSalaryMax('');
        setCurrentPage(1);
    };

    // 👇 ĐẾM SỐ FILTER ĐANG ACTIVE
    const activeFiltersCount = [filterLocation, filterEmploymentType, filterSalaryMin, filterSalaryMax]
        .filter(f => f !== '').length;

    // 👇 TẠO ARRAY CÁC SỐ TRANG
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    // 👇 FUNCTIONS ĐIỀU KHIỂN CAROUSEL
    const nextBanner = () => {
        setCurrentBanner((prev) => (prev + 1) % banners.length); // 👈 DYNAMIC
    };

    const prevBanner = () => {
        setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length); // 👈 DYNAMIC
    };

    const goToBanner = (index) => {
        setCurrentBanner(index);
    };

    // 👇 ĐỊNH NGHĨA CÁC BANNER
    const defaultBanners = [
        {
            id: 1,
            image: "/images/banner1.jpg",
            alt: "Banner 1"
        },
        {
            id: 2,
            image: "/images/banner2.jpg",
            alt: "Banner 2"
        },
        {
            id: 3,
            image: "/images/banner3.png",
            alt: "Banner 3"
        }
    ];

    // Helper lấy URL ảnh
    const getImageUrl = (path) => path ? `http://localhost:5000${path}` : null;

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    if (error) return <div className="text-center py-20 text-red-600 font-bold">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary-500/20 rounded-full blur-[100px] -z-10"></div>
                <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                    Find Your <span className="gradient-text">Dream IT Job</span>
                </h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                    Unlock Your Future, Find the Job You Deserve.
                </p>
            </div>

            {/* Carousel Banner */}
            <div className="mb-10 relative overflow-hidden rounded-2xl shadow-2xl group">
                <div className="relative w-full" style={{ aspectRatio: '16/5' }}>
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id}
                            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                                index === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                            }`}
                        >
                            <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>

                {/* Navigation Buttons - Hiện khi hover */}
                <button
                    onClick={prevBanner}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110 transition-all shadow-lg"
                    aria-label="Previous"
                >
                    <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <button
                    onClick={nextBanner}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110 transition-all shadow-lg"
                    aria-label="Next"
                >
                    <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Dots Indicator - UPDATE LENGTH */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToBanner(index)}
                            className={`h-2 rounded-full transition-all ${
                                index === currentBanner 
                                    ? 'bg-white w-8' 
                                    : 'bg-white/50 hover:bg-white/75 w-2'
                            }`}
                            aria-label={`Go to banner ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Progress Bar - UPDATE CALCULATION */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div 
                        className="h-full bg-white transition-all duration-300 ease-linear"
                        style={{ width: `${((currentBanner + 1) / (banners.length || 1)) * 100}%` }}
                    />
                </div>
            </div>

            {/* 👇 SEARCH & FILTER BAR - CẬP NHẬT */}
            <div id="job-list-section" className="bg-white rounded-2xl shadow-soft p-4 mb-6 border border-slate-100">
                {/* Search Bar */}
                <div className="flex flex-col md:flex-row gap-2 mb-4">
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
                    
                    {/* Toggle Advanced Filters Button */}
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition flex items-center justify-center gap-2 relative"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* 👇 ADVANCED FILTERS - HIỂN THỊ KHI CLICK */}
                {showAdvancedFilters && (
                    <div className="pt-4 border-t border-slate-100 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Location Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                                    📍 Location
                                </label>
                                <select
                                    value={filterLocation}
                                    onChange={(e) => setFilterLocation(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                >
                                    <option value="">All Locations</option>
                                    {[...new Set(jobs.map(job => job.location).filter(Boolean))].map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Employment Type Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                                    💼 Job Type
                                </label>
                                <select
                                    value={filterEmploymentType}
                                    onChange={(e) => setFilterEmploymentType(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                >
                                    <option value="">All Types</option>
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="contract">Contract</option>
                                    <option value="internship">Internship</option>
                                </select>
                            </div>

                            {/* Salary Min Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                                    💰 Min Salary ($)
                                </label>
                                <input
                                    type="number"
                                    value={filterSalaryMin}
                                    onChange={(e) => setFilterSalaryMin(e.target.value)}
                                    placeholder="e.g. 50000"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                />
                            </div>

                            {/* Salary Max Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                                    💸 Max Salary ($)
                                </label>
                                <input
                                    type="number"
                                    value={filterSalaryMax}
                                    onChange={(e) => setFilterSalaryMax(e.target.value)}
                                    placeholder="e.g. 150000"
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        {/* Reset Button */}
                        {activeFiltersCount > 0 && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {currentJobs.map((job) => (
                    <Link 
                        to={`/jobs/${job.id}`} 
                        key={job.id} 
                        className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 border border-slate-200 overflow-hidden">
                                {job.avatar_url ? (
                                    <img 
                                        src={job.avatar_url} 
                                        alt={job.company_name} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback nếu ảnh lỗi
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = job.company_name?.charAt(0) || 'C';
                                        }}
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
                            <div className="flex items-center text-primary-600 text-sm font-bold">
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
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
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                    >
                        ← Prev
                    </button>

                    {startPage > 1 && (
                        <>
                            <button onClick={() => paginate(1)} className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600 font-semibold transition">
                                1
                            </button>
                            {startPage > 2 && <span className="text-slate-400">...</span>}
                        </>
                    )}

                    {pageNumbers.map(number => (
                        <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`w-10 h-10 rounded-lg font-semibold transition ${
                                currentPage === number
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600'
                            }`}
                        >
                            {number}
                        </button>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
                            <button onClick={() => paginate(totalPages)} className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600 font-semibold transition">
                                {totalPages}
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
                    >
                        Next →
                    </button>
                </div>
            )}

            {filteredJobs.length > 0 && (
                <div className="text-center mt-6 text-sm text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{indexOfFirstJob + 1}-{Math.min(indexOfLastJob, filteredJobs.length)}</span> of <span className="font-semibold text-slate-700">{filteredJobs.length}</span> jobs
                </div>
            )}
            
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
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={resetFilters}
                            className="mt-4 px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-semibold transition"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default JobList;