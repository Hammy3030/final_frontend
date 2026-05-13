import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';
import { getApiUrl } from '../utils/apiConfig';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,
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

  // Timeout to prevent infinite loading
  useEffect(() => {
    if (state.isLoading && !state.isInitialized) {
      const timeout = setTimeout(() => {
        console.warn('Auth loading timeout - forcing logout');
        dispatch({ type: 'LOGIN_FAILURE' });
      }, 15000); // 15 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [state.isLoading, state.isInitialized]);

  // Check initial session on mount
  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Validate token with backend
          const response = await axios.get(getApiUrl('/auth/profile'), {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (response.data.success) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.data.data.user,
                token: token
              },
            });
          } else {
            // Token invalid, clear it
            localStorage.removeItem('token');
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } else {
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } catch (error) {
        const status = error.response?.status;
        // 401 = โทเค็นไม่ถูกต้อง/หมดอายุ → ลบโทเค็น
        if (!error.response || status === 401) {
          localStorage.removeItem('token');
          dispatch({ type: 'LOGIN_FAILURE' });
          return;
        }
        // 500/502/503 = ฝั่ง backend ผิดพลาด → ไม่ลบโทเค็น รีเฟรชหลัง backend แก้แล้วจะลองเช็ค session ใหม่
        if (status >= 500) {
          console.warn(
            '[Auth] Profile API returned',
            status,
            '- Backend may be down. Token kept; try refreshing the page later.'
          );
          dispatch({ type: 'LOGIN_FAILURE' });
          return;
        }
        console.error('Initial session check error:', status ?? error?.message ?? error);
        localStorage.removeItem('token');
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkInitialSession();
  }, []);


  // Remove duplicate auth check - INITIAL_SESSION event handles this

  const login = async (credentials, isRetry = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await axios.post(getApiUrl('/auth/login'), {
        email: credentials.email,
        password: credentials.password
      });

      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('token', token);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
        toast.success('เข้าสู่ระบบสำเร็จ');
        return { success: true };
      }
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      const status = error.response?.status;
      if (status >= 500 && !isRetry) {
        await new Promise(r => setTimeout(r, 1500));
        return login(credentials, true);
      }
      const message = status >= 500
        ? 'ไม่มีบัญชีนี้จ้า'
        : (error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      toast.error(message);
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, error: message };
    }
  };


  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Register with backend API
      const response = await axios.post(getApiUrl('/auth/register'), {
        email: userData.email,
        password: userData.password,
        role: userData.role,
        name: userData.name,
        school: userData.school,
        studentCode: userData.studentCode
      });

      if (response.data.success) {
        // Don't auto-login after registration - user needs to verify email
        // The backend now returns requiresEmailVerification flag

        dispatch({ type: 'SET_LOADING', payload: false });
        toast.success(response.data.message || 'สมัครสมาชิกสำเร็จ กรุณายืนยันอีเมล');
        return { success: true, requiresEmailVerification: true };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Clear token from localStorage
      localStorage.removeItem('token');

      // Clear auth state
      dispatch({ type: 'LOGOUT' });

      toast.success('ออกจากระบบแล้ว');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the state even if there's an error
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    });
  };

  const refreshProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(getApiUrl('/auth/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          dispatch({
            type: 'UPDATE_USER',
            payload: response.data.data.user,
          });
          return { success: true, user: response.data.data.user };
        }
      }
      return { success: false };
    } catch (error) {
      console.error('Refresh profile error:', error);
      return { success: false, error };
    }
  };

  const value = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
  }), [state, login, register, logout, updateUser]);

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
