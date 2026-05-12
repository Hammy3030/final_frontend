import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, TrendingUp, ArrowLeft, ArrowRight, Lock, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import AudioButton from '../../components/AudioButton';
import { getLessonStatus, calculateTotalStars, calculateGoldMedals, calculateStamps } from '../../utils/lessonHelpers';

const ShimmerOverlay = () => (
  <motion.div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none z-0">
    <motion.div
      className="absolute inset-0"
      style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)" }}
      animate={{ x: ["-100%", "200%"] }}
      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
    />
  </motion.div>
);

const StudentLessonsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [testsList, setTestsList] = useState([]);
  const [testAttempts, setTestAttempts] = useState([]);
  const [gameAttempts, setGameAttempts] = useState([]);
  const [lessonPage, setLessonPage] = useState(0);
  const [lockSoundKey, setLockSoundKey] = useState(0);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLargeScreen = windowWidth >= 1024;
  const lessonCardsPerPage = isLargeScreen ? 2 : 1;

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [lRes, tRes, gRes] = await Promise.all([
        axios.get(getApiUrl('/student/lessons'), { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(getApiUrl('/student/tests'), { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(getApiUrl('/student/games'), { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (lRes.data.success) setLessons(lRes.data.data.lessons || []);
      if (tRes.data.success) {
        setTestsList(tRes.data.data.tests || []);
        const allT = [];
        tRes.data.data.tests.forEach(t => t.testAttempts && allT.push(...t.testAttempts));
        setTestAttempts(allT);
      }
      if (gRes.data.success) {
        const allG = [];
        gRes.data.data.games?.forEach(g => g.gameAttempts && allG.push(...g.gameAttempts));
        setGameAttempts(allG);
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { if (user?.id) fetchData(); }, [user, fetchData]);

  const statsList = [
    { Icon: BookOpen, label: "บทเรียน", val: lessons.length, grad: "from-sky-400 to-blue-500", sound: `บทเรียนทั้งหมด ${lessons.length} บท` },
    { Icon: CheckCircle, label: "เรียนจบ", val: lessons.filter(l => l.status === 'COMPLETED' || l.progress?.isCompleted).length, grad: "from-emerald-400 to-green-500", sound: `เรียนจบไปแล้ว ${lessons.filter(l => l.status === 'COMPLETED' || l.progress?.isCompleted).length} บท` },
    { Icon: TrendingUp, label: "ก้าวหน้า", val: `${lessons.length > 0 ? Math.round((lessons.filter(l => l.status === 'COMPLETED' || l.progress?.isCompleted).length / lessons.length) * 100) : 0}%`, grad: "from-pink-400 to-rose-500", sound: `ความก้าวหน้าตอนนี้` },
    { emoji: "⭐", label: "ดาว", val: calculateTotalStars(testAttempts), grad: "from-amber-400 to-yellow-500", sound: `ดาวสะสมทั้งหมด ${calculateTotalStars(testAttempts)} ดวง` },
    { emoji: "🥇", label: "เหรียญ", val: calculateGoldMedals(gameAttempts), grad: "from-orange-400 to-red-500", sound: `เหรียญทองทั้งหมด ${calculateGoldMedals(gameAttempts)} เหรียญ` },
    { emoji: "🎯", label: "ตรา", val: calculateStamps(lessons), grad: "from-cyan-400 to-blue-500", sound: `ตราประทับทั้งหมด ${calculateStamps(lessons)} อัน` },
  ];

  return (
    // ล็อคหน้าจอด้วย h-screen และ overflow-hidden เพื่อไม่ให้มีการสกอร์
    <div className="h-screen w-full relative overflow-hidden flex flex-col font-['Sarabun'] text-gray-800 bg-[#f0f4ff]">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-sky-100" />

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="max-w-[1440px] mx-auto w-full h-full flex flex-col p-4 md:p-6 space-y-2 md:space-y-4"
      >
        {/* ── 1. Stats Grid: ปรับความสูงให้ยืดหยุ่น (h-[12vh]) เพื่อประหยัดพื้นที่ ── */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 shrink-0">
          {statsList.map((item, i) => (
            <div
              key={i}
              className={`relative bg-gradient-to-br ${item.grad} rounded-2xl md:rounded-[2rem] p-2 text-white shadow-xl overflow-hidden flex flex-col items-center justify-center h-[10vh] md:h-[13vh] border-[3px] border-white`}
            >
              <ShimmerOverlay />
              <div className="flex items-center justify-center gap-1 z-10 w-full mb-0.5">
                <span className="text-[10px] md:text-sm font-black uppercase drop-shadow-sm">{item.label}</span>
                <AudioButton text={item.sound} variant="mini" iconSize={14} className="!p-1.5" />
              </div>
              <span className="text-2xl md:text-4xl lg:text-5xl font-black drop-shadow-lg z-10 leading-none">{item.val}</span>
            </div>
          ))}
        </div>

        {/* ── 2. Header Area ── */}
        <div className="flex items-center justify-between shrink-0 h-[6vh] md:h-[8vh] px-2">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard/student')}
            className="bg-white text-indigo-600 px-4 md:px-6 py-2 rounded-xl shadow-lg border-2 border-indigo-100 font-black flex items-center gap-2 text-sm md:text-lg transition-all"
          >
            <Home size={20} /> <span className="hidden sm:inline">หน้าหลัก</span>
          </motion.button>

          <div className="flex items-center gap-3 bg-white/60 px-6 py-2 rounded-full backdrop-blur-sm border border-white shadow-sm">
            <h2 className="text-xl md:text-3xl font-black text-indigo-900 tracking-tight">เลือกบทเรียน</h2>
            <AudioButton text="เลือกบทเรียนที่ต้องการเรียนได้เลยจ้า" variant="mini" iconSize={24} />
          </div>

          <div className="w-[100px] hidden sm:block opacity-0">spacer</div>
        </div>

        {/* ── 3. Main Lesson Carousel: ใช้ flex-1 เพื่อให้กินพื้นที่ที่เหลือทั้งหมด ── */}
        <div className="flex-1 min-h-0 flex items-center justify-center gap-2 md:gap-6 relative">
          
          {/* Arrow Left */}
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }} whileTap={{ scale: 0.9 }}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-2xl flex items-center justify-center disabled:opacity-20 border-4 border-white shrink-0 z-20 cursor-pointer"
            disabled={lessonPage === 0}
            onClick={() => setLessonPage(p => p - 1)}
          >
            <ArrowLeft size={32} className="text-indigo-600" />
          </motion.button>

          {/* Carousel Container */}
          <div className="flex-1 h-full flex items-center justify-center py-2">
            <div className={`grid gap-4 md:gap-8 w-full h-full max-w-[1200px] mx-auto ${isLargeScreen ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {(() => {
                const sorted = [...lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
                const visible = sorted.slice(lessonPage * lessonCardsPerPage, (lessonPage * lessonCardsPerPage) + lessonCardsPerPage);
                const footerGradients = [
                  'linear-gradient(145deg, #bae6fd 0%, #7dd3fc 55%, #38bdf8 100%)',
                  'linear-gradient(145deg, #a7f3d0 0%, #6ee7b7 55%, #34d399 100%)',
                  'linear-gradient(145deg, #e9d5ff 0%, #d8b4fe 55%, #c084fc 100%)',
                  'linear-gradient(145deg, #fde68a 0%, #fcd34d 55%, #fbbf24 100%)',
                  'linear-gradient(145deg, #c7d2fe 0%, #a5b4fc 55%, #818cf8 100%)',
                  'linear-gradient(145deg, #fecdd3 0%, #fda4af 55%, #fb7185 100%)'
                ];

                return visible.map((lesson) => {
                  const status = getLessonStatus(lesson);
                  const num = lesson.orderIndex ?? lesson.chapter ?? '1';
                  const sid = String(lesson.id || lesson._id || '');
                  const canEnter = status.canAccess || lesson.progress?.isCompleted;

                  return (
                    <Link
                      key={sid}
                      to={canEnter ? `/dashboard/student/lessons/${sid}` : '#'}
                      onClick={(e) => { if (!canEnter) { e.preventDefault(); toast.error('บทเรียนนี้ยังไม่ปลดล็อก'); setLockSoundKey(p => p + 1); } }}
                      className="group block h-full flex flex-col"
                    >
                      <motion.div
                        className="bg-white rounded-[3rem] md:rounded-[4rem] overflow-hidden flex flex-col border-[8px] md:border-[12px] border-white relative shadow-2xl transition-all flex-1 h-full"
                        whileHover={canEnter ? { y: -8, scale: 1.01 } : {}}
                      >
                        {/* Image Section: ใช้ flex-1 เพื่อให้ยืดหยุ่นตามความสูงของจอ */}
                        <div className="relative flex-1 bg-indigo-50 overflow-hidden min-h-0">
                          <img
                            src={lesson.imageUrl || `/หน้าปกบทเรียน/บทที่${num}.png`}
                            className={`w-full h-full object-cover transition-transform duration-700 ${canEnter ? 'group-hover:scale-110' : 'opacity-40 grayscale blur-[1px]'}`}
                            alt={lesson.title}
                          />
                          <div className="absolute top-4 right-4 p-2 md:p-3 bg-white/90 rounded-2xl shadow-lg z-10 border border-indigo-50">
                            <status.icon className={status.color} size={isLargeScreen ? 32 : 24} />
                          </div>
                          {!canEnter && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px]">
                              <Lock size={60} className="text-white drop-shadow-2xl opacity-80" />
                            </div>
                          )}
                        </div>

                        {/* Title Section: ปรับความสูงให้คงที่เพื่อความสวยงาม */}
                        <div
                          className="p-4 md:p-6 shrink-0 border-t border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] w-full flex flex-col items-center text-center"
                          style={{ background: footerGradients[(Number(num) - 1) % 6] }}
                        >
                          <div className="flex flex-row items-center justify-center gap-2 mb-1 w-full">
                            <h3 className="text-2xl md:text-4xl font-black text-gray-900  tracking-tighter shrink-0">
                              บทที่ {num}
                            </h3>
                            <span className="inline-flex shrink-0 items-center">
                              <AudioButton
                                text={`บทที่ ${num} ${lesson.title.split(':')[1] || lesson.title}`}
                                variant="mini"
                                iconSize={20}
                              />
                            </span>
                          </div>
                          <p className="font-bold text-gray-900/80 text-sm md:text-xl px-2 drop-shadow-sm w-full max-w-full text-center break-words line-clamp-2">
                            {lesson.title.split(':')[1] || lesson.title}
                          </p>
                        </div>
                      </motion.div>
                    </Link>
                  );
                });
              })()}
            </div>
          </div>

          {/* Arrow Right */}
          <motion.button
            whileHover={{ scale: 1.1, x: 5 }} whileTap={{ scale: 0.9 }}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-2xl flex items-center justify-center disabled:opacity-20 border-4 border-white shrink-0 z-20 cursor-pointer"
            disabled={(lessonPage + 1) * lessonCardsPerPage >= lessons.length}
            onClick={() => setLessonPage(p => p + 1)}
          >
            <ArrowRight size={32} className="text-indigo-600" />
          </motion.button>
        </div>
      </motion.div>

      {/* Hidden Audio for Lock status */}
      <div className="hidden">
        {lockSoundKey > 0 && <AudioButton key={lockSoundKey} text="บทเรียนนี้ยังไม่ปลดล็อกจ้า เรียนบทก่อนหน้าให้จบก่อนนะ" autoPlay={true} />}
      </div>
    </div>
  );
};

export default StudentLessonsPage;