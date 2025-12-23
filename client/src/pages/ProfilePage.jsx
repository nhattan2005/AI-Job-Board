import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
    const { user, updateUser, isCandidate, isEmployer } = useAuth(); // Đảm bảo updateUser được lấy từ context
    const navigate = useNavigate();

    // Common fields
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Candidate fields
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [skills, setSkills] = useState('');

    // Employer fields
    const [companyName, setCompanyName] = useState('');
    const [companyDescription, setCompanyDescription] = useState('');
    const [website, setWebsite] = useState('');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(''); // State cho avatar

    useEffect(() => {
        if (user) {
            setEmail(user.email || '');
            setPhone(user.phone || '');

            if (isCandidate) {
                setFullName(user.full_name || '');
                setBio(user.bio || '');
                setSkills(user.skills ? user.skills.join(', ') : '');
            } else if (isEmployer) {
                setCompanyName(user.company_name || '');
                setCompanyDescription(user.company_description || '');
                setWebsite(user.website || '');
            }

            setAvatarUrl(user.avatar_url || ''); // Load avatar từ user context
        }
    }, [user, isCandidate, isEmployer]);

    // 👇 HÀM XỬ LÝ UPLOAD ẢNH
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setLoading(true);
            const response = await api.post('/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const newAvatarUrl = response.data.avatar_url;
            setAvatarUrl(newAvatarUrl);
            
            // Cập nhật user trong context để các trang khác cũng thấy avatar mới
            updateUser({ ...user, avatar_url: newAvatarUrl });
            
            setSuccess('Avatar updated successfully!');
        } catch (err) {
            console.error(err);
            setError('Failed to upload avatar');
        } finally {
            setLoading(false);
        }
    };

    // Helper để lấy full URL ảnh
    const getFullImageUrl = (path) => {
        if (!path) return null;
        return `http://localhost:5000${path}`; // Thay đổi port nếu server chạy port khác
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const updateData = {
                phone
            };

            if (isCandidate) {
                updateData.full_name = fullName;
                updateData.bio = bio;
                updateData.skills = skills.split(',').map(s => s.trim()).filter(s => s);
            } else {
                updateData.company_name = companyName;
                updateData.company_description = companyDescription;
                updateData.website = website;
            }

            const response = await api.put('/auth/profile', updateData);
            updateUser(response.data.user);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            setSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    to={isCandidate ? "/" : "/employer/dashboard"}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center mb-4"
                >
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>

                <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
                <p className="text-gray-600">Manage your account information</p>
            </div>

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* 👇 THÊM ĐOẠN CODE NÀY VÀO ĐÂY (Ngay trước div chứa form Profile Information) */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center gap-6">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-200 flex items-center justify-center">
                        {avatarUrl ? (
                            <img 
                                src={getFullImageUrl(avatarUrl)} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-3xl text-slate-400 font-bold">
                                {isEmployer ? companyName?.charAt(0) || 'C' : fullName?.charAt(0) || 'U'}
                            </span>
                        )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Profile Picture</h2>
                    <p className="text-sm text-gray-500">Click on the image to upload a new photo. JPG, PNG or GIF.</p>
                </div>
            </div>
            {/* 👆 KẾT THÚC ĐOẠN CODE CẦN THÊM */}

            {/* Profile Information Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Profile Information</h2>
                
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {/* Email (readonly) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Candidate Fields */}
                    {isCandidate && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows="4"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Skills (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={skills}
                                    onChange={(e) => setSkills(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="JavaScript, React, Node.js"
                                />
                            </div>
                        </>
                    )}

                    {/* Employer Fields */}
                    {isEmployer && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Company Description
                                </label>
                                <textarea
                                    value={companyDescription}
                                    onChange={(e) => setCompanyDescription(e.target.value)}
                                    rows="4"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://yourcompany.com"
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Change Password</h2>
                
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Current Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            New Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;