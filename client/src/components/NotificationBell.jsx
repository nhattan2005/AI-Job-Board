import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Load notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications?limit=10');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load unread count only (faster)
    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    // Mark as read
    const markAsRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            fetchUnreadCount();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // Get icon based on type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'interview_invite':
                return '📅';
            case 'application_status':
                return '📝';
            case 'interview_confirmed':
                return '✅';
            case 'job_alert':
                return '💼';
            case 'new_application':  // 👈 THÊM TYPE MỚI
                return '📝';
            default:
                return '🔔';
        }
    };

    // Format time ago
    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    // Load unread count on mount
    useEffect(() => {
        fetchUnreadCount();

        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    // Load full notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
                        <h3 className="text-lg font-bold text-slate-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="font-semibold">No notifications yet</p>
                                <p className="text-sm mt-1">We'll notify you when something arrives</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer group ${
                                        !notification.is_read ? 'bg-blue-50' : 'bg-white'
                                    }`}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            markAsRead(notification.id);
                                        }
                                        if (notification.link) {
                                            setIsOpen(false);
                                        }
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-semibold ${
                                                    !notification.is_read ? 'text-slate-900' : 'text-slate-700'
                                                }`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-slate-400">
                                                    {timeAgo(notification.created_at)}
                                                </span>
                                                {notification.link && (
                                                    <Link
                                                        to={notification.link}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                                    >
                                                        View →
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                            <Link
                                to="/notifications"
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-semibold block text-center"
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;