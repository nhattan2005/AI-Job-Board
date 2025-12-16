import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
    const [salaryFilter, setSalaryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [jobs, searchTerm, locationFilter, employmentTypeFilter, salaryFilter, sortBy]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/jobs');
            setJobs(response.data);
            setFilteredJobs(response.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setError('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...jobs];

        // Search filter (title, company, description)
        if (searchTerm) {
            filtered = filtered.filter(job => 
                job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Location filter
        if (locationFilter) {
            filtered = filtered.filter(job => 
                job.location?.toLowerCase().includes(locationFilter.toLowerCase())
            );
        }

        // Employment type filter
        if (employmentTypeFilter !== 'all') {
            filtered = filtered.filter(job => 
                job.employment_type === employmentTypeFilter
            );
        }

        // Salary filter
        if (salaryFilter !== 'all') {
            filtered = filtered.filter(job => {
                if (!job.salary_range) return salaryFilter === 'not-specified';
                
                const salaryText = job.salary_range.toLowerCase();
                
                switch(salaryFilter) {
                    case 'under-50k':
                        return salaryText.includes('k') && parseInt(salaryText.match(/\d+/)) < 50;
                    case '50k-100k':
                        return salaryText.includes('k') && parseInt(salaryText.match(/\d+/)) >= 50 && parseInt(salaryText.match(/\d+/)) <= 100;
                    case '100k-150k':
                        return salaryText.includes('k') && parseInt(salaryText.match(/\d+/)) >= 100 && parseInt(salaryText.match(/\d+/)) <= 150;
                    case 'over-150k':
                        return salaryText.includes('k') && parseInt(salaryText.match(/\d+/)) > 150;
                    case 'not-specified':
                        return !job.salary_range;
                    default:
                        return true;
                }
            });
        }

        // Sort
        switch(sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'title-asc':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                filtered.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default:
                break;
        }

        setFilteredJobs(filtered);
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setLocationFilter('');
        setEmploymentTypeFilter('all');
        setSalaryFilter('all');
        setSortBy('newest');
    };

    const hasActiveFilters = searchTerm || locationFilter || employmentTypeFilter !== 'all' || salaryFilter !== 'all';

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Available Jobs</h2>
                <p className="text-gray-600">
                    {filteredJobs.length} of {jobs.length} {jobs.length === 1 ? 'position' : 'positions'} 
                    {hasActiveFilters && ' (filtered)'}
                </p>
            </div>

            {/* Search & Filters Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by job title, company, or keywords..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg 
                            className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Location Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            Location
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Remote, New York"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Employment Type Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Employment Type
                        </label>
                        <select
                            value={employmentTypeFilter}
                            onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Types</option>
                            <option value="full-time">Full-time</option>
                            <option value="part-time">Part-time</option>
                            <option value="contract">Contract</option>
                            <option value="internship">Internship</option>
                        </select>
                    </div>

                    {/* Salary Range Filter */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Salary Range
                        </label>
                        <select
                            value={salaryFilter}
                            onChange={(e) => setSalaryFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Salaries</option>
                            <option value="under-50k">Under $50k</option>
                            <option value="50k-100k">$50k - $100k</option>
                            <option value="100k-150k">$100k - $150k</option>
                            <option value="over-150k">Over $150k</option>
                            <option value="not-specified">Not Specified</option>
                        </select>
                    </div>

                    {/* Sort By */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <svg className="inline h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="title-asc">Title (A-Z)</option>
                            <option value="title-desc">Title (Z-A)</option>
                        </select>
                    </div>
                </div>

                {/* Active Filters & Clear Button */}
                {hasActiveFilters && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                            {searchTerm && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                                    Search: "{searchTerm}"
                                    <button onClick={() => setSearchTerm('')} className="ml-2">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            )}
                            {locationFilter && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                                    Location: {locationFilter}
                                    <button onClick={() => setLocationFilter('')} className="ml-2">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            )}
                            {employmentTypeFilter !== 'all' && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                                    Type: {employmentTypeFilter}
                                    <button onClick={() => setEmploymentTypeFilter('all')} className="ml-2">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            )}
                            {salaryFilter !== 'all' && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                                    Salary: {salaryFilter.replace('-', ' ')}
                                    <button onClick={() => setSalaryFilter('all')} className="ml-2">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            )}
                        </div>
                        <button
                            onClick={clearAllFilters}
                            className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Results */}
            {filteredJobs.length === 0 && jobs.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your filters or search criteria</p>
                    <button
                        onClick={clearAllFilters}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                        Clear All Filters
                    </button>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <svg 
                        className="mx-auto h-16 w-16 text-gray-400 mb-4" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs available yet</h3>
                    <p className="text-gray-500 mb-6">Be the first to post a job!</p>
                    <Link 
                        to="/post-job"
                        className="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition"
                    >
                        Post a Job
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredJobs.map(job => (
                        <Link
                            key={job.id}
                            to={`/jobs/${job.id}`}
                            className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-300"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-3">
                                    {/* Left: Job Info */}
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition mb-2">
                                            {job.title}
                                        </h3>
                                        
                                        {job.company && (
                                            <p className="text-lg text-gray-600 font-medium mb-3 flex items-center">
                                                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                {job.company}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                            {/* Location */}
                                            {job.location && (
                                                <span className="flex items-center">
                                                    <svg className="h-4 w-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {job.location}
                                                </span>
                                            )}

                                            {/* Salary Range */}
                                            {job.salary_range && (
                                                <span className="flex items-center font-semibold text-green-600">
                                                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {job.salary_range}
                                                </span>
                                            )}

                                            {/* Employment Type */}
                                            {job.employment_type && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                                                    {job.employment_type.replace('-', ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Posted Date */}
                                    <div className="ml-6 text-right">
                                        <p className="text-xs text-gray-500 flex items-center">
                                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(job.created_at).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* View Details Link */}
                                <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-100">
                                    <span className="text-blue-600 hover:text-blue-800 font-semibold flex items-center group">
                                        View Details & Apply
                                        <svg className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JobList;