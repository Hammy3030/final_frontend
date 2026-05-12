import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const isMountedRef = useRef(true);
    const pollIntervalRef = useRef(null);

    const getAuthHeaders = useCallback(() => ({
        Authorization: `Bearer ${token}`
    }), [token]);

    const fetchNotifications = useCallback(async () => {
        if (!user || !token || user.role !== 'STUDENT') return;

        try {
            setLoading(true);
            const res = await axios.get(getApiUrl('/student/notifications'), {
                headers: getAuthHeaders()
            });

            const nextNotifications = res.data?.data?.notifications || [];

            if (isMountedRef.current) {
                setNotifications(nextNotifications);
                setUnreadCount(nextNotifications.filter((n) => !n.isRead).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [user, token, getAuthHeaders]);

    const markAsRead = async (notificationId) => {
        if (!token) return;

        const previousNotifications = notifications;
        const wasUnread = notifications.some((n) => n.id === notificationId && !n.isRead);

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        try {
            await axios.put(getApiUrl(`/student/notifications/${notificationId}/read`), {}, {
                headers: getAuthHeaders()
            });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Rollback + re-sync from server for consistency
            if (isMountedRef.current) {
                setNotifications(previousNotifications);
                setUnreadCount(previousNotifications.filter((n) => !n.isRead).length);
            }
            await fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        if (!token) return;

        const previousNotifications = notifications;
        const unreadNotifications = notifications.filter((n) => !n.isRead);

        if (unreadNotifications.length === 0) {
            return;
        }

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await axios.put(getApiUrl('/student/notifications/read-all'), {}, {
                headers: getAuthHeaders()
            });
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            // Rollback + re-sync
            if (isMountedRef.current) {
                setNotifications(previousNotifications);
                setUnreadCount(previousNotifications.filter((n) => !n.isRead).length);
            }
            await fetchNotifications();
        }
    };

    // Polling for notifications
    useEffect(() => {
        isMountedRef.current = true;

        if (user && user.role === 'STUDENT') {
            fetchNotifications();

            pollIntervalRef.current = setInterval(() => {
                fetchNotifications();
            }, 30000); // Poll every 30 seconds

            return () => {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
            };
        }

        setNotifications([]);
        setUnreadCount(0);
    }, [user, token, fetchNotifications]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    const value = {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        fetchNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
