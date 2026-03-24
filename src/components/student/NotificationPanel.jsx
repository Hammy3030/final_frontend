import React from 'react';
import { motion } from 'framer-motion';

/**
 * Notification Panel Component
 * Displays notifications list
 */
const NotificationPanel = ({ 
  notifications, 
  unreadCount, 
  onNotificationClick 
}) => {
  if (notifications.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">ไม่มีการแจ้งเตือน</p>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.slice(0, 5).map((notif) => (
        <motion.div
          key={notif.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNotificationClick(notif.id)}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            notif.isRead
              ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                  {notif.title}
                </h3>
                {!notif.isRead && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-bold">
                    ใหม่
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
              <span className="text-xs text-gray-400 mt-2 block">
                {new Date(notif.createdAt).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {!notif.isRead && (
              <div className="ml-2 w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1 animate-pulse"></div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default NotificationPanel;
