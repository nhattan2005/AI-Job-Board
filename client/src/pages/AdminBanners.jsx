import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const AdminBanners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [globalDuration, setGlobalDuration] = useState(() => {
        return parseInt(localStorage.getItem('bannerDuration')) || 8;
    });
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        display_order: 0,
        is_active: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const res = await api.get('/banners/all');
            setBanners(res.data);
        } catch (error) {
            console.error('Error fetching banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const openCreateModal = () => {
        setEditingBanner(null);
        setFormData({ 
            title: '', 
            subtitle: '', 
            display_order: banners.length + 1, 
            is_active: true
        });
        setImageFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (banner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title,
            subtitle: banner.subtitle || '',
            display_order: banner.display_order,
            is_active: banner.is_active
        });
        setImagePreview(banner.image_url);
        setImageFile(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!editingBanner && !imageFile) {
            alert('Please select an image');
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('subtitle', formData.subtitle);
        data.append('display_order', formData.display_order);
        data.append('is_active', formData.is_active);

        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            if (editingBanner) {
                await api.put(`/banners/${editingBanner.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/banners', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowModal(false);
            fetchBanners();
        } catch (error) {
            alert('Failed to save banner');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;

        try {
            await api.delete(`/banners/${id}`);
            fetchBanners();
        } catch (error) {
            alert('Failed to delete banner');
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Banner Management" subtitle="Loading...">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout 
            title="Banner Management" 
            subtitle="Manage homepage carousel banners"
        >
            <div className="mb-6 flex items-center justify-between">
                {/* Global Duration Setting */}
                <div className="flex items-center gap-3 bg-white rounded-xl shadow-md px-5 py-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <label className="text-sm font-semibold text-gray-700">
                        Auto-slide Duration:
                    </label>
                    <input
                        type="number"
                        value={globalDuration}
                        onChange={(e) => {
                            const value = parseInt(e.target.value) || 8;
                            setGlobalDuration(value);
                            localStorage.setItem('bannerDuration', value);
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="3"
                        max="30"
                    />
                    <span className="text-sm text-gray-600">seconds</span>
                </div>

                <button
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Banner
                </button>
            </div>

            {/* Banner List */}
            <div className="grid grid-cols-1 gap-6">
                {banners.map((banner) => (
                    <div key={banner.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="flex">
                            <div className="w-1/3">
                                <img
                                    src={banner.image_url}
                                    alt={banner.title}
                                    className="w-full h-48 object-cover"
                                />
                            </div>
                            <div className="w-2/3 p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{banner.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            banner.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {banner.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-2">{banner.subtitle}</p>
                                    <p className="text-sm text-gray-500">Display Order: {banner.display_order}</p>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => openEditModal(banner)}
                                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">
                            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Subtitle
                                </label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Display Order
                                </label>
                                <input
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Lower numbers appear first
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm font-semibold text-gray-700">Active</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 ml-6">
                                    Inactive banners won't be displayed on the homepage
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Banner Image {!editingBanner && '*'}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-lg file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100 cursor-pointer"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Recommended: 1920x600px (16:5 ratio), max 5MB
                                </p>
                            </div>

                            {imagePreview && (
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-lg border"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                                >
                                    {editingBanner ? 'Update Banner' : 'Create Banner'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminBanners;