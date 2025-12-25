import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <>
            <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div 
                        className="absolute inset-0" 
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 35px,
                                rgba(255, 255, 255, 0.03) 35px,
                                rgba(255, 255, 255, 0.03) 70px
                            )`
                        }}
                    />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                    {/* Main Footer Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        
                        {/* About Section */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold">AI Job Board</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-4">
                                Powered by AI, built for your career success
                            </p>
                            
                            {/* Social Links */}
                            <div className="flex gap-3">
                                <a 
                                    href="https://linkedin.com" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-primary-600 hover:border-primary-600 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                                    </svg>
                                </a>
                                <a 
                                    href="https://facebook.com" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-primary-600 hover:border-primary-600 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                                    </svg>
                                </a>
                                <a 
                                    href="https://github.com/nhattan2005/AI-Job-Board" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-primary-600 hover:border-primary-600 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* About Project */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">About Project</h3>
                            
                            <div className="space-y-3">
                                <p className="text-white text-lg font-bold leading-relaxed">
                                    Đồ án môn học
                                </p>
                                <p className="text-slate-300 text-base leading-relaxed">
                                    Nhập môn Công nghệ phần mềm
                                </p>
                                <p className="text-primary-400 text-base font-bold">
                                    SE104.Q11.KHTN
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed mt-2">
                                    Trường Đại học Công nghệ thông tin - ĐHQG TP.HCM
                                </p>
                            </div>
                        </div>

                        {/* AI Features */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">AI Features</h3>
                            <ul className="space-y-2">
                                <li className="text-slate-400 text-sm flex items-start">
                                    <span className="text-primary-400 mr-2">✓</span>
                                    CV Match Score
                                </li>
                                <li className="text-slate-400 text-sm flex items-start">
                                    <span className="text-primary-400 mr-2">✓</span>
                                    CV Tailoring
                                </li>
                                <li className="text-slate-400 text-sm flex items-start">
                                    <span className="text-primary-400 mr-2">✓</span>
                                    Career Path Analyzer
                                </li>
                                <li className="text-slate-400 text-sm flex items-start">
                                    <span className="text-primary-400 mr-2">✓</span>
                                    Mock Interview AI
                                </li>
                                <li className="text-slate-400 text-sm flex items-start">
                                    <span className="text-primary-400 mr-2">✓</span>
                                    Personalized Roadmap
                                </li>
                                <li className="text-slate-400 text-sm flex items-start">
                                    <span className="text-primary-400 mr-2">✓</span>
                                    Smart Job Matching
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Want to post a job?</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start gap-2 text-slate-400">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <div>
                                        <div className="font-medium text-white mb-1">Email:</div>
                                        <a href="mailto:contact@aijobboard.com" className="hover:text-primary-400 transition">
                                            contact@aijobboard.com
                                        </a>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-2 text-slate-400">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <div className="font-medium text-white mb-1">Ho Chi Minh City</div>
                                        <a href="tel:+84977460519" className="hover:text-primary-400 transition">
                                            (+84) 977 460 519
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 text-slate-400">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <div className="font-medium text-white mb-1">Ha Noi</div>
                                        <a href="tel:+84983131351" className="hover:text-primary-400 transition">
                                            (+84) 983 131 351
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-slate-700 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <span>Copyright © 2025 AI Job Board</span>
                                <span className="hidden md:inline">•</span>
                                <span className="hidden md:inline">Powered by TanDungSon</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link to="/privacy-policy" className="hover:text-primary-400 transition">
                                    Privacy Policy
                                </Link>
                                <span>•</span>
                                <Link to="/terms-of-service" className="hover:text-primary-400 transition">
                                    Terms of Service
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;
