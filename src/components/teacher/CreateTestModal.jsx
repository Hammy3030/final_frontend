import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Image as ImageIcon, Save, FileText, CheckCircle2, Volume2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import { useAuth } from '../../contexts/AuthContext';
import { speak } from '../../utils/textToSpeech';
import { compressImage } from '../../utils/imageUtils';

const CreateTestModal = ({ isOpen, onClose, lessonId, lessonTitle }) => {
  const { token } = useAuth();
  const [testTitle, setTestTitle] = useState(lessonTitle ? `แบบทดสอบ - ${lessonTitle}` : 'แบบทดสอบบทเรียน');
  const [testType, setTestType] = useState('PRE_TEST');
  const [questions, setQuestions] = useState([
    {
      question: '',
      options: ['', '', '', ''],
      imageOptions: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      file: null,
      preview: null,
      imageUrl: ''
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      imageOptions: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      file: null,
      preview: null,
      imageUrl: ''
    }]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleImageChange = async (index, e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        const newQuestions = [...questions];
        newQuestions[index].file = file;
        newQuestions[index].preview = compressed; // Compressed base64 string
        setQuestions(newQuestions);
      } catch (err) {
        toast.error(err.message || 'เกิดข้อผิดพลาดในการบีบอัดรูปภาพ');
      }
    }
  };

  const handleOptionImageChange = async (qIndex, oIndex, e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        const newQuestions = [...questions];
        if (!newQuestions[qIndex].imageOptions) {
          newQuestions[qIndex].imageOptions = ['', '', '', ''];
        }
        newQuestions[qIndex].imageOptions[oIndex] = compressed; // Compressed base64 string
        setQuestions(newQuestions);
      } catch (err) {
        toast.error(err.message || 'เกิดข้อผิดพลาดในการบีบอัดรูปภาพ');
      }
    }
  };

  const removeOptionImage = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].imageOptions) {
      newQuestions[qIndex].imageOptions[oIndex] = '';
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (questions.some(q => !q.question || q.options.some((o, i) => !o && !(q.imageOptions && q.imageOptions[i])))) {
      toast.error('กรุณากรอกโจทย์และตัวเลือก หรือใส่รูปภาพให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the test first
      const testRes = await axios.post(getApiUrl(`/lessons/${lessonId}/tests`), {
        title: testTitle,
        type: testType,
        timeLimit: 15
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const testId = testRes.data.data.test._id || testRes.data.data.test.id;

      // 2. Create questions with base64 images
      for (const q of questions) {
        // Only send imageOptions if at least one option has an image
        const hasImageOptions = q.imageOptions && q.imageOptions.some(img => img);
        
        await axios.post(getApiUrl(`/lessons/tests/${testId}/questions`), {
          question: q.question,
          options: q.options,
          imageOptions: hasImageOptions ? q.imageOptions : undefined,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          imageUrl: q.preview || q.imageUrl, // Use base64 preview
          isMultipleChoice: false // Standard single choice for Grade 1
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      toast.success('สร้างแบบทดสอบสำเร็จแล้ว!');
      onClose();
    } catch (error) {
      console.error('Create test error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างแบบทดสอบ');
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
          className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <FileText size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">สร้างแบบทดสอบ</h2>
                <p className="text-purple-100 text-sm font-medium">กำหนดโจทย์และตัวเลือกด้วยตัวเอง</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div className="space-y-8">
              {/* Test Config */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-wider">ชื่อแบบทดสอบ</label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:bg-white outline-none transition-all font-bold text-lg"
                    placeholder="เช่น แบบทดสอบ สระอา"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-wider">ประเภท</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setTestType('PRE_TEST')}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${testType === 'PRE_TEST' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                      ก่อนเรียน
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestType('POST_TEST')}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${testType === 'POST_TEST' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                    >
                      หลังเรียน
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-wider">รายการคำถาม ({questions.length})</label>
                </div>
                
                <div className="space-y-12">
                  {questions.map((q, qIndex) => (
                    <motion.div 
                      layout
                      key={qIndex} 
                      className="relative p-8 bg-gray-50 border-2 border-gray-100 rounded-[2.5rem] hover:border-purple-200 transition-all"
                    >
                      <div className="absolute -top-4 -left-4 w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg">
                        {qIndex + 1}
                      </div>

                      <div className="flex flex-col lg:flex-row gap-8">
                        {/* Image Upload for Question */}
                        <div className="shrink-0">
                          <input
                            type="file"
                            id={`test-img-${qIndex}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageChange(qIndex, e)}
                          />
                          <label
                            htmlFor={`test-img-${qIndex}`}
                            className={`w-full lg:w-40 h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm
                              ${q.preview ? 'border-purple-500 bg-white' : 'border-gray-200 bg-white hover:border-purple-400'}
                            `}
                          >
                            {q.preview ? (
                              <img src={q.preview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <>
                                <ImageIcon size={28} className="text-gray-300 mb-2" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-2">รูปภาพโจทย์<br/>(ถ้ามี)</span>
                              </>
                            )}
                          </label>
                        </div>

                        {/* Question Content */}
                        <div className="flex-1 space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">โจทย์คำถาม</label>
                            <div className="relative">
                              <input
                                type="text"
                                value={q.question}
                                onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                className="w-full pl-6 pr-12 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-purple-400 outline-none transition-all font-bold text-lg"
                                placeholder="เช่น ข้อใดคือภาพ ก ไก่?"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => q.question && speak(q.question)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                                title="ฟังเสียงโจทย์"
                              >
                                <Volume2 size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((option, oIndex) => (
                              <div key={oIndex} className="relative group bg-white border-2 border-gray-100 rounded-2xl p-2 transition-all focus-within:border-purple-400">
                                <div className="flex gap-2">
                                  {/* Left: Checkbox / Letter */}
                                  <button
                                    type="button"
                                    onClick={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                    className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black transition-colors self-center
                                      ${q.correctAnswer === oIndex ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'}
                                    `}
                                  >
                                    {['ก', 'ข', 'ค', 'ง'][oIndex]}
                                  </button>

                                  {/* Middle: Image Upload + Preview (If any) */}
                                  <div className="shrink-0 flex items-center">
                                    <input
                                      type="file"
                                      id={`opt-img-${qIndex}-${oIndex}`}
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => handleOptionImageChange(qIndex, oIndex, e)}
                                    />
                                    {q.imageOptions && q.imageOptions[oIndex] ? (
                                      <div className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden group/img">
                                        <img src={q.imageOptions[oIndex]} alt="" className="w-full h-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => removeOptionImage(qIndex, oIndex)}
                                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                                        >
                                          <Trash2 size={16} className="text-white" />
                                        </button>
                                      </div>
                                    ) : (
                                      <label
                                        htmlFor={`opt-img-${qIndex}-${oIndex}`}
                                        className="w-10 h-10 rounded-lg bg-purple-50 text-purple-400 hover:bg-purple-100 hover:text-purple-600 flex items-center justify-center cursor-pointer transition-colors"
                                        title="ใส่รูปภาพประกอบตัวเลือก"
                                      >
                                        <ImageIcon size={20} />
                                      </label>
                                    )}
                                  </div>

                                  {/* Right: Text Input */}
                                  <div className="relative flex-1 min-w-0 flex items-center">
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                      className={`w-full bg-transparent px-2 py-2 pr-10 outline-none font-bold text-gray-700
                                        ${q.correctAnswer === oIndex ? 'text-green-700' : ''}
                                      `}
                                      placeholder={`ตัวเลือก ${['ก', 'ข', 'ค', 'ง'][oIndex]}`}
                                      required={!(q.imageOptions && q.imageOptions[oIndex])} // Not required if image is provided
                                    />
                                    <button
                                      type="button"
                                      onClick={() => option && speak(option)}
                                      className="absolute right-1 p-1.5 text-gray-300 hover:text-purple-500 rounded-full transition-colors"
                                      title="ฟังเสียงตัวเลือก"
                                    >
                                      <Volume2 size={16} />
                                    </button>
                                  </div>
                                  
                                  {/* Success Checkmark indicator (Optional) */}
                                  {q.correctAnswer === oIndex && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <CheckCircle2 size={20} className="text-green-500" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">คำอธิบาย (เฉลย)</label>
                            <textarea
                              value={q.explanation}
                              onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                              className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-purple-400 outline-none transition-all font-bold text-sm resize-none"
                              placeholder="อธิบายว่าทำไมถึงตอบข้อนี้..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          className="absolute -top-2 -right-2 p-2 bg-white text-rose-500 border-2 border-gray-100 rounded-full shadow-md hover:bg-rose-50 hover:border-rose-200 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[2.5rem] text-gray-400 font-bold hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 group"
                >
                  <div className="p-1 bg-gray-100 rounded-full group-hover:bg-purple-100 transition-colors">
                    <Plus size={20} />
                  </div>
                  เพิ่มคำถามใหม่
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
              className={`px-10 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-purple-200 flex items-center gap-2 transition-all active:scale-95
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-purple-300'}
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
                  <span>บันทึกแบบทดสอบ</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateTestModal;
