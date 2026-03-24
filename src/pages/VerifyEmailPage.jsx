import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import { getApiUrl } from '../utils/apiConfig';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('ไม่พบ token สำหรับยืนยันอีเมล');
        return;
      }

      try {
        const response = await axios.get(getApiUrl('/auth/verify-email'), {
          params: { token }
        });

        if (response.data.success) {
          // Store token and redirect to dashboard
          localStorage.setItem('token', response.data.data.token);
          setStatus('success');
          setMessage('ยืนยันอีเมลสำเร็จ! กำลังพาคุณเข้าสู่ระบบ...');

          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'เกิดข้อผิดพลาดในการยืนยันอีเมล');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
      >
        {status === 'loading' && (
          <div className="text-center">
            <Loader className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">กำลังยืนยันอีเมล...</h2>
            <p className="text-gray-600">กรุณารอสักครู่</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันอีเมลสำเร็จ!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Mail className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-blue-800">กำลังพาคุณเข้าสู่ระบบ...</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันอีเมลไม่สำเร็จ</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                สมัครสมาชิกใหม่
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
