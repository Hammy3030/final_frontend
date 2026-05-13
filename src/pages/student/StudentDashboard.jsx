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
  const [stats, setStats] = useState({ total: 0, completed: 0, percent: 0 });

  const { refreshProfile } = useAuth();

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

  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 10 + Math.random() * 15,
      color: ["rgba(167,139,250,0.2)", "rgba(251,191,36,0.2)", "rgba(96,165,250,0.2)"][Math.floor(Math.random() * 3)],
    })), []
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#f8faff] font-[Sarabun,sans-serif] pb-10">
      {/* Background Particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {particles.map((p) => <FloatingParticle key={p.id} {...p} />)}
      </div>

      <motion.div 
        className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10"
        variants={container} initial="hidden" animate={isLoaded ? "show" : "hidden"}
      >
        {/* Header Section */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-xl border-4 border-white flex items-center justify-center text-4xl overflow-hidden">
              🧒🏻
            </div>
            <div>
              <p className="text-indigo-500 font-bold text-sm sm:text-base">สวัสดีจ้า</p>
              <h1 className="text-xl sm:text-3xl font-black text-gray-800 tracking-tight">
                {user?.name || "นักเรียนคนเก่ง"}
              </h1>
            </div>
          </div>
          <motion.button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-full text-gray-600 font-bold shadow-lg hover:bg-red-50 hover:text-red-500 transition-all border border-white"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <LogOut size={18} />
            <span>ออกจากระบบ</span>
          </motion.button>
        </motion.div>

        {/* Stats Grid - Responsive: 1 col on small mobile, 3 col on tablet up */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[
            { label: "บทเรียนทั้งหมด", val: stats.total, icon: BookOpen, color: "from-sky-400 to-blue-500" },
            { label: "เรียนจบแล้ว", val: stats.completed, icon: Check, color: "from-emerald-400 to-green-500" },
            { label: "ความคืบหน้า", val: `${stats.percent}%`, icon: TrendingUp, color: "from-pink-400 to-rose-500" }
          ].map((card, i) => (
            <motion.div
              key={i}
              className={`relative p-6 rounded-[2rem] bg-gradient-to-br ${card.color} shadow-2xl flex flex-col items-center justify-center text-white overflow-hidden min-h-[160px]`}
              whileHover={{ y: -5 }}
            >
              <ShimmerOverlay />
              <card.icon size={32} className="mb-2 opacity-90" />
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm sm:text-base font-bold opacity-90">{card.label}</span>
                <AudioButton text={card.label} variant="mini" className="!p-1.5" iconSize={16} />
              </div>
              <span className="text-4xl sm:text-5xl font-black">{card.val}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons Grid - Responsive: 1 col on mobile, 2 col on tablet up */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {[
            { 
              to: "/dashboard/student/lessons", emoji: "📚", label: "บทเรียน", sub: "เข้าสู่โลกแห่งการเรียนรู้", 
              color: "from-violet-500 to-indigo-600", shadow: "shadow-indigo-200" 
            },
            { 
              to: "/dashboard/student/writing", emoji: "✏️", label: "ฝึกเขียน", sub: "ฝึกลายมือให้สวยงาม", 
              color: "from-orange-400 to-yellow-500", shadow: "shadow-orange-200" 
            }
          ].map((btn, i) => (
            <Link key={i} to={btn.to} className="group no-underline">
              <motion.div
                className={`relative p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br ${btn.color} ${btn.shadow} flex flex-col items-center text-center text-white overflow-hidden h-full min-h-[250px] sm:min-h-[320px] transition-all`}
                whileHover={{ y: -10, scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <ShimmerOverlay />
                <div className="relative z-10 flex flex-col items-center h-full justify-center">
                  <span className="text-6xl sm:text-8xl mb-4 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                    {btn.emoji}
                  </span>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{btn.label}</h2>
                    <AudioButton text={btn.label} variant="mini" iconSize={24} />
                  </div>
                  <p className="text-white/80 font-bold text-base sm:text-lg">{btn.sub}</p>
                </div>
                {/* Decorative Glow */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;