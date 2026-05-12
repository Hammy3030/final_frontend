import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Volume2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  Clock,
  BookOpen,
  Play,
  Loader,
  XCircle,
  Eraser,
  Edit2,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  FileText,
  Gamepad2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { speakText, stopSpeech } from '../../utils/speechHelper';
import { getApiUrl } from '../../utils/apiConfig';
import HandwritingCanvas from '../../components/HandwritingCanvas';
import { useAuth } from '../../contexts/AuthContext';
import { getWritingGuide } from '../../utils/writingGuide';
import AudioButton from '../../components/AudioButton';
import MilestonePopup from '../../components/MilestonePopup';
import AddVocabImageModal from '../../components/teacher/AddVocabImageModal';
import CreateGameModal from '../../components/teacher/CreateGameModal';
import CreateTestModal from '../../components/teacher/CreateTestModal';

const LessonDetailPage = () => {
  const unlockRedirectRef = useRef(false);
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const classroomId = searchParams.get('classroomId');

  const [lesson, setLesson] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activityAnswers, setActivityAnswers] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [preTestStatus, setPreTestStatus] = useState(null);
  const [postTestStatus, setPostTestStatus] = useState(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [vocabWordIndex, setVocabWordIndex] = useState(0);
  const [writingWordIndex, setWritingWordIndex] = useState(0);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneData, setMilestoneData] = useState({ title: '', subtitle: '', emoji: '' });
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [showCreateGameModal, setShowCreateGameModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isFetchingLesson, setIsFetchingLesson] = useState(false);

  // Check unlock conditions before accessing lesson
  useEffect(() => {
    const checkUnlockConditions = async () => {
      if (isTeacher || !lessonId) {
        setIsLoadingStatus(false);
        return;
      }

      try {
        const preTestRes = await axios.get(
          getApiUrl(`/student/lessons/${lessonId}/pre-test-status`),
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { _t: Date.now() }
          }
        );

        if (preTestRes.data?.success) {
          const status = preTestRes.data.data;
          setPreTestStatus(status);

          // 1. เช็ก Pre-test: ใส่ id เพื่อไม่ให้ Toast ซ้อน
          if (status.hasPreTest && !status.isPreTestCompleted) {
            setIsRedirecting(true);
            unlockRedirectRef.current = true;
            toast.error('ต้องทำแบบทดสอบก่อนเรียนก่อน', {
              id: 'pre-test-error', // บังคับให้แสดงแค่อันเดียว
              duration: 3000,
              icon: '📝'
            });
            return navigate(status.preTestId ? `/dashboard/student/tests/${status.preTestId}` : '/dashboard/student');
          }

          // 2. เช็กการปลดล็อก: ใส่ id เพื่อไม่ให้ Toast ซ้อน
          if (status.canAccessLesson === false) {
            setIsRedirecting(true);
            unlockRedirectRef.current = true;
            toast.error('บทเรียนนี้ยังไม่ปลดล็อก', {
              id: 'unlock-error', // บังคับให้แสดงแค่อันเดียว
              duration: 3000,
              icon: '🔒'
            });
            return navigate('/dashboard/student/lessons');
          }
        }

        // 3. เช็ก Post-test status (ถ้าผ่านเงื่อนไขบนมาได้)
        const postTestRes = await axios.get(
          getApiUrl(`/student/lessons/${lessonId}/post-test-status`),
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(() => null); // ป้องกัน Error จากตัวนี้ไปทำให้ Toast เด้ง

        if (postTestRes?.data?.success) {
          setPostTestStatus(postTestRes.data.data);
        }

      } catch (err) {
        console.warn('Check unlock conditions failed:', err);
      } finally {
        if (!unlockRedirectRef.current) {
          setIsLoadingStatus(false);
        }
      }
    };

    checkUnlockConditions();
  }, [lessonId, navigate, isTeacher, token]);


  useEffect(() => {
    // Timer for tracking time spent
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchLessonDetail() {
      if (!lessonId || isLoadingStatus || !token || unlockRedirectRef.current || isRedirecting) return;

      try {
        setIsFetchingLesson(true);
        const res = await axios.get(getApiUrl(`/lessons/${lessonId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (cancelled) return;

        const raw = res.data?.data?.lesson;
        if (!raw || !res.data?.success) {
          toast.error('ไม่พบข้อมูลบทเรียน', { icon: '📭' });
          navigate(isTeacher ? '/dashboard/teacher' : '/dashboard/student/lessons');
          return;
        }

        setLesson({
          ...raw,
          id: raw.id || raw._id
        });
      } catch (err) {
        if (cancelled) return;
        console.error('Lesson load error:', err);
        toast.error('โหลดบทเรียนไม่สำเร็จ ตรวจสอบว่ารันหลังบ้านแล้ว (เช่น พอร์ต 3000)', {
          duration: 5000
        });
        navigate(isTeacher ? '/dashboard/teacher' : '/dashboard/student/lessons');
      } finally {
        if (!cancelled) {
          setIsFetchingLesson(false);
        }
      }
    }

    fetchLessonDetail();

    return () => {
      cancelled = true;
    };
  }, [lessonId, token, isLoadingStatus, isTeacher, navigate]);

  if (isLoadingStatus || isFetchingLesson || !lesson) {
    return (
      <div className="flex items-center justify-center h-dvh bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดบทเรียน...</p>
        </div>
      </div>
    );
  }

  // Remove colon after "บทที่ X:" in title
  const formatLessonTitle = (title) => {
    if (!title) return title;
    return title.replace(/บทที่ (\d+):/g, 'บทที่ $1');
  };

  // Generate dynamic lesson steps based on lesson type
  const generateLessonSteps = () => {
    const lessonContent = lesson.title.split(': ')[1] || '';

    // Extract the main concept from title
    const getMainConcept = () => {
      // Try to extract single character from title first
      // For "พยัญชนะ ก-ง" or "สระ อา", get the first vowel/consonant
      const singleCharMatch = lessonContent.match(/^สระ ([ก-๙]+)$/);
      if (singleCharMatch) return singleCharMatch[1];

      // For consonant ranges or other patterns, extract from content
      if (lesson.content) {
        // Look for single-character Thai letters (consonants/vowels)
        const matches = lesson.content.match(/[\s\n]([ก-๙])[\s\n]/g);
        if (matches && matches.length > 0) {
          // Return the first single character found
          const firstMatch = matches[0].trim();
          if (firstMatch.length === 1) return firstMatch;
        }

        // Fallback: find first single character anywhere
        const singleChars = lesson.content.match(/[ก-ฮ]/g);
        if (singleChars && singleChars.length > 0) {
          return singleChars[0];
        }
      }
      return null;
    };

    // Extract vocabulary words with better detection
    const extractVocabulary = () => {
      const words = [];

      // 1. Check for [MEDIA] block in content first
      if (lesson.content && lesson.content.includes('[MEDIA]')) {
        try {
          const mediaMatch = lesson.content.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
          if (mediaMatch && mediaMatch[1]) {
            const mediaData = JSON.parse(mediaMatch[1]);
            if (mediaData.items && Array.isArray(mediaData.items)) {
              // SEPARATION: Filter to prioritize generic Vocabulary words (length > 1)
              // Steps:
              // 1. Identify "Vocabulary Words" (e.g., กา, ขา, งา) -> length > 1
              // 2. If present, show ONLY them in the Vocabulary Section.
              // 3. If not present, show everything (Consonants) as fallback.
              const vocabOnly = mediaData.items.filter(item => item.word && item.word.length > 1);

              const itemsToReturn = vocabOnly.length > 0 ? vocabOnly : mediaData.items;

              const result = itemsToReturn.map(item => ({
                word: item.word,
                emoji: null, // Image preferred
                // Use vocabImage if available (Chicken), otherwise Consonant Image (Ko Kai)
                image: item.vocabImage || item.image,
                meaning: item.label || item.word,
                audio: null // Will trigger TTS fallback
              }));

              return result; // [Requirement 4] RETURN EARLY to prevent mixing with fallback
            }
          }
        } catch (e) {
          console.error('Failed to parse media content:', e);
        }
      }

      // Vocabulary mapping for each lesson (Fallback)
      const vocabularyMap = {
        'ก–ง': [
          { word: 'ไก่', emoji: '🐔', meaning: 'สัตว์ปีกที่ขี้อวด' },
          { word: 'ไข่', emoji: '🥚', meaning: 'ของที่ไก่ให้' },
          { word: 'ควาย', emoji: '🐃', meaning: 'สัตว์ตัวใหญ่มีเขา' },
          { word: 'ระฆัง', emoji: '🔔', meaning: 'เครื่องตีให้เสียงดัง' },
          { word: 'งู', emoji: '🐍', meaning: 'สัตว์เลื้อยคลาน' },
          { word: 'กา', emoji: '🐦', meaning: 'นกสีดำ' },
          { word: 'ขา', emoji: '🦵', meaning: 'อวัยวะที่ใช้เดิน' },
          { word: 'คา', emoji: '🏠', meaning: 'บ้านเรือน' },
          { word: 'งา', emoji: '🐘', meaning: 'ของงาช้าง' }
        ],
        'จ–ณ': [
          { word: 'จาน', emoji: '🍽️', meaning: 'ภาชนะใส่อาหาร' },
          { word: 'ฉิ่ง', emoji: '🔔', meaning: 'เครื่องดนตรีไทย' },
          { word: 'ช้าง', emoji: '🐘', meaning: 'สัตว์ตัวใหญ่มาก' },
          { word: 'ซอ', emoji: '🎻', meaning: 'เครื่องดนตรี' }
        ],
        'ด–ม': [
          { word: 'เด็ก', emoji: '👶', meaning: 'คนตัวเล็ก' },
          { word: 'เต่า', emoji: '🐢', meaning: 'สัตว์มีกระดอง' },
          { word: 'ถุง', emoji: '👜', meaning: 'ของสำหรับใส่ของ' },
          { word: 'ทหาร', emoji: '👮', meaning: 'ผู้ปกป้องประเทศ' },
          { word: 'ธง', emoji: '🚩', meaning: 'ผ้าสำหรับชักขึ้น' },
          { word: 'หนู', emoji: '🐭', meaning: 'สัตว์ตัวเล็กหางยาว' },
          { word: 'ใบไม้', emoji: '🍃', meaning: 'ส่วนของต้นไม้' },
          { word: 'ปลา', emoji: '🐟', meaning: 'สัตว์ในน้ำ' },
          { word: 'ผึ้ง', emoji: '🐝', meaning: 'แมลงทำน้ำผึ้ง' },
          { word: 'ม้า', emoji: '🐴', meaning: 'สัตว์ใช้ขี่' }
        ],
        'ย–ฮ': [
          { word: 'ยักษ์', emoji: '👹', meaning: 'ยักษ์ในนิทาน' },
          { word: 'เรือ', emoji: '🚢', meaning: 'ยานพาหนะในน้ำ' },
          { word: 'ลิง', emoji: '🐵', meaning: 'สัตว์ที่คล้ายคน' },
          { word: 'แหวน', emoji: '💍', meaning: 'เครื่องประดับนิ้ว' },
          { word: 'ศาลา', emoji: '🏛️', meaning: 'อาคารหลังคาใหญ่' },
          { word: 'สระ', emoji: '🏊', meaning: 'ที่ว่ายน้ำ' },
          { word: 'หีบ', emoji: '📦', meaning: 'กล่องใส่ของ' },
          { word: 'อ่าง', emoji: '🛁', meaning: 'ภาชนะใส่น้ำ' },
          { word: 'ฮูก', emoji: '🦉', meaning: 'นกกลางคืน' }
        ],
        'อา': [
          { word: 'กา', emoji: '🐦', meaning: 'นกสีดำ' },
          { word: 'ขา', emoji: '🦵', meaning: 'อวัยวะที่ใช้เดิน' },
          { word: 'คา', emoji: '🏠', meaning: 'บ้านเรือน' },
          { word: 'งา', emoji: '🐘', meaning: 'ของงาช้าง' },
          { word: 'จา', emoji: '👋', meaning: 'ทักทาย' },
          { word: 'ชา', emoji: '☕', meaning: 'เครื่องดื่ม' }
        ],
        'อี': [
          { word: 'กี', emoji: '🏃', meaning: 'เดินเร็ว' },
          { word: 'ขี', emoji: '✏️', meaning: 'เขียน' },
          { word: 'คี', emoji: '🤗', meaning: 'กอด' }
        ],
        'อือ': [
          { word: 'กือ', emoji: '🌊', meaning: 'คลื่น' },
          { word: 'ขือ', emoji: '💨', meaning: 'ลม' },
          { word: 'คือ', emoji: '💡', meaning: 'เป็น' }
        ],
        'อุ': [
          { word: 'กุ', emoji: '🎯', meaning: 'เป้า' },
          { word: 'ขุ', emoji: '🏀', meaning: 'ลูกบอล' },
          { word: 'คุ', emoji: '🗣️', meaning: 'พูด' }
        ]
      };

      // Try to find matching vocabulary based on lesson title
      if (lessonContent) {
        for (const [key, vocabList] of Object.entries(vocabularyMap)) {
          if (lessonContent.includes(key) || lesson.title.includes(key)) {
            words.push(...vocabList);
            break;
          }
        }
      }

      // Fallback: extract from content if no match found
      if (words.length === 0 && lesson.content) {
        const matches = lesson.content.match(/[ก-๙]{2,}/g);
        if (matches) {
          const uniqueWords = [...new Set(matches.filter(m => m.length === 2))];
          const emojis = ['🐔', '🥚', '🐃', '🔔', '🐍', '🐦', '🦵', '🏠', '🐘', '👶', '🐢', '👜'];
          uniqueWords.slice(0, 12).forEach((word, idx) => {
            words.push({
              word,
              emoji: emojis[idx] || '📝',
              meaning: 'ตัวอย่างคำ'
            });
          });
        }
      }

      return words;
    };

    const mainConcept = getMainConcept();
    const vocabularyWords = extractVocabulary();
    const isVowel = lessonContent.match(/^สระ (.+)$/);
    const isConsonant = lessonContent.match(/^พยัญชนะ (.+)$/);

    const steps = [];

    // Parse lesson content for intro and blending
    let introData = null;
    let blendingData = [];
    let hasIntroSection = false;
    if (lesson.content && lesson.content.includes('[MEDIA]')) {
      try {
        const mediaMatch = lesson.content.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
        if (mediaMatch && mediaMatch[1]) {
          const mediaData = JSON.parse(mediaMatch[1]);
          introData = mediaData.intro || null;
          blendingData = mediaData.blending || [];
          hasIntroSection = !!introData;
        }
      } catch (e) {
        console.error('Failed to parse media content:', e);
      }
    }

    // Intro step - For lessons 5-8 (with intro section) use IntroStep, for lessons 1-4 use ContentStep
    if (hasIntroSection) {
      // Lessons 5-8: Display text only (no images)
      steps.push({
        id: 'intro',
        title: '📖 บทนำ',
        type: 'intro',
        content: {
          title: `บทนำ: ${formatLessonTitle(lesson.title)}`,
          intro: introData,
          audio: introData?.audio || lesson.audioUrl,
          vowelSound: introData?.vowelSound || null,
          vowelText: introData?.vowelText || null
        }
      });
    } else {
      // Lessons 1-4: Display images from items array
      steps.push({
        id: 'intro',
        title: '📖 บทนำ',
        type: 'content',
        content: {
          title: `บทนำ: ${formatLessonTitle(lesson.title)}`,
          description: lesson.content,
          audio: lesson.audioUrl
        }
      });
    }

    // Blending step - Show blending combinations
    if (blendingData.length > 0) {
      steps.push({
        id: 'blending',
        title: '🔊 ผสมเสียง',
        type: 'blending',
        content: {
          title: 'ผสมเสียง',
          blending: blendingData
        }
      });
    }

    // Pronunciation step removed - no longer needed

    // Vocabulary step with dynamic words
    if (vocabularyWords.length > 0) {
      // Extract lesson number from title (e.g., "บทที่ 1" -> "1", supports up to บทที่ 8)
      const lessonNumberMatch = lesson.title.match(/บทที่\s*(\d+)/);
      const lessonNumber = lessonNumberMatch ? lessonNumberMatch[1] : null;

      steps.push({
        id: 'vocabulary',
        title: '📚 คำศัพท์',
        type: 'vocabulary',
        content: {
          lessonNumber: lessonNumber, // Pass lesson number to VocabularyStep
          words: vocabularyWords.map((wordItem, idx) => {
            // Support both object and string format
            if (typeof wordItem === 'object' && wordItem.word) {
              return {
                word: wordItem.word,
                meaning: wordItem.meaning || 'ตัวอย่างคำ',
                emoji: wordItem.emoji || String.fromCodePoint(0x1F300 + idx),
                image: wordItem.image || null, // Pass vocabImage from backend
                primaryImage: wordItem.image || null, // Alias for vocabImage
                fallbackImage: wordItem.image || null // Fallback to vocabImage
              };
            }
            return {
              word: wordItem,
              meaning: 'ตัวอย่างคำ',
              emoji: String.fromCodePoint(0x1F300 + idx),
              image: null,
              primaryImage: null,
              fallbackImage: null
            };
          })
        }
      });
    }

    // Add writing practice - Extract all consonants from lesson (only from lesson-specific data)
    const getConsonantsFromLesson = () => {
      const consonants = [];
      let rangeStart = null;
      let rangeEnd = null;

      // 1. Extract from lesson title range (e.g., "พยัญชนะ ก-ง")
      // This gives us the exact range of consonants for this lesson - PRIMARY SOURCE
      if (lessonContent) {
        const rangeMatch = lessonContent.match(/พยัญชนะ\s+([ก-ฮ])-([ก-ฮ])/);
        if (rangeMatch) {
          rangeStart = rangeMatch[1];
          rangeEnd = rangeMatch[2];
          const startCode = rangeStart.charCodeAt(0);
          const endCode = rangeEnd.charCodeAt(0);

          // Generate all consonants in the range
          for (let code = startCode; code <= endCode; code++) {
            const char = String.fromCharCode(code);
            if (/[ก-ฮ]/.test(char)) {
              consonants.push(char);
            }
          }
        }
      }

      // 2. Extract from [MEDIA] block - get all single character consonants from items
      // Only add if they're within the range (if range exists)
      if (lesson.content && lesson.content.includes('[MEDIA]')) {
        try {
          const mediaMatch = lesson.content.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
          if (mediaMatch && mediaMatch[1]) {
            const mediaData = JSON.parse(mediaMatch[1]);
            if (mediaData.items && Array.isArray(mediaData.items)) {
              mediaData.items.forEach(item => {
                const word = item.word || item;
                // Only add single character Thai consonants (not words like "กา", "ขา")
                if (word && word.length === 1 && /[ก-ฮ]/.test(word)) {
                  // If we have a range, only add if it's within the range
                  if (rangeStart && rangeEnd) {
                    const charCode = word.charCodeAt(0);
                    const startCode = rangeStart.charCodeAt(0);
                    const endCode = rangeEnd.charCodeAt(0);
                    if (charCode >= startCode && charCode <= endCode && !consonants.includes(word)) {
                      consonants.push(word);
                    }
                  } else if (!consonants.includes(word)) {
                    consonants.push(word);
                  }
                }
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse media content for consonants:', e);
        }
      }

      // 3. Extract from vocabulary words
      // These are the consonants that appear in vocabulary words of this lesson
      if (vocabularyWords.length > 0) {
        vocabularyWords.forEach(item => {
          const word = typeof item === 'object' ? item.word : item;
          // [Requirement 1 Fix] Extract base consonant even if word starts with a vowel (e.g., "ไก่" -> "ก")
          if (word && word.length > 0) {
            // Find the first character that is a Thai consonant [ก-ฮ]
            const consonantMatch = word.match(/[ก-ฮ]/);
            if (consonantMatch) {
              const baseChar = consonantMatch[0];
              // If we have a range, only add if it's within the range
              if (rangeStart && rangeEnd) {
                const charCode = baseChar.charCodeAt(0);
                const startCode = rangeStart.charCodeAt(0);
                const endCode = rangeEnd.charCodeAt(0);
                if (charCode >= startCode && charCode <= endCode && !consonants.includes(baseChar)) {
                  consonants.push(baseChar);
                }
              } else if (!consonants.includes(baseChar)) {
                // For custom lessons without range, add all found consonants
                consonants.push(baseChar);
              }
            }
          }
        });
      }

      // 4. Final fallback: use mainConcept (only if within range)
      if (consonants.length === 0 && mainConcept) {
        if (rangeStart && rangeEnd) {
          const charCode = mainConcept.charCodeAt(0);
          const startCode = rangeStart.charCodeAt(0);
          const endCode = rangeEnd.charCodeAt(0);
          if (charCode >= startCode && charCode <= endCode) {
            consonants.push(mainConcept);
          }
        } else {
          consonants.push(mainConcept);
        }
      }

      // Remove duplicates and sort consonants to maintain order
      const uniqueConsonants = [...new Set(consonants)];
      return uniqueConsonants.sort((a, b) => a.localeCompare(b, 'th'));
    };

    const consonantsToPractice = getConsonantsFromLesson();
    if (consonantsToPractice.length > 0) {
      steps.push({
        id: 'activity-writing',
        title: '✍️ กิจกรรม: ฝึกเขียน',
        type: 'activity-writing',
        content: {
          question: 'ลากนิ้วเขียนตามเส้นประ',
          words: consonantsToPractice, // Array of consonants to practice
          word: consonantsToPractice[0] // First word for backward compatibility
        }
      });
    }

    // Summary - Hide for teachers as requested
    if (!isTeacher) {
      steps.push({
        id: 'summary',
        title: '📌 สรุปบทเรียน',
        type: 'summary',
        content: {
          title: 'เรียนจบแล้ว! 🎉',
          points: []
        }
      });
    }

    return steps;
  };

  const lessonSteps = generateLessonSteps();

  const handleStepComplete = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
      if (isTeacher) {
        toast.success('คุณครูทำส่วนนี้เสร็จแล้ว');
      } else {
        // Show big milestone popup instead of small toast for students
        setMilestoneData({
          title: 'เก่งมาก',
          subtitle: 'เรียนหัวข้อต่อไปกันเถอะ',
          emoji: '🌟'
        });
        setShowMilestone(true);
      }
    }
  };

  const handleNextStep = () => {
    const currentStepData = lessonSteps[currentStep];
    // ถ้าอยู่ขั้นคำศัพท์ ให้ปุ่มถัดไปเลื่อนคำศัพท์ให้จบก่อน
    if (currentStepData?.type === 'vocabulary') {
      const totalWords = currentStepData?.content?.words?.length || 0;
      if (totalWords > 0 && vocabWordIndex < totalWords - 1) {
        setVocabWordIndex(vocabWordIndex + 1);
        return;
      }
    }

    // [Requirement 2] ถ้าอยู่ขั้นฝึกเขียน ให้ปุ่มถัดไปเลื่อนพยัญชนะให้ครบทุกตัวก่อน
    if (currentStepData?.type === 'activity-writing') {
      const totalWritingWords = currentStepData?.content?.words?.length || 0;
      if (totalWritingWords > 0 && writingWordIndex < totalWritingWords - 1) {
        setWritingWordIndex(writingWordIndex + 1);
        return;
      }
    }

    if (currentStep < lessonSteps.length - 1) {
      handleStepComplete(lessonSteps[currentStep].id);
      setVocabWordIndex(0);
      setWritingWordIndex(0);
      setCurrentStep(currentStep + 1);
    } else {
      handleLessonComplete();
    }
  };

  const handleAddContinuousImage = async (newItem) => {
    try {
      let mediaData = { items: [] };
      let newContent = lesson.content || '';

      if (newContent.includes('[MEDIA]')) {
        const mediaMatch = newContent.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
        if (mediaMatch && mediaMatch[1]) {
          try {
            mediaData = JSON.parse(mediaMatch[1]);
          } catch (e) { console.error('Failed to parse media block', e) }
        }
      }

      if (!mediaData.items) mediaData.items = [];

      if (editingItemIndex !== null) {
        mediaData.items[editingItemIndex] = {
          ...mediaData.items[editingItemIndex],
          word: newItem.word,
          image: newItem.image,
          vocabImage: newItem.image,
          label: newItem.label
        };
      } else {
        mediaData.items.push({
          word: newItem.word,
          image: newItem.image,
          vocabImage: newItem.image,
          label: newItem.label
        });
      }

      const mediaString = `[MEDIA]\n${JSON.stringify(mediaData)}\n[/MEDIA]`;

      if (newContent.includes('[MEDIA]')) {
        newContent = newContent.replace(/\[MEDIA\][\s\S]*?\[\/MEDIA\]/, mediaString);
      } else {
        newContent += `\n${mediaString}`;
      }

      // Update on backend
      const token = localStorage.getItem('token');
      await axios.put(
        getApiUrl(`/teacher/lessons/${lessonId}`),
        {
          title: lesson.title,
          content: newContent,
          order: lesson.order || lesson.orderIndex || 1,
          orderIndex: lesson.orderIndex || 1,
          category: lesson.category || 'custom'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(editingItemIndex !== null ? 'แก้ไขข้อมูลรูปภาพสำเร็จ' : 'อัปโหลดรูปภาพเข้าสู่บทเรียนเรียบร้อยแล้ว', { icon: '📸' });

      setEditingItemIndex(null);
      // Update local state to reflect immediately
      setLesson(prev => ({ ...prev, content: newContent }));

    } catch (err) {
      console.error('Failed to add image:', err);
      const validationErrs = err.response?.data?.errors?.map(e => e.message).join(', ');
      toast.error(validationErrs ? 'ข้อมูลไม่ครบ: ' + validationErrs : 'เกิดข้อผิดพลาดในการบันทึกรูปแบบ');
      throw err;
    }
  };

  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    setShowAddImageModal(true);
  };

  const handleDeleteItem = async (index) => {
    if (!window.confirm('คุณต้องการลบรูปภาพและคำศัพท์นี้ใช่หรือไม่?')) return;
    try {
      let mediaData = { items: [] };
      let newContent = lesson.content || '';

      if (newContent.includes('[MEDIA]')) {
        const mediaMatch = newContent.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
        if (mediaMatch && mediaMatch[1]) {
          try {
            mediaData = JSON.parse(mediaMatch[1]);
          } catch (e) { console.error('Failed to parse', e) }
        }
      }
      if (!mediaData.items) return;

      mediaData.items.splice(index, 1);
      const mediaString = `[MEDIA]\n${JSON.stringify(mediaData)}\n[/MEDIA]`;
      newContent = newContent.replace(/\[MEDIA\][\s\S]*?\[\/MEDIA\]/, mediaString);

      const token = localStorage.getItem('token');
      await axios.put(
        getApiUrl(`/teacher/lessons/${lessonId}`),
        {
          title: lesson.title,
          content: newContent,
          order: lesson.order || lesson.orderIndex || 1,
          orderIndex: lesson.orderIndex || 1,
          category: lesson.category || 'custom'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('ลบข้อมูลเรียบร้อยแล้ว');
      setLesson(prev => ({ ...prev, content: newContent }));
    } catch (err) {
      console.error(err);
      toast.error('ลบข้อมูลไม่สำเร็จ');
    }
  };

  const handleSaveTitleEdit = async () => {
    if (!editTitleValue.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        getApiUrl(`/teacher/lessons/${lessonId}`),
        {
          title: editTitleValue,
          content: lesson.content,
          order: lesson.order || lesson.orderIndex || 1,
          orderIndex: lesson.orderIndex || 1,
          category: lesson.category || 'custom'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLesson(prev => ({ ...prev, title: editTitleValue }));
      setIsEditingTitle(false);
      toast.success('เปลี่ยนชื่อบทเรียนสำเร็จ');
    } catch (err) {
      console.error(err);
      const validationErrs = err.response?.data?.errors?.map(e => e.message).join(', ');
      toast.error(validationErrs || 'เกิดข้อผิดพลาดในการเปลี่ยนชื่อบทเรียน');
    }
  };

  const generateTests = () => {
    setShowCreateTestModal(true);
  };

  const generateGames = () => {
    setShowCreateGameModal(true);
  };

  const handlePrevStep = () => {
    const currentStepData = lessonSteps[currentStep];
    // ✅ ปรับปรุง: ถ้าอยู่หน้าคำศัพท์หรือฝึกเขียน ให้ปุ่มก่อนหน้าถอยย่อยก่อน
    if ((currentStepData?.type === 'vocabulary' || currentStepData?.type === 'activity-writing') && (vocabWordIndex > 0 || writingWordIndex > 0)) {
      if (currentStepData?.type === 'vocabulary') setVocabWordIndex(vocabWordIndex - 1);
      else setWritingWordIndex(writingWordIndex - 1);
      return;
    }

    if (currentStep > 0) {
      setVocabWordIndex(0);
      setWritingWordIndex(0);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLessonComplete = async () => {
    if (isTeacher) {
      toast('สิ้นสุดเนื้อหาแล้ว');
      return;
    }

    try {
      // Call API to mark lesson as complete
      const token = localStorage.getItem('token');
      await axios.post(
        getApiUrl(`/student/lessons/${lessonId}/complete`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowConfetti(true);
      setMilestoneData({
        title: 'ยินดีด้วย เรียนจบแล้ว 🎉',
        subtitle: 'เก่งมาก',
        emoji: '🏆'
      });
      setShowMilestone(true);

      // Refresh posttest status after completing lesson
      let postTestId = null;
      try {
        const postTestRes = await axios.get(
          getApiUrl(`/student/lessons/${lessonId}/post-test-status`),
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (postTestRes.data?.success) {
          setPostTestStatus(postTestRes.data.data);
          postTestId = postTestRes.data.data?.postTestId;
        }
      } catch (err) {
        console.warn('Post-test status refresh failed:', err);
      }

      // Fallback: try to get postTestId from lesson state
      if (!postTestId) {
        postTestId = postTestStatus?.postTestId ?? lesson?.postTest?.id ?? lesson?.postTest?._id;
      }

      setTimeout(() => {
        if (isTeacher && classroomId) {
          navigate(`/dashboard/teacher/classrooms/${classroomId}`);
        } else if (postTestId) {
          navigate(`/dashboard/student/tests/${postTestId}`);
        } else {
          navigate('/dashboard/student');
        }
      }, 2000);
    } catch (error) {
      console.error('Complete lesson error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกความคืบหน้า');
    }
  };

  const handleActivityAnswer = async (activityId, answer, isCorrect = false, score = 0) => {
    // Update local state
    setActivityAnswers({
      ...activityAnswers,
      [activityId]: { answer, isCorrect, score }
    });

    // Submit to backend
    try {
      const token = localStorage.getItem('token');

      await axios.post(
        getApiUrl(`/student/lessons/${lessonId}/activities/${activityId}/submit`),
        {
          answer: typeof answer === 'object' ? answer : { answer },
          isCorrect: isCorrect,
          score: score || (isCorrect ? 100 : 0),
          timeSpent: timeSpent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Submit activity error:', error);
      // Don't show error to user, just log it
    }
  };

  const playAudio = (audioUrl, text = null) => {
    // Stop any ongoing speech
    stopSpeech();

    // Prefer text-to-speech (Gemini) if text is provided, 
    // especially since older audioUrl might point to old voices
    if (text) {
      speakText(text);
      return;
    }

    if (audioUrl?.startsWith('http')) {
      // Try to play actual audio file if no text provided
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.error('Audio play error:', err);
      });
    } else {
      // Default fallback
      speakText('อา');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStepContent = () => {
    const step = lessonSteps[currentStep];

    switch (step.type) {
      case 'intro':
        return <IntroStep step={step} playAudio={playAudio} />;
      case 'blending':
        return <BlendingStep step={step} playAudio={playAudio} />;
      case 'content':
        return (
          <ContentStep
            step={step}
            playAudio={playAudio}
            isTeacher={isTeacher}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        );
      case 'vocabulary':
        return (
          <VocabularyStep
            step={step}
            playAudio={playAudio}
            currentWordIndex={vocabWordIndex}
            setCurrentWordIndex={setVocabWordIndex}
          />
        );
      case 'activity-listening':
        return (
          <ListeningActivity
            step={step}
            playAudio={playAudio}
            onAnswer={(answer) => handleActivityAnswer(step.id, answer)}
            currentAnswer={activityAnswers[step.id]}
          />
        );
      case 'activity-matching':
        return (
          <MatchingActivity
            step={step}
            onAnswer={(answer) => handleActivityAnswer(step.id, answer)}
            currentAnswer={activityAnswers[step.id]}
          />
        );
      case 'activity-writing':
        return <WritingActivityStep
          step={step}
          currentWordIndex={writingWordIndex}
          setCurrentWordIndex={setWritingWordIndex}
          onComplete={(activityId, writtenText, isCorrect, score) => {
            handleActivityAnswer(activityId, { writtenText, isCorrect, score }, isCorrect, score);
          }}
        />;
      case 'summary':
        return (
          <SummaryStep
            step={step}
            postTestStatus={postTestStatus}
            postTestId={postTestStatus?.postTestId ?? lesson?.postTest?.id ?? lesson?.postTest?._id}
            onGoToPostTest={() => {
              const id = postTestStatus?.postTestId ?? lesson?.postTest?.id ?? lesson?.postTest?._id;
              if (id) navigate(`/dashboard/student/tests/${id}`);
            }}
          />
        );
      default:
        return <div>Unknown step type</div>;
    }
  };

  const progress = ((currentStep + 1) / lessonSteps.length) * 100;

  return (
    <div className="h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden flex flex-col">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 bg-white border-b border-gray-200 shadow-sm p-2 sm:p-3"
      >
        <div className="max-w-5xl mx-auto">
          {/* Top row: Back + Title + Timer */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              onClick={() => {
                if (isTeacher && classroomId) {
                  navigate(`/dashboard/teacher/classrooms/${classroomId}`);
                } else {
                  navigate(isTeacher ? '/dashboard/teacher' : '/dashboard/student');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 shrink-0"
              aria-label="กลับ"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitleEdit()}
                    className="flex-1 w-full px-3 py-1 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-bold"
                    autoFocus
                  />
                  <button onClick={handleSaveTitleEdit} className="p-1.5 text-green-600 hover:bg-green-100 rounded transition">
                    <Check size={18} />
                  </button>
                  <button onClick={() => { setIsEditingTitle(false); setEditTitleValue(lesson.title); }} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 min-w-0 line-clamp-1">{formatLessonTitle(lesson.title)}</h1>
                  {isTeacher && (
                    <button onClick={() => setIsEditingTitle(true)} className="p-1 text-gray-400 hover:text-blue-600 rounded transition shrink-0">
                      <Edit2 size={16} />
                    </button>
                  )}
                  <AudioButton text={formatLessonTitle(lesson.title)} variant="mini" iconSize={16} />
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-gray-600 shrink-0">
              <Clock size={16} />
              <span className="text-sm font-medium">{formatTime(timeSpent)}</span>
            </div>
          </div>

          {/* Progress bar + Step dots */}
          <div className="space-y-1.5">
            {!isTeacher && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">ความคืบหน้า {Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </>
            )}
            <div className="flex items-center justify-center gap-1 flex-wrap pt-1">
              {lessonSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition ${index === currentStep
                    ? 'bg-blue-500 scale-125'
                    : completedSteps.includes(step.id)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                    }`}
                  title={step.title}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full px-4 sm:px-6 py-4 flex flex-col relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-3 sm:p-6 flex-1 min-h-0 overflow-hidden flex flex-col"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Teacher Floating Action Buttons */}
          {isTeacher && (
            <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-40 flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateTests}
                className="px-5 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black rounded-full shadow-2xl flex items-center gap-2"
              >
                <FileText size={18} />
                <span className="hidden sm:inline text-[15px]">สร้างข้อสอบ</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateGames}
                className="px-5 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black rounded-full shadow-2xl flex items-center gap-2"
              >
                <Gamepad2 size={18} />
                <span className="hidden sm:inline text-[15px]">สร้างเกม</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddImageModal(true)}
                className="px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-full shadow-2xl flex items-center gap-2"
              >
                <Plus size={18} />
                <span className="hidden sm:inline text-[15px]">เพิ่มรูปภาพ</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 bg-white border-t border-gray-200 p-2 sm:p-3"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => {
              if (currentStep > 0 || (currentStep === 0 && (vocabWordIndex > 0 || writingWordIndex > 0))) handlePrevStep();
              else {
                if (isTeacher && classroomId) navigate(`/dashboard/teacher/classrooms/${classroomId}`);
                else navigate(isTeacher ? '/dashboard/teacher' : '/dashboard/student');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm shrink-0"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">{currentStep === 0 && vocabWordIndex === 0 && writingWordIndex === 0 ? 'กลับ' : 'ก่อนหน้า'}</span>
          </button>

          <button
            onClick={handleNextStep}
            className={`flex items-center gap-1.5 px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg font-bold transition text-sm shrink-0 shadow-sm ${
              // ถ้าเป็นหน้าสุดท้าย และไม่ใช่ครู และสอบผ่านแล้ว ให้ใช้สีเทา (Disabled Style)
              !isTeacher && currentStep === lessonSteps.length - 1 && lesson?.progress?.hasPassedPostTest
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : currentStep === lessonSteps.length - 1
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              }`}
          >
            {!isTeacher && currentStep === lessonSteps.length - 1 ? (
              // เช็คสถานะการผ่านตรงนี้
              lesson?.progress?.hasPassedPostTest ? (
                <><CheckCircle size={18} className="text-green-600" /> <span>สอบผ่านแล้ว</span></>
              ) : (
                <><Play size={18} fill="currentColor" /> <span>ทำ Post-test</span></>
              )
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline">
                  ถัดไป
                </span>
                <ChevronRight size={18} />
              </div>
            )}
          </button>
        </div>
      </motion.div>

      {/* Milestone Popup */}
      <MilestonePopup
        isOpen={showMilestone}
        onClose={() => setShowMilestone(false)}
        title={milestoneData.title}
        subtitle={milestoneData.subtitle}
        emoji={milestoneData.emoji}
        onAction={() => {
          setShowMilestone(false);
          // Auto-scroll to next step is already handled by handleNextStep calling this
        }}
      />



      {showAddImageModal && (
        <AddVocabImageModal
          onClose={() => {
            setShowAddImageModal(false);
            setEditingItemIndex(null);
          }}
          onAdd={handleAddContinuousImage}
          initialData={
            editingItemIndex !== null
              ? (() => {
                try {
                  const match = lesson?.content?.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
                  if (match && match[1]) {
                    const data = JSON.parse(match[1]);
                    return data.items[editingItemIndex];
                  }
                } catch (e) {
                  console.error('Failed to parse item data for modal', e);
                }
                return null;
              })()
              : null
          }
        />
      )}

      {showCreateGameModal && (
        <CreateGameModal
          isOpen={showCreateGameModal}
          onClose={() => setShowCreateGameModal(false)}
          lessonId={lessonId}
          lessonTitle={lesson?.title}
        />
      )}

      {showCreateTestModal && (
        <CreateTestModal
          isOpen={showCreateTestModal}
          onClose={() => setShowCreateTestModal(false)}
          lessonId={lessonId}
          lessonTitle={lesson?.title}
        />
      )}
    </div>
  );
};

// Intro Step Component
const IntroStep = ({ step, playAudio }) => {
  const intro = step.content.intro;
  const vowelMatch = (step.content.title || '').match(/สระ (.+?)(?:\s|$)/);
  const vowelName = vowelMatch ? vowelMatch[1] : 'อา';

  return (
    <div className="h-full flex flex-col gap-6 items-center justify-center py-4">
      <div className="flex items-center gap-2 shrink-0">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-center"
        >
          {step.content.title}
        </motion.h2>
        <AudioButton text={step.content.title} variant="normal" iconSize={24} />
      </div>
      {intro?.vowelImage ? (
        <div className="flex-1 min-h-0 flex items-center justify-center w-full overflow-hidden">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-4 shadow-2xl border-2 border-blue-100 max-h-full"
          >
            <img
              src={intro.vowelImage}
              alt={`สระ${vowelName}`}
              className="max-h-64 sm:max-h-80 w-auto object-contain rounded-lg"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl px-6 py-4 border border-blue-200 text-center">
            {intro?.text && <p className="text-gray-700 text-sm leading-relaxed">{intro.text}</p>}
          </div>
        </div>
      )}
      {intro?.vowelSound && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => playAudio(intro.vowelSound, `สระ${vowelName}`)}
          className="shrink-0 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold hover:shadow-lg transition"
        >
          <Volume2 size={20} />
          <span>ฟังเสียงสระ{vowelName}</span>
        </motion.button>
      )}
    </div>
  );
};

// Blending Step Component
const BlendingStep = ({ step, playAudio }) => {
  const blending = step.content.blending || [];

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="shrink-0 text-center pb-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <span className="p-2 bg-blue-100 rounded-lg">🔊</span> {step.content.title}
        </h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {blending.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg px-4 py-3 border border-blue-200 flex items-center justify-between gap-3"
          >
            <p className="text-xl sm:text-2xl font-bold text-gray-800">
              <span className="text-blue-600">{item.consonant}</span>
              <span className="text-gray-400 mx-1">+</span>
              <span className="text-purple-600">{item.vowel}</span>
              <span className="text-gray-400 mx-1">→</span>
              <span className="text-green-600">{item.word}</span>
            </p>
            {item.audio && (
              <button
                onClick={() => playAudio(item.audio, `${item.consonant} ${item.vowel} ${item.word}`)}
                className="shrink-0 p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition shadow-sm"
              >
                <Volume2 size={18} />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Content Step Component
const ContentStep = ({ step, playAudio, isTeacher, onEditItem, onDeleteItem }) => {
  const isMediaContent = step.content.description && step.content.description.includes('[MEDIA]');

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="shrink-0 text-center border-b border-gray-100 pb-4 flex items-center justify-center gap-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 leading-tight">{step.content.title}</h2>
        <AudioButton text={step.content.title} variant="mini" iconSize={20} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-2 custom-scrollbar">
        {isMediaContent ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(() => {
              try {
                const match = step.content.description.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
                if (match && match[1]) {
                  const data = JSON.parse(match[1]);
                  const consonants = data.items.filter(item => item.word && item.word.length === 1);
                  const itemsToShow = consonants.length > 0 ? consonants : data.items;
                  return itemsToShow.map((item, index) => (
                    <div key={index} className="relative group/card h-full">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => playAudio(null, item.label || item.word)}
                        className={`group p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 min-h-[120px] h-full w-full transition-all duration-300 shadow-sm hover:shadow-xl ${index % 2 === 0 ? 'bg-blue-50 border-blue-100 hover:border-blue-400' : 'bg-pink-50 border-pink-100 hover:border-pink-400'}`}
                      >
                        <div className="relative">
                          <img src={item.image} alt={item.word} className="h-16 sm:h-20 w-auto object-contain transform group-hover:scale-110 transition-transform duration-300" />
                          <div className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-blue-500 text-white p-1 rounded-full shadow-md scale-75">
                              <Volume2 size={12} />
                            </div>
                          </div>
                        </div>
                        <span className="font-extrabold text-xs sm:text-sm text-gray-800 text-center leading-tight">{item.label}</span>
                      </motion.button>

                      {isTeacher && (
                        <div className="absolute -top-2 -right-2 flex gap-1 transform transition-all opacity-0 group-hover/card:opacity-100 scale-95 group-hover/card:scale-100 z-20">
                          <button onClick={(e) => { e.stopPropagation(); onEditItem(index); }} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-lg hover:scale-110 transition">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onDeleteItem(index); }} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg hover:scale-110 transition">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ));
                }
              } catch (e) {
                return <p className="text-red-500 col-span-3 text-sm p-2">Error loading content</p>;
              }
            })()}
          </div>
        ) : (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            {(step.content.description || '').split('\n').map((line, idx) => (
              <p key={`line-${idx}`} className="text-gray-700 text-sm mb-2 whitespace-pre-wrap last:mb-0">{line}</p>
            ))}
          </div>
        )}
      </div>

      {step.content.objectives && (
        <div className="shrink-0 bg-green-50 border border-green-200 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-green-800 mb-1">🎯 วัตถุประสงค์</h3>
          <ul className="space-y-1">
            {step.content.objectives.map((obj, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="text-green-600 mt-0.5 shrink-0" size={15} />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Vocabulary Step Component
const VocabularyStep = ({ step, playAudio, currentWordIndex, setCurrentWordIndex }) => {
  const words = step.content.words;
  const currentWord = words[currentWordIndex];
  const lessonNumber = step.content.lessonNumber;

  // State for image handling
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Update image source when word changes
  useEffect(() => {
    let source = null;

    // Priority 1: Use image from backend (vocabImage) if available
    if (currentWord.image) {
      source = currentWord.image;
    }

    // Priority 2: Try primaryImage alias
    if (!source && currentWord.primaryImage) {
      source = currentWord.primaryImage;
    }

    // Priority 3: Fallback - construct path if we have a word and lesson number
    // Supports lessons 1-8 (บทที่1 to บทที่8) - use correct folder path
    if (!source && lessonNumber && currentWord.word) {
      // Only do this if it's a full word (length > 1), not a single consonant
      if (currentWord.word.length > 1) {
        const lessonNum = parseInt(lessonNumber);
        if (lessonNum >= 1 && lessonNum <= 8) {
          source = `/คำศัพท์บท1-8/บทที่${lessonNumber}/${currentWord.word}.png`;
        }
      }
    }

    // Final Fallback: Consonant Card image (from backend 'image' field)
    if (!source) {
      source = currentWord.fallbackImage;
    }

    setImgSrc(source);
    setImgError(false);
  }, [currentWord, lessonNumber]);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Title + counter */}
      <div className="shrink-0 flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-xl font-extrabold text-blue-600 flex items-center gap-2">
          <span className="p-1.5 bg-blue-100 rounded-lg text-blue-600">📚</span> คำศัพท์
        </h2>
        <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{currentWordIndex + 1} / {words.length}</span>
      </div>

      {/* Word Card - fills remaining height */}
      <motion.div
        key={currentWordIndex}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 min-h-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl border border-blue-100 flex flex-col lg:flex-row items-center justify-center p-6 gap-8 shadow-inner"
      >
        {/* Image area */}
        <div className="flex-1 lg:flex-[1.2] min-h-0 flex items-center justify-center w-full overflow-hidden">
          {!imgError && imgSrc ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-3xl p-4 border-2 border-blue-50 relative group max-h-full flex items-center justify-center"
            >
              <img
                src={imgSrc}
                alt={currentWord.word}
                className="max-h-48 sm:max-h-64 lg:max-h-72 w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  console.warn('Image failed to load:', imgSrc);
                  // ... existing error logic ...
                  if (imgSrc && imgSrc.includes('/คำศัพท์บท') && currentWord.word) {
                    const firstChar = currentWord.word.charAt(0);
                    if (firstChar && /[ก-ฮ]/.test(firstChar)) {
                      setImgSrc(`/ก-ฮ/${firstChar}.png`);
                      return;
                    }
                  }
                  setImgError(true);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
            </motion.div>
          ) : (
            <div className="text-8xl transform hover:scale-110 transition-transform">{currentWord.emoji || '📖'}</div>
          )}
        </div>

        {/* Word + meaning */}
        <div className="shrink-0 lg:flex-1 text-center lg:text-left flex flex-col items-center lg:items-start gap-3">
          <div className="space-y-1">
            <h3 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight">{currentWord.word}</h3>
            <p className="text-base sm:text-lg text-gray-500 font-medium leading-relaxed">{currentWord.meaning}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {String(lessonNumber) !== '4' && (
              <button
                onClick={() => playAudio(currentWord.audio, currentWord.word)}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-xl hover:-translate-y-1 transition duration-300 text-lg group"
              >
                <Volume2 size={24} className="group-hover:animate-bounce" />
                ฟังเสียง
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* [Requirement 4] Slide Indicators (Dots) */}
      {words.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {words.map((_, idx) => (
            <motion.div
              key={idx}
              initial={false}
              animate={{
                width: idx === currentWordIndex ? 24 : 8,
                backgroundColor: idx === currentWordIndex ? '#3b82f6' : '#d1d5db'
              }}
              className="h-2 rounded-full transition-all duration-300"
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Listening Activity Component
const ListeningActivity = ({ step, playAudio, onAnswer, currentAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(currentAnswer);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (optionIndex) => {
    setSelectedAnswer(optionIndex);
    setShowResult(true);
    onAnswer(optionIndex);

    const isCorrect = step.content.options[optionIndex].isCorrect;
    if (isCorrect) {
      toast.success('ถูกต้อง 🎉');
    } else {
      toast.error('❌ ลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 py-4 px-2">
      <div className="text-center space-y-2 max-w-2xl flex flex-col items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            {step.title}
          </h2>
          <AudioButton text={step.title} variant="mini" iconSize={20} />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-lg text-gray-500 font-medium">
            {step.content.question}
          </p>
          <AudioButton text={step.content.question} variant="mini" iconSize={16} />
        </div>
      </div>

      {/* Audio Player */}
      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-25 group-hover:opacity-40 blur-xl transition-all duration-500 animate-pulse" />
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => playAudio(step.content.audio, step.content.question || step.title)}
          className="relative w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl z-10"
        >
          <Volume2 size={56} className="group-hover:animate-bounce" />
        </motion.button>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl">
        {step.content.options.map((option, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(index)}
            className={`p-4 sm:p-6 rounded-3xl border-2 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col items-center justify-center gap-3 ${selectedAnswer === index
              ? option.isCorrect
                ? 'border-green-500 bg-green-50 shadow-green-100'
                : 'border-red-500 bg-red-50 shadow-red-100'
              : 'border-gray-100 bg-white hover:border-blue-400 hover:bg-blue-50/50'
              }`}
          >
            <div className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform">{option.emoji}</div>
            <div className="text-xl sm:text-2xl font-black text-gray-900">{option.text}</div>
            {showResult && selectedAnswer === index && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1"
              >
                {option.isCorrect ? (
                  <span className="text-green-600 font-bold flex items-center gap-1"><Check size={16} /> ถูกต้อง</span>
                ) : (
                  <span className="text-red-600 font-bold flex items-center gap-1"><XCircle size={16} /> ไม่ถูกต้อง</span>
                )}
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Matching Activity Component
const MatchingActivity = ({ step, onAnswer, currentAnswer }) => {
  const [matches, setMatches] = useState(currentAnswer || {});
  const [selectedWord, setSelectedWord] = useState(null);

  const handleWordClick = (wordObj) => {
    setSelectedWord(wordObj);
  };

  const handleImageClick = (imageObj) => {
    if (selectedWord) {
      const newMatches = {
        ...matches,
        [selectedWord.id]: imageObj.id
      };
      setMatches(newMatches);
      onAnswer(newMatches);
      setSelectedWord(null);

      // Check if correct
      if (selectedWord.id === imageObj.id) {
        toast.success('ถูกต้อง');
      } else {
        toast.error('❌ ลองใหม่อีกครั้ง');
      }
    }
  };

  const correctMatches = Object.entries(matches).filter(([wordId, imageId]) => wordId === imageId).length;

  return (
    <div className="h-full flex flex-col gap-6 py-2 px-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              {step.title}
            </h2>
            <AudioButton text={step.title} variant="mini" iconSize={20} />
          </div>
          <div className="flex items-center gap-2 justify-center md:justify-start mt-1">
            <p className="text-lg text-gray-500 font-medium">
              {step.content.question}
            </p>
            <AudioButton text={step.content.question} variant="mini" iconSize={16} />
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200 self-center md:self-auto">
          <p className="text-sm font-bold text-gray-600 flex items-center gap-2">
            <Award size={18} className="text-yellow-500" />
            คะแนนความถูกต้อง: <span className="text-blue-600">{correctMatches} / {step.content.pairs.length}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 py-2">
        {/* Words Column */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {step.content.pairs.map((pair) => (
            <motion.button
              key={pair.id}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleWordClick(pair)}
              className={`p-5 rounded-2xl text-2xl font-bold transition-all duration-300 flex items-center justify-between group shadow-sm ${selectedWord?.id === pair.id
                ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100'
                : matches[pair.id]
                  ? matches[pair.id] === pair.id
                    ? 'bg-green-50 text-green-700 border-2 border-green-200'
                    : 'bg-red-50 text-red-700 border-2 border-red-200'
                  : 'bg-white text-gray-700 border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
            >
              {pair.word}
              {matches[pair.id] === pair.id && <CheckCircle size={24} className="text-green-500" />}
            </motion.button>
          ))}
        </div>

        {/* Images Column */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {step.content.pairs.map((pair) => (
            <motion.button
              key={pair.id}
              whileHover={{ scale: 1.02, x: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleImageClick(pair)}
              className={`p-5 rounded-2xl text-6xl sm:text-7xl transition-all duration-300 flex items-center justify-center border-2 shadow-sm ${Object.values(matches).includes(pair.id)
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-100 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
            >
              <span className="transform group-hover:scale-110 transition-transform">{pair.image}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {correctMatches === step.content.pairs.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-4 flex items-center justify-center gap-4 mt-2"
        >
          <div className="p-3 bg-green-500 rounded-full text-white shadow-lg">
            <Award size={32} />
          </div>
          <div>
            <p className="text-xl font-black text-green-800">
              ยอดเยี่ยมโดนใจ! 🎉
            </p>
            <p className="text-sm text-green-600 font-medium">จับคู่ถูกทุกคู่แล้ว เก่งมากเลยตัวเล็ก</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Writing Activity Step Component — responsive, raw canvas, no HandwritingCanvas wrapper
const WritingActivityStep = ({ step, onComplete, currentWordIndex, setCurrentWordIndex }) => {
  const words = step.content.words || (step.content.word ? [step.content.word] : ['ก']);
  const [completedWords, setCompletedWords] = useState(new Set());
  const wordToWrite = words[currentWordIndex];
  const [isChecking, setIsChecking] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const guideImgRef = useRef(null);
  const containerRef = useRef(null);
  const { token } = useAuth();

  const getGuideImagePath = (char) => `/ฝึกเขียน/${char}.png`;

  const setupCanvas = (redrawGuide = true) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const size = Math.min(container.clientWidth, container.clientHeight);
    if (size <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = Math.max(10, size / 28);
    if (redrawGuide) {
      const img = guideImgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        const pad = size * 0.1;
        const drawSize = size * 0.8;
        ctx.globalAlpha = 0.22;
        ctx.drawImage(img, pad, pad, drawSize, drawSize);
        ctx.globalAlpha = 1;
      }
    }
  };

  const drawGuideOnly = () => {
    const canvas = canvasRef.current;
    const img = guideImgRef.current;
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.width / dpr;
    const ctx = canvas.getContext('2d');
    ctx.globalAlpha = 0.22;
    ctx.drawImage(img, size * 0.1, size * 0.1, size * 0.8, size * 0.8);
    ctx.globalAlpha = 1;
  };

  // Setup canvas on mount and word change
  useEffect(() => {
    setupCanvas(true);
  }, [wordToWrite]);

  // Responsive: re-setup on resize
  useEffect(() => {
    const handleResize = () => setupCanvas(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [wordToWrite]);

  // --- Drawing handlers ---
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onStartDraw = (e) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const onDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onEndDraw = () => setIsDrawing(false);

  // --- Actions ---
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.width / dpr;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = Math.max(10, size / 28);
    drawGuideOnly();
    setDetectedText('');
    setIsCorrect(null);
    setAiExplanation('');
  };

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 128) return false;
    }
    return true;
  };

  const checkHandwriting = async () => {
    if (!canvasRef.current || isCanvasEmpty()) {
      toast.error('กรุณาเขียนอักษรก่อนตรวจสอบ');
      return;
    }
    setIsChecking(true);
    try {
      const imageData = canvasRef.current.toDataURL('image/png');
      const response = await fetch(getApiUrl('/student/writing/detect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ imageData, targetWord: wordToWrite })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      setDetectedText(data.data.detectedText || 'ไม่พบ');
      setIsCorrect(data.data.isCorrect);
      setAiExplanation(data.data.explanation || '');
      if (data.data.isCorrect) {
        const newCompleted = new Set([...completedWords, wordToWrite]);
        setCompletedWords(newCompleted);
        const allDone = words.every(w => newCompleted.has(w));
        if (allDone) {
          onComplete(step.id, wordToWrite, true, 100);
          toast.success('🎉 เสร็จแล้ว');
        } else {
          const nextIdx = words.findIndex((w, i) => i > currentWordIndex && !newCompleted.has(w));
          if (nextIdx !== -1) {
            toast.success(`ถูก ➜ ${words[nextIdx]}`);
            setTimeout(() => { setCurrentWordIndex(nextIdx); }, 600);
          }
        }
      } else {
        toast.error('ลองใหม่อีกครั้ง');
      }
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-3 py-1">
      {/* Hidden guide image loader */}
      <img
        ref={guideImgRef}
        src={getGuideImagePath(wordToWrite)}
        alt=""
        className="hidden"
        crossOrigin="anonymous"
        onLoad={() => { setupCanvas(true); }}
      />

      {/* Main Content: Info Left, Canvas Right */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.2fr_2.5fr] gap-4 px-2">

        {/* Left Column: Character Info & Selection */}
        <div className="flex flex-col gap-4 bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100/50 min-h-0">
          <div className="flex flex-col items-center gap-3 text-center shrink-0">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border-2 border-indigo-200 flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
              <span className="text-5xl font-black text-indigo-600">{wordToWrite}</span>
            </div>
            <div className="space-y-0.5">

              {/* [Requirement 5] Writing Slide Indicators */}
              {words.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pb-2">
                  {words.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentWordIndex ? 'w-6 bg-indigo-600' : 'w-1.5 bg-indigo-200'
                        }`}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-black text-gray-800">ฝึกลากเส้นประ</h3>
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">{currentWordIndex + 1} / {words.length}</span>
              </div>
              <p className="text-sm font-medium text-indigo-500">{step.content.question || 'ลากนิ้วตามตัวอักษรให้ถูกต้อง'}</p>
            </div>
          </div>

          {words.length > 1 && (
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">พยัญชนะ / สระ ในบทนี้</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-1.5">
                {words.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentWordIndex(i); setTimeout(clearCanvas, 10); }}
                    className={`w-10 h-10 rounded-xl text-lg font-black transition-all duration-300 transform hover:scale-110 shadow-sm ${completedWords.has(w)
                      ? 'bg-green-500 text-white shadow-green-200'
                      : i === currentWordIndex
                        ? 'bg-indigo-600 text-white shadow-indigo-200 ring-4 ring-indigo-100'
                        : 'bg-white text-gray-400 border-2 border-gray-100 hover:border-indigo-200 hover:text-indigo-500'
                      }`}
                  >
                    {completedWords.has(w) ? '✓' : w}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Large Canvas Area */}
        <div ref={containerRef} className="flex-1 min-h-0 flex items-center justify-center relative bg-white rounded-[2rem] border-2 border-dashed border-indigo-100 overflow-hidden shadow-inner">
          <div className="relative w-full h-full flex items-center justify-center p-3">
            <canvas
              ref={canvasRef}
              className="touch-none cursor-crosshair block max-w-full max-h-full"
              onMouseDown={onStartDraw}
              onMouseMove={onDraw}
              onMouseUp={onEndDraw}
              onMouseLeave={onEndDraw}
              onTouchStart={onStartDraw}
              onTouchMove={onDraw}
              onTouchEnd={onEndDraw}
            />
            {/* Quick-erase corner button */}
            <button
              onClick={clearCanvas}
              className="absolute top-4 right-4 p-3 bg-white/95 rounded-2xl shadow-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-300 z-10 group border border-gray-100"
              title="ล้างกระดาน"
            >
              <Eraser size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
            {/* Checking overlay */}
            {isChecking && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20 gap-3">
                <Loader className="w-12 h-12 text-indigo-600 animate-spin" strokeWidth={3} />
                <p className="text-indigo-600 text-lg font-black">กำลังตรวจสอบ...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer: AI Result & Progress & Action Buttons */}
      <div className="shrink-0 flex flex-col gap-3 pt-2 border-t border-gray-100">
        {/* AI result pill */}


        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={checkHandwriting}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-xl hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 shadow-indigo-200 shadow-lg"
          >
            {isChecking
              ? <><Loader size={24} className="animate-spin" /> ...</>
              : <><Check size={24} strokeWidth={3} /> ตรวจคำตอบ</>
            }
          </button>

          <button
            onClick={clearCanvas}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-gray-600 rounded-2xl font-bold text-xl hover:bg-gray-100 active:scale-95 transition-all duration-300 border-2 border-gray-200"
          >
            <RefreshCw size={24} />
            <span>เริ่มใหม่</span>
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}} />
    </div>
  );
};

// Summary Step Component
const SummaryStep = ({ step, postTestStatus, postTestId, onGoToPostTest }) => {
  const readAloud = (text) => () => { if (text) speakText(text, { rate: 0.55 }); };
  return (
    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md px-8 py-10 text-center"
      >
        <div className="text-7xl mb-4">🏆</div>
        <h2 className="text-4xl font-black text-blue-600 mb-8">
          เรียนจบแล้ว
        </h2>
        <button
          type="button"
          onClick={readAloud('เก่งมาก เรียนจบแล้ว กดปุ่มสีเขียวเพื่อทำแบบทดสอบหลังเรียนเลย')}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold transition"
        >
          <Volume2 size={22} />

        </button>
      </motion.div>
    </div>
  );
};

export default LessonDetailPage;
