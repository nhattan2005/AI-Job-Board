import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell'; // 👈 THÊM

const Navigation = () => {
    const { isAuthenticated, isCandidate, isEmployer, isAdmin, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false); // 👈 THÊM STATE
    const profileMenuRef = useRef(null); // 👈 THÊM REF

    // Hiệu ứng khi cuộn trang
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 👇 THÊM: Đóng menu khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        if (showProfileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileMenu]);

    const handleLogout = () => {
        logout();
        navigate('/');
        setShowProfileMenu(false);
    };

    const isActive = (path) => location.pathname === path;

    const NavLink = ({ to, children }) => (
        <Link 
            to={to} 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive(to)
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-slate-700 hover:bg-slate-100'
            }`}
        >
            {children}
        </Link>
    );

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-lg">AI</span>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                            JobBoard
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {isAuthenticated ? (
                            <>
                                {isCandidate && (
                                    <>
                                        <NavLink to="/">Browse Jobs</NavLink>
                                        {/* 👇 THÊM CAREER PATH */}
                                        <NavLink to="/career-path">Career Path</NavLink>
                                        {/* 👇 THÊM PRACTICE INTERVIEW */}
                                        <NavLink to="/practice-interview">Practice Interview</NavLink>
                                    </>
                                )}

                                {isEmployer && (
                                    <>
                                        <NavLink to="/employer/dashboard">Dashboard</NavLink>
                                        <NavLink to="/employer/post-job">Post Job</NavLink>
                                        <NavLink to="/employer/all-applications">Applications</NavLink>
                                    </>
                                )}

                                {isAdmin && (
                                    <>
                                        <NavLink to="/admin/dashboard">Dashboard</NavLink>
                                        <NavLink to="/admin/users">Users</NavLink>
                                        <NavLink to="/admin/jobs">Jobs</NavLink>
                                        <NavLink to="/admin/banners">Banners</NavLink>
                                    </>
                                )}

                                {/* 👇 THÊM NOTIFICATION BELL TRƯỚC LOGIN/PROFILE */}
                                <NotificationBell />

                                {/* 👇 PROFILE DROPDOWN */}
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary-600 transition p-2 rounded-lg hover:bg-slate-50"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary-600 font-bold border border-slate-200 overflow-hidden">
                                            {user?.avatar_url ? (
                                                <img 
                                                    src={user.avatar_url} 
                                                    alt="Avatar" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span>
                                                    {user?.full_name?.[0] || user?.company_name?.[0] || 'U'}
                                                </span>
                                            )}
                                        </div>
                                        {/* Chevron icon */}
                                        <svg 
                                            className={`w-4 h-4 text-slate-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* 👇 DROPDOWN MENU */}
                                    {showProfileMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 animate-fadeIn">
                                            {/* User Info Header */}
                                            <div className="px-4 py-3 border-b border-slate-100">
                                                <p className="text-sm font-bold text-slate-900">
                                                    {user?.full_name || user?.company_name || 'User'}
                                                </p>
                                                <p className="text-xs text-slate-500">{user?.email}</p>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="py-1">
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setShowProfileMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                                >
                                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    My Profile
                                                </Link>

                                                {isCandidate && (
                                                    <>
                                                        <Link
                                                            to="/my-applications"
                                                            onClick={() => setShowProfileMenu(false)}
                                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                                        >
                                                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            My Applications
                                                        </Link>

                                                        <Link
                                                            to="/my-interviews"
                                                            onClick={() => setShowProfileMenu(false)}
                                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                                        >
                                                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            My Interviews
                                                        </Link>

                                                        {/* 👇 THÊM: Favorite Jobs */}
                                                        <Link
                                                            to="/my-favorites"
                                                            onClick={() => setShowProfileMenu(false)}
                                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                                        >
                                                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                            </svg>
                                                            Favorite Jobs
                                                        </Link>

                                                        <Link to="/my-following" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition">
                                                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            My Following
                                                        </Link>

                                                        <Link
                                                            to="/my-roadmap"
                                                            onClick={() => setShowProfileMenu(false)}
                                                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                                        >
                                                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                            </svg>
                                                            My Roadmap
                                                        </Link>
                                                    </>
                                                )}

                                                {/* Divider */}
                                                <div className="my-1 border-t border-slate-100"></div>

                                                {/* Logout */}
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full text-left"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login">Login</NavLink>
                                <Link
                                    to="/register"
                                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-lg hover:shadow-primary-600/30 transition-all"
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;