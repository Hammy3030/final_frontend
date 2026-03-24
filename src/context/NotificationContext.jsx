import React, { createContext, useContext, useState, useEffect } from 'react';
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

    const fetchNotifications = async () => {
        if (!user || !token) return;

        try {
            // In a real app, this would be an API call
            // For now, we'll use mock data or a placeholder endpoint if available
            // const res = await axios.get(getApiUrl('/notifications'), {
            //   headers: { Authorization: `Bearer ${token}` }
            // });
            // setNotifications(res.data.data);
            // setUnreadCount(res.data.data.filter(n => !n.isRead).length);

            // Mock data for demonstration
            const mockNotifications = [
                {
                    id: 1,
                    title: 'ยินดีต้อนรับ!',
                    message: 'ยินดีต้อนรับสู่ BearThai ขอให้สนุกกับการเรียนรู้นะครับ',
                    isRead: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'บทเรียนใหม่',
                    message: 'บทเรียน "สระ อา" พร้อมให้เรียนแล้ว',
                    isRead: true,
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                }
            ];

            // Only set if empty to avoid overwriting state in this mock version
            if (notifications.length === 0) {
                setNotifications(mockNotifications);
                setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
            }

        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            // API call would go here
            // await axios.put(getApiUrl(`/notifications/${notificationId}/read`), {}, {
            //   headers: { Authorization: `Bearer ${token}` }
            // });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            // API call would go here
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Polling for notifications
    useEffect(() => {
        if (user) {
            fetchNotifications();

            const interval = setInterval(() => {
                fetchNotifications();
            }, 30000); // Poll every 30 seconds

            return () => clearInterval(interval);
        }
    }, [user, token]);

    const value = {
        notifications,
        unreadCount,
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
