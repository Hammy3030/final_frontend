import { useState, useRef, useEffect } from 'react';
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
  Plus,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AddStudentToClassModal from '../../components/teacher/AddStudentToClassModal';
import CreateLessonModal from '../../components/teacher/CreateLessonModal';
import QuickCreateLessonModal from '../../components/teacher/QuickCreateLessonModal';
import PdfImportPreviewModal from '../../components/teacher/PdfImportPreviewModal';
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
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [pdfPreviewData, setPdfPreviewData] = useState([]);
  const [isConfirmingPdf, setIsConfirmingPdf] = useState(false);
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

  // Student filters
  const [studentSearch, setStudentSearch] = useState('');
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');
  const [studentGender, setStudentGender] = useState('all');
  const [studentProgressFilter, setStudentProgressFilter] = useState('all');
  const [studentTestStatus, setStudentTestStatus] = useState('all');
  const [studentScoreLevel, setStudentScoreLevel] = useState('all');
  const [studentGameStatus, setStudentGameStatus] = useState('all');
  const [studentActivityStatus, setStudentActivityStatus] = useState('all');
  const [studentSort, setStudentSort] = useState('name-asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Test filters
  const [testSearch, setTestSearch] = useState('');
  const [testType, setTestType] = useState('all');
  const [testStatus, setTestStatus] = useState('all');
  const [testSort, setTestSort] = useState('newest');

  // Game filters
  const [gameSearch, setGameSearch] = useState('');
  const [gameType, setGameType] = useState('all');
  const [gameStatus, setGameStatus] = useState('all');
  const [gameSort, setGameSort] = useState('newest');

  // Debounced search terms
  const [debouncedTestSearch, setDebouncedTestSearch] = useState('');
  const [debouncedGameSearch, setDebouncedGameSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTestSearch(testSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [testSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGameSearch(gameSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [gameSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStudentSearch(studentSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [studentSearch]);

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

  // Fetch classroom students with filters
  const { data: studentsResult, isLoading: isLoadingStudents } = useQuery(
    ['classroom-students', classroomId, debouncedStudentSearch, studentGender, studentProgressFilter, studentTestStatus, studentScoreLevel, studentGameStatus, studentActivityStatus, studentSort],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/teacher/classrooms/${classroomId}/students`),
        {
          params: {
            search: debouncedStudentSearch,
            gender: studentGender,
            progress: studentProgressFilter,
            testStatus: studentTestStatus,
            scoreLevel: studentScoreLevel,
            gameStatus: studentGameStatus,
            activityStatus: studentActivityStatus,
            sort: studentSort
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.data;
    },
    { enabled: !!classroomId }
  );

  // Fetch classroom tests
  const { data: testsData, isLoading: isLoadingTests } = useQuery(
    ['classroom-tests', classroomId, debouncedTestSearch, testType, testStatus, testSort],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/teacher/classrooms/${classroomId}/tests`),
        {
          params: { search: debouncedTestSearch, type: testType, status: testStatus, sort: testSort },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.data.tests;
    },
    { enabled: !!classroomId }
  );

  // Fetch classroom games
  const { data: gamesData, isLoading: isLoadingGames } = useQuery(
    ['classroom-games', classroomId, debouncedGameSearch, gameType, gameStatus, gameSort],
    async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        getApiUrl(`/teacher/classrooms/${classroomId}/games`),
        {
          params: { search: debouncedGameSearch, type: gameType, status: gameStatus, sort: gameSort },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.data.games;
    },
    { enabled: !!classroomId }
  );

  const fileInputRef = useRef(null);

  // Import PDF mutation
  const importPdfMutation = useMutation(
    async (file) => {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        getApiUrl(`/teacher/classrooms/${classroomId}/students/import-pdf`),
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        if (data.data?.preview) {
          setPdfPreviewData(data.data.preview);
          setShowPdfPreviewModal(true);
        } else {
          toast.success(data.message || 'วิเคราะห์ไฟล์ PDF สำเร็จ');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการนำเข้า PDF');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  );

  const handlePdfConfirm = async (validStudents) => {
    try {
      setIsConfirmingPdf(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/teacher/classrooms/${classroomId}/students`),
        { students: validStudents },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(`นำเข้านักเรียน ${validStudents.length} คนสำเร็จ`);
        setShowPdfPreviewModal(false);
        // Invalidate and refetch immediately
        queryClient.invalidateQueries(['classroom', classroomId]);
        queryClient.invalidateQueries(['classroom-students', classroomId]);
        queryClient.refetchQueries(['classroom-students', classroomId]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsConfirmingPdf(false);
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
      return;
    }
    toast.loading('กำลังประมวลผล PDF ผ่าน AI...');
    importPdfMutation.mutate(file, {
      onSettled: () => toast.dismiss()
    });
  };

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
        // Invalidate and refetch immediately
        queryClient.invalidateQueries(['classroom', classroomId]);
        queryClient.invalidateQueries(['classroom-students', classroomId]);
        queryClient.refetchQueries(['classroom-students', classroomId]);
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
        // Invalidate and refetch immediately
        queryClient.invalidateQueries(['classroom', classroomId]);
        queryClient.invalidateQueries(['classroom-students', classroomId]);
        queryClient.refetchQueries(['classroom-students', classroomId]);
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
    if (!studentId || studentId === 'undefined') {
      console.warn('Cannot fetch progress: studentId is undefined');
      return;
    }
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
    return studentsResult?.students || [];
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
    setStudentSearch('');
    setStudentGender('all');
    setStudentProgressFilter('all');
    setStudentTestStatus('all');
    setStudentScoreLevel('all');
    setStudentGameStatus('all');
    setStudentActivityStatus('all');
    setStudentSort('name-asc');
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

  // ฟังก์ชันดึงนักเรียนคนแรกที่ถูกเพิ่มเข้ามา
  const getFirstAddedStudent = () => {
    if (!classroomData?.students || classroomData.students.length === 0) return null;

    // สำเนา array แล้วเรียงตามวันที่สร้าง (createdAt) จากเก่าไปใหม่ (น้อยไปมาก)
    const sorted = [...classroomData.students].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return sorted[0]; // คนแรกสุด
  };

  const firstStudent = getFirstAddedStudent();



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
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePdfUpload}
                  accept="application/pdf"
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importPdfMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {importPdfMutation.isLoading ? 'กำลังนำเข้า...' : 'นำเข้าจาก PDF'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddStudentsModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  สร้างบัญชี
                </motion.button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px] sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="ค้นหาชื่อหรือรหัสนักเรียน..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                    />
                  </div>

                  {/* Gender Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:inline">เพศ:</span>
                    <select
                      value={studentGender}
                      onChange={(e) => {
                        setStudentGender(e.target.value);
                        handleFilterChange();
                      }}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-gray-300 transition-all"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="male">ชาย</option>
                      <option value="female">หญิง</option>
                    </select>
                  </div>

                  {/* Advanced Filter Toggle */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium ${showAdvancedFilters
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">ตัวกรองขั้นสูง</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Clear Filters */}
                  {(studentSearch || studentGender !== 'all' || studentProgressFilter !== 'all' || studentTestStatus !== 'all' || studentScoreLevel !== 'all' || studentGameStatus !== 'all' || studentActivityStatus !== 'all') && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-600 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition"
                    >
                      ล้างค่าทั้งหมด
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Items Per Page */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">แสดง:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <select
                      value={studentSort}
                      onChange={(e) => {
                        setStudentSort(e.target.value);
                        handleFilterChange();
                      }}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer hover:border-gray-300 transition-all"
                    >
                      <option value="name-asc">ชื่อ (ก-ฮ)</option>
                      <option value="name-desc">ชื่อ (ฮ-ก)</option>
                      <option value="studentId-asc">รหัสนักเรียน (น้อย-มาก)</option>
                      <option value="studentId-desc">รหัสนักเรียน (มาก-น้อย)</option>
                      <option value="progress-desc">ความคืบหน้า (มาก-น้อย)</option>
                      <option value="progress-asc">ความคืบหน้า (น้อย-มาก)</option>
                      <option value="test-desc">คะแนนสอบเฉลี่ย (มาก-น้อย)</option>
                      <option value="game-desc">คะแนนเกมเฉลี่ย (มาก-น้อย)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Advanced Filters (Toggleable) */}
              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-6">
                      {/* Test Status */}
                      <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">สถานะแบบทดสอบ</label>
                        <select
                          value={studentTestStatus}
                          onChange={(e) => {
                            setStudentTestStatus(e.target.value);
                            handleFilterChange();
                          }}
                          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition-all"
                        >
                          <option value="all">ทั้งหมด</option>
                          <option value="pre-done">ทำ Pre-test แล้ว</option>
                          <option value="post-done">ทำ Post-test แล้ว</option>
                          <option value="none">ยังไม่ได้ทำ</option>
                        </select>
                      </div>

                      {/* Score Level */}
                      <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ระดับคะแนนเฉลี่ย</label>
                        <select
                          value={studentScoreLevel}
                          onChange={(e) => {
                            setStudentScoreLevel(e.target.value);
                            handleFilterChange();
                          }}
                          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition-all"
                        >
                          <option value="all">ทั้งหมด</option>
                          <option value="excellent">ดีเยี่ยม (80% ขึ้นไป)</option>
                          <option value="passed">ผ่านเกณฑ์ (50-79%)</option>
                          <option value="care">ควรพัฒนา (ต่ำกว่า 50%)</option>
                        </select>
                      </div>

                      {/* Game Status */}
                      <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">สถานะการเล่นเกม</label>
                        <select
                          value={studentGameStatus}
                          onChange={(e) => {
                            setStudentGameStatus(e.target.value);
                            handleFilterChange();
                          }}
                          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition-all"
                        >
                          <option value="all">ทั้งหมด</option>
                          <option value="played">เคยเล่นแล้ว</option>
                          <option value="not-played">ยังไม่เคยเล่น</option>
                        </select>
                      </div>

                      {/* Progress Filter */}
                      <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ความคืบหน้า</label>
                        <select
                          value={studentProgressFilter}
                          onChange={(e) => {
                            setStudentProgressFilter(e.target.value);
                            handleFilterChange();
                          }}
                          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition-all"
                        >
                          <option value="all">ทั้งหมด</option>
                          <option value="completed">เรียนจบแล้ว (100%)</option>
                          <option value="learning">กำลังเรียน (1-99%)</option>
                          <option value="not-started">ยังไม่เริ่มเรียน (0%)</option>
                        </select>
                      </div>

                      {/* Activity Status */}
                      <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ความเคลื่อนไหว</label>
                        <select
                          value={studentActivityStatus}
                          onChange={(e) => {
                            setStudentActivityStatus(e.target.value);
                            handleFilterChange();
                          }}
                          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-white transition-all"
                        >
                          <option value="all">ทั้งหมด</option>
                          <option value="active">เข้าเรียนล่าสุดใน 7 วัน</option>
                          <option value="inactive">ไม่ได้เข้าเรียนเกิน 7 วัน</option>
                          <option value="never">ไม่เคยเข้าเรียนเลย</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-6">
            {isLoadingStudents ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 text-sm animate-pulse font-medium">กำลังค้นหารายชื่อนักเรียน...</p>
              </div>
            ) : studentsResult?.totalCount === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-center py-8 text-gray-500">
                  ยังไม่มีนักเรียนในห้องเรียนนี้
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddStudentsModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  เพิ่มนักเรียน
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
                      key={student.id || student._id}
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
                            onClick={() => handleViewStudentProgress(student.id || student._id)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition duration-200"
                            title="ดูความคืบหน้าและคะแนน"
                          >
                            <BarChart3 size={16} />
                          </button>
                          <button
                            onClick={() => copyToClipboard(student.qrCode || student.studentCode, `code-${student.id || student._id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                            title="คัดลอกรหัสนักเรียน"
                          >
                            {copiedCode === `code-${student.id || student._id}` ? (
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
            {/* Tests Toolbar */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  placeholder="ค้นหาชื่อแบบทดสอบ..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-200 rounded-xl shadow-sm">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="bg-transparent text-sm font-medium focus:outline-none"
                  >
                    <option value="all">ทุกประเภท</option>
                    <option value="pre_test">ก่อนเรียน (Pre-test)</option>
                    <option value="post_test">หลังเรียน (Post-test)</option>
                    <option value="normal">ทั่วไป</option>
                  </select>
                </div>



                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-200 rounded-xl shadow-sm ml-auto">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <select
                    value={testSort}
                    onChange={(e) => setTestSort(e.target.value)}
                    className="bg-transparent text-sm font-medium focus:outline-none"
                  >
                    <option value="newest">ใหม่ - เก่า</option>
                    <option value="oldest">เก่า - ใหม่</option>
                    <option value="name">เรียงตามชื่อ (ก-ฮ)</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoadingTests ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : !testsData || testsData.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">ไม่พบแบบทดสอบที่ตรงกับเงื่อนไข</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {testsData.map((test) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={test.id || test._id}
                    className="p-4 border border-gray-100 rounded-2xl hover:shadow-lg hover:border-purple-200 transition-all bg-white group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${test.isActive ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-400'}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewTest(test.id || test._id)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTest(test.id || test._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
                      {test.title}
                    </h4>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <div className="flex gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${test.type === 'PRE_TEST' ? 'bg-orange-50 text-orange-600' :
                          test.type === 'POST_TEST' ? 'bg-green-50 text-green-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                          {test.type === 'PRE_TEST' ? 'ก่อนเรียน' : test.type === 'POST_TEST' ? 'หลังเรียน' : 'ทั่วไป'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {test.questions?.length || 0} ข้อ
                      </span>
                    </div>
                  </motion.div>
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
            {/* Games Toolbar */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={gameSearch}
                  onChange={(e) => setGameSearch(e.target.value)}
                  placeholder="ค้นหาชื่อเกม..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-200 rounded-xl shadow-sm">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    className="bg-transparent text-sm font-medium focus:outline-none"
                  >
                    <option value="all">ทุกประเภท</option>
                    <option value="matching">จับคู่ (Matching)</option>
                    <option value="linking">โยงเส้น (Linking)</option>
                    <option value="drag_drop">จัดหมวดหมู่ (Drag & Drop)</option>
                  </select>
                </div>



                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-200 rounded-xl shadow-sm ml-auto">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <select
                    value={gameSort}
                    onChange={(e) => setGameSort(e.target.value)}
                    className="bg-transparent text-sm font-medium focus:outline-none"
                  >
                    <option value="newest">ใหม่ - เก่า</option>
                    <option value="oldest">เก่า - ใหม่</option>
                    <option value="name">เรียงตามชื่อ (ก-ฮ)</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoadingGames ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              </div>
            ) : !gamesData || gamesData.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Gamepad2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">ไม่พบเกมที่ตรงกับเงื่อนไข</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {gamesData.map((game) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={game.id || game._id}
                    className="p-4 border border-gray-100 rounded-2xl hover:shadow-lg hover:border-yellow-200 transition-all bg-white group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${game.isActive ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'}`}>
                        <Gamepad2 className="w-6 h-6" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewGame(game.id || game._id)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game.id || game._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-yellow-600 transition-colors">
                      {game.title}
                    </h4>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <div className="flex gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${game.type === 'MATCHING' ? 'bg-blue-50 text-blue-600' :
                          game.type === 'LINKING' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>
                          {game.type === 'MATCHING' ? 'จับคู่' : game.type === 'LINKING' ? 'โยงเส้น' : 'จัดหมวดหมู่'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
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

      {/* Modals */}
      <PdfImportPreviewModal
        isOpen={showPdfPreviewModal}
        onClose={() => setShowPdfPreviewModal(false)}
        previewData={pdfPreviewData}
        onConfirm={handlePdfConfirm}
        isSubmitting={isConfirmingPdf}
      />

      {showAddStudentsModal && (
        <AddStudentToClassModal
          isOpen={showAddStudentsModal}
          onClose={() => setShowAddStudentsModal(false)}
          onSuccess={() => {
            // Invalidate and refetch immediately
            queryClient.invalidateQueries(['classroom', classroomId]);
            queryClient.invalidateQueries(['classroom-students', classroomId]);
            queryClient.refetchQueries(['classroom-students', classroomId]);
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
                      {q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.isMultipleChoice
                              ? Array.isArray(q.correctAnswer) && q.correctAnswer.includes(optIdx)
                              : q.correctAnswer === optIdx;
                            const imgUrl = q.imageOptions && q.imageOptions[optIdx];

                            return (
                              <div key={optIdx} className={`relative flex flex-col items-center justify-center p-4 rounded-xl transition-all ${isCorrect ? 'bg-green-50 border-2 border-green-500 shadow-sm' : 'bg-white border-2 border-gray-100 hover:border-indigo-100'}`}>
                                {/* Check icon for correct answer */}
                                {isCorrect && (
                                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm z-10">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}

                                {/* Option Number Badge */}
                                <div className={`absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-lg font-black text-sm ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {['ก', 'ข', 'ค', 'ง'][optIdx] || optIdx + 1}
                                </div>

                                <div className="mt-4 flex flex-col items-center gap-3 w-full">
                                  {imgUrl ? (
                                    <>
                                      <img src={imgUrl} alt={`Option ${optIdx + 1}`} className="max-h-32 object-contain rounded-lg shadow-sm" />
                                      {opt && (
                                        <span className={`text-base font-bold text-center px-2 ${isCorrect ? 'text-green-800' : 'text-gray-700'}`}>
                                          {opt}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className={`text-lg font-bold text-center py-4 px-2 ${isCorrect ? 'text-green-800' : 'text-gray-700'}`}>
                                      {opt}
                                    </span>
                                  )}
                                </div>
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
          initialTitle={(() => {
            const lessons = classroomData?.lessons || [];
            if (lessons.length === 0) return 'บทที่ 1 ';

            const extractNum = (str) => {
              const m = str.match(/บทที่\s*(\d+)/);
              return m ? parseInt(m[1], 10) : 0;
            };
            const maxNum = Math.max(...lessons.map(l => extractNum(l.title)));
            return `บทที่ ${maxNum + 1} `;
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
            initialTitle={(() => {
              const lessons = classroomData?.lessons || [];
              if (lessons.length === 0) return 'บทที่ 1 ';

              const extractNum = (str) => {
                const m = str.match(/บทที่\s*(\d+)/);
                return m ? parseInt(m[1], 10) : 0;
              };
              const maxNum = Math.max(...lessons.map(l => extractNum(l.title)));
              return `บทที่ ${maxNum + 1} `;
            })()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassroomPage;

