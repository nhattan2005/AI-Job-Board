import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 👈 Import Link
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports');
            setReports(res.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.patch(`/reports/${id}/status`, { status });
            fetchReports();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    return (
        <AdminLayout title="Report Management" subtitle="Review user reports">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                            <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                        report.target_type === 'job' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                    }`}>
                                        {report.target_type.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {/* 👇 CẬP NHẬT: Link trỏ đến Job hoặc User */}
                                    {report.target_type === 'job' ? (
                                        <Link 
                                            to={`/jobs/${report.target_id}`} 
                                            target="_blank" 
                                            className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1"
                                            title="View Job Details"
                                        >
                                            {report.target_name || 'Unknown Job'}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </Link>
                                    ) : report.target_type === 'user' ? (
                                        <Link 
                                            to={`/employer/${report.target_id}`} 
                                            target="_blank"
                                            className="text-purple-600 hover:text-purple-800 font-bold hover:underline flex items-center gap-1"
                                            title="View Profile"
                                        >
                                            {report.target_name || 'Unknown User'}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </Link>
                                    ) : (
                                        <div className="text-sm font-medium text-gray-900">{report.target_name}</div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">ID: {report.target_id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 font-semibold">{report.reason}</div>
                                    <div className="text-sm text-gray-500">{report.description}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {report.reporter_email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {report.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleStatusUpdate(report.id, 'resolved')}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                Resolve
                                            </button>
                                            <button 
                                                onClick={() => handleStatusUpdate(report.id, 'dismissed')}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
};

export default AdminReports;