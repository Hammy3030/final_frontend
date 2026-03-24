import { createContext, useContext, useEffect, useState } from 'react';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Mock Socket.io is disabled for development
    console.log('Mock Socket.io: Disabled for development');
    setIsConnected(false);
  }, []);

  // Mock functions for Socket.io operations
  const joinClassroom = (classroomId) => {
    console.log('Mock Socket: Joining classroom', classroomId);
  };

  const leaveClassroom = (classroomId) => {
    console.log('Mock Socket: Leaving classroom', classroomId);
  };

  const sendMessage = (message) => {
    console.log('Mock Socket: Sending message', message);
  };

  const value = {
    socket: null,
    isConnected: false,
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
