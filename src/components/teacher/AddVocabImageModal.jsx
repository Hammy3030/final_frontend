import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Plus, Image as ImageIcon, Save, Edit2, FileImage, Type } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils/imageUtils';

const AddVocabImageModal = ({ onClose, onAdd, initialData = null }) => {
  const [word, setWord] = useState(initialData?.word || '');
  const [label, setLabel] = useState(initialData?.label || '');
  const [imagePreview, setImagePreview] = useState(initialData?.image || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file) => {
    if (file && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImage(file);
        setImagePreview(compressed);
      } catch (err) {
        toast.error(err.message || 'เกิดข้อผิดพลาดในการบีบอัดรูปภาพ');
      }
    } else {
      toast.error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  }, []);

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
        onClose();
      } else {
        setWord('');
        setLabel('');
        setImagePreview(null);
        toast.success('เพิ่มคำศัพท์สำเร็จ! สามารถเพิ่มต่อได้เลย');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-[Sarabun,sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20"
        >
          {/* Premium Header */}
          <div className="px-8 py-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 text-white relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30">
                  {initialData ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none">
                    {initialData ? 'แก้ไขบทเรียน' : 'เพิ่มเนื้อหาบทเรียน'}
                  </h2>
                  <p className="text-white/70 text-sm mt-1 font-medium">เพิ่มรูปภาพและคำศัพท์เพื่อสร้างบทเรียนที่น่าสนใจ</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white/20 rounded-2xl transition-all duration-200 group"
              >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Type size={16} className="text-indigo-500" />
                  คำศัพท์ / ประโยค
                </label>
                <input
                  type="text"
                  value={word}
                  onChange={e => setWord(e.target.value)}
                  placeholder="เช่น ก, ไก่, โรงเรียน"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-lg outline-none placeholder:text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <span className="text-emerald-500">✨</span> คำอ่าน / ความหมาย
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="เช่น ก ไก่, ง งู"
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-lg outline-none placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <FileImage size={16} className="text-blue-500" />
                อัปโหลดรูปภาพประกอบ
              </label>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <label 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`flex-1 flex flex-col items-center justify-center p-8 rounded-[2rem] cursor-pointer transition-all duration-300 relative overflow-hidden group border-2 border-dashed ${
                    isDragging 
                      ? 'bg-indigo-50 border-indigo-500 scale-[1.02]' 
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
                    isDragging ? 'bg-indigo-500 text-white rotate-12' : 'bg-white text-indigo-500 shadow-lg group-hover:scale-110 group-hover:rotate-3'
                  }`}>
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <span className="block text-base font-black text-slate-700">คลิก หรือ ลากไฟล์มาวางที่นี่</span>
                    <span className="block text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">JPG, PNG, WebP (Max 5MB)</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>

                <div className="shrink-0 flex items-center justify-center">
                  {imagePreview ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative w-40 h-40 group"
                    >
                      <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-[2rem] opacity-20 blur-lg group-hover:opacity-40 transition-opacity" />
                      <div className="relative w-full h-full rounded-[1.8rem] overflow-hidden border-4 border-white shadow-xl">
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        <button
                          type="button"
                          onClick={() => setImagePreview(null)}
                          className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-2 shadow-lg hover:bg-rose-600 hover:scale-110 transition-all duration-200"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-40 h-40 rounded-[2rem] bg-slate-50 border-2 border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-2 border-dashed">
                      <ImageIcon size={48} className="opacity-20" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">No Preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between gap-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-4 text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all duration-200"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
              >
                {isSaving ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={22} />
                )}
                <span className="text-lg">
                  {isSaving ? 'กำลังบันทึก...' : (initialData ? 'บันทึกการแก้ไข' : 'บันทึกเข้าบทเรียน')}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddVocabImageModal;
