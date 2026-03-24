import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Plus, Image as ImageIcon, Save, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AddVocabImageModal = ({ onClose, onAdd, initialData = null }) => {
  const [word, setWord] = useState(initialData?.word || '');
  const [label, setLabel] = useState(initialData?.label || '');
  const [imagePreview, setImagePreview] = useState(initialData?.image || null);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word) {
      toast.error('กรุณากรอกคำศัพท์');
      return;
    }
    if (!imagePreview) {
      toast.error('กรุณาอัปโหลดรูปภาพ');
      return;
    }
    
    try {
      setIsSaving(true);
      await onAdd({ word, label: label || word, image: imagePreview });
      if (initialData) {
        onClose(); // Close immediately on Edit
      } else {
        setWord('');
        setLabel('');
        setImagePreview(null);
        // Don't close so they can add another
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-[Sarabun,sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/50"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                {initialData ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <h2 className="text-xl font-bold">{initialData ? 'แก้ไขข้อมูลรูปภาพและคำศัพท์' : 'เพิ่มพรีวิวรูปภาพ (เพิ่มได้เรื่อยๆ)'}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">คำศัพท์ / พยัญชนะ / ประโยค</label>
              <input 
                type="text" 
                value={word}
                onChange={e => setWord(e.target.value)}
                placeholder="เช่น ก, ข, ควาย, โรงเรียน"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">คำอ่าน / ความหมาย (แสดงใต้รูป - หากมี)</label>
              <input 
                type="text" 
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="เช่น ก ไก่, ง งู"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">อัปโหลดรูปภาพที่ต้องการ</label>
              <div className="flex gap-4">
                <label className="flex-1 flex flex-col items-center justify-center p-6 bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-2xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 transition-all group">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="text-emerald-600" size={24} />
                  </div>
                  <span className="text-xs font-bold text-emerald-600">กดเลือกไฟล์รูปภาพจากเครื่อง</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                
                {imagePreview ? (
                  <div className="relative w-32 h-32 shrink-0 group">
                    <img src={imagePreview} className="w-full h-full object-cover rounded-2xl shadow-md border-4 border-white" alt="Preview" />
                    <button 
                      type="button" 
                      onClick={() => setImagePreview(null)} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-gray-100 flex items-center justify-center text-gray-300 shrink-0">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
              >
                เสร็จสิ้น / ปิด
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                <span>{isSaving ? 'กำลังอัปเดตบทเรียน...' : (initialData ? 'บันทึกการแก้ไข' : 'อัปโหลดภาพนี้เข้าบทเรียน')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddVocabImageModal;
