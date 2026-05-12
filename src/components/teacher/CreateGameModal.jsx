import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Image as ImageIcon, Save, Gamepad2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import { useAuth } from '../../contexts/AuthContext';

const CreateGameModal = ({ isOpen, onClose, lessonId, lessonTitle }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState(lessonTitle ? `เกม - ${lessonTitle}` : 'เกมจับคู่คำศัพท์');
  const [pairs, setPairs] = useState([
    { id: '1', word: '', image: '', label: '', file: null, preview: null }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPair = () => {
    setPairs([...pairs, { id: String(pairs.length + 1), word: '', image: '', label: '', file: null, preview: null }]);
  };

  const removePair = (index) => {
    if (pairs.length > 1) {
      setPairs(pairs.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (index, field, value) => {
    const newPairs = [...pairs];
    newPairs[index][field] = value;
    if (field === 'word' && !newPairs[index].label) {
      newPairs[index].label = value;
    }
    setPairs(newPairs);
  };

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPairs = [...pairs];
        newPairs[index].file = file;
        newPairs[index].preview = reader.result; // This will be the base64 string
        setPairs(newPairs);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pairs.some(p => !p.word || (!p.image && !p.preview))) {
      toast.error('กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบทุกคู่');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create Game using pairs with embedded base64 images
      const gameData = {
        title,
        type: 'MATCHING',
        settings: {
          pairs: pairs.map(p => ({
            id: p.id,
            word: p.word,
            image: p.preview || p.image, // Use base64 preview as the image
            label: p.label || p.word
          }))
        }
      };

      await axios.post(getApiUrl(`/lessons/${lessonId}/games`), gameData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('สร้างเกมสำเร็จแล้ว!');
      onClose();
    } catch (error) {
      console.error('Create game error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างเกม');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <Gamepad2 size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">สร้างเกมจับคู่</h2>
                <p className="text-orange-100 text-sm font-medium">กำหนดรูปภาพและคำศัพท์ด้วยตัวเอง</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="space-y-8">
              {/* Game Title */}
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-wider">ชื่อเกม</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-lg"
                  placeholder="เช่น จับคู่คำศัพท์ สระอา"
                  required
                />
              </div>

              {/* Pairs List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider">รายการคู่จับคู่ ({pairs.length})</label>
                </div>
                
                <div className="grid gap-4">
                  {pairs.map((pair, index) => (
                    <motion.div 
                      layout
                      key={index} 
                      className="group p-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] hover:border-orange-200 hover:bg-orange-50/30 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Image Upload Area */}
                        <div className="relative shrink-0">
                          <input
                            type="file"
                            id={`game-img-${index}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageChange(index, e)}
                          />
                          <label
                            htmlFor={`game-img-${index}`}
                            className={`w-32 h-32 rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm
                              ${pair.preview ? 'border-orange-500 bg-white' : 'border-gray-200 bg-white hover:border-orange-400 group-hover:scale-105'}
                            `}
                          >
                            {pair.preview ? (
                              <img src={pair.preview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <ImageIcon size={24} className="text-gray-300 mb-2" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-2">อัปโหลด<br/>รูปภาพ</span>
                              </>
                            )}
                          </label>
                        </div>

                        {/* Text Fields Area */}
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">คำศัพท์</label>
                              <input
                                type="text"
                                value={pair.word}
                                onChange={(e) => handleFieldChange(index, 'word', e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-orange-400 outline-none transition-all font-bold"
                                placeholder="เช่น ไก่"
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">คำอ่าน/ป้ายกำกับ</label>
                              <input
                                type="text"
                                value={pair.label}
                                onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-orange-400 outline-none transition-all font-bold"
                                placeholder="เช่น ก ไก่"
                                required
                              />
                            </div>
                          </div>
                          
                          {pairs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePair(index)}
                              className="text-sm font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors ml-auto"
                            >
                              <Trash2 size={16} />
                              ลบคู่นี้
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addPair}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 font-bold hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2 group"
                >
                  <div className="p-1 bg-gray-100 rounded-full group-hover:bg-orange-100 transition-colors">
                    <Plus size={20} />
                  </div>
                  เพิ่มคู่จับคู่ใหม่
                </button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 text-gray-500 font-black hover:text-gray-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-10 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black rounded-2xl shadow-xl shadow-orange-200 flex items-center gap-2 transition-all active:scale-95
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-orange-300'}
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>บันทึกเกม</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateGameModal;
