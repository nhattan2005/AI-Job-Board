import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    
    const topRef = useRef(null);

    const [role, setRole] = useState('candidate');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');

    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState('');

    const [companyName, setCompanyName] = useState('');
    const [companyDescription, setCompanyDescription] = useState('');
    const [website, setWebsite] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationType, setVerificationType] = useState('otp');

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (error && topRef.current) {
            topRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }, [error]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) {
            console.log('⚠️ Already submitting, ignoring duplicate request');
            return;
        }

        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/[a-z]/.test(password)) {
            setError('Password must contain at least one lowercase letter');
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setError('Password must contain at least one uppercase letter');
            return;
        }

        if (!/[0-9]/.test(password)) {
            setError('Password must contain at least one number');
            return;
        }

        if (role === 'candidate' && !fullName) {
            setError('Full name is required for candidates');
            return;
        }

        if (role === 'employer' && !companyName) {
            setError('Company name is required for employers');
            return;
        }

        if (!phone) {
            setError('Phone number is required');
            return;
        }

        setLoading(true);
        setIsSubmitting(true);

        try {
            const userData = { email, password, role, phone, verificationType };
            
            if (role === 'candidate') {
                userData.full_name = fullName;
                userData.bio = bio;
                userData.skills = skills.split(',').map(s => s.trim()).filter(s => s);
            } else {
                userData.company_name = companyName;
                userData.company_description = companyDescription;
                userData.website = website;
            }

            console.log('📤 Sending registration data:', userData);

            const result = await register(userData);
            
            console.log('✅ Registration result:', result);
            
            if (result.skipVerification) {
                if (result.user.role === 'employer') {
                    navigate('/employer/dashboard');
                } else if (result.user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/');
                }
                return;
            }
            
            if (verificationType === 'otp') {
                navigate('/verify-email', { 
                    state: { 
                        email: email,
                        verificationType: 'otp'
                    } 
                });
            } else {
                navigate('/verify-email-sent', {
                    state: {
                        email: email,
                        verificationType: 'link'
                    }
                });
            }
        } catch (err) {
            console.error('❌ Registration error:', err);
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
            setTimeout(() => {
                setIsSubmitting(false);
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div ref={topRef} className="max-w-2xl mx-auto bg-white p-10 rounded-xl shadow-2xl">
                <div className="mb-8">
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 rounded-lg shadow-md animate-shake">
                        <div className="flex items-start">
                            <svg className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <p className="font-semibold">Registration Error</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            I am a... <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('candidate')}
                                className={`py-4 px-6 border-2 rounded-lg font-semibold transition ${
                                    role === 'candidate'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <div className="text-center">
                                    <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Job Seeker
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('employer')}
                                className={`py-4 px-6 border-2 rounded-lg font-semibold transition ${
                                    role === 'employer'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <div className="text-center">
                                    <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Employer
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+84 123 456 789"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Min. 8 characters"
                            />
                            <PasswordStrengthIndicator password={password} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Confirm your password"
                            />
                        </div>
                    </div>

                    {role === 'candidate' && (
                        <div className="space-y-4 border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900">Candidate Information</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bio
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Skills (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={skills}
                                    onChange={(e) => setSkills(e.target.value)}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="JavaScript, React, Node.js"
                                />
                            </div>
                        </div>
                    )}

                    {role === 'employer' && (
                        <div className="space-y-4 border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="TechCorp Inc."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Company Description
                                </label>
                                <textarea
                                    value={companyDescription}
                                    onChange={(e) => setCompanyDescription(e.target.value)}
                                    rows="3"
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describe your company..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://yourcompany.com"
                                />
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Email Verification Method <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Choose how you want to verify your email address
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setVerificationType('otp')}
                                className={`py-4 px-4 border-2 rounded-lg font-semibold transition ${
                                    verificationType === 'otp'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🔢</div>
                                    <div className="font-bold mb-1">OTP Code</div>
                                    <div className="text-xs text-gray-500">
                                        Receive a 6-digit code via email
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        ⏱️ Expires in 10 minutes
                                    </div>
                                </div>
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => setVerificationType('link')}
                                className={`py-4 px-4 border-2 rounded-lg font-semibold transition ${
                                    verificationType === 'link'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <div className="text-center">
                                    <div className="text-3xl mb-2">🔗</div>
                                    <div className="font-bold mb-1">Email Link</div>
                                    <div className="text-xs text-gray-500">
                                        Click a link in your email
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        ⏱️ Expires in 24 hours
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating account...
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-500">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;