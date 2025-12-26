import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout'; // 👈 IMPORT

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ role: 'all', status: 'all' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [banModal, setBanModal] = useState({ open: false, user: null, reason: '' });

    useEffect(() => {
        fetchUsers();
    }, [filter, page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users', { params: { ...filter, page, limit: 20 } });
            setUsers(res.data.users);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBanToggle = async (user) => {
        if (user.is_banned) {
            // Unban directly
            if (window.confirm(`Unban user ${user.email}?`)) {
                try {
                    await api.patch(`/admin/users/${user.id}/ban`, { reason: 'Unbanned by admin' });
                    fetchUsers();
                } catch (error) {
                    alert('Failed to unban user');
                }
            }
        } else {
            // Open modal for ban reason
            setBanModal({ open: true, user, reason: '' });
        }
    };

    const confirmBan = async () => {
        try {
            await api.patch(`/admin/users/${banModal.user.id}/ban`, { reason: banModal.reason });
            setBanModal({ open: false, user: null, reason: '' });
            fetchUsers();
        } catch (error) {
            alert('Failed to ban user');
        }
    };

    return (
        <AdminLayout 
            title="User Management" 
            subtitle="View and moderate user accounts"
        >
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex gap-4">
                <select
                    value={filter.role}
                    onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="all">All Roles</option>
                    <option value="candidate">Candidates</option>
                    <option value="employer">Employers</option>
                </select>

                <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.full_name || user.company_name || 'N/A'}
                                        </div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.role === 'candidate' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.is_banned ? (
                                        <div>
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                Banned
                                            </span>
                                            <div className="text-xs text-gray-500 mt-1">{user.ban_reason}</div>
                                        </div>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleBanToggle(user)}
                                        className={`px-3 py-1 text-sm font-semibold rounded-lg ${
                                            user.is_banned
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                    >
                                        {user.is_banned ? 'Unban' : 'Ban'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center gap-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="px-4 py-2">Page {page} of {totalPages}</span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            {/* Ban Modal */}
            {banModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Ban User: {banModal.user.email}</h3>
                        <textarea
                            value={banModal.reason}
                            onChange={(e) => setBanModal({ ...banModal, reason: e.target.value })}
                            placeholder="Reason for banning..."
                            rows="4"
                            className="w-full px-3 py-2 border rounded-lg mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={confirmBan}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold"
                            >
                                Confirm Ban
                            </button>
                            <button
                                onClick={() => setBanModal({ open: false, user: null, reason: '' })}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminUsers;