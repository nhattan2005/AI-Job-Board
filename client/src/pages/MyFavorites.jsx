import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MyFavorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const response = await api.get('/favorites/my-favorites');
            setFavorites(response.data.favorites);
        } catch (err) {
            console.error('Error fetching favorites:', err);
            setError('Failed to load favorite jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (jobId) => {
        if (!window.confirm('Remove this job from favorites?')) return;

        try {
            await api.delete(`/favorites/remove/${jobId}`);
            setFavorites(favorites.filter(fav => fav.id !== jobId));
        } catch (err) {
            console.error('Error removing favorite:', err);
            alert('Failed to remove favorite');
        }
    };

    const formatSalary = (salaryRange) => {
        return salaryRange || 'Negotiable';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">❤️ Favorite Jobs</h1>
                <p className="text-slate-600">
                    Jobs you've saved for later
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {favorites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                    <svg className="mx-auto h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No favorite jobs yet</h3>
                    <p className="text-slate-500 mb-6">Start browsing jobs and save your favorites</p>
                    <Link
                        to="/"
                        className="inline-block bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700 transition"
                    >
                        Browse Jobs
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favorites.map(job => (
                        <div key={job.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden border border-slate-100">
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                            {job.avatar_url ? (
                                                <img 
                                                    src={job.avatar_url} 
                                                    alt={job.company_name} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="font-bold text-slate-600">
                                                    {job.company_name?.charAt(0) || 'C'}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                                            <p className="text-sm text-slate-500">{job.company_name}</p>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => handleRemoveFavorite(job.id)}
                                        className="text-red-400 hover:text-red-600 transition"
                                        title="Remove from favorites"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-slate-600">
                                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        {job.location}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600">
                                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formatSalary(job.salary_range)}
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100">
                                        {job.employment_type}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                                        {job.status}
                                    </span>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <span className="text-xs text-slate-400">
                                        Saved {new Date(job.favorited_at).toLocaleDateString()}
                                    </span>
                                    <Link
                                        to={`/jobs/${job.id}`}
                                        className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                    >
                                        View Details
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyFavorites;