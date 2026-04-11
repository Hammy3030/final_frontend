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
  <motion.div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
    <motion.div
      className="absolute inset-0"
      style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)" }}
      animate={{ x: ["-100%", "200%"] }}
      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
    />
  </motion.div>
);

const MockStudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [testsList, setTestsList] = useState([]);
  const [testAttempts, setTestAttempts] = useState([]);
  const [gameAttempts, setGameAttempts] = useState([]);
  const [lessonPage, setLessonPage] = useState(0);
  const [lockSoundKey, setLockSoundKey] = useState(0);

  // Responsive logic
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
    <div className="h-screen w-full relative overflow-hidden flex flex-col font-['Sarabun'] text-gray-800">
      {/* Background Layer */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-sky-50" />

      {/* Main Container: ปรับ Padding ให้เหมาะสมกับหน้าจอ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-[1400px] mx-auto w-full h-full flex flex-col p-4 md:p-6 lg:p-8 space-y-4"
      >

        {/* ── 1. Stats Grid: ปรับขนาดให้ compact ขึ้นบนจอเล็ก แต่คงความใหญ่บนจอใหญ่ ── */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
          {statsList.map((item, i) => (
            <div
              key={i}
              className={`relative bg-gradient-to-br ${item.grad} rounded-2xl p-2 md:p-3 text-white shadow-md overflow-hidden flex flex-col items-center justify-center h-24 md:h-32 border-2 border-white/30`}
            >
              <ShimmerOverlay />
              <div className="flex items-center gap-1.5 mb-1 z-10 text-center">
                {item.Icon ? <item.Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" /> : <span className="text-xl md:text-2xl shrink-0">{item.emoji}</span>}
                <span className="text-[10px] md:text-sm font-bold uppercase tracking-tight leading-none">{item.label}</span>
                <AudioButton text={item.sound} variant="mini" iconSize={12} className="!bg-white/20 !text-white !p-1 border-none transition-colors" />
              </div>
              <span className="text-2xl md:text-4xl lg:text-5xl font-black drop-shadow-md z-10">{item.val}</span>
            </div>
          ))}
        </div>

        {/* ── 2. Header Area: จัดวางให้เป็นระเบียบ ไม่เบี้ยว ── */}
        <div className="flex items-center justify-between shrink-0 h-16 px-2">
          <motion.button
            whileHover={{ x: -3 }}
            onClick={() => navigate('/dashboard/student')}
            className="bg-white text-indigo-600 px-4 md:px-6 py-2.5 rounded-xl shadow-sm border-2 border-indigo-50 font-bold flex items-center gap-2 text-sm md:text-base active:scale-95 transition-all"
          >
            <Home size={20} /> <span className="hidden sm:inline">หน้าหลัก</span>
          </motion.button>

          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-3xl font-black text-gray-800  uppercase tracking-tight">เลือกบทเรียน</h2>
            <AudioButton text="เลือกบทเรียนที่ต้องการเรียนได้เลยจ้า" variant="mini" iconSize={24} className="!bg-indigo-600 !text-white shadow-md" />
          </div>

          <div className="w-[100px] hidden sm:block opacity-0">spacer</div>
        </div>

        {/* ── 3. Main Lesson Carousel: หัวใจหลักของความ Responsive ── */}
        <div className="flex-1 min-h-0 flex items-center justify-center gap-2 md:gap-6 relative overflow-hidden">

          {/* Arrow Left */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-xl flex items-center justify-center disabled:opacity-10 border-4 border-indigo-50 shrink-0 z-20 active:scale-90 transition-all"
            disabled={lessonPage === 0}
            onClick={() => setLessonPage(p => p - 1)}
          >
            <ArrowLeft size={32} className="text-indigo-600" />
          </motion.button>

          {/* Lesson Cards Wrapper */}
          <div className="flex-1 h-full flex justify-center items-center py-4">
            <div className={`grid gap-6 md:gap-10 w-full h-full max-w-[1100px] mx-auto ${isLargeScreen ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {(() => {
                const sorted = [...lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
                const visible = sorted.slice(lessonPage * lessonCardsPerPage, (lessonPage * lessonCardsPerPage) + lessonCardsPerPage);
                const footerColors = ['#E0F2FE', '#DCFCE7', '#FAE8FF', '#FEF3C7', '#E0E7FF', '#FFE4E6'];

                return visible.map((lesson) => {
                  const status = getLessonStatus(lesson);
                  const num = lesson.orderIndex ?? lesson.chapter ?? '1';
                  const sid = String(lesson.id || lesson._id || '');

                  const preTest = testsList.find(t => String(t.lessonId || t.lesson_id || '') === sid && (t.type === 'PRE_TEST' || t.type === 'pre_test'));
                  const preTestDone = preTest && (preTest.testAttempts?.length > 0 || preTest.attempted);
                  const isFirst = Number(num) <= 1;
                  const prevLesson = !isFirst && sorted.find(l => Number(l.orderIndex || l.chapter || 0) === Number(num) - 1);
                  const prevCompleted = !prevLesson || (prevLesson?.progress?.hasPassedPostTest === true && prevLesson?.progress?.isCompleted === true);
                  const canEnter = (!!preTest && !preTestDone && (isFirst || prevCompleted)) || ((status.canAccess && status.status !== 'COMPLETED' && (!preTest || preTestDone)) || lesson.progress?.isCompleted);

                  return (
                    <Link
                      key={sid}
                      to={canEnter ? `/dashboard/student/lessons/${sid}` : '#'}
                      onClick={(e) => { if (!canEnter) { e.preventDefault(); toast.error('บทเรียนนี้ยังไม่ปลดล็อก'); setLockSoundKey(p => p + 1); } }}
                      className="group block h-full flex flex-col"
                    >
                      <motion.div
                        className="bg-white rounded-[3rem] md:rounded-[4rem] overflow-hidden  flex flex-col border-[8px] md:border-[12px] border-white relative transition-all flex-1"
                        whileHover={{ y: -8, scale: 1.01 }}
                      >
                        {/* Image Section: ปรับสัดส่วนให้คงที่และพอดีพื้นที่ */}
                        <div className="relative flex-1 bg-slate-100 overflow-hidden min-h-0">
                          <img
                            src={
                              lesson.imageUrl
                                ? (lesson.imageUrl.startsWith('data:') || lesson.imageUrl.startsWith('http')
                                  ? lesson.imageUrl
                                  : `${getApiBaseUrl()}${lesson.imageUrl.startsWith('/') ? '' : '/'}${lesson.imageUrl}`)
                                : `/หน้าปกบทเรียน/บทที่${num}.png`
                            }
                            // เพิ่ม h-[101%] เพื่อให้รูปยาวเกินลงมานิดหน่อย จะได้ไม่เกิดช่องว่างเป็นเส้น
                            className={`w-full h-[101%] object-cover transition-transform duration-700 group-hover:scale-110 ${!canEnter ? 'opacity-30 grayscale' : ''}`}
                            alt={lesson.title}
                            onError={(e) => {
                              e.target.src = "https://www.freeiconspng.com/uploads/no-image-icon-11.PNG";
                            }}
                          />
                          <div className="absolute top-4 right-4 p-2 md:p-3 bg-white/95 rounded-2xl shadow-lg z-10 border border-indigo-50/50">
                            <status.icon className={status.color} size={isLargeScreen ? 32 : 24} />
                          </div>
                          {!canEnter && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                              <Lock size={60} className="text-white drop-shadow-2xl opacity-80" />
                            </div>
                          )}
                        </div>

                        {/* Title Section: ลดพื้นที่ว่างเกินไป (Vertical) */}
                        <div
                          // ลบ border-t border-black/5 ออก 
                          // เพิ่ม -mt-1 (Margin Top ติดลบ) เพื่อให้แถบสีเกยขึ้นไปทับขอบรูปภาพ ปิดเส้นสีขาว ป้องกัน double slash
                          className="p-4 md:p-6 text-center shrink-0 -mt-1 relative z-10"
                          style={{ background: footerColors[(Number(num) - 1) % 6] }}
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <h3 className="text-2xl md:text-4xl font-black text-gray-900 italic tracking-tighter">บทที่ {num}</h3>
                            <AudioButton text={`บทที่ ${num} ${lesson.title.split(':')[1] || lesson.title}`} variant="mini" iconSize={20} className="!bg-white !text-indigo-600 shadow-sm" />
                          </div>
                          <p className="font-bold text-gray-600 text-sm md:text-xl truncate px-2">
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
            whileHover={{ scale: 1.1 }}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-xl flex items-center justify-center disabled:opacity-10 border-4 border-indigo-50 shrink-0 z-20 active:scale-90 transition-all"
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

export default MockStudentDashboard;