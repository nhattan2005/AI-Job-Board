import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const VerifyEmailSentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';
    const [resending, setResending] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const handleResend = async () => {
        setResending(true);
        setMessage('');

        try {
            await api.post('/auth/resend-verification', {
                email,
                verificationType: 'link'
            });
            setMessage('✅ New verification link sent! Please check your email.');
        } catch (err) {
            setMessage('❌ Failed to resend email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white p-10 rounded-xl shadow-2xl text-center">
                {/* Icon */}
                <div className="mx-auto h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                    Check Your Email
                </h2>

                {/* Description */}
                <p className="text-gray-600 mb-2">
                    We've sent a verification link to:
                </p>
                <p className="text-lg font-semibold text-blue-600 mb-6">
                    {email}
                </p>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                    <p className="text-sm text-gray-700 mb-3 font-semibold">
                        📬 Next steps:
                    </p>
                    <ol className="text-sm text-gray-600 space-y-2 ml-4 list-decimal">
                        <li>Open your email inbox</li>
                        <li>Find the email from AI Job Board</li>
                        <li>Click the verification link</li>
                        <li>You'll be redirected back to complete setup</li>
                    </ol>
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                    <p className="text-xs text-yellow-800">
                        ⚠️ Didn't receive the email? Check your spam folder or click resend below.
                    </p>
                </div>

                {/* Resend Message */}
                {message && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${
                        message.includes('✅') 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {message}
                    </div>
                )}

                {/* Resend Button */}
                <button
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full mb-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>

                {/* Back to Login */}
                <Link
                    to="/login"
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                    ← Back to login
                </Link>

                {/* Time Info */}
                <p className="mt-6 text-xs text-gray-500">
                    The verification link will expire in 24 hours
                </p>
            </div>
        </div>
    );
};

export default VerifyEmailSentPage;