import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResendVerification, setShowResendVerification] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setShowResendVerification(false);

        try {
            const user = await login(email, password);
            
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user.role === 'employer') {
                navigate('/employer/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            const errorData = err.response?.data;
            
            // 👇 THÊM: Xử lý trường hợp account bị ban
            if (errorData?.isBanned || errorData?.error === 'Account Suspended') {
                setError(errorData.message || 'Your account has been suspended. Please contact support.');
            } else if (errorData?.error === 'Email not verified') {
                setUnverifiedEmail(errorData.email || email);
                setShowResendVerification(true);
                setError('Your email is not verified. Please verify your email to continue.');
            } else {
                setError(errorData?.error || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // HÀM GỬI LẠI EMAIL XÁC THỰC
    const handleResendVerification = async () => {
        try {
            await api.post('/auth/resend-verification', {
                email: unverifiedEmail,
                verificationType: 'otp'
            });
            
            navigate('/verify-email', {
                state: {
                    email: unverifiedEmail,
                    verificationType: 'otp'
                }
            });
        } catch (err) {
            setError('Failed to resend verification email');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Or{' '}
                        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
                            create a new account
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                        {showResendVerification && (
                            <button
                                onClick={handleResendVerification}
                                className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                            >
                                Resend Verification Email
                            </button>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">
                        Forgot your password?
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;