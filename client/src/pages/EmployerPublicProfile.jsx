import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext'; // 👈 THÊM

const EmployerPublicProfile = () => {
    const { employerId } = useParams();
    const [employer, setEmployer] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);
    const { isAuthenticated, isCandidate } = useAuth(); // 👈 THÊM

    useEffect(() => {
        fetchEmployerProfile();
    }, [employerId]);

    useEffect(() => {
        if (isAuthenticated && isCandidate && employer) {
            checkFollowStatus();
        }
    }, [employer, isAuthenticated, isCandidate]);

    const fetchEmployerProfile = async () => {
        try {
            setLoading(true);
            const [employerRes, jobsRes] = await Promise.all([
                api.get(`/employer/profile/${employerId}`),
                api.get(`/employer/profile/${employerId}/jobs`)
            ]);
            setEmployer(employerRes.data);
            setJobs(jobsRes.data);
        } catch (err) {
            console.error('Error fetching employer profile:', err);
            setError('Không thể tải thông tin công ty');
        } finally {
            setLoading(false);
        }
    };

    const checkFollowStatus = async () => {
        try {
            const res = await api.get(`/employer/follow-status/${employerId}`);
            setIsFollowing(res.data.isFollowing);
        } catch (err) {
            console.warn('Failed to check follow status');
        }
    };

    const handleFollow = async () => {
        if (!isAuthenticated) {
            alert('Please login to follow employers');
            return;
        }

        try {
            setFollowLoading(true);
            if (isFollowing) {
                await api.delete(`/employer/unfollow/${employerId}`);
                setIsFollowing(false);
                setFollowerCount(prev => prev - 1);
            } else {
                await api.post(`/employer/follow/${employerId}`);
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
            }
        } catch (err) {
            console.error('Follow error:', err);
            alert('Failed to follow/unfollow');
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    if (!employer) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center px-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy công ty</h2>
                <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold">
                    ← Quay lại danh sách việc làm
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Back Button */}
            <Link
                to="/"
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center mb-6"
            >
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
            </Link>

            {/* Company Header */}
            <div className="relative">
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Company Info */}
                <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="relative -mt-16 mb-6">
                        <div className="inline-block">
                            {employer.avatar_url ? (
                                <img
                                    src={employer.avatar_url}
                                    alt={employer.company_name}
                                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover bg-white"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <span className="text-4xl font-bold text-white">
                                        {employer.company_name?.charAt(0) || 'C'}
                                    </span>
                                </div>
                            )}
                            {/* Verified Badge */}
                            <div className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-1.5 border-2 border-white shadow-md">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Company Name & Follow Button */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {employer.company_name}
                            </h1>
                            {employer.company_industry && (
                                <p className="text-gray-600 mb-2">
                                    <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                        {employer.company_industry}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* 👇 THÊM NÚT FOLLOW */}
                        {isCandidate && (
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`flex items-center px-6 py-2.5 rounded-lg font-semibold transition ${
                                    isFollowing
                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isFollowing ? (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Follow
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                        {/* 👇 HIỂN THỊ FOLLOWER COUNT */}
                        <span className="flex items-center">
                            <svg className="w-5 h-5 mr-1 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            {employer.follower_count || 0} Followers
                        </span>

                        {jobs.length > 0 && (
                            <>
                                <span>•</span>
                                <span className="flex items-center">
                                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {jobs.length} Open Position{jobs.length !== 1 ? 's' : ''}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Company Description */}
                    {employer.company_description && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Giới thiệu công ty</h3>
                            <div className="prose max-w-none">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {employer.company_description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Benefits */}
                    {employer.company_benefits && employer.company_benefits.length > 0 && (
                        <div className="mb-6 pb-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Phúc lợi & Quyền lợi
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {employer.company_benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start">
                                        <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-gray-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Address & Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
                        {employer.company_address && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Địa chỉ văn phòng
                                </h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                    {employer.company_address}
                                </p>
                            </div>
                        )}

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Thông tin liên hệ
                            </h3>
                            <div className="space-y-2">
                                {(employer.company_email || employer.email) && (
                                    <div className="flex items-center text-gray-700">
                                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                        <a href={`mailto:${employer.company_email || employer.email}`} className="hover:text-blue-600">
                                            {employer.company_email || employer.email}
                                        </a>
                                    </div>
                                )}
                                {employer.company_phone && (
                                    <div className="flex items-center text-gray-700">
                                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <a href={`tel:${employer.company_phone}`} className="hover:text-blue-600">
                                            {employer.company_phone}
                                        </a>
                                    </div>
                                )}
                                {employer.website && (
                                    <div className="flex items-center text-gray-700">
                                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        <a href={employer.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                                            {employer.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Social Media */}
                    {(employer.social_linkedin || employer.social_facebook || employer.social_twitter) && (
                        <div className="pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Theo dõi chúng tôi</h3>
                            <div className="flex items-center space-x-4">
                                {employer.social_linkedin && (
                                    <a
                                        href={employer.social_linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                        </svg>
                                    </a>
                                )}
                                {employer.social_facebook && (
                                    <a
                                        href={employer.social_facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                    </a>
                                )}
                                {employer.social_twitter && (
                                    <a
                                        href={employer.social_twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Open Positions Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-7 h-7 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Các vị trí đang tuyển dụng ({jobs.length})
                </h2>

                {jobs.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-lg font-semibold">Hiện tại chưa có vị trí tuyển dụng</p>
                        <p className="text-sm mt-2">Vui lòng quay lại sau để cập nhật cơ hội mới</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {jobs.map(job => (
                            <Link
                                key={job.id}
                                to={`/jobs/${job.id}`}
                                className="border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition mb-2">
                                            {job.title}
                                        </h3>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                            {job.location && (
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {job.location}
                                                </span>
                                            )}
                                            {job.employment_type && (
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {job.employment_type}
                                                </span>
                                            )}
                                            {job.salary_range && (
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {job.salary_range}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                        Đang tuyển
                                    </span>
                                </div>

                                {job.description && (
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                        {job.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <span className="text-xs text-gray-500">
                                        Posted {new Date(job.created_at).toLocaleDateString('vi-VN')}
                                    </span>
                                    <span className="text-blue-600 font-semibold text-sm flex items-center group-hover:translate-x-1 transition">
                                        Xem chi tiết
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployerPublicProfile;
