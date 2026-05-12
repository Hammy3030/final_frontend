import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  School,
  GraduationCap,
  TrendingUp,
  RefreshCw,
  Edit,
  Trash,
  Sparkles
} from 'lucide-react';
import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateClassroomModal from '../../components/teacher/CreateClassroomModal';
import { getApiUrl } from '../../utils/apiConfig';

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

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [classroomsData, setClassroomsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);

  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        delay: Math.random() * 4,
        duration: 5 + Math.random() * 5,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 8 + Math.random() * 12,
        color: [
          "rgba(255,176,0,0.2)",
          "rgba(167,139,250,0.2)",
          "rgba(96,165,250,0.2)",
          "rgba(52,211,153,0.2)",
        ][Math.floor(Math.random() * 4)],
      })),
    []
  );

  // Fetch classrooms from API
  const fetchClassrooms = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/teacher/classrooms'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setClassroomsData(response.data.data.classrooms);
      } else {
        throw new Error(response.data.message || 'Failed to fetch classrooms');
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch classrooms on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchClassrooms();
    }
  }, [user?.id]);

  // Create classroom function
  const createClassroom = async (classroomData) => {
    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(getApiUrl('/teacher/classrooms'), {
        name: classroomData.name,
        description: classroomData.description
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Refresh classrooms data
        await fetchClassrooms();
        setShowCreateModal(false);
        toast.success('สร้างห้องเรียนสำเร็จ');
      } else {
        throw new Error(response.data.message || 'Failed to create classroom');
      }
    } catch (error) {
      console.error('Error creating classroom:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างห้องเรียน');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateClassroom = (data) => {
    createClassroom(data);
  };

  // Update classroom function
  const updateClassroom = async (classroomData) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        getApiUrl(`/teacher/classrooms/${editingClassroom.id}`),
        {
          name: classroomData.name,
          description: classroomData.description
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        await fetchClassrooms();
        setShowEditModal(false);
        setEditingClassroom(null);
        toast.success('อัปเดตห้องเรียนสำเร็จ');
      } else {
        throw new Error(response.data.message || 'Failed to update classroom');
      }
    } catch (error) {
      console.error('Error updating classroom:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตห้องเรียน');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditClassroom = (classroom) => {
    setEditingClassroom(classroom);
    setShowEditModal(true);
  };

  const handleUpdateClassroom = (data) => {
    updateClassroom(data);
  };

  const deleteClassroom = async (classroomId) => {
    if (!globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบห้องเรียนนี้?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        getApiUrl(`/teacher/classrooms/${classroomId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('ลบห้องเรียนสำเร็จ');
        await fetchClassrooms();
      } else {
        throw new Error(response.data.message || 'Failed to delete classroom');
      }
    } catch (error) {
      console.error('Error deleting classroom:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบห้องเรียน');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTotalStudents = () => {
    return classroomsData?.reduce((total, classroom) => total + (classroom.students?.[0]?.count || 0), 0) || 0;
  };

  const getTotalLessons = () => {
    return classroomsData?.reduce((total, classroom) => total + (classroom.lessons?.[0]?.count || 0), 0) || 0;
  };


  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto font-[Sarabun,Noto_Sans_Thai,sans-serif]">
      {/* ── Animated Background ── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <motion.div
          className="absolute inset-0 opacity-40"
          animate={{
            background: [
              "radial-gradient(circle at 10% 20%, rgba(255,176,0,0.1) 0%, transparent 40%)",
              "radial-gradient(circle at 90% 80%, rgba(120,119,198,0.1) 0%, transparent 40%)",
              "radial-gradient(circle at 50% 50%, rgba(255,176,0,0.05) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        {particles.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}
      </div>

      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl sticky top-0 z-50 border-b border-white/40 shadow-sm shadow-indigo-100/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="flex-shrink-0"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#FFB000] via-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  BearThai
                </h1>
                <p className="text-sm text-gray-500 font-medium">ครู - {user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
                className="p-3 text-gray-600 hover:text-[#FFB000] hover:bg-yellow-50 rounded-xl transition-all duration-200"
                title="ตั้งค่าโปรไฟล์"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-white to-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-2">
                  สวัสดี {user?.name}
                </h2>
                <p className="text-gray-600 text-lg">
                  ยินดีต้อนรับสู่ระบบจัดการห้องเรียน BearThai
                </p>
              </div>
              <div className="flex gap-3 flex-wrap" />
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative group bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 rounded-[2.5rem] p-8 shadow-xl shadow-blue-200/40 overflow-hidden border-2 border-white/20"
          >
            <ShimmerOverlay />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-700" />
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-4 group-hover:rotate-12 transition-transform">
                <School className="w-8 h-8 text-white" />
              </div>
              <p className="text-white/80 font-bold text-sm mb-1 uppercase tracking-wider">ห้องเรียน</p>
              <p className="text-5xl font-black text-white drop-shadow-md">
                {classroomsData?.length || 0}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative group bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 rounded-[2.5rem] p-8 shadow-xl shadow-green-200/40 overflow-hidden border-2 border-white/20"
          >
            <ShimmerOverlay />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-700" />
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-4 group-hover:-rotate-12 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <p className="text-white/80 font-bold text-sm mb-1 uppercase tracking-wider">นักเรียน</p>
              <p className="text-5xl font-black text-white drop-shadow-md">
                {getTotalStudents()}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative group bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 rounded-[2.5rem] p-8 shadow-xl shadow-purple-200/40 overflow-hidden border-2 border-white/20"
          >
            <ShimmerOverlay />
            <div className="absolute top-1/2 -right-10 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <p className="text-white/80 font-bold text-sm mb-1 uppercase tracking-wider">บทเรียน</p>
              <p className="text-5xl font-black text-white drop-shadow-md">
                {getTotalLessons()}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Statistics & Charts Section */}
        {classroomsData?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200/50">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-3xl font-black text-gray-800 tracking-tight">
                กราฟห้องเรียน
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {/* Statistics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Students Distribution Chart */}
                <div className="bg-white/60 backdrop-blur-md rounded-[2rem] shadow-xl shadow-indigo-100/20 border border-white/60 p-8 hover:shadow-2xl transition-all duration-300 group">
                  <h4 className="text-lg font-black text-gray-700 mb-8 flex items-center gap-3">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-300 animate-pulse"></div>
                    จำนวนนักเรียนต่อห้อง
                  </h4>
                  <div className="space-y-6">
                    {classroomsData.slice(0, 5).map((classroom, i) => {
                      const maxStudents = Math.max(...classroomsData.map(c => c.students?.[0]?.count || 0), 1);
                      const percentage = ((classroom.students?.[0]?.count || 0) / maxStudents) * 100;
                      return (
                        <div key={classroom.id}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-600 truncate">{classroom.name}</span>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{classroom.students?.[0]?.count || 0} คน</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 0.5 + i * 0.1, duration: 1.2, ease: "easeOut" }}
                              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full shadow-lg shadow-indigo-200"
                            ></motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lessons Distribution Chart */}
                <div className="bg-white/60 backdrop-blur-md rounded-[2rem] shadow-xl shadow-indigo-100/20 border border-white/60 p-8 hover:shadow-2xl transition-all duration-300">
                  <h4 className="text-lg font-black text-gray-700 mb-8 flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-300 animate-pulse"></div>
                    จำนวนบทเรียนต่อห้อง
                  </h4>
                  <div className="space-y-6">
                    {classroomsData.slice(0, 5).map((classroom, i) => {
                      const maxLessons = Math.max(...classroomsData.map(c => c.lessons?.[0]?.count || 0), 1);
                      const percentage = ((classroom.lessons?.[0]?.count || 0) / maxLessons) * 100;
                      return (
                        <div key={classroom.id}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-600 truncate">{classroom.name}</span>
                            <span className="text-xs font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">{classroom.lessons?.[0]?.count || 0} บท</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 0.7 + i * 0.1, duration: 1.2, ease: "easeOut" }}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full shadow-lg shadow-purple-200"
                            ></motion.div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Progress */}
            <div className="bg-white/60 backdrop-blur-md rounded-[2rem] shadow-xl shadow-indigo-100/20 border border-white/60 p-8 hover:shadow-2xl transition-all duration-300 mt-8">
              <h4 className="text-lg font-black text-gray-700 mb-8 flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-300 animate-pulse"></div>
                ความสมบูรณ์ของห้องเรียน
              </h4>
              <div className="space-y-6">
                {classroomsData.slice(0, 3).map((classroom, idx) => {
                  const hasStudents = (classroom.students?.[0]?.count || 0) > 0;
                  const hasLessons = (classroom.lessons?.[0]?.count || 0) > 0;
                  const progress = ((hasStudents ? 1 : 0) + (hasLessons ? 1 : 0)) / 2 * 100;
                  return (
                    <div key={classroom.id}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-600 truncate">{classroom.name}</span>
                        <span className="text-xs font-black text-gray-900 bg-white px-2.5 py-1 rounded-full shadow-sm">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner border border-gray-50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: 0.9 + idx * 0.1, duration: 1.4, ease: "easeOut" }}
                          className={`h-full rounded-full shadow-lg ${progress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-emerald-100' :
                            progress >= 50 ? 'bg-gradient-to-r from-sky-400 to-indigo-500 shadow-indigo-100' :
                              'bg-gradient-to-r from-amber-400 to-orange-500 shadow-orange-100'
                            }`}
                        ></motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        )}

        {/* Classrooms Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#FFB000] to-orange-500 rounded-xl shadow-lg">
                  <School className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  ห้องเรียนของฉัน
                </h3>
              </div>
              {classroomsData?.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-[#FFB000] to-orange-500 text-white text-sm font-semibold rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-orange-500/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  สร้างห้องเรียนใหม่
                </motion.button>
              )}
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : classroomsData?.length === 0 ? (
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <School className="w-12 h-12 text-gray-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ยังไม่มีห้องเรียน
                </h3>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FFB000] to-orange-500 text-white text-base font-semibold rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-orange-500/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  สร้างห้องเรียนใหม่
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classroomsData?.map((classroom, index) => {
                  const studentCount = classroom.students?.[0]?.count || 0;
                  const lessonCount = classroom.lessons?.[0]?.count || 0;
                  const isEmpty = studentCount === 0 && lessonCount === 0;

                  return (
                    <motion.div
                      key={classroom.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative rounded-[2rem] p-8 transition-all duration-300 overflow-hidden border-2 h-full flex flex-col ${isEmpty
                        ? 'border-dashed border-gray-200 bg-white/40 hover:border-[#FFB000]/40'
                        : 'border-white/60 bg-white/60 backdrop-blur-md shadow-xl shadow-indigo-100/30'
                        }`}
                    >
                      <ShimmerOverlay />

                      {/* Interactive background glow for active cards */}
                      {!isEmpty && (
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                      )}

                      {/* Action buttons */}
                      <div className="absolute top-4 right-4 flex gap-2 z-10">
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditClassroom(classroom);
                          }}
                          className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 bg-white shadow-md border border-gray-100"
                          title="แก้ไขห้องเรียน"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: -15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteClassroom(classroom.id);
                          }}
                          disabled={isDeleting}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 bg-white shadow-md border border-gray-100"
                          title="ลบห้องเรียน"
                        >
                          <Trash className="w-4 h-4" />
                        </motion.button>
                      </div>

                      <Link
                        to={`/dashboard/teacher/classrooms/${classroom.id}`}
                        className="flex-1 flex flex-col relative z-10"
                      >
                        <div className="mb-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3 ${isEmpty ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-br from-[#FFB000] to-orange-500 text-white shadow-lg shadow-orange-200/50'
                            }`}>
                            <School size={28} />
                          </div>

                          <h4 className={`text-2xl font-black mb-2 line-clamp-1 ${isEmpty ? 'text-gray-400' : 'text-gray-800'}`}>
                            {classroom.name}
                          </h4>
                          <p className="text-gray-500 text-sm line-clamp-2 min-h-[2.5rem]">
                            {classroom.description || 'ยังไม่มีคำอธิบายห้องเรียน'}
                          </p>
                        </div>

                        {isEmpty && (
                          <div className="mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-amber-100 text-amber-700 border border-amber-200">
                              ห้องเรียนว่าง
                            </span>
                          </div>
                        )}

                        <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(studentCount, 3))].map((_, i) => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-600 font-bold">
                                🧒🏻
                              </div>
                            ))}
                            {studentCount > 3 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                                +{studentCount - 3}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-gray-400" title="บทเรียน">
                              <BookOpen size={16} />
                              <span className="text-sm font-bold text-gray-600">{lessonCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400" title="นักเรียน">
                              <Users size={16} />
                              <span className="text-sm font-bold text-gray-600">{studentCount}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Classroom Modal */}
      {
        showCreateModal && (
          <CreateClassroomModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateClassroom}
            isLoading={isCreating}
          />
        )
      }

      {/* Edit Classroom Modal */}
      {
        showEditModal && editingClassroom && (
          <CreateClassroomModal
            onClose={() => {
              setShowEditModal(false);
              setEditingClassroom(null);
            }}
            onSubmit={handleUpdateClassroom}
            isLoading={isUpdating}
            initialData={{
              name: editingClassroom.name,
              description: editingClassroom.description || ''
            }}
            isEditMode={true}
          />
        )
      }

    </div >
  );
};

export default TeacherDashboard;
