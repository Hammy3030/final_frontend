import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  UserPlus,
  Trash2,
  RefreshCw,
  Edit,
  Trash,
  GripVertical,
  FileText,
  Gamepad2,
  Copy,
  Check,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Play,
  Archive,
  RotateCcw,
  Eye,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AddStudentToClassModal from '../../components/teacher/AddStudentToClassModal';
import CreateLessonModal from '../../components/teacher/CreateLessonModal';
import QuickCreateLessonModal from '../../components/teacher/QuickCreateLessonModal';
import { getApiUrl } from '../../utils/apiConfig';
import { useLocation } from 'react-router-dom';

const ClassroomPage = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [viewingLesson, setViewingLesson] = useState(null);
  const [viewingTest, setViewingTest] = useState(null);
  const [viewingGame, setViewingGame] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [lessonDetails, setLessonDetails] = useState(null);
  const [testDetails, setTestDetails] = useState(null);
  const [gameDetails, setGameDetails] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('all'); // 'all', 'male', 'female'
  const [filterProgress, setFilterProgress] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' , 'progress' , 'createdAt'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch classroom details
  const { data: classroomData, isLoading } = useQuery(
    ['classroom', classroomId],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/teacher/classrooms/${classroomId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.classroom;
    }
  );

  // Fetch deleted items
  const { data: deletedItems, isLoading: isLoadingDeleted } = useQuery(
    ['deleted-items', classroomId],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/teacher/classrooms/${classroomId}/deleted`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data;
    },
    {
      enabled: !!classroomId,
      refetchOnWindowFocus: false
    }
  );

  // Add students mutation
  const addStudentsMutation = useMutation(
    async (studentsData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/classrooms/${classroomId}/students`),
        studentsData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.students;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        setShowAddStudentsModal(false);
        toast.success('เพิ่มนักเรียนสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Remove student mutation
  const removeStudentMutation = useMutation(
    async (studentId) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        getApiUrl(`/teacher/classrooms/${classroomId}/students/${studentId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('ลบนักเรียนสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Reset password mutation
  const resetPasswordMutation = useMutation(
    async (studentId) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/classrooms/${classroomId}/students/${studentId}/reset-password`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.newPassword;
    },
    {
      onSuccess: (newPassword) => {
        // Show persistent modal/alert instead of toast
        // Using a simple confirm/alert for now as a quick better-than-toast solution
        // In a real app, a dedicated modal "PasswordResetSuccessModal" is better
        globalThis.alert(`✅ รีเซ็ตรหัสผ่านสำเร็จ\n\nรหัสผ่านใหม่คือ: ${newPassword}\n\nกรุณาจดบันทึกรหัสผ่านนี้ไว้`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Generate default lessons mutation
  const generateLessonsMutation = useMutation(
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/classrooms/${classroomId}/lessons/generate`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.lessons;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('สร้างเนื้อหาทั้งหมดอัตโนมัติสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Create custom lesson mutation
  const createLessonMutation = useMutation(
    async (lessonData) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/classrooms/${classroomId}/lessons`),
        lessonData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.lesson;
    },
    {
      onSuccess: (lesson) => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        setShowCreateLessonModal(false);
        toast.success('สร้างบทเรียนสำเร็จ');
        navigate(`/dashboard/teacher/lessons/${lesson.id || lesson._id}?classroomId=${classroomId}`);
      },
      onError: (error) => {
        const apiMessage =
          error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.message;
        toast.error(apiMessage || 'เกิดข้อผิดพลาดในการสร้างบทเรียน');
      }
    }
  );

  // Generate tests mutation
  const generateTestsMutation = useMutation(
    async (lessonId) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/lessons/${lessonId}/tests/generate`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.tests;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('สร้างแบบทดสอบอัตโนมัติสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Generate games mutation
  const generateGamesMutation = useMutation(
    async (lessonId) => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/lessons/${lessonId}/games/generate`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.games;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('สร้างเกมอัตโนมัติสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Update lesson mutation
  const updateLessonMutation = useMutation(
    async ({ lessonId, data }) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        getApiUrl(`/teacher/lessons/${lessonId}`),
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data.lesson;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('อัปเดตบทเรียนสำเร็จ');
        setShowEditLessonModal(false);
        setSelectedLesson(null);
        setEditingLesson(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Delete lesson mutation (soft delete)
  const deleteLessonMutation = useMutation(
    async (lessonId) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        getApiUrl(`/teacher/lessons/${lessonId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        queryClient.invalidateQueries(['deleted-items', classroomId]);
        toast.success('ลบบทเรียนสำเร็จ (สามารถกู้คืนได้)');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Restore lesson mutation
  const restoreLessonMutation = useMutation(
    async (lessonId) => {
      const token = localStorage.getItem('token');
      await axios.post(
        getApiUrl(`/teacher/lessons/${lessonId}/restore`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        queryClient.invalidateQueries(['deleted-items', classroomId]);
        toast.success('กู้คืนบทเรียนสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Delete test mutation (soft delete)
  const deleteTestMutation = useMutation(
    async (testId) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        getApiUrl(`/teacher/tests/${testId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        queryClient.invalidateQueries(['deleted-items', classroomId]);
        toast.success('ลบแบบทดสอบสำเร็จ (สามารถกู้คืนได้)');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Restore test mutation
  const restoreTestMutation = useMutation(
    async (testId) => {
      const token = localStorage.getItem('token');
      await axios.post(
        getApiUrl(`/teacher/tests/${testId}/restore`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        queryClient.invalidateQueries(['deleted-items', classroomId]);
        toast.success('กู้คืนแบบทดสอบสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Delete game mutation (soft delete)
  const deleteGameMutation = useMutation(
    async (gameId) => {
      const token = localStorage.getItem('token');
      await axios.delete(
        getApiUrl(`/teacher/games/${gameId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        queryClient.invalidateQueries(['deleted-items', classroomId]);
        toast.success('ลบเกมสำเร็จ (สามารถกู้คืนได้)');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Restore game mutation
  const restoreGameMutation = useMutation(
    async (gameId) => {
      const token = localStorage.getItem('token');
      await axios.post(
        getApiUrl(`/teacher/games/${gameId}/restore`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        queryClient.invalidateQueries(['deleted-items', classroomId]);
        toast.success('กู้คืนเกมสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  // Reorder lessons mutation
  const reorderLessonsMutation = useMutation(
    async (lessonOrders) => {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        getApiUrl('/teacher/lessons/reorder'),
        { lessonOrders },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('จัดลำดับบทเรียนสำเร็จ');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  const handleAddStudents = (data) => {
    addStudentsMutation.mutate(data);
  };

  const handleRemoveStudent = (studentId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบนักเรียนคนนี้?')) {
      removeStudentMutation.mutate(studentId);
    }
  };

  const handleResetPassword = (studentId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตรหัสผ่าน?')) {
      resetPasswordMutation.mutate(studentId);
    }
  };

  const handleEditLesson = (lesson) => {
    setSelectedLesson(lesson);
    setEditingLesson(true);
    setShowEditLessonModal(true);
  };

  const handleDeleteLesson = (lessonId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบบทเรียนนี้?\n\nหมายเหตุ: คุณสามารถกู้คืนบทเรียนนี้ได้ภายหลัง')) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleRestoreLesson = (lessonId) => {
    restoreLessonMutation.mutate(lessonId);
  };

  const handleSaveLesson = (lessonData) => {
    updateLessonMutation.mutate({ lessonId: selectedLesson.id, data: lessonData });
  };

  const handleGenerateTests = (lessonId) => {
    generateTestsMutation.mutate(lessonId);
  };

  const handleGenerateGames = (lessonId) => {
    generateGamesMutation.mutate(lessonId);
  };

  const handleDeleteTest = (testId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบแบบทดสอบนี้?\n\nหมายเหตุ: คุณสามารถกู้คืนแบบทดสอบนี้ได้ภายหลัง')) {
      deleteTestMutation.mutate(testId);
    }
  };

  const handleRestoreTest = (testId) => {
    restoreTestMutation.mutate(testId);
  };

  const handleDeleteGame = (gameId) => {
    // eslint-disable-next-line no-alert
    if (globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบเกมนี้?\n\nหมายเหตุ: คุณสามารถกู้คืนเกมนี้ได้ภายหลัง')) {
      deleteGameMutation.mutate(gameId);
    }
  };

  const handleRestoreGame = (gameId) => {
    restoreGameMutation.mutate(gameId);
  };

  const handleViewLesson = async (lessonId) => {
    try {
      setIsLoadingDetails(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/lessons/${lessonId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setLessonDetails(response.data.data.lesson);
        setViewingLesson(lessonId);
      }
    } catch (error) {
      console.error('Error fetching lesson details:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดรายละเอียดบทเรียน');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewTest = async (testId) => {
    try {
      setIsLoadingDetails(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/lessons/tests/${testId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setTestDetails(response.data.data.test);
        setViewingTest(testId);
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดรายละเอียดแบบทดสอบ');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewGame = async (gameId) => {
    try {
      setIsLoadingDetails(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/lessons/games/${gameId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setGameDetails(response.data.data.game);
        setViewingGame(gameId);
      }
    } catch (error) {
      console.error('Error fetching game details:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดรายละเอียดเกม');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewStudentProgress = async (studentId) => {
    try {
      setIsLoadingProgress(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/teacher/classrooms/${classroomId}/students/${studentId}/progress`),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setStudentProgress(response.data.data.progress);
        setViewingStudent(studentId);
      }
    } catch (error) {
      console.error('Error fetching student progress:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลความคืบหน้าของนักเรียน');
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast.success('คัดลอกแล้ว');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Copy error:', err);
      toast.error('ไม่สามารถคัดลอกได้');
    }
  };

  // Filter and search students
  const filteredAndSortedStudents = () => {
    if (!classroomData?.students) return [];

    let filtered = [...classroomData.students];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(query) ||
        student.studentCode?.toLowerCase().includes(query) ||
        student.qrCode?.toLowerCase().includes(query)
      );
    }

    // Gender filter
    if (filterGender !== 'all') {
      filtered = filtered.filter(student => {
        const name = student.name?.toLowerCase() || '';
        if (filterGender === 'male') {
          return name.startsWith('เด็กชาย') || name.startsWith('ด.ช.');
        } else if (filterGender === 'female') {
          return name.startsWith('เด็กหญิง') || name.startsWith('ด.ญ.');
        }
        return true;
      });
    }

    // Progress filter
    if (filterProgress) {
      filtered = filtered.filter(student => {
        const completionRate = student.progressSummary?.completionRate || 0;
        const completedLessons = student.progressSummary?.completedLessons || 0;
        if (filterProgress === 'no-progress') return completedLessons === 0;
        if (filterProgress === 'in-progress') return completedLessons > 0 && completionRate < 100;
        if (filterProgress === 'completed') return completionRate === 100;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'progress':
          aValue = a.progressSummary?.completionRate || 0;
          bValue = b.progressSummary?.completionRate || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  };

  // Pagination
  const paginatedStudents = () => {
    const filtered = filteredAndSortedStudents();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredAndSortedStudents().length / itemsPerPage);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterGender('all');
    setFilterProgress('');
    setSortBy('name');
    setSortOrder('asc');
    setCurrentPage(1);
  };

  const handleDeleteAllLessons = async () => {
    // eslint-disable-next-line no-alert
    if (!globalThis.confirm('คุณแน่ใจหรือไม่ที่จะลบบทเรียนทั้งหมด?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (classroomData?.lessons && classroomData.lessons.length > 0) {
        await Promise.all(classroomData.lessons.map(lesson =>
          axios.delete(
            getApiUrl(`/teacher/lessons/${lesson.id}`),
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        ));
        queryClient.invalidateQueries(['classroom', classroomId]);
        toast.success('ลบบทเรียนทั้งหมดสำเร็จ');
      }
    } catch (error) {
      console.error('Error deleting all lessons:', error);
      toast.error('เกิดข้อผิดพลาดในการลบบทเรียน');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !classroomData?.lessons) {
      return;
    }

    const oldIndex = classroomData.lessons.findIndex(lesson => lesson.id === active.id);
    const newIndex = classroomData.lessons.findIndex(lesson => lesson.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedLessons = arrayMove(classroomData.lessons, oldIndex, newIndex);

    // Update orderIndex for each lesson
    const lessonOrders = reorderedLessons.map((lesson, index) => ({
      lessonId: lesson.id,
      orderIndex: index + 1
    }));

    reorderLessonsMutation.mutate(lessonOrders);
  };

  const handleMoveLesson = (lesson, direction) => {
    if (!classroomData?.lessons) return;

    // Filter lessons in the same category and chapter
    const siblings = classroomData.lessons
      .filter(l => l.category === lesson.category && (l.chapter || '1') === (lesson.chapter || '1'))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const currentIndex = siblings.findIndex(l => l.id === lesson.id);
    if (currentIndex === -1) return;

    let targetIndex;
    if (direction === 'up') {
      targetIndex = currentIndex - 1;
    } else {
      targetIndex = currentIndex + 1;
    }

    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const targetLesson = siblings[targetIndex];

    // Swap orderIndex
    const newOrders = [
      { lessonId: lesson.id, orderIndex: targetLesson.orderIndex },
      { lessonId: targetLesson.id, orderIndex: lesson.orderIndex }
    ];

    reorderLessonsMutation.mutate(newOrders);
  };

  // Sortable Lesson Item Component
  const SortableLessonItem = ({ lesson }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: lesson.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition duration-200"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{lesson.content?.substring(0, 100)}...</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDeleteLesson(lesson.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 font-[Sarabun,sans-serif] overflow-y-auto flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard/teacher')}
                className="p-2 text-gray-400 hover:text-gray-600 transition duration-200 mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {classroomData?.name}
                </h1>
                <p className="text-sm text-gray-500">
                  จัดการห้องเรียน
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">นักเรียน</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroomData?.students?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">บทเรียน</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroomData?.lessons?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">แบบทดสอบ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroomData?.tests?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Gamepad2 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">เกม</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroomData?.games?.length || 0}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Students Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                รายชื่อนักเรียน ({filteredAndSortedStudents().length} / {classroomData?.students?.length || 0})
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddStudentsModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                สร้างบัญชีนักเรียน
              </motion.button>
            </div>

            {/* Search and Filter Bar */}
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อหรือรหัสนักเรียน"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      handleFilterChange();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                {/* Gender Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterGender}
                    onChange={(e) => {
                      setFilterGender(e.target.value);
                      handleFilterChange();
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">ทุกเพศ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>

                {/* Progress Filter */}
                <select
                  value={filterProgress}
                  onChange={(e) => {
                    setFilterProgress(e.target.value);
                    handleFilterChange();
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">ทุกความคืบหน้า</option>
                  <option value="no-progress">ยังไม่เริ่มเรียน</option>
                  <option value="in-progress">กำลังเรียน</option>
                  <option value="completed">เรียนจบแล้ว</option>
                </select>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    handleFilterChange();
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">เรียงตามชื่อ</option>
                  <option value="progress">เรียงตามความคืบหน้า</option>
                  <option value="createdAt">เรียงตามวันที่สร้าง</option>
                </select>

                {/* Sort Order */}
                <button
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    handleFilterChange();
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition duration-200"
                  title={sortOrder === 'asc' ? 'เรียงจากน้อยไปมาก' : 'เรียงจากมากไปน้อย'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>


                {/* Items Per Page */}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-gray-600">แสดง:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {classroomData?.students?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center py-8 text-gray-500">
                  ยังไม่มีนักเรียน
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddStudentsModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  สร้างบัญชีนักเรียน
                </motion.button>
              </div>
            ) : filteredAndSortedStudents().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>

                <p className="text-gray-600 mb-4">
                  ไม่พบนักเรียนที่ตรงกับเงื่อนไขการค้นหา
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition duration-200"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedStudents().map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{student.name}</h3>
                          <p className="text-sm text-gray-600">รหัสนักเรียน: {student.studentCode || student.qrCode}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            สร้างเมื่อ: {new Date(student.createdAt || Date.now()).toLocaleString('th-TH')}
                          </p>
                          {student.progressSummary && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <div className="flex items-center gap-1 text-xs">
                                <BookOpen className="w-3 h-3 text-blue-600" />
                                <span className="text-gray-600">
                                  เรียนจบ {student.progressSummary.completedLessons}/{student.progressSummary.totalLessons} บท
                                </span>
                              </div>
                              {student.progressSummary.averageTestScore > 0 && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Award className="w-3 h-3 text-purple-600" />
                                  <span className="text-gray-600">
                                    คะแนนเฉลี่ย {student.progressSummary.averageTestScore}%
                                  </span>
                                </div>
                              )}
                              {student.progressSummary.completionRate > 0 && (
                                <div className="w-full mt-1">
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>ความคืบหน้า</span>
                                    <span>{student.progressSummary.completionRate}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${student.progressSummary.completionRate}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewStudentProgress(student.id)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition duration-200"
                            title="ดูความคืบหน้าและคะแนน"
                          >
                            <BarChart3 size={16} />
                          </button>
                          <button
                            onClick={() => copyToClipboard(student.qrCode || student.studentCode, `code-${student.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                            title="คัดลอกรหัสนักเรียน"
                          >
                            {copiedCode === `code-${student.id}` ? (
                              <Check size={16} className="text-green-600" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleRemoveStudent(student.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                            title="ลบนักเรียน"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-600">
                      แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedStudents().length)} จาก {filteredAndSortedStudents().length} คน
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm rounded-lg transition duration-200 ${currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lessons Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                บทเรียนทั้งหมด
              </h3>
              <div className="flex gap-2">
                {/* {classroomData?.lessons && classroomData.lessons.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteAllLessons}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition duration-200"
                    >
                    <Trash className="w-4 h-4 mr-2" /> ลบทั้งหมด
                    </motion.button>
                  )} */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowQuickCreate(true)}
                  disabled={createLessonMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                >
                  {createLessonMutation.isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {createLessonMutation.isLoading ? 'กำลังสร้าง' : 'สร้างบทเรียนใหม่'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => generateLessonsMutation.mutate()}
                  disabled={generateLessonsMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generateLessonsMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      กำลังสร้าง
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      สร้างเนื้อหาทั้งหมดอัตโนมัติ
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {classroomData?.lessons?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center py-8 text-gray-500 ">
                  ยังไม่มีบทเรียน
                </div>

              </div>
            ) : (
              <div className="space-y-8">
                {['consonants', 'vowels', 'words', 'sentences'].map((category) => {
                  const categoryLessons = classroomData?.lessons?.filter(l => l.category === category) || [];
                  if (categoryLessons.length === 0) return null;

                  const categoryTitle = {
                    consonants: 'พยัญชนะ',
                    vowels: 'สระ',
                  }[category];

                  // Group by chapter
                  const chapters = {};
                  categoryLessons.forEach(lesson => {
                    const chapter = lesson.chapter || '1';
                    if (!chapters[chapter]) chapters[chapter] = [];
                    chapters[chapter].push(lesson);
                  });

                  return (
                    <div key={category} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 border-gray-300">
                        หมวด: {categoryTitle}
                      </h4>

                      <div className="space-y-6">
                        {Object.entries(chapters).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([chapter, lessons]) => (
                          <div key={chapter}>
                            <h5 className="text-md font-semibold text-gray-700 mb-3 ml-2">
                              บทที่ {chapter}
                            </h5>
                            <div className="space-y-3 pl-4">
                              {lessons.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, index) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition duration-200"
                                >
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {lesson.content?.includes('[MEDIA]')
                                        ? 'สื่อการสอนมัลติมีเดีย (Multimedia Content)'
                                        : (lesson.content?.substring(0, 100) + (lesson.content?.length > 100 ? '...' : ''))}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col mr-2">
                                      <button
                                        onClick={() => handleMoveLesson(lesson, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="เลื่อนขึ้น"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveLesson(lesson, 'down')}
                                        disabled={index === lessons.length - 1}
                                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="เลื่อนลง"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => navigate(`/dashboard/teacher/lessons/${lesson.id}?classroomId=${classroomId}`)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                      title="แก้ไขบทเรียน"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    {/* <button
                                      onClick={() => navigate(`/dashboard/teacher/lessons/${lesson.id}?classroomId=${classroomId}`)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                      title="เล่นบทเรียน"
                                    >
                                      <Play className="w-4 h-4" />
                                    </button> */}
                                    {/* Play Test Button */}
                                    {/* {(() => {
                                      const lessonTests = classroomData?.tests?.filter(t => t.lessonId === lesson.id || t.lessonId?.toString() === lesson.id?.toString()) || [];
                                      const firstTest = lessonTests[0];
                                      return firstTest ? (
                                        <button
                                          onClick={() => navigate(`/dashboard/student/tests/${firstTest.id || firstTest._id}`)}
                                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                          title="เล่นแบบทดสอบ"
                                        >
                                          <FileText className="w-4 h-4 text-purple-600" />
                                        </button>
                                      ) : null;
                                    })()} */}
                                    {/* Play Game Button */}
                                    {/* {(() => {
                                      const lessonGames = classroomData?.games?.filter(g => g.lessonId === lesson.id || g.lessonId?.toString() === lesson.id?.toString()) || [];
                                      const firstGame = lessonGames[0];
                                      return firstGame ? (
                                        <button
                                          onClick={() => navigate(`/dashboard/student/games/${firstGame.id || firstGame._id}`)}
                                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                                          title="เล่นเกม"
                                        >
                                          <Gamepad2 className="w-4 h-4 text-yellow-600" />
                                        </button>
                                      ) : null;
                                    })()} */}
                                    {/* <button
                                      onClick={() => handleViewLesson(lesson.id)}
                                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                      title="ดูรายละเอียดบทเรียน"
                                    >
                                      <Search className="w-4 h-4" />
                                    </button> */}
                                    <button
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                      title="ลบบทเรียน"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tests Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              แบบทดสอบทั้งหมด
            </h3>
          </div>
          <div className="p-6">
            {!classroomData?.tests || classroomData.tests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ยังไม่มีแบบทดสอบ</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classroomData.tests.map((test) => (
                  <div key={test.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex gap-1">
                        {/* <button
                          onClick={() => navigate(`/dashboard/student/tests/${test.id || test._id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="เล่นแบบทดสอบ"
                        >
                          <Play className="w-4 h-4 text-green-600" />
                        </button> */}
                        <button
                          onClick={() => handleViewTest(test.id)}
                          className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                          title="ดูรายละเอียดแบบทดสอบ"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTest(test.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="ลบแบบทดสอบ"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{test.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {test.type === 'PRE_TEST' ? 'ก่อนเรียน' : test.type === 'POST_TEST' ? 'หลังเรียน' : 'ทั่วไป'}
                      </span>
                      <span>{test.questions?.length || 0} ข้อ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Games Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-yellow-600" />
              เกมทั้งหมด
            </h3>
          </div>
          <div className="p-6">
            {!classroomData?.games || classroomData.games.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ยังไม่มีเกม</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classroomData.games.map((game) => (
                  <div key={game.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Gamepad2 className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex gap-1">
                        {/* <button
                          onClick={() => navigate(`/dashboard/student/games/${game.id || game._id}`)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="เล่นเกม"
                        >
                          <Play className="w-4 h-4 text-Yellow-600" />
                        </button> */}
                        <button
                          onClick={() => handleViewGame(game.id)}
                          className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                          title="ดูรายละเอียดเกม"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="ลบเกม"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">{game.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {game.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deleted Items Section */}
        {(deletedItems?.lessons?.length > 0 || deletedItems?.tests?.length > 0 || deletedItems?.games?.length > 0) && (
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-300 mb-8">
            <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <Archive className="w-5 h-5 text-gray-600" />
                รายการที่ถูกลบ (สามารถกู้คืนได้)
              </h3>
            </div>
            <div className="p-6">
              {/* Deleted Lessons */}
              {deletedItems?.lessons?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    บทเรียนที่ถูกลบ ({deletedItems.lessons.length})
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {deletedItems.lessons.map((lesson) => (
                      <div key={lesson.id || lesson._id} className="p-4 border border-gray-300 rounded-lg bg-white/50 opacity-75 hover:opacity-100 transition">
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-gray-600" />
                          </div>
                          <button
                            onClick={() => handleRestoreLesson(lesson.id || lesson._id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="กู้คืนบทเรียน"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-semibold text-gray-700 mb-1 line-clamp-1">{lesson.title}</h4>
                        <p className="text-xs text-gray-500">
                          ถูกลบเมื่อ: {lesson.deletedAt ? new Date(lesson.deletedAt).toLocaleDateString('th-TH') : '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deleted Tests */}
              {deletedItems?.tests?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    แบบทดสอบที่ถูกลบ ({deletedItems.tests.length})
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {deletedItems.tests.map((test) => (
                      <div key={test.id || test._id} className="p-4 border border-gray-300 rounded-lg bg-white/50 opacity-75 hover:opacity-100 transition">
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="w-6 h-6 text-gray-600" />
                          </div>
                          <button
                            onClick={() => handleRestoreTest(test.id || test._id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="กู้คืนแบบทดสอบ"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-semibold text-gray-700 mb-1 line-clamp-1">{test.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                          <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                            {test.type === 'PRE_TEST' ? 'ก่อนเรียน' : test.type === 'POST_TEST' ? 'หลังเรียน' : 'ทั่วไป'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {test.deletedAt ? new Date(test.deletedAt).toLocaleDateString('th-TH') : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deleted Games */}
              {deletedItems?.games?.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6 text-yellow-600" />
                    เกมที่ถูกลบ ({deletedItems.games.length})
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {deletedItems.games.map((game) => (
                      <div key={game.id || game._id} className="p-4 border border-gray-300 rounded-lg bg-white/50 opacity-75 hover:opacity-100 transition">
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Gamepad2 className="w-5 h-5 text-gray-600" />
                          </div>
                          <button
                            onClick={() => handleRestoreGame(game.id || game._id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="กู้คืนเกม"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-semibold text-gray-700 mb-1 line-clamp-1">{game.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
                          <span className="bg-gray-200 px-2 py-1 rounded text-xs">{game.type}</span>
                          <span className="text-xs text-gray-500">
                            {game.deletedAt ? new Date(game.deletedAt).toLocaleDateString('th-TH') : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Add Students Modal */}
      {/* Add Student To Class Modal */}
      {showAddStudentsModal && (
        <AddStudentToClassModal
          isOpen={showAddStudentsModal}
          onClose={() => setShowAddStudentsModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries(['classroom', classroomId]);
          }}
          classroomId={classroomId}
        />
      )}

      {/* Edit Lesson Modal */}
      {
        showEditLessonModal && (
          <EditLessonModal
            isOpen={showEditLessonModal}
            onClose={() => {
              setShowEditLessonModal(false);
              setSelectedLesson(null);
              setEditingLesson(false);
            }}
            onSubmit={editingLesson ? handleSaveLesson : null}
            initialData={selectedLesson}
            isEditing={editingLesson}
          />
        )
      }

      {/* View Lesson Details Modal */}
      {viewingLesson && lessonDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setViewingLesson(null);
            setLessonDetails(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">📚 รายละเอียดบทเรียน</h3>
              <button
                onClick={() => {
                  setViewingLesson(null);
                  setLessonDetails(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{lessonDetails.title}</h4>
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {lessonDetails.category === 'consonants' ? 'พยัญชนะ' : lessonDetails.category === 'vowels' ? 'สระ' : lessonDetails.category}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    บทที่ {lessonDetails.chapter || '1'}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {lessonDetails.content?.replace(/\[MEDIA\][\s\S]*?\[\/MEDIA\]/g, '[สื่อการสอนมัลติมีเดีย]') || 'ไม่มีเนื้อหา'}
                  </p>
                </div>
              </div>

              {/* Games Section */}
              {lessonDetails.games && lessonDetails.games.length > 0 && (
                <div>
                  <h5 className="text-md font-semibold text-gray-900 mb-3">🎮 เกม ({lessonDetails.games.length})</h5>
                  <div className="space-y-4">
                    {lessonDetails.games.map((game) => (
                      <div key={game.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-2 mb-3">
                          <h6 className="font-semibold text-gray-900">{game.title}</h6>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {game.type}
                          </span>
                        </div>
                        {game.settings && (
                          <div className="mt-3">
                            {/* MATCHING Game */}
                            {game.settings.pairs && Array.isArray(game.settings.pairs) && (
                              <div>
                                <h6 className="font-medium text-gray-900 mb-2 text-sm">🔗 คู่ที่ต้องจับคู่ ({game.settings.pairs.length} คู่)</h6>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {game.settings.pairs.map((pair, idx) => (
                                    <div key={pair.id || idx} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                      <div className="flex flex-col items-center gap-1">
                                        {pair.image && (
                                          <img
                                            src={pair.image}
                                            alt={pair.label || pair.word}
                                            className="w-12 h-12 object-contain rounded"
                                            onError={(e) => e.target.style.display = 'none'}
                                          />
                                        )}
                                        <p className="text-xs font-medium text-gray-900 text-center">
                                          {pair.label || pair.word}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* DRAG_DROP Game */}
                            {game.settings.items && game.settings.targets && (
                              <div className="space-y-3">
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-2 text-sm">📦 คำศัพท์ ({game.settings.items.length} คำ)</h6>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {game.settings.items.map((item, idx) => (
                                      <div key={item.id || idx} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                                        <p className="text-xs font-medium text-gray-900">{item.text || item.word}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h6 className="font-medium text-gray-900 mb-2 text-sm">🎯 กลุ่มเป้าหมาย ({game.settings.targets.length} กลุ่ม)</h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {game.settings.targets.map((target, idx) => (
                                      <div key={target.id || idx} className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                        <div className="flex items-center gap-2">
                                          {target.image && (
                                            <img
                                              src={target.image}
                                              alt={target.label || `กลุ่ม ${idx + 1}`}
                                              className="w-12 h-12 object-contain rounded"
                                              onError={(e) => e.target.style.display = 'none'}
                                            />
                                          )}
                                          <p className="text-xs font-medium text-gray-900">
                                            {target.label || `กลุ่ม ${idx + 1}`}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Fallback for other game types */}
                            {!game.settings.pairs && !game.settings.items && (
                              <pre className="bg-gray-50 rounded p-2 overflow-x-auto text-xs">
                                {JSON.stringify(game.settings, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* View Test Details Modal */}
      {viewingTest && testDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setViewingTest(null);
            setTestDetails(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">📝 รายละเอียดแบบทดสอบ</h3>
              <button
                onClick={() => {
                  setViewingTest(null);
                  setTestDetails(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{testDetails.title}</h4>
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {testDetails.type === 'PRE_TEST' ? 'ก่อนเรียน (Pretest)' : testDetails.type === 'POST_TEST' ? 'หลังเรียน (Posttest)' : 'ทั่วไป'}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {testDetails.questions?.length || 0} ข้อ
                  </span>
                  {testDetails.timeLimit && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      ⏱️ {testDetails.timeLimit} นาที
                    </span>
                  )}
                </div>
              </div>

              {testDetails.questions && testDetails.questions.length > 0 ? (
                <div className="space-y-4">
                  {testDetails.questions.map((q, idx) => (
                    <div key={q.id || idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <h5 className="font-semibold text-gray-900">
                          ข้อ {idx + 1}: {q.question}
                        </h5>
                        {q.isMultipleChoice && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            เลือกหลายคำตอบ
                          </span>
                        )}
                        {q.isMatching && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                            จับคู่
                          </span>
                        )}
                      </div>
                      {q.imageUrl && (
                        <div className="mb-3">
                          <img src={q.imageUrl} alt="Question" className="max-w-md rounded border border-gray-200" />
                        </div>
                      )}
                      {q.imageOptions && q.imageOptions.length > 0 && (
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          {q.imageOptions.map((imgUrl, imgIdx) => (
                            <img key={imgIdx} src={imgUrl} alt={`Option ${imgIdx + 1}`} className="max-w-xs rounded border border-gray-200" />
                          ))}
                        </div>
                      )}
                      {q.options && (
                        <div className="space-y-2 mb-3">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.isMultipleChoice
                              ? Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIdx)
                              : q.correctAnswer === optIdx;
                            return (
                              <div key={optIdx} className={`flex items-center gap-2 p-2 rounded ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'
                                }`}>
                                <span className={`px-2 py-1 rounded text-sm ${isCorrect ? 'bg-green-100 text-green-800 font-semibold' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                  {optIdx + 1}. {opt}
                                </span>
                                {isCorrect && <Check className="w-4 h-4 text-green-600" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {q.matchingPairs && q.matchingPairs.length > 0 && (
                        <div className="mb-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">คู่ที่ถูกต้อง:</p>
                          {q.matchingPairs.map((pair, pairIdx) => (
                            <div key={pairIdx} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                              <div className="flex items-center gap-2">
                                {pair.leftImage && (
                                  <img src={pair.leftImage} alt={pair.left} className="w-12 h-12 object-contain" />
                                )}
                                <span className="font-semibold text-gray-900">{pair.left}</span>
                              </div>
                              <span className="text-gray-400">→</span>
                              <div className="flex items-center gap-2">
                                {pair.rightImage && (
                                  <img src={pair.rightImage} alt={pair.right} className="w-12 h-12 object-contain" />
                                )}
                                <span className="font-semibold text-gray-900">{pair.right}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-900">
                            <span className="font-semibold">💡 คำอธิบาย:</span> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  ยังไม่มีคำถามในแบบทดสอบนี้
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* View Game Details Modal */}
      {viewingGame && gameDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setViewingGame(null);
            setGameDetails(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">🎮 รายละเอียดเกม</h3>
              <button
                onClick={() => {
                  setViewingGame(null);
                  setGameDetails(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{gameDetails.title}</h4>
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    {gameDetails.type}
                  </span>
                </div>
              </div>
              {gameDetails.settings && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">⚙️ การตั้งค่าเกม</h5>
                  {/* MATCHING Game */}
                  {gameDetails.settings.pairs && Array.isArray(gameDetails.settings.pairs) && (
                    <div>
                      <h6 className="font-medium text-gray-900 mb-3">🔗 คู่ที่ต้องจับคู่ ({gameDetails.settings.pairs.length} คู่)</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {gameDetails.settings.pairs.map((pair, idx) => (
                          <div key={pair.id || idx} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex flex-col items-center gap-2">
                              {pair.image && (
                                <img
                                  src={pair.image}
                                  alt={pair.label || pair.word}
                                  className="w-20 h-20 object-contain rounded"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              )}
                              <p className="text-sm font-medium text-gray-900 text-center">
                                {pair.label || pair.word}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* DRAG_DROP Game */}
                  {gameDetails.settings.items && gameDetails.settings.targets && (
                    <div className="space-y-4">
                      <div>
                        <h6 className="font-medium text-gray-900 mb-2">📦 คำศัพท์ ({gameDetails.settings.items.length} คำ)</h6>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {gameDetails.settings.items.map((item, idx) => (
                            <div key={item.id || idx} className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-gray-900">{item.text || item.word}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h6 className="font-medium text-gray-900 mb-2">🎯 กลุ่มเป้าหมาย ({gameDetails.settings.targets.length} กลุ่ม)</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {gameDetails.settings.targets.map((target, idx) => (
                            <div key={target.id || idx} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                {target.image && (
                                  <img
                                    src={target.image}
                                    alt={target.label || `กลุ่ม ${idx + 1}`}
                                    className="w-16 h-16 object-contain rounded"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {target.label || `กลุ่ม ${idx + 1}`}
                                  </p>
                                  {target.text && (
                                    <p className="text-xs text-gray-600 mt-1">{target.text}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Fallback for other game types */}
                  {!gameDetails.settings.pairs && !gameDetails.settings.items && (
                    <pre className="text-sm text-gray-700 overflow-x-auto">
                      {JSON.stringify(gameDetails.settings, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* View Student Progress Modal */}
      {viewingStudent && studentProgress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setViewingStudent(null);
            setStudentProgress(null);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold"> ความคืบหน้าและคะแนน</h3>
                <p className="text-sm text-blue-100 mt-1">{studentProgress.student.name} ({studentProgress.student.studentCode})</p>
              </div>
              <button
                onClick={() => {
                  setViewingStudent(null);
                  setStudentProgress(null);
                }}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6">
              {isLoadingProgress ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">บทเรียนที่เรียนจบ</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {studentProgress.statistics.completedLessons}/{studentProgress.statistics.totalLessons}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">อัตราความสำเร็จ</p>
                          <p className="text-2xl font-bold text-green-600">
                            {studentProgress.statistics.completionRate}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">คะแนนเฉลี่ยแบบทดสอบ</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {studentProgress.statistics.averageTestScore}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-4 border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                          <Gamepad2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">คะแนนเฉลี่ยเกม</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {studentProgress.statistics.averageGameScore}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Progress */}
                  <div className="bg-white rounded-xl border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        ความคืบหน้ารายบทเรียน ({studentProgress.lessons.length} บท)
                      </h4>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        {studentProgress.lessons.map((lesson, idx) => {
                          const progress = lesson.progress;
                          return (
                            <div key={lesson.id || lesson._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${progress?.isCompleted ? 'bg-green-100' : progress ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                    {progress?.isCompleted ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : progress ? (
                                      <Clock className="w-5 h-5 text-blue-600" />
                                    ) : (
                                      <BookOpen className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-gray-900">{lesson.title}</h5>
                                    <p className="text-xs text-gray-500">บทที่ {lesson.orderIndex || idx + 1}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  {progress?.hasPassedPreTest && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">ผ่าน Pretest</span>
                                  )}
                                  {progress?.hasPassedPostTest && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">ผ่าน Posttest</span>
                                  )}
                                  {progress?.isCompleted && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">เรียนจบ</span>
                                  )}
                                  {!progress && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">ยังไม่เริ่มเรียน</span>
                                  )}
                                </div>
                              </div>
                              {progress?.completedAt && (
                                <p className="text-xs text-gray-500 mt-2">
                                  เสร็จเมื่อ: {new Date(progress.completedAt).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Test Attempts */}
                  <div className="bg-white rounded-xl border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-purple-600" />
                        ผลการทำแบบทดสอบ ({Array.isArray(studentProgress.testAttempts) ? studentProgress.testAttempts.length : Object.keys(studentProgress.testAttempts || {}).length} แบบทดสอบ)
                      </h4>
                    </div>
                    <div className="p-6">
                      {(!studentProgress.testAttempts || (Array.isArray(studentProgress.testAttempts) ? studentProgress.testAttempts.length === 0 : Object.keys(studentProgress.testAttempts).length === 0)) ? (
                        <div className="text-center py-8 text-gray-500">ยังไม่ได้ทำแบบทดสอบ</div>
                      ) : (
                        <div className="space-y-4">
                          {(Array.isArray(studentProgress.testAttempts) ? studentProgress.testAttempts : Object.values(studentProgress.testAttempts)).map((testData, idx) => {
                            const test = testData.test || testData;
                            const attempts = testData.attempts || [];
                            const bestAttempt = attempts.length > 0 ? attempts.reduce((best, current) =>
                              (current.score || 0) > (best?.score || 0) ? current : best, attempts[0]
                            ) : null;
                            const latestAttempt = attempts.length > 0 ? attempts[0] : null;

                            if (!test) return null;

                            return (
                              <div key={test._id || test.id || idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-gray-900">{test.title}</h5>
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                      <span className={`px-2 py-1 rounded text-xs ${test.type === 'PRE_TEST' ? 'bg-blue-100 text-blue-700' :
                                        test.type === 'POST_TEST' ? 'bg-green-100 text-green-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                        {test.type === 'PRE_TEST' ? 'ก่อนเรียน' : test.type === 'POST_TEST' ? 'หลังเรียน' : 'ทั่วไป'}
                                      </span>
                                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                        ทำทั้งหมด {attempts.length} ครั้ง
                                      </span>
                                    </div>
                                  </div>
                                  {bestAttempt && (
                                    <div className="text-right ml-4">
                                      <p className={`text-2xl font-bold ${bestAttempt.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                        {bestAttempt.score || 0}%
                                      </p>
                                      <p className="text-xs text-gray-500">คะแนนสูงสุด</p>
                                    </div>
                                  )}
                                </div>
                                {latestAttempt && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-sm">
                                      <div>
                                        <p className="text-gray-600 mb-1">ครั้งล่าสุด:</p>
                                        <p className={`font-semibold text-lg ${latestAttempt.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                          {latestAttempt.score || 0}% {latestAttempt.isPassed ? '✅ ผ่าน' : '❌ ไม่ผ่าน'}
                                        </p>
                                      </div>
                                      <div className="text-right text-xs text-gray-500">
                                        <p className="mb-1">
                                          {latestAttempt.completedAt ? new Date(latestAttempt.completedAt).toLocaleDateString('th-TH', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          }) : '-'}
                                        </p>
                                        {latestAttempt.timeSpent && (
                                          <p className="text-gray-400">⏱️ {Math.round(latestAttempt.timeSpent / 60)} นาที</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {attempts.length > 1 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <details className="cursor-pointer">
                                      <summary className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                                        📋 ดูประวัติการทำทั้งหมด ({attempts.length} ครั้ง)
                                      </summary>
                                      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                                        {attempts.map((attempt, attemptIdx) => (
                                          <div key={attempt._id || attempt.id || attemptIdx} className={`flex items-center justify-between p-3 rounded-lg border ${attempt.isPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                            <div className="flex items-center gap-3">
                                              <span className={`font-semibold ${attempt.isPassed ? 'text-green-700' : 'text-red-700'}`}>
                                                ครั้งที่ {attempt.attemptNumber || attemptIdx + 1}
                                              </span>
                                              <span className={`text-lg font-bold ${attempt.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                                {attempt.score || 0}%
                                              </span>
                                              {attempt.isPassed && <CheckCircle className="w-4 h-4 text-green-600" />}
                                            </div>
                                            <div className="text-right text-xs text-gray-500">
                                              <p>{attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString('th-TH') : '-'}</p>
                                              {attempt.timeSpent && (
                                                <p className="text-gray-400">{Math.round(attempt.timeSpent / 60)} นาที</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </details>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Game Attempts */}
                  {studentProgress.gameAttempts && studentProgress.gameAttempts.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Gamepad2 className="w-5 h-5 text-yellow-600" />
                          ผลการเล่นเกม ({studentProgress.gameAttempts.length} เกม)
                        </h4>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          {studentProgress.gameAttempts.slice(0, 10).map((attempt, idx) => {
                            const game = attempt.gameId;
                            return (
                              <div key={attempt._id || attempt.id || idx} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold text-gray-900">{game?.title || 'เกมไม่ทราบชื่อ'}</h5>
                                    <p className="text-xs text-gray-500 mt-1">ครั้งที่ {attempt.attemptNumber || idx + 1}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-bold text-yellow-600">{attempt.score || 0}%</p>
                                    {attempt.completedAt && (
                                      <p className="text-xs text-gray-500">
                                        {new Date(attempt.completedAt).toLocaleDateString('th-TH')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {studentProgress.gameAttempts.length > 10 && (
                            <p className="text-center text-sm text-gray-500 py-2">
                              และอีก {studentProgress.gameAttempts.length - 10} เกม...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Create Lesson Modal */}
      {showCreateLessonModal && (
        <CreateLessonModal
          onClose={() => setShowCreateLessonModal(false)}
          onSubmit={(lessonData) => createLessonMutation.mutate(lessonData)}
          isLoading={createLessonMutation.isLoading}
          nextOrder={(() => {
            const lessons = classroomData?.lessons || [];
            if (lessons.length === 0) return 1;
            const maxOrder = Math.max(...lessons.map(l => l.orderIndex || 0));
            return maxOrder + 1;
          })()}
        />
      )}

      <AnimatePresence>
        {showQuickCreate && (
          <QuickCreateLessonModal
            onClose={() => setShowQuickCreate(false)}
            isLoading={createLessonMutation.isLoading}
            onSubmit={(title, imageUrl) => {
              const newLessonOrder = classroomData?.lessons?.length
                ? Math.max(...classroomData.lessons.map(l => l.orderIndex || 0)) + 1
                : 1;
              const payload = {
                title: title,
                category: 'custom',
                content: `[MEDIA]\n{"items":[]}\n[/MEDIA]`,
                order: newLessonOrder,
                orderIndex: newLessonOrder
              };
              if (imageUrl) payload.imageUrl = imageUrl;
              createLessonMutation.mutate(payload);
              setShowQuickCreate(false);
            }}
          />
        )}
      </AnimatePresence>
    </div >
  );
};

export default ClassroomPage;
