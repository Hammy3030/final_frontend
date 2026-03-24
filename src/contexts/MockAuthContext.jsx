import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { mockAuth, mockAuthState } from '../config/mockData';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('mock-token'),
  isAuthenticated: !!localStorage.getItem('mock-token'),
  isLoading: false,
  isInitialized: false,
  hasCheckedAuth: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        hasCheckedAuth: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        hasCheckedAuth: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        hasCheckedAuth: true,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload,
        hasCheckedAuth: true,
      };
    case 'SET_AUTH_CHECKED':
      return {
        ...state,
        hasCheckedAuth: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check initial session on mount
  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        
        const token = localStorage.getItem('mock-token');
        if (token) {
          // Find user by token
          const userId = token.replace('mock-token-', '');
          const user = mockAuthState.users?.find(u => u.id === userId);
          
          if (user) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user, token },
            });
          } else {
            localStorage.removeItem('mock-token');
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } else {
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkInitialSession();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await mockAuth.login(credentials);
      
      if (result.success) {
        localStorage.setItem('mock-token', result.token);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: result.user, token: result.token },
        });
        
        toast.success('เข้าสู่ระบบสำเร็จ');
        return { success: true };
      }
    } catch (error) {
      const message = error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      toast.error(message);
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, error: message };
    }
  };

  const qrLogin = async (qrCode) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await mockAuth.qrLogin(qrCode);
      
      if (result.success) {
        localStorage.setItem('mock-token', result.token);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: result.user, token: result.token },
        });
        
        toast.success('เข้าสู่ระบบด้วย QR Code สำเร็จ');
        return { success: true };
      }
    } catch (error) {
      const message = error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย QR Code';
      toast.error(message);
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const result = await mockAuth.register(userData);
      
      if (result.success) {
        toast.success('สมัครสมาชิกสำเร็จ');
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: true };
      }
    } catch (error) {
      const message = error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      toast.error(message);
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await mockAuth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      localStorage.removeItem('mock-token');
      
      // Clear auth state
      dispatch({ type: 'LOGOUT' });
      
      // Show success message
      toast.success('ออกจากระบบแล้ว');
      
      // Clear loading
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    });
  };

  const value = useMemo(() => ({
    ...state,
    login,
    qrLogin,
    register,
    logout,
    updateUser,
  }), [state, login, qrLogin, register, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
