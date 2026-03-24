import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { BookOpen, TrendingUp, Check, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { getApiUrl } from "../../utils/apiConfig";
import AudioButton from "../../components/AudioButton";

/* ── Floating particle component ── */
const FloatingParticle = ({ delay, duration, x, y, size, color }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      background: color,
      left: `${x}%`,
      top: `${y}%`,
      filter: "blur(1px)",
    }}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, -15, 0],
      opacity: [0.3, 0.7, 0.3],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

/* ── Shimmer overlay for cards ── */
const ShimmerOverlay = () => (
  <motion.div
    className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
      }}
      animate={{ x: ["-100%", "200%"] }}
      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
    />
  </motion.div>
);

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    percent: 0
  });

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(getApiUrl('/student/lessons'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          const lessons = response.data.data?.lessons || [];
          const total = lessons.length;
          const completed = lessons.filter((l) => l.status === 'COMPLETED' || l.progress?.isCompleted === true).length;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          setStats({ total, completed, percent });
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchProgress();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        delay: Math.random() * 4,
        duration: 4 + Math.random() * 4,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 6 + Math.random() * 14,
        color: ["rgba(167,139,250,0.35)", "rgba(251,191,36,0.3)", "rgba(96,165,250,0.3)", "rgba(251,146,60,0.3)", "rgba(52,211,153,0.3)"][Math.floor(Math.random() * 5)],
      })),
    []
  );

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const statCards = [
    {
      icon: BookOpen,
      label: "บทเรียนทั้งหมด",
      value: stats.total,
      gradient: "from-sky-400 to-blue-500",
      shadow: "shadow-blue-300/40",
      iconStroke: 2,
    },
    {
      icon: Check,
      label: "เรียนจบแล้ว",
      value: stats.completed,
      gradient: "from-emerald-400 to-green-500",
      shadow: "shadow-green-300/40",
      iconStroke: 2.5,
    },
    {
      icon: TrendingUp,
      label: "ความคืบหน้า",
      value: `${stats.percent}%`,
      percent: null,
      gradient: "from-pink-400 to-rose-500",
      shadow: "shadow-pink-300/40",
      iconStroke: 2,
    },
  ];

  const actionButtons = [
    {
      to: "/dashboard/student/lessons",
      emoji: "📚",
      label: "บทเรียน",
      sublabel: "เริ่มเรียนรู้เลย",
      gradient: "from-violet-500 via-purple-500 to-indigo-500",
      shadow: "hover:shadow-purple-400/50",
      glow: "rgba(139,92,246,0.4)",
    },
    {
      to: "/dashboard/student/writing",
      emoji: "✏️",
      label: "ฝึกเขียน",
      sublabel: "ฝึกเขียนตัวอักษร",
      gradient: "from-amber-400 via-yellow-400 to-orange-400",
      shadow: "hover:shadow-amber-400/50",
      glow: "rgba(251,191,36,0.4)",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden font-[Sarabun,Noto_Sans_Thai,sans-serif]">
      {/* ── Background ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-sky-50 to-purple-100" />
        {particles.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}
      </div>

      <motion.div
        className="relative z-10 max-w-2xl mx-auto px-4 py-6 sm:py-10 min-h-screen"
        variants={container}
        initial="hidden"
        animate={isLoaded ? "show" : "hidden"}
      >
        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6 sm:mb-10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/80 border-[3px] border-white shadow-lg flex items-center justify-center text-3xl sm:text-4xl">🧒🏻</div>
            </div>
            <div>
              <p className="text-sm sm:text-base text-indigo-400 font-semibold leading-none mb-1">สวัสดี</p>
              <div className="flex items-center gap-2 relative">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 leading-none">
                  {user?.name || "นักเรียน"}
                </h1>
                <div className="flex-shrink-0">
                  {/* <AudioButton
                    text={`สวัสดี ${user?.name || "นักเรียน"}`}
                    variant="mini"
                    className="!p-1 !bg-indigo-100 !text-indigo-600 border-none"
                    iconSize={18}
                  /> */}
                </div>
              </div>
            </div>
          </div>
          <motion.button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/70 backdrop-blur-md text-gray-600 border border-white/50 rounded-full px-4 py-2 text-sm font-bold shadow-lg hover:bg-red-50 hover:text-red-500 transition-colors"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </motion.button>
        </motion.div>

        {/* ── Stats Cards ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                className={`relative bg-gradient-to-br ${card.gradient} rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center shadow-lg ${card.shadow} overflow-hidden`}
                whileHover={{ y: -6, scale: 1.03 }}
              >
                <ShimmerOverlay />
                <Icon className="text-white/90 mb-6 relative z-10" size={window.innerWidth < 640 ? 50 : 50} strokeWidth={card.iconStroke} />
                <div className="flex items-center justify-center w-full mb-1 relative z-10">
                  {/* Trick: ใช้ Relative + Absolute เพื่อให้ Text อยู่กลางและปุ่มเสียงต่อท้าย */}
                  <div className="relative flex items-center justify-center">
                    <p className="text-[11px] sm:text-sm font-bold text-white/90 text-center leading-none">
                      {card.label}
                    </p>
                    <div className="absolute left-full ml-1">
                      <AudioButton
                        text={card.label}
                        variant="mini"
                        className="!p-0.5 !bg-white/20 !text-white border-none"
                        iconSize={20}
                      />
                    </div>
                  </div>
                </div>
                <motion.span
                  className="text-3xl sm:text-5xl font-extrabold text-white relative z-10 leading-none mt-1"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + (i * 0.1), type: "spring" }}
                >
                  {card.value}
                </motion.span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Action Buttons ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {actionButtons.map((btn, i) => (
            <motion.div key={i} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={btn.to}
                className={`relative block bg-gradient-to-br ${btn.gradient} rounded-3xl sm:rounded-[2rem] p-8 sm:p-12 text-center no-underline shadow-xl ${btn.shadow} overflow-hidden group`}
              >
                <ShimmerOverlay />
                <motion.div className="text-6xl sm:text-7xl mb-4 relative z-10 leading-none" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}>
                  {btn.emoji}
                </motion.div>
                <div className="flex items-center justify-center mb-2 relative z-10">
                  <div className="relative flex items-center justify-center">
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-none">
                      {btn.label}
                    </h2>
                    <div className="absolute left-full ml-3">
                      <AudioButton
                        text={`${btn.label} ${btn.sublabel}`}
                        variant="mini"
                        className="!bg-white/20 !text-white !p-2 rounded-full border border-white/10"
                        iconSize={window.innerWidth < 640 ? 18 : 24}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base font-medium text-white/70 relative z-10">{btn.sublabel}</p>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity" style={{ background: btn.glow }} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;