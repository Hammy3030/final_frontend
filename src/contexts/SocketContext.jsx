import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if Socket.io is enabled via environment variables
    const socketEnabled = import.meta.env.VITE_SOCKET_ENABLED === 'true';
    const socketUrl = import.meta.env.VITE_SOCKET_URL;

    if (!socketEnabled || !socketUrl) {
      // Socket.io is disabled - using Supabase Realtime instead
      setIsConnected(false);
      return;
    }

    // Socket.io connection (currently disabled, will use Supabase Realtime)
    if (isAuthenticated && user) {
      const newSocket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('token'),
        },
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('Connected to Socket.io server');
        setIsConnected(true);
        
        // Join classroom if user is a student
        if (user.role === 'STUDENT' && user.classroom?.id) {
          newSocket.emit('join-classroom', user.classroom.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from Socket.io server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Close socket if user is not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  // Listen for notifications
  useEffect(() => {
    if (socket && user?.role === 'STUDENT') {
      socket.on('notification', (notification) => {
        console.log('Received notification:', notification);
        // Handle notification display here
      });

      socket.on('announcement', (announcement) => {
        console.log('Received announcement:', announcement);
        // Handle announcement display here
      });

      return () => {
        socket.off('notification');
        socket.off('announcement');
      };
    }
  }, [socket, user]);

  const joinClassroom = (classroomId) => {
    if (socket && isConnected) {
      socket.emit('join-classroom', classroomId);
    }
  };

  const leaveClassroom = (classroomId) => {
    if (socket && isConnected) {
      socket.emit('leave-classroom', classroomId);
    }
  };

  const sendMessage = (message) => {
    if (socket && isConnected) {
      socket.emit('message', message);
    }
  };

  const value = {
    socket,
    isConnected,
    joinClassroom,
    leaveClassroom,
    sendMessage,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
