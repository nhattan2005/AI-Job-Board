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
    const [companyAddress, setCompanyAddress] = useState('');
    const [companySize, setCompanySize] = useState('');
    const [companyIndustry, setCompanyIndustry] = useState('');
    const [companyFoundedYear, setCompanyFoundedYear] = useState('');
    const [companyBenefits, setCompanyBenefits] = useState('');
    const [companyEmail, setCompanyEmail] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');
    const [socialLinkedin, setSocialLinkedin] = useState('');
    const [socialFacebook, setSocialFacebook] = useState('');
    const [socialTwitter, setSocialTwitter] = useState('');

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
                setCompanyAddress(user.company_address || '');
                setCompanySize(user.company_size || '');
                setCompanyIndustry(user.company_industry || '');
                setCompanyFoundedYear(user.company_founded_year || '');
                setCompanyBenefits(user.company_benefits ? user.company_benefits.join(', ') : '');
                setCompanyEmail(user.company_email || '');
                setCompanyPhone(user.company_phone || '');
                setSocialLinkedin(user.social_linkedin || '');
                setSocialFacebook(user.social_facebook || '');
                setSocialTwitter(user.social_twitter || '');
            }

            setAvatarUrl(user.avatar_url || ''); // Load avatar từ user context
        }
    }, [user, isCandidate, isEmployer]);

    // 👇 HÀM XỬ LÝ UPLOAD ẢNH
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setLoading(true);
            setError('');
            console.log('📤 Uploading avatar...');
            
            // 👇 SỬA LỖI TẠI ĐÂY: Đổi '/auth/avatar' thành '/auth/upload-avatar'
            const response = await api.post('/auth/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const newAvatarUrl = response.data.avatar_url;
            console.log('✅ Avatar uploaded:', newAvatarUrl);
            
            setAvatarUrl(newAvatarUrl);
            
            // 👇 THÊM: Fetch lại profile để update user object trong context
            const profileResponse = await api.get('/auth/profile');
            updateUser(profileResponse.data.user);
            
            setSuccess('Avatar updated successfully!');
        } catch (err) {
            console.error('❌ Upload error:', err);
            setError(err.response?.data?.error || 'Failed to upload avatar');
        } finally {
            setLoading(false);
        }
    };

    // Helper để lấy full URL ảnh
    const getFullImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path; // Nếu là link Cloudinary thì giữ nguyên
        return `http://localhost:5000${path}`; // Fallback cho ảnh cũ (nếu có)
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
                updateData.company_address = companyAddress;
                updateData.company_size = companySize;
                updateData.company_industry = companyIndustry;
                updateData.company_founded_year = companyFoundedYear ? parseInt(companyFoundedYear) : null;
                updateData.company_benefits = companyBenefits.split(',').map(b => b.trim()).filter(b => b);
                updateData.company_email = companyEmail;
                updateData.company_phone = companyPhone;
                updateData.social_linkedin = socialLinkedin;
                updateData.social_facebook = socialFacebook;
                updateData.social_twitter = socialTwitter;
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

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
                        <p className="text-gray-600">Manage your account information</p>
                    </div>

                    {/* Role Badge */}
                    <div className={`px-4 py-2 rounded-lg border-2 font-semibold flex items-center gap-2 ${
                        user?.role === 'admin' 
                            ? 'bg-purple-50 border-purple-200 text-purple-700'
                            : user?.role === 'employer'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                        {/* Icon theo role */}
                        {user?.role === 'admin' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        ) : user?.role === 'employer' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                        
                        {/* Text hiển thị role */}
                        <span>
                            {user?.role === 'admin' && 'Admin'}
                            {user?.role === 'employer' && 'Employer'}
                            {user?.role === 'candidate' && 'Job Seeker'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 👇 THÊM PHẦN NÀY CHO EMPLOYER */}
            {isEmployer && user?.id && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div>
                                <h3 className="font-bold text-gray-800">Company Public Profile</h3>
                                <p className="text-sm text-gray-600">See how candidates view your company</p>
                            </div>
                        </div>
                        <Link
                            to={`/employer/${user.id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition flex items-center gap-2"
                        >
                            View Profile
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </Link>
                    </div>
                </div>
            )}

            {/* Success/Error Messages */}
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
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Company Information</h3>
                            </div>

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
                                    placeholder="TechCorp Inc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Company Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={companyDescription}
                                    onChange={(e) => setCompanyDescription(e.target.value)}
                                    rows="4"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Giới thiệu về công ty, văn hóa và sứ mệnh..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Company Address <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={companyAddress}
                                    onChange={(e) => setCompanyAddress(e.target.value)}
                                    rows="2"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Tầng 12, Bitexco Financial Tower, 2 Hai Trieu, Quận 1, TPHCM"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Size
                                    </label>
                                    <select
                                        value={companySize}
                                        onChange={(e) => setCompanySize(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Select size</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201-500">201-500 employees</option>
                                        <option value="501-1000">501-1000 employees</option>
                                        <option value="1000+">1000+ employees</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Founded Year
                                    </label>
                                    <input
                                        type="number"
                                        value={companyFoundedYear}
                                        onChange={(e) => setCompanyFoundedYear(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="2020"
                                        min="1800"
                                        max={new Date().getFullYear()}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Industry
                                </label>
                                <input
                                    type="text"
                                    value={companyIndustry}
                                    onChange={(e) => setCompanyIndustry(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Software Development, E-commerce, FinTech, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Company Benefits (ngăn cách bằng dấu phẩy)
                                </label>
                                <textarea
                                    value={companyBenefits}
                                    onChange={(e) => setCompanyBenefits(e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Lương cạnh tranh, Bảo hiểm sức khỏe, Remote work, Ngân sách học tập"
                                />
                                <p className="text-xs text-gray-500 mt-1">Nhập các phúc lợi cách nhau bằng dấu phẩy</p>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Contact Information</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Email
                                    </label>
                                    <input
                                        type="email"
                                        value={companyEmail}
                                        onChange={(e) => setCompanyEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="hr@company.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Company Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={companyPhone}
                                        onChange={(e) => setCompanyPhone(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+84 123 456 789"
                                    />
                                </div>
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

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Social Media</h3>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    LinkedIn
                                </label>
                                <input
                                    type="url"
                                    value={socialLinkedin}
                                    onChange={(e) => setSocialLinkedin(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://linkedin.com/company/yourcompany"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Facebook
                                </label>
                                <input
                                    type="url"
                                    value={socialFacebook}
                                    onChange={(e) => setSocialFacebook(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://facebook.com/yourcompany"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Twitter
                                </label>
                                <input
                                    type="url"
                                    value={socialTwitter}
                                    onChange={(e) => setSocialTwitter(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://twitter.com/yourcompany"
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