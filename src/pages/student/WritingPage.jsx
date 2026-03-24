import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eraser,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader,
  Volume2,
  Trophy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import { speakText } from '../../utils/speechHelper';

/* ── All 44 Thai consonants ── */
const ALL_CONSONANTS = [
  'ก','ข','ฃ','ค','ฅ','ฆ','ง','จ','ฉ','ช','ซ','ฌ','ญ',
  'ฎ','ฏ','ฐ','ฑ','ฒ','ณ','ด','ต','ถ','ท','ธ','น',
  'บ','ป','ผ','ฝ','พ','ฟ','ภ','ม','ย','ร','ล','ว',
  'ศ','ษ','ส','ห','ฬ','อ','ฮ'
];

/* ── Floating particle ── */
const FloatingParticle = ({ delay, duration, x, y, size, color }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ width: size, height: size, background: color, left: `${x}%`, top: `${y}%`, filter: 'blur(1px)' }}
    animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

const WritingPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const guideImgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [detectedText, setDetectedText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [aiExplanation, setAiExplanation] = useState('');
  const [guideLoaded, setGuideLoaded] = useState(false);

  const particles = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i, delay: Math.random() * 3, duration: 4 + Math.random() * 3,
      x: Math.random() * 100, y: Math.random() * 100, size: 6 + Math.random() * 10,
      color: ['rgba(167,139,250,0.3)', 'rgba(251,191,36,0.25)', 'rgba(96,165,250,0.25)', 'rgba(52,211,153,0.25)'][Math.floor(Math.random() * 4)],
    })), []);

  // ── Draw the guide image onto the canvas as a dashed background ──
  const drawGuideImage = () => {
    const canvas = canvasRef.current;
    const img = guideImgRef.current;
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext('2d');
    ctx.save();

    // Calculate size to fit image centered with padding
    const padding = 20;
    const availW = canvas.width - padding * 2;
    const availH = canvas.height - padding * 2;
    const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const offsetX = (canvas.width - drawW) / 2;
    const offsetY = (canvas.height - drawH) / 2;

    // Draw the guide image with reduced opacity (dashed-like effect)
    ctx.globalAlpha = 0.25;
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    ctx.globalAlpha = 1.0;

    ctx.restore();
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawGuideImage();
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    return () => window.removeEventListener('resize', setCanvasSize);
  }, [currentWord, guideLoaded]);

  const getPos = (e, rect) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas.getBoundingClientRect());
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas.getBoundingClientRect());
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGuideImage();
    setDetectedText('');
    setIsCorrect(null);
    setAiExplanation('');
  };

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixelData.length; i += 4) {
      if (pixelData[i] !== 0) return false;
    }
    return true;
  };

  const checkHandwriting = async () => {
    if (!currentWord) { toast.error('กรุณาเลือกคำที่จะเขียน'); return; }
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isCanvasEmpty()) { toast.error('กรุณาเขียนอักษรบนกระดานก่อนตรวจสอบ'); return; }

    setIsChecking(true);
    setAiExplanation('');

    try {
      const imageData = canvas.toDataURL('image/png');
      const token = localStorage.getItem('token');

      const response = await fetch(getApiUrl('/student/writing/save-and-detect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ imageData, targetWord: currentWord })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'เกิดข้อผิดพลาดในการตรวจสอบ');

      const result = data.data;
      setDetectedText(result.detectedText || 'ไม่พบตัวอักษร');
      setIsCorrect(result.isCorrect);
      setAiExplanation(result.explanation || '');

      if (result.isCorrect && result.confidence >= 60) {
        setScore(prev => prev + 10);
        toast.success(`ถูกต้อง 🎉 (ความมั่นใจ: ${result.confidence}%)`, { duration: 3000 });
      } else {
        const confidenceMsg = result.confidence ? ` (ความมั่นใจ: ${result.confidence}%)` : '';
        toast.error(`ยังไม่ถูกต้อง${confidenceMsg}`, { duration: 4000 });
      }
    } catch (error) {
      const errorMessage = error.message || '';
      let userMessage;
      if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        userMessage = 'ระบบกำลังใช้งานมากเกินไป กรุณารอสักครู่แล้วลองใหม่';
      } else if (errorMessage.includes('API') || errorMessage.includes('network')) {
        userMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      } else {
        userMessage = 'เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง';
      }
      toast.error(userMessage, { duration: 5000 });
      setDetectedText('');
      setIsCorrect(false);
      setAiExplanation('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsChecking(false);
    }
  };

  const goToChar = (index) => {
    const clamped = Math.max(0, Math.min(ALL_CONSONANTS.length - 1, index));
    setCurrentIndex(clamped);
    setCurrentWord(ALL_CONSONANTS[clamped]);
    setGuideLoaded(false);
    setDetectedText('');
    setIsCorrect(null);
    setAiExplanation('');
  };

  const loadNewWord = () => {
    const randomIdx = Math.floor(Math.random() * ALL_CONSONANTS.length);
    goToChar(randomIdx);
  };

  useEffect(() => { loadNewWord(); }, []);

  const guideImageSrc = currentWord ? `/ฝึกเขียน/${currentWord}.png` : '';

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden font-[Sarabun,Noto_Sans_Thai,sans-serif]">
      {/* ── Background ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100" />
        {particles.map((p) => <FloatingParticle key={p.id} {...p} />)}
      </div>

      {/* Hidden image for loading the guide into canvas */}
      <img
        ref={guideImgRef}
        src={guideImageSrc}
        alt=""
        className="hidden"
        crossOrigin="anonymous"
        onLoad={() => { setGuideLoaded(true); drawGuideImage(); }}
      />

      {/* ── Header (fixed height) ── */}
      <header className="shrink-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/30 shadow-md shadow-indigo-100/30">
        <div className="max-w-lg mx-auto px-3 py-2">
          <div className="flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/dashboard/student')}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-300/40"
            >
              <ArrowLeft size={20} />
            </motion.button>

            <h1 className="text-lg font-extrabold text-gray-800">✏️ ฝึกเขียน</h1>

            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-white px-3 py-1.5 rounded-xl shadow-md shadow-amber-300/40">
              <Trophy size={16} />
              <span className="text-base font-extrabold">{score}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content (flex-1 fills remaining space) ── */}
      <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full px-3 py-2 min-h-0">

        {/* ── Top bar: Sound + Character + Nav (compact) ── */}
        <div className="shrink-0 flex items-center justify-between mb-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => speakText(currentWord, { rate: 0.55 })}
            className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-300/30 shrink-0"
          >
            <Volume2 size={22} />
          </motion.button>

          <motion.div
            key={currentWord}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl px-5 py-1"
          >
            <span className="text-4xl font-extrabold text-blue-600">{currentWord}</span>
          </motion.div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-indigo-400 font-semibold">{currentIndex + 1}/{ALL_CONSONANTS.length}</span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => goToChar(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => goToChar(currentIndex + 1)}
              disabled={currentIndex === ALL_CONSONANTS.length - 1}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </div>

        {/* ── Canvas (fills remaining space) ── */}
        <div className="flex-1 min-h-0 bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl shadow-indigo-100/40 border border-white/50 p-2 mb-2 flex flex-col">
          <div className="relative flex-1 min-h-0 bg-white rounded-xl overflow-hidden shadow-inner"
               style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#c7d2fe' }}>
            {/* Subtle grid lines */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
                 style={{
                   backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
                   backgroundSize: '25% 25%'
                 }} />

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full z-10 cursor-crosshair bg-transparent touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {isChecking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl"
              >
                <Loader className="w-8 h-8 text-white animate-spin mb-2" />
                <p className="text-white font-bold">AI กำลังตรวจสอบ...</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── AI Result (overlays above buttons when shown) ── */}
        <AnimatePresence>
          {detectedText && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`shrink-0 p-3 rounded-xl mb-2 border-2 ${
                isCorrect
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{isCorrect ? '🎉' : '💪'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800">
                    {isCorrect ? 'เก่งมาก! ถูกต้อง! ⭐' : 'ลองใหม่นะ! สู้ๆ!'}
                    {' '}
                    <span className="text-blue-600">({detectedText})</span>
                  </p>
                  {aiExplanation && (
                    <p className="text-xs text-gray-500 truncate">💡 {aiExplanation}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action Buttons (fixed at bottom) ── */}
        <div className="shrink-0 grid grid-cols-3 gap-2 pb-1">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={clearCanvas}
            className="flex items-center justify-center gap-2 bg-gradient-to-br from-rose-400 to-red-500 text-white py-3 px-2 rounded-xl shadow-lg shadow-red-300/40 font-bold text-sm"
          >
            <Eraser size={22} />
            <span>ลบ</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={loadNewWord}
            className="flex items-center justify-center gap-2 bg-gradient-to-br from-amber-400 to-yellow-500 text-white py-3 px-2 rounded-xl shadow-lg shadow-amber-300/40 font-bold text-sm"
          >
            <RefreshCw size={22} />
            <span>สุ่มใหม่</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={checkHandwriting}
            disabled={isChecking}
            className="flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-400 to-green-500 text-white py-3 px-2 rounded-xl shadow-lg shadow-green-300/40 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle size={22} />}
            <span>{isChecking ? 'ตรวจ...' : 'ตรวจ'}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default WritingPage;
