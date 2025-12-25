import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
    const { isAuthenticated, isCandidate, isEmployer, isAdmin, user, logout } = useAuth(); // 👈 THÊM isAdmin
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    // Hiệu ứng khi cuộn trang
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    const NavLink = ({ to, children }) => (
        <Link 
            to={to} 
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive(to) 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
            }`}
        >
            {children}
        </Link>
    );

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
            scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50' : 'bg-white border-b border-slate-100'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white font-bold text-lg shadow-glow group-hover:scale-110 transition-transform">
                                AI
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                                JobBoard
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-2">
                        {isAuthenticated ? (
                            <>
                                {isCandidate && (
                                    <>
                                        <NavLink to="/">Browse Jobs</NavLink>
                                        <NavLink to="/my-applications">Applications</NavLink>
                                        <NavLink to="/my-interviews">Interviews</NavLink>
                                        <NavLink to="/my-roadmap">My Roadmap</NavLink>
                                    </>
                                )}

                                {isEmployer && (
                                    <>
                                        <NavLink to="/employer/dashboard">Dashboard</NavLink>
                                        <NavLink to="/employer/post-job">Post Job</NavLink>
                                        <NavLink to="/employer/all-applications">Applications</NavLink>
                                    </>
                                )}

                                {/* 👇 THÊM ĐOẠN NÀY */}
                                {isAdmin && (
                                    <>
                                        <NavLink to="/admin/dashboard">Dashboard</NavLink>
                                        <NavLink to="/admin/users">Users</NavLink>
                                        <NavLink to="/admin/jobs">Jobs</NavLink>
                                    </>
                                )}

                                <NavLink to="/profile">Profile</NavLink>

                                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                                
                                <div className="flex items-center gap-3 ml-2">
                                    <Link to="/profile" className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary-600 transition">
                                        {/* 👇 SỬA: Thay thế avatar giả bằng ảnh thật */}
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-primary-600 font-bold border border-slate-200 overflow-hidden">
                                            {user?.avatar_url ? (
                                                <img 
                                                    src={user.avatar_url} 
                                                    alt={user?.full_name || user?.company_name || 'User'} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Fallback nếu ảnh lỗi
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <span style={{ display: user?.avatar_url ? 'none' : 'flex' }} className="w-full h-full flex items-center justify-center">
                                                {user?.full_name?.[0] || user?.company_name?.[0] || 'U'}
                                            </span>
                                        </div>
                                    </Link>
                                    <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-red-600 transition">
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-primary-600 transition">
                                    Login
                                </Link>
                                <Link to="/register" className="px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                                    Get Started
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