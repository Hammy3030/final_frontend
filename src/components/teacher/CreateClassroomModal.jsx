import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';

const CreateClassroomModal = ({ onClose, onSubmit, isLoading, initialData, isEditMode = false }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      name: '',
      description: ''
    }
  });

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'แก้ไขห้องเรียน' : 'สร้างห้องเรียนใหม่'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition duration-200"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อห้องเรียน
              </label>
              <input
                type="text"
                {...register('name', {
                  required: 'กรุณากรอกชื่อห้องเรียน',
                  minLength: {
                    value: 2,
                    message: 'ชื่อห้องเรียนต้องมีอย่างน้อย 2 ตัวอักษร'
                  },
                  maxLength: {
                    value: 100,
                    message: 'ชื่อห้องเรียนต้องไม่เกิน 100 ตัวอักษร'
                  }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="เช่น ป.1/1 , ภาษาไทย ป.1"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย (ไม่บังคับ)
              </label>
              <textarea
                {...register('description')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="กรอกคำอธิบายเกี่ยวกับห้องเรียน"
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังสร้าง
                  </div>
                ) : (
                  isEditMode ? 'บันทึกการแก้ไข' : 'สร้างห้องเรียน'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateClassroomModal;
