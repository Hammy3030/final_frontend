import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register: authRegister, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = {
        ...data,
        role: 'TEACHER',
        school: data.school
      };
      
      const result = await authRegister(userData);
      
      if (!result.success) {
        setError(result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      } else if (result.success && result.requiresEmailVerification) {
        // Show message and redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
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
        {/* Register Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            สมัครสมาชิกครู
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'กรุณากรอกชื่อ-นามสกุล',
                  minLength: {
                    value: 2,
                    message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
                  }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-base"
                placeholder="กรอกชื่อ-นามสกุลของคุณ"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                อีเมล
              </label>
              <input
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

            {/* School Input */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                โรงเรียน
              </label>
              <input
                type="text"
                {...register('school', { 
                  required: 'กรุณากรอกชื่อโรงเรียน'
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-base"
                placeholder="กรอกชื่อโรงเรียน"
              />
              {errors.school && (
                <p className="mt-1 text-sm text-red-600">{errors.school.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { 
                    required: 'กรุณากรอกรหัสผ่าน',
                    minLength: {
                      value: 6,
                      message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                    }
                  })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-base"
                  placeholder="กรอกรหัสผ่าน"
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

            {/* Confirm Password Input */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', { 
                    required: 'กรุณายืนยันรหัสผ่าน',
                    validate: value => value === password || 'รหัสผ่านไม่ตรงกัน'
                  })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-base"
                  placeholder="ยืนยันรหัสผ่าน"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <p className="text-center text-sm text-gray-600 mt-4">
              หลังจากสมัครสมาชิกแล้ว คุณจะได้รับการยืนยันอีเมลเพื่อเข้าสู่ระบบ
            </p>


            <div className="flex justify-center w-full mt-4">
              <p className="text-sm text-gray-600">
                มีบัญชีแล้ว?
                <Link to="/login" className="text-blue-600 hover:underline ml-1">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
            {/* Register Button */}
            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-4 rounded-xl font-semibold text-lg transition duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-6 ${
                isLoading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>กำลังสมัครสมาชิก...</span>
                </div>
              ) : (
                'สมัครสมาชิกครู'
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
