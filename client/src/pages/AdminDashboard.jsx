import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout'; // 👈 IMPORT

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentActions, setRecentActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, actionsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/actions?limit=10')
            ]);
            setStats(statsRes.data);
            setRecentActions(actionsRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Admin Dashboard" subtitle="Loading...">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout 
            title="Admin Dashboard" 
            subtitle="Manage users, jobs, and monitor platform activity"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{stats?.total_candidates || 0}</p>
                            <p className="text-gray-600">Candidates</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{stats?.total_employers || 0}</p>
                            <p className="text-gray-600">Employers</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{stats?.active_jobs || 0}</p>
                            <p className="text-gray-600">Active Jobs</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 text-red-600">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-2xl font-bold text-gray-800">{stats?.banned_users || 0}</p>
                            <p className="text-gray-600">Banned Users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link to="/admin/users" className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                        <svg className="h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <div className="ml-4">
                            <h3 className="text-lg font-bold text-gray-800">Manage Users</h3>
                            <p className="text-sm text-gray-600">View and moderate users</p>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/jobs" className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                        <svg className="h-10 w-10 text-green-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div className="ml-4">
                            <h3 className="text-lg font-bold text-gray-800">Manage Jobs</h3>
                            <p className="text-sm text-gray-600">Review and moderate jobs</p>
                        </div>
                    </div>
                </Link>

                <Link to="/admin/banners" className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                        <svg className="h-10 w-10 text-indigo-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="ml-4">
                            <h3 className="text-lg font-bold text-gray-800">Manage Banners</h3>
                            <p className="text-sm text-gray-600">Homepage carousel images</p>
                        </div>
                    </div>
                </Link>
                
                {/* 👇 THÊM CARD MỚI */}
                <Link to="/admin/admins" className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                        <svg className="h-10 w-10 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <div className="ml-4">
                            <h3 className="text-lg font-bold text-gray-800">Manage Admins</h3>
                            <p className="text-sm text-gray-600">Administrator accounts</p>
                        </div>
                    </div>
                </Link>

                {/* 👇 Add Report Link */}
                <Link to="/admin/reports" className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <div className="flex items-center">
                        <svg className="h-10 w-10 text-red-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="ml-4">
                            <h3 className="text-lg font-bold text-gray-800">View Reports</h3>
                            <p className="text-sm text-gray-600">Access system reports</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Admin Actions</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentActions.map((action) => (
                                <tr key={action.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {action.action_type.replace('_', ' ').toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {action.admin_email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {action.target_type} #{action.target_id}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {action.reason || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(action.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;