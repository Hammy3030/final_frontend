import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  BookOpen,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Info,
  Layers
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils/imageUtils';

/**
 * Create Lesson Modal Component
 * Redesigned for premium UX and ease of use
 */
const CreateLessonModal = ({ onClose, onSubmit, isLoading = false, nextOrder = 1, initialTitle = '' }) => {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm({
    defaultValues: {
      orderIndex: nextOrder,
      category: 'custom',
      title: initialTitle,
      content: ''
    }
  });

  const [imagePreview, setImagePreview] = useState(null);
  const selectedCategory = watch('category');
  const currentContent = watch('content');

  const contentTemplates = {
    consonants: `[MEDIA]
{"items":[
  {"word":"ก","image":"/ก-ฮ/ก.png","vocabImage":"/คำศัพท์บท1-8/บทที่1/ไก่.png","label":"ก ไก่"},
  {"word":"ข","image":"/ก-ฮ/ข.png","vocabImage":"/คำศัพท์บท1-8/บทที่1/ไข่.png","label":"ข ไข่"},
  {"word":"ค","image":"/ก-ฮ/ค.png","vocabImage":"/คำศัพท์บท1-8/บทที่1/ควาย.png","label":"ค ควาย"}
]}
[/MEDIA]`,
    vowels: `[MEDIA]
{"items":[
  {"word":"า","image":"/สระ/า.png","vocabImage":"/คำศัพท์บท1-8/บทที่5/ขา.png","label":"สระ อา"},
  {"word":"ิ","image":"/สระ/ิ.png","vocabImage":"/คำศัพท์บท1-8/บทที่6/ปิ.png","label":"สระ อิ"},
  {"word":"ี","image":"/สระ/ี.png","vocabImage":"/คำศัพท์บท1-8/บทที่6/ตี.png","label":"สระ อี"}
]}
[/MEDIA]`,
    words: `คำศัพท์วันนี้
1) กา - นกกา
2) ขา - ขาของเรา
3) งา - เมล็ดงา

ให้นักเรียนอ่านออกเสียงตามครูและฝึกเขียนคำศัพท์`,
    sentences: `ประโยคตัวอย่าง
1) ฉันอ่านหนังสือ
2) แม่พาไปตลาด
3) เราชอบเรียนภาษาไทย

กิจกรรม: ให้นักเรียนเลือก 1 ประโยคแล้วอ่านออกเสียง`
  };

  const categories = [
    { id: 'consonants', label: 'พยัญชนะ', icon: BookOpen, color: 'from-blue-500 to-indigo-600', iconColor: 'text-blue-500' },
    { id: 'vowels', label: 'สระ', icon: Layers, color: 'from-purple-500 to-pink-600', iconColor: 'text-purple-500' },
    { id: 'words', label: 'คำศัพท์', icon: ImageIcon, color: 'from-amber-400 to-orange-600', iconColor: 'text-amber-500' },
    { id: 'sentences', label: 'ประโยค', icon: Video, color: 'from-emerald-400 to-teal-600', iconColor: 'text-emerald-500' },
    { id: 'custom', label: 'อื่นๆ', icon: Plus, color: 'from-slate-500 to-slate-700', iconColor: 'text-slate-500' },
  ];

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImagePreview(compressed);
      } catch (err) {
        toast.error(err.message || 'เกิดข้อผิดพลาดในการบีบอัดรูปภาพ');
      }
    }
  };

  const nextStep = async () => {
    const fields = step === 1 ? ['title', 'category'] : ['content'];
    const isValid = await trigger(fields);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmitForm = async (data) => {
    const orderValue = Number.parseInt(data.orderIndex, 10) || nextOrder;
    const formData = {
      title: data.title,
      content: data.content,
      order: orderValue,
      orderIndex: orderValue,
      category: data.category,
      imageUrl: imagePreview || undefined
    };
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 sm:p-6 font-[Sarabun,sans-serif]">
      {/* Dynamic Background Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/50"
      >
        {/* Header - Compact & Elegant */}
        <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">สร้างบทเรียนใหม่</h2>
                <p className="text-white/70 text-sm font-bold">ขั้นตอนที่ {step} จาก 2</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
            <motion.div
              className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              animate={{ width: `${(step / 2) * 100}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0">
          <div className="p-8 sm:p-10 flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {/* Lesson Name */}
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={16} className="text-indigo-500" />
                      ชื่อบทเรียน
                    </label>
                    <input
                      type="text"
                      {...register('title', { required: 'กรุณากรอกชื่อบทเรียน' })}
                      className="w-full px-6 py-4.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-bold text-lg placeholder-slate-300"
                      placeholder="เช่น บทที่ 9: พยัญชนะไทยแสนสนุก"
                      autoFocus
                    />
                    {errors.title && (
                      <p className="text-xs font-bold text-rose-500 ml-2">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-4">
                    <label className="text-sm font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                      <Layers size={16} className="text-indigo-500" />
                      เลือกประเภทบทเรียน
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <motion.div
                            key={cat.id}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setValue('category', cat.id)}
                            className={`cursor-pointer relative p-4 rounded-3xl border-2 flex flex-col items-center text-center transition-all duration-300 ${isSelected
                                ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100'
                                : 'border-slate-100 bg-white hover:border-indigo-200'
                              }`}
                          >
                            <div className={`w-12 h-12 rounded-2xl mb-3 flex items-center justify-center transition-transform ${isSelected ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-500'}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <span className={`text-xs font-black ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>{cat.label}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Index */}
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RefreshCw size={16} className="text-indigo-500" />
                        ลำดับการแสดงผล
                      </div>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">แนะนำ: {nextOrder}</span>
                    </label>
                    <input
                      type="number"
                      {...register('orderIndex', { required: 'กรุณากรอกลำดับ' })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all duration-300 font-black text-xl text-center text-indigo-900"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Content Editor */}
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-500" />
                        เนื้อหาบทเรียน
                      </div>
                    </label>

                    {/* Template chooser */}
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs sm:text-sm font-bold text-indigo-700">เลือกแบบฟอร์มเนื้อหาอัตโนมัติ</p>
                        <span className="text-[10px] sm:text-xs font-semibold text-indigo-500">ช่วยให้กรอกง่าย ไม่งง</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setValue('content', contentTemplates.consonants, { shouldValidate: true })}
                          className="px-3 py-2 rounded-xl bg-white border border-indigo-100 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
                        >
                          พยัญชนะ
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('content', contentTemplates.vowels, { shouldValidate: true })}
                          className="px-3 py-2 rounded-xl bg-white border border-indigo-100 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
                        >
                          สระ
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('content', contentTemplates.words, { shouldValidate: true })}
                          className="px-3 py-2 rounded-xl bg-white border border-indigo-100 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
                        >
                          คำศัพท์
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('content', contentTemplates.sentences, { shouldValidate: true })}
                          className="px-3 py-2 rounded-xl bg-white border border-indigo-100 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
                        >
                          ประโยค
                        </button>
                      </div>
                      {!currentContent && (
                        <button
                          type="button"
                          onClick={() => {
                            const byCategory = contentTemplates[selectedCategory] || contentTemplates.consonants;
                            setValue('content', byCategory, { shouldValidate: true });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs sm:text-sm font-bold hover:opacity-95 transition"
                        >
                          เติมตัวอย่างตามหมวดที่เลือกให้เลย
                        </button>
                      )}
                    </div>

                    <div className="relative group">
                      <textarea
                        {...register('content', { required: 'กรุณากรอกเนื้อหาบทเรียน' })}
                        rows={6}
                        className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-violet-100 focus:border-violet-500 focus:bg-white transition-all duration-300 font-bold text-lg placeholder-slate-300 resize-none leading-relaxed"
                        placeholder="เขียนเนื้อหาตรงนี้... คุณสามารถระบุตำแหน่งรูปภาพด้วย [MEDIA]"
                      />
                      <div className="absolute bottom-4 right-6 flex items-center gap-2 pointer-events-none">
                        <div className="bg-white/80 backdrop-blur shadow-sm px-3 py-1.5 rounded-full border border-slate-100 flex items-center gap-1.5">
                          <Info size={14} className="text-blue-500" />
                          <span className="text-[10px] font-black text-slate-400">ใช้ [MEDIA] เพื่อแสดงรูป</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Media Upload */}
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon size={16} className="text-indigo-500" />
                      รูปภาพประกอบ
                    </label>
                    <div className="flex gap-5">
                      <label className="flex-1 flex flex-col items-center justify-center p-8 bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2rem] cursor-pointer hover:bg-white hover:border-indigo-500 transition-all duration-300 group">
                        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="text-indigo-600" size={28} />
                        </div>
                        <span className="text-xs font-black text-indigo-500">เลือกรูปภาพจากเครื่อง</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>

                      {imagePreview ? (
                        <div className="relative w-40 h-40 group shrink-0">
                          <img src={imagePreview} className="w-full h-full object-cover rounded-[2rem] shadow-xl border-4 border-white" alt="Preview" />
                          <button
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-2 shadow-lg shadow-rose-200 hover:scale-110 transition-transform"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-40 h-40 rounded-[2rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                          <ImageIcon size={40} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="px-8 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-8 py-4 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-indigo-600 transition-all duration-300"
              >
                ย้อนกลับ
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-rose-500 transition-all duration-300"
              >
                ยกเลิก
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-10 py-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span>ถัดไป</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-3 px-10 py-4.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <Sparkles size={20} />
                )}
                <span>{isLoading ? 'กำลังบันทึก...' : 'สร้างบทเรียนทันที'}</span>
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateLessonModal;
