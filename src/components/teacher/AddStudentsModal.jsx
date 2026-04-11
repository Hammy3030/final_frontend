import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';

const PREFIXES = [
  { value: 'เด็กชาย', label: 'เด็กชาย' },
  { value: 'เด็กหญิง', label: 'เด็กหญิง' },
  { value: 'ด.ช.', label: 'ด.ช.' },
  { value: 'ด.ญ.', label: 'ด.ญ.' },
];

const AddStudentsModal = ({ onClose, onSubmit, isLoading }) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      students: [{ prefix: 'เด็กชาย', name: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'students'
  });

  const handleFormSubmit = (data) => {
    // Combine prefix + name as full name
    const processed = {
      ...data,
      students: data.students.map(s => ({
        ...s,
        name: `${s.prefix}${s.name}`.trim()
      }))
    };
    onSubmit(processed);
  };

  const addStudent = () => {
    append({ prefix: 'เด็กชาย', name: '' });
  };

  const removeStudent = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
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
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              สร้างบัญชีนักเรียน
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
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-end gap-3 p-4 border border-gray-200 rounded-lg"
                >
                  {/* Prefix */}
                  <div className="w-32 shrink-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คำนำหน้า
                    </label>
                    <select
                      {...register(`students.${index}.prefix`)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
                      disabled={isLoading}
                    >
                      {PREFIXES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ-นามสกุล
                    </label>
                    <input
                      type="text"
                      {...register(`students.${index}.name`, {
                        required: 'กรุณากรอกชื่อ-นามสกุล',
                        minLength: {
                          value: 2,
                          message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="ชื่อ นามสกุล"
                      disabled={isLoading}
                    />
                    {errors.students?.[index]?.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.students[index].name.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeStudent(index)}
                    className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition duration-200 shrink-0"
                    disabled={isLoading || fields.length === 1}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={addStudent}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition duration-200"
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                สร้างบัญชีนักเรียน
              </button>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200 mt-6">
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
                    กำลังเพิ่ม...
                  </div>
                ) : (
                  `สร้างบัญชีนักเรียน ${fields.length} คน`
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddStudentsModal;
