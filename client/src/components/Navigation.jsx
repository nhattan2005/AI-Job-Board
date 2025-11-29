import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
    const { user, logout, isAuthenticated, isEmployer, isCandidate } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-blue-600 text-white shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-2xl font-bold">AI Job Board</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-6">
                        {isAuthenticated ? (
                            <>
                                {/* Role-specific Links */}
                                {isCandidate && (
                                    <>
                                        <Link to="/" className="hover:text-gray-200 transition font-medium">
                                            Browse Jobs
                                        </Link>
                                        <Link to="/my-applications" className="hover:text-gray-200 transition font-medium">
                                            My Applications
                                        </Link>
                                    </>
                                )}
                                
                                {isEmployer && (
                                    <>
                                        <Link to="/employer/dashboard" className="hover:text-gray-200 transition font-medium">
                                            Dashboard
                                        </Link>
                                        <Link to="/employer/post-job" className="hover:text-gray-200 transition font-medium">
                                            Post Job
                                        </Link>
                                    </>
                                )}

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-2 hover:text-gray-200 transition"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center">
                                            <span className="text-sm font-semibold">
                                                {user?.email?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                                            <div className="px-4 py-2 border-b border-gray-200">
                                                <p className="text-sm text-gray-700 font-semibold">
                                                    {user?.full_name || user?.company_name}
                                                </p>
                                                <p className="text-xs text-gray-500">{user?.email}</p>
                                            </div>
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="hover:text-gray-200 transition font-medium">
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
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