import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EmailVerifiedPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [status, setStatus] = useState('verifying');
    const [error, setError] = useState('');

    useEffect(() => {
        verifyEmail();
    }, [token]);

    const verifyEmail = async () => {
        try {
            const response = await api.get(`/auth/verify-email/${token}`);
            const { token: authToken, user } = response.data;
            
            localStorage.setItem('token', authToken);
            
            setStatus('success');
            
            setTimeout(() => {
                if (user.role === 'employer') {
                    navigate('/employer/dashboard');
                } else {
                    navigate('/');
                }
            }, 2000);
        } catch (err) {
            setStatus('error');
            setError(err.response?.data?.error || 'Verification failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-2xl text-center">
                {status === 'verifying' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verifying Your Email...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we verify your email address
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Email Verified Successfully!
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Your account has been verified. Redirecting you now...
                        </p>
                        <div className="flex justify-center">
                            <div className="animate-pulse flex space-x-2">
                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                            </div>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-red-600 mb-4">
                            {error}
                        </p>
                        <Link
                            to="/login"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                        >
                            Go to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmailVerifiedPage;