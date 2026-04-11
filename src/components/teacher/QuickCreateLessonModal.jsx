import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, BookOpen, Upload, Image as ImageIcon } from 'lucide-react';

const QuickCreateLessonModal = ({ onClose, onSubmit, isLoading = false }) => {
  const [title, setTitle] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) onSubmit(title, imagePreview);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-[Sarabun,sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/50"
        >
          <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold">กำหนดชื่อบทเรียนใหม่</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อบทเรียน</label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="เช่น บทที่ 1: ก ไก่"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">หน้าปกบทเรียน (ถ้ามี)</label>
              <div className="flex gap-4">
                <label className="flex-1 flex flex-col items-center justify-center p-4 bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all group">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="text-blue-600" size={20} />
                  </div>
                  <span className="text-xs font-bold text-blue-600">อัปโหลดหน้าปก</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>

                {imagePreview ? (
                  <div className="relative w-24 h-24 shrink-0 group">
                    <img src={imagePreview} className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white" alt="Preview" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus size={20} />
                )}
                <span>สร้างและไปหน้าเนื้อหา</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickCreateLessonModal;
