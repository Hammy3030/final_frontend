import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('teacher'); // 'teacher' or 'student'
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      if (loginType === 'teacher') {
        await login(data);
      } else {
        // For students, login with student code only (no password required)
        await login({
          email: data.studentCode?.toUpperCase(), // Student code (e.g., STU001)
          password: '' // No password required for student login
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">BearThai</h1>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-lg p-8"
        >
          {/* Login Type Switcher */}
          <div className="flex justify-center mb-8">
            <div className="flex w-full max-w-xs bg-white rounded-full shadow-sm p-1">
              <button
                type="button"
                onClick={() => setLoginType('teacher')}
                className={`flex-1 py-3 rounded-full font-medium text-lg transition duration-200 focus:outline-none ${loginType === 'teacher'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-transparent text-blue-700'
                  }`}
              >
                ครู
              </button>
              <button
                type="button"
                onClick={() => setLoginType('student')}
                className={`flex-1 py-3 rounded-full font-medium text-lg transition duration-200 focus:outline-none ${loginType === 'student'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-transparent text-blue-700'
                  }`}
              >
                นักเรียน
              </button>
            </div>
          </div>

          {/* Form Title */}
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            เข้าสู่ระบบ
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {loginType === 'teacher' ? (
              <>
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2">
                    อีเมล
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email', {
                      required: 'กรุณากรอกอีเมล',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'รูปแบบอีเมลไม่ถูกต้อง'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-base"
                    placeholder="กรอกอีเมลของคุณ"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: 'กรุณากรอกรหัสผ่าน',
                        minLength: {
                          value: 6,
                          message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                        }
                      })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-base"
                      placeholder="กรอกรหัสผ่านของคุณ"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Student Code Input */}
                <div>
                  <label htmlFor="studentCode" className="block text-base font-medium text-gray-700 mb-2">
                    รหัสนักเรียน
                  </label>
                  <input
                    id="studentCode"
                    type="text"
                    {...register('studentCode', {
                      required: 'กรุณากรอกรหัสนักเรียน',
                      pattern: {
                        value: /^STU\d{3}$/i,
                        message: 'รหัสนักเรียนต้องเป็นรูปแบบ STU001'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-base uppercase"
                    placeholder="กรอกรหัสนักเรียน (เช่น STU001)"
                    maxLength={6}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.studentCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.studentCode.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 rounded-xl font-semibold text-lg transition duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-6 ${isLoading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                }`}
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </motion.button>
          </form>


          {/* Info for Teachers */}
          {loginType === 'teacher' && (
            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-medium transition duration-200 text-base"
              >
                สมัครสมาชิกครู
              </Link>
            </div>
          )}

          {/* Info for Students */}
          {loginType === 'student' && (
            <div className="mt-6 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  <strong>สำหรับนักเรียน:</strong> รหัสนักเรียนจะได้รับจากครูผู้สอน
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
