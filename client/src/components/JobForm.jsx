import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Thêm useParams
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const JobForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Lấy ID từ URL nếu đang edit
    const isEditMode = !!id; // Kiểm tra xem có phải đang edit không
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [salaryRange, setSalaryRange] = useState('');
    const [employmentType, setEmploymentType] = useState('full-time');
    const [deadline, setDeadline] = useState(''); // State cho deadline
    const [status, setStatus] = useState('active'); // State cho status
    
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch data nếu đang ở chế độ Edit
    useEffect(() => {
        if (isEditMode) {
            const fetchJob = async () => {
                try {
                    const response = await api.get(`/jobs/${id}`);
                    const job = response.data;
                    setTitle(job.title);
                    setDescription(job.description);
                    setLocation(job.location);
                    setSalaryRange(job.salary_range);
                    setEmploymentType(job.employment_type);
                    setStatus(job.status);
                    
                    // Format date cho input type="date" (YYYY-MM-DD)
                    if (job.deadline) {
                        const date = new Date(job.deadline);
                        setDeadline(date.toISOString().split('T')[0]);
                    }
                } catch (err) {
                    setError('Failed to fetch job details');
                }
            };
            fetchJob();
        }
    }, [id, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        const jobData = {
            title,
            description,
            location,
            salary_range: salaryRange,
            employment_type: employmentType,
            deadline: deadline || null,
            status
        };

        try {
            if (isEditMode) {
                // Gọi API Update
                await api.put(`/jobs/${id}`, jobData);
                setSuccess('Job updated successfully!');
            } else {
                // Gọi API Create
                await api.post('/jobs', jobData);
                setSuccess('Job posted successfully!');
            }
            
            setTimeout(() => {
                navigate('/employer/dashboard');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {isEditMode ? 'Edit Job Posting' : 'Post a New Job'}
                </h2>
                <p className="text-gray-600 mb-6">
                    {isEditMode ? 'Update the details of your job posting' : 'Fill in the details to create a new job posting'}
                </p>
                
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="e.g. Senior React Developer"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="6"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Describe the role, requirements, and responsibilities..."
                            required
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="e.g. Ho Chi Minh City, Remote"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Employment Type
                            </label>
                            <select
                                value={employmentType}
                                onChange={(e) => setEmploymentType(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="contract">Contract</option>
                                <option value="internship">Internship</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Salary Range
                            </label>
                            <input
                                type="text"
                                value={salaryRange}
                                onChange={(e) => setSalaryRange(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="e.g. $1000 - $2000 or Negotiable"
                            />
                        </div>

                        {/* 👇 THÊM INPUT DEADLINE */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Application Deadline
                            </label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                min={new Date().toISOString().split('T')[0]} // Không cho chọn ngày quá khứ
                            />
                        </div>
                    </div>

                    {/* 👇 THÊM INPUT STATUS (Chỉ hiện khi Edit) */}
                    {isEditMode && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Job Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            >
                                <option value="active">Active (Open for applications)</option>
                                <option value="closed">Closed (No longer accepting)</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/employer/dashboard')}
                            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-200"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : (isEditMode ? 'Update Job' : 'Post Job')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobForm;