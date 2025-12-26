import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications?limit=100');
            setNotifications(response.data.notifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const filteredNotifications = notifications.filter(n =>
        filter === 'all' ? true : !n.is_read
    );

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'interview_invite': return '📅';
            case 'application_status': return '📝';
            case 'interview_confirmed': return '✅';
            case 'job_alert': return '💼';
            default: return '🔔';
        }
    };

    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link to="/" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center mb-4">
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Home
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                            <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Notifications
                        </h1>
                        <p className="text-gray-600">
                            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filter === 'unread'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Unread ({notifications.filter(n => !n.is_read).length})
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`bg-white rounded-lg shadow hover:shadow-md transition p-6 ${
                                !notification.is_read ? 'border-l-4 border-blue-600' : ''
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 text-3xl">
                                    {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {notification.title}
                                        </h3>
                                        {!notification.is_read && (
                                            <span className="flex-shrink-0 w-3 h-3 bg-blue-600 rounded-full"></span>
                                        )}
                                    </div>

                                    <p className="text-gray-700 mb-3">
                                        {notification.message}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">
                                            {timeAgo(notification.created_at)}
                                        </span>

                                        <div className="flex items-center gap-3">
                                            {notification.link && (
                                                <Link
                                                    to={notification.link}
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                                                >
                                                    View Details →
                                                </Link>
                                            )}

                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-sm text-gray-600 hover:text-gray-800 font-semibold"
                                                >
                                                    Mark as read
                                                </button>
                                            )}

                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="text-sm text-red-600 hover:text-red-800 font-semibold"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;