import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const VerifyEmailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Lấy email từ state (truyền từ trang Register) hoặc localStorage
    const [email, setEmail] = useState(location.state?.email || '');

    useEffect(() => {
        if (!email) {
            // Nếu không có email, quay về login
            navigate('/login');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Gọi API xác thực
            const response = await api.post('/auth/verify-email-otp', {
                email,
                otp
            });

            // 2. Backend trả về token và user ngay lập tức
            const { token, user } = response.data;

            // 3. Lưu token vào localStorage
            localStorage.setItem('token', token);

            // 4. Redirect và reload để AuthContext cập nhật trạng thái đăng nhập
            // Dùng window.location.href thay vì navigate để đảm bảo app reload sạch sẽ
            if (user.role === 'employer') {
                window.location.href = '/employer/dashboard';
            } else {
                window.location.href = '/';
            }

        } catch (err) {
            // Xử lý lỗi
            const errorMsg = err.response?.data?.error || 'Verification failed';
            
            // Nếu lỗi là "Invalid OTP" nhưng thực ra user đã verify rồi (trường hợp bạn vừa gặp)
            // Ta có thể thử đăng nhập lại hoặc báo user
            if (errorMsg === 'Invalid OTP') {
                setError('Invalid OTP or account already verified. Please try logging in.');
            } else {
                setError(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setLoading(true);
            await api.post('/auth/resend-verification', { 
                email,
                verificationType: 'otp'
            });
            alert('New OTP sent to your email');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">✉️</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Verify your email
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        We've sent a 6-digit code to <br/>
                        <span className="font-semibold text-blue-600">{email}</span>
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                        {error.includes('already verified') && (
                            <button 
                                onClick={() => navigate('/login')}
                                className="block mt-2 text-blue-700 underline font-bold"
                            >
                                Go to Login
                            </button>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="otp" className="sr-only">OTP Code</label>
                        <input
                            id="otp"
                            type="text"
                            required
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full px-3 py-4 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="000000"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-gray-600">
                        Didn't receive the code?{' '}
                        <button 
                            onClick={handleResendOtp}
                            disabled={loading}
                            className="font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400"
                        >
                            Resend OTP
                        </button>
                    </p>
                    <div className="mt-4">
                        <button 
                            onClick={() => navigate('/register')}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ← Back to registration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;