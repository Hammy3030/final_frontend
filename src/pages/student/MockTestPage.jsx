import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Volume2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  FileText
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { getApiUrl } from '../../utils/apiConfig';
import { speak } from '../../utils/textToSpeech';
import { speakText } from '../../utils/speechHelper';
import { useAuth } from '../../contexts/AuthContext';
import AudioButton from '../../components/AudioButton';

const MockTestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testState, setTestState] = useState('intro'); // intro, testing, result
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPair, setSelectedPair] = useState(null); // For matching questions
  const [showReview, setShowReview] = useState(false); // To toggle answer summary

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(getApiUrl(`/lessons/tests/${testId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          const testData = response.data.data.test;
          const lessonId = testData.lessonId || testData.lesson_id || testData.lesson?.id || testData.lesson?._id;

          // Guard: บล็อกการเข้าแบบทดสอบโดยตรงถ้ายังไม่ปลดล็อกจาก flow หลัก
          if (lessonId && testData.type !== 'NORMAL') {
            try {
              const lessonsRes = await axios.get(getApiUrl('/student/lessons'), {
                headers: { Authorization: `Bearer ${token}` }
              });
              const lessons = lessonsRes.data?.data?.lessons || [];
              const sorted = [...lessons].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
              const lesson = sorted.find(l => String(l.id || l._id) === String(lessonId));
              const order = Number(lesson?.orderIndex ?? lesson?.chapter ?? 0);
              const prevLesson = order > 1
                ? sorted.find(l => Number(l.orderIndex ?? l.chapter ?? 0) === order - 1)
                : null;
              const prevCompleted = !prevLesson || (prevLesson?.progress?.hasPassedPostTest === true && prevLesson?.progress?.isCompleted === true);
              const preUnlocked = order <= 1 || prevCompleted;
              const postUnlocked = lesson?.progress?.isCompleted === true;

              if (testData.type === 'PRE_TEST' && !preUnlocked) {
                toast.error('แบบทดสอบนี้ยังไม่ปลดล็อก');
                navigate('/dashboard/student/lessons');
                return;
              }
              if (testData.type === 'POST_TEST' && !postUnlocked) {
                toast.error('ต้องเรียนบทเรียนให้จบก่อนทำ Post-test');
                navigate(`/dashboard/student/lessons/${lessonId}`);
                return;
              }
            } catch (_) {
              // ถ้าเช็กสถานะไม่ได้ ให้ fallback ต่อด้วย flow เดิม
            }
          }

          setTest(testData);
          setTimeLeft((testData.timeLimit || 30) * 60); // Convert to seconds
          setQuestions(testData.questions || []);

          // Fetch lesson games for the "Play Game" button
          const lid = testData.lessonId || testData.lesson_id;
          if (lid) {
            try {
              const lessonRes = await axios.get(getApiUrl(`/lessons/${lid}`), {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (lessonRes.data?.success) {
                setTest(prev => ({ ...prev, lesson: lessonRes.data.data.lesson }));
              }
            } catch (err) {
              console.warn('Could not fetch lesson games:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching test:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดแบบทดสอบ');
        navigate('/dashboard/student');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
  }, [testId, navigate]);

  // Reset selected pair when question changes
  useEffect(() => {
    setSelectedPair(null);
  }, [currentQuestionIndex]);

  useEffect(() => {
    // Timer
    if (testState === 'testing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [testState, timeLeft]);

  const startTest = () => {
    setTestState('testing');
    setAnswers({});
    setCurrentQuestionIndex(0);
    toast.success('เริ่มทำแบบทดสอบ');
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmitTest = async () => {
    const score = calculateScore();
    const timeSpent = test?.timeLimit ? (test.timeLimit * 60 - timeLeft) : null;

    // ตรวจสอบการทำ Post-Test ซ้ำ
    if (test?.type === 'POST_TEST' && userHasCompletedPostTest()) {
      toast.error('คุณทำ Post-Test แล้วและผ่านเกณฑ์ ไม่สามารถทำซ้ำได้');
      navigate('/dashboard/student/lessons');
      return;
    }

    // Prepare answers in the format expected by backend
    const formattedAnswers = {};
    questions.forEach(q => {
      const questionId = q._id || q.id;
      const answerKey = q._id || q.id;
      if (answers[answerKey] !== undefined) {
        formattedAnswers[questionId] = answers[answerKey];
      }
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/student/tests/${testId}/submit`),
        { answers: formattedAnswers, timeSpent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        setTestState('result');
        if (score >= (test?.passingScore || 60)) {
          setShowConfetti(true);
          toast.success(`🎉 คะแนน ${score}%`);
          // Mark the Post-Test as completed
          markPostTestCompleted();
        } else {
          toast.error(`คุณทำคะแนนได้ ${score}% แต่ต้องได้ ${test?.passingScore || 60}% ขึ้นไป`);
        }
      } else {
        toast.error('เกิดข้อผิดพลาดในการบันทึกผลแบบทดสอบ');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกผลแบบทดสอบ');
      setTestState('result');
    }
  };

  // Function to check if the user has already completed the Post-Test
  const userHasCompletedPostTest = () => {
    // ตรวจสอบสถานะจากฐานข้อมูลหรือการเก็บข้อมูล
    // เช่น จากการบันทึกผลการทำ Post-Test หรือจากค่าใน user หรือ test
    return user?.postTestCompleted || false; // ตัวอย่างตรวจสอบจากข้อมูลใน user
  };

  // Function to mark the Post-Test as completed
  const markPostTestCompleted = () => {
    // Update the user's status to reflect they have completed the Post-Test
    try {
      const token = localStorage.getItem('token');
      axios.post(
        getApiUrl(`/student/tests/${testId}/complete`), // API ที่จะอัปเดตสถานะ Post-Test
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error marking Post-Test as completed:', error);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const questionId = q._id || q.id;
      const userAnswer = answers[questionId];
      const correctAnswer = q.correctAnswer;

      if (q.isMultipleChoice) {
        // Multiple choice: compare arrays
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) {
            correct++;
          }
        }
      } else if (q.isMatching) {
        // Matching: check if all pairs are correct
        if (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)) {
          // User answer is an object like {0: 0, 1: 2} meaning pair 0 → option 0, pair 1 → option 2
          const matchingPairs = q.matchingPairs || [];
          let allCorrect = true;

          for (let i = 0; i < matchingPairs.length; i++) {
            const pair = matchingPairs[i];
            const userSelectedOption = userAnswer[i];
            const correctOptionIndex = q.options.indexOf(pair.right);

            if (userSelectedOption !== correctOptionIndex) {
              allCorrect = false;
              break;
            }
          }

          if (allCorrect && Object.keys(userAnswer).length === matchingPairs.length) {
            correct++;
          }
        } else if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) {
            correct++;
          }
        } else if (userAnswer === correctAnswer) {
          correct++;
        }
      } else {
        // Single choice: direct comparison
        if (userAnswer === correctAnswer) {
          correct++;
        }
      }
    });
    return questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  };

  const getCorrectCount = () => {
    let correct = 0;
    questions.forEach(q => {
      const questionId = q._id || q.id;
      const userAnswer = answers[questionId];
      const correctAnswer = q.correctAnswer;

      if (q.isMultipleChoice) {
        // Multiple choice: compare arrays
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) {
            correct++;
          }
        }
      } else if (q.isMatching) {
        // Matching: check if all pairs are correct
        if (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)) {
          // User answer is an object like {0: 0, 1: 2}
          const matchingPairs = q.matchingPairs || [];
          let allCorrect = true;

          for (let i = 0; i < matchingPairs.length; i++) {
            const pair = matchingPairs[i];
            const userSelectedOption = userAnswer[i];
            const correctOptionIndex = q.options.indexOf(pair.right);

            if (userSelectedOption !== correctOptionIndex) {
              allCorrect = false;
              break;
            }
          }

          if (allCorrect && Object.keys(userAnswer).length === matchingPairs.length) {
            correct++;
          }
        } else if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) {
            correct++;
          }
        } else if (userAnswer === correctAnswer) {
          correct++;
        }
      } else {
        // Single choice: direct comparison
        if (userAnswer === correctAnswer) {
          correct++;
        }
      }
    });
    return correct;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStarRating = (score) => {
    if (score >= 90) return 3;
    if (score >= 80) return 2;
    if (score >= 60) return 1;
    return 0;
  };

  // Format title to remove repetitive prefixes
  const formatTestTitle = (title) => {
    if (!title) return title;
    return title
      .replace(/แบบทดสอบ(ก่อน|หลัง)เรียน\s*[-\:]?\s*/g, '') // remove redundant prefix
      .replace(/บทที่ (\d+):/g, 'บทที่ $1:')
      .replace(/ก[–-]ง/g, 'ก-ง')
      .trim();
  };

  if (isLoading || !test || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-dvh bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>

        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionId = currentQuestion?._id || currentQuestion?.id;
  const isAnswered = answers[currentQuestionId] !== undefined;
  const allAnswered = questions.every(q => {
    const questionId = q._id || q.id;
    return answers[questionId] !== undefined;
  });

  return (
    <div className="h-dvh bg-gradient-to-br from-indigo-50 to-purple-100 overflow-hidden flex flex-col">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Intro Screen */}
      {testState === 'intro' && (
        <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 py-8 text-center overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
              <div className="absolute top-4 right-6 w-8 h-8 bg-yellow-300/30 rounded-full animate-pulse" />

              {/* Icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-3 shadow-lg border border-white/30"
              >
                <span className="text-3xl">
                  {test.type === 'PRE_TEST' ? '📝' : test.type === 'POST_TEST' ? '🏆' : '📋'}
                </span>
              </motion.div>

              {/* Type Badge */}
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-3xl font-bold uppercase tracking-wider mb-2">
                {test.type === 'PRE_TEST' ? 'แบบทดสอบก่อนเรียน' : test.type === 'POST_TEST' ? 'แบบทดสอบหลังเรียน' : 'แบบทดสอบ'}
              </div>

              {/* Title + Speaker */}
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-sm">
                  {formatTestTitle(test.title)}
                </h1>
                <button
                  onClick={() => speakText(formatTestTitle(test.title), { rate: 0.55 })}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors shrink-0 border border-white/30"
                  title="ฟังชื่อแบบทดสอบ"
                >
                  <Volume2 size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Details Section */}
            <div className="px-5 py-6 pb-5">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                <div className="bg-green-50/80 rounded-2xl p-2.5 sm:p-3 text-center border border-green-100 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-1.5">
                    <Clock className="text-blue-600" size={18} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-blue-600/80 font-bold mb-0.5">เวลา</p>
                  <p className="text-xs sm:text-sm font-black text-blue-800 leading-none">{test.timeLimit} นาที</p>
                </div>
                <div className="bg-purple-50/80 rounded-2xl p-2.5 sm:p-3 text-center border border-purple-100 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-1.5">
                    <AlertCircle className="text-purple-600" size={18} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-purple-600/80 font-bold mb-0.5">จำนวน</p>
                  <p className="text-xs sm:text-sm font-black text-purple-800 leading-none">{questions.length} ข้อ</p>
                </div>
                <div className="bg-amber-50/80 rounded-2xl p-2.5 sm:p-3 text-center border border-amber-100 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-1.5">
                    <Star className="text-amber-600 fill-amber-500" size={18} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-amber-600/80 font-bold mb-0.5">เกณฑ์ผ่าน</p>
                  {test.type === 'PRE_TEST' ? (
                    <p className="text-[10px] sm:text-xs font-bold text-amber-800/60 leading-none mt-1">ไม่มี</p>
                  ) : (
                    <p className="text-xs sm:text-sm font-black text-amber-800 leading-none">{test.passingScore}%</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startTest}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-lg rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <span className="text-2xl"></span> เริ่มทำแบบทดสอบ
                </motion.button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-2 flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 font-bold text-sm transition-colors rounded-xl hover:bg-gray-50"
                >
                  ← ย้อนกลับ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Testing Screen */}
      {testState === 'testing' && currentQuestion && (
        <div className="flex-1 min-h-0 flex flex-col p-2 sm:p-3 gap-2">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-2.5 sm:p-3 shrink-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <button
                onClick={() => {
                  if (confirm('คุณต้องการออกจากแบบทดสอบหรือไม่? ข้อมูลจะไม่ถูกบันทึก')) {
                    navigate('/dashboard/student');
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition text-xl sm:text-base shrink-0"
              >
                <ArrowLeft size={20} />
                ออก
              </button>

              <div className="flex items-center gap-2 text-red-600">
                <Clock size={20} className="sm:w-6 sm:h-6" />
                <span className="text-lg sm:text-2xl font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <FileText className="text-indigo-600 shrink-0" size={20} />
              <span className="text-xs sm:text-sm font-medium text-gray-700">กำลังทำแบบทดสอบ</span>
              {/* <AudioButton text="กำลังทำแบบทดสอบ" variant="mini" iconSize={14} /> */}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h2 className="text-base sm:text-1xl font-bold text-gray-900 truncate min-w-0">{formatTestTitle(test.title)}</h2>
                <AudioButton text={formatTestTitle(test.title)} variant="mini" iconSize={18} />
              </div>
              <span className="text-xl sm:text-base text-gray-600 shrink-0">
                ข้อ {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question - scrollable */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-xl shadow-lg p-2 sm:p-3 flex-1 flex flex-col h-full"
              >
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start gap-2 mb-2">
                    <AudioButton text={currentQuestion.question} variant="normal" iconSize={20} className="mt-1" />
                    <h4 className="text-base sm:text-2xl font-semibold text-gray-900 leading-snug break-words min-w-0">
                      {currentQuestion.question}
                    </h4>
                  </div>

                  <div className={`flex-1 grid grid-cols-1 ${currentQuestion.imageUrl && !currentQuestion.imageUrl.startsWith('emoji:') ? 'md:grid-cols-2' : ''} gap-4 min-h-[420px]`}>
                    {/* Left Side: Illustration / Media */}
                    {currentQuestion.imageUrl && !currentQuestion.imageUrl.startsWith('emoji:') && (
                      <div className="flex flex-col items-center justify-center p-2 sm:p-5 ">
                        <div className="w-68 h-68 sm:w-80 sm:h-80 bg-orange-100 rounded-3xl flex items-center justify-center border-2 border-white shadow-xl p-6 relative overflow-hidden group">
                          <div className="absolute inset-0  from-blue-50/50 to-purple-50/50 opacity-20 group-hover:opacity-100 transition-opacity" />
                          <img
                            src={currentQuestion.imageUrl}
                            alt="Question"
                            className="max-w-full max-h-full object-contain relative z-100 drop-shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<span class="text-80xl">🖼️</span>';
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Right Side: Options / Content */}
                    <div className="flex flex-col justify-center flex-1">



                      {currentQuestion.audioUrl && (
                        <div className="flex justify-center mb-6">
                          <button
                            onClick={() => toast.success('🔊 กำลังเล่นเสียง')}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                          >
                            <Volume2 size={20} />
                            ฟังเสียง
                          </button>
                        </div>
                      )}

                      {/* Options */}
                      {!currentQuestion.isMatching ? (
                        <>
                          {/* Show imageOptions as Row 1 for multiple choice */}
                          {currentQuestion.imageOptions && currentQuestion.imageOptions.length > 0 && currentQuestion.isMultipleChoice && (
                            <div className="mb-2">
                              <div className="grid grid-cols-2 gap-2">
                                {currentQuestion.imageOptions.map((imgUrl, imgIdx) => (
                                  <div key={imgIdx} className="bg-white rounded-xl border-2 border-gray-10 p-2 shadow-sm">
                                    <img
                                      src={imgUrl}
                                      alt={`Option ${imgIdx + 1}`}
                                      className="w-full h-20 sm:h-24 object-contain rounded-lg"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<div class="text-center text-gray-400 text-xs">ไม่พบรูป</div>';
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Row 2: Text options */}
                          <div className={`grid ${currentQuestion.isMultipleChoice ? 'grid-cols-4' : 'grid-cols-2'} gap-2`}>
                            {currentQuestion.options.map((option, index) => {
                              const questionId = currentQuestion._id || currentQuestion.id;
                              const isSelected = currentQuestion.isMultipleChoice
                                ? Array.isArray(answers[questionId]) && answers[questionId].includes(index)
                                : answers[questionId] === index;

                              // Extract emoji and text from option (format: "🐍 งู → ง")
                              const emojiMatch = option.match(/[\u{1F300}-\u{1F9FF}]/u);
                              const emoji = emojiMatch ? emojiMatch[0] : null;
                              const textParts = option.split('→');
                              const displayText = textParts.length > 1 ? textParts[1].trim() : option;

                              // Get corresponding image if imageOptions exist
                              // const optionImage = currentQuestion.imageOptions && currentQuestion.imageOptions[index];

                              // Kid-friendly background colors by index
                              const colors = [
                                'border-rose-200 bg-rose-50/30',
                                'border-amber-200 bg-amber-50/30',
                                'border-emerald-200 bg-emerald-50/30',
                                'border-sky-200 bg-sky-50/30',
                              ];
                              const colorClass = colors[index % colors.length];

                              return (
                                <motion.div  /* ✅ แก้จาก motion.button เป็น motion.div */
                                  key={index}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    if (currentQuestion.isMultipleChoice) {
                                      const currentAnswers = Array.isArray(answers[questionId]) ? answers[questionId] : [];
                                      const newAnswers = currentAnswers.includes(index)
                                        ? currentAnswers.filter(i => i !== index)
                                        : [...currentAnswers, index];
                                      handleAnswerSelect(questionId, newAnswers);
                                    } else {
                                      handleAnswerSelect(questionId, index);
                                    }
                                  }}
                                  className={`group relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${isSelected
                                    ? 'border-indigo-500 bg-indigo-50 shadow-xl ring-2 ring-indigo-200 ring-offset-2'
                                    : `${colorClass} hover:shadow-lg hover:border-indigo-300`
                                    }`}
                                >
                                  <div className="flex flex-col items-center justify-center gap-2">
                                    {emoji && !(currentQuestion.isMultipleChoice && currentQuestion.imageOptions) && (
                                      <div className="text-4xl mb-1 drop-shadow-sm">{emoji}</div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected
                                        ? 'border-indigo-500 bg-indigo-500 shadow-sm'
                                        : 'border-gray-300 bg-white group-hover:border-indigo-300'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full bg-white transition-transform ${isSelected ? 'scale-100' : 'scale-0'}`} />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-sm sm:text-lg font-black text-center leading-tight ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                          {displayText}
                                        </span>
                                        {/* ✅ ใส่ onClick stopPropagation เพื่อไม่ให้กดเสียงแล้วเป็นการเลือกคำตอบซ้ำ */}
                                        <AudioButton
                                          text={displayText}
                                          variant="mini"
                                          iconSize={12}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        /* Matching Question - Simple Inline Interface */
                        <div className="space-y-4 text-center flex flex-col items-center -mt-10">
                          {/* Simple instruction */}
                          <div className="flex items-center justify-center gap-3 bg-indigo-50/50 px-6 py-2 rounded-full border border-indigo-100 shadow-sm">
                            <p className="text-xl sm:text-2xl font-black text-indigo-600">
                              แตะที่ตัวพยัญชนะ แล้วเลือกรูปภาพที่ตรงกัน
                            </p>
                            <AudioButton text="แตะที่ตัวพยัญชนะ แล้วเลือกรูปภาพที่ตรงกันน้าค้าบ" variant="mini" iconSize={24} />
                          </div>

                          {/* Matching rows - each pair is a row */}
                          <div className="space-y-4 w-full max-w-4xl mx-auto">
                            {currentQuestion.matchingPairs && currentQuestion.matchingPairs.map((pair, pairIdx) => {
                              const questionId = currentQuestion._id || currentQuestion.id;
                              const userMatches = answers[questionId] || {};
                              const selectedOption = userMatches[pairIdx];
                              const isActive = selectedPair === pairIdx;
                              const matchedImage = currentQuestion.imageOptions?.[selectedOption];

                              return (
                                <div key={pairIdx} className="flex items-center gap-2">
                                  {/* Left: Consonant button */}
                                  <motion.div /* ✅ แก้จาก motion.button เป็น motion.div */
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedPair(isActive ? null : pairIdx)}
                                    className={`w-20 h-20 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[2rem] border-4 flex items-center justify-center text-3xl sm:text-5xl font-black shrink-0 transition-all cursor-pointer ${isActive
                                      ? 'border-indigo-500 bg-indigo-500 text-white shadow-xl scale-105'
                                      : selectedOption !== undefined
                                        ? 'border-green-400 bg-green-50 text-green-700 shadow-lg'
                                        : 'border-gray-200 bg-white text-indigo-600 hover:border-indigo-300 shadow-md'
                                      }`}
                                  >
                                    {pair.left}
                                  </motion.div>

                                  {/* Arrow */}
                                  <span className="text-gray-300 text-2xl shrink-0 font-bold">→</span>

                                  {/* Right: Option choices or matched result */}
                                  {selectedOption !== undefined ? (
                                    <div className="flex-1 flex items-center gap-4 bg-green-50 border-4 border-green-200 rounded-[2rem] px-6 py-4 shadow-inner">
                                      {matchedImage && (
                                        <img src={matchedImage} alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md" />
                                      )}
                                      <span className="text-xl font-black text-green-700">{currentQuestion.options?.[selectedOption]}</span>
                                      <span className="text-green-500 ml-auto text-2xl font-bold">✓</span>
                                      <button
                                        onClick={() => {
                                          const newMatches = { ...userMatches };
                                          delete newMatches[pairIdx];
                                          handleAnswerSelect(questionId, newMatches);
                                        }}
                                        className="p-2 text-red-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-full"
                                      >
                                        <XCircle size={24} />
                                      </button>
                                    </div>
                                  ) : isActive ? (
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      {currentQuestion.options.map((option, index) => {
                                        const isUsed = Object.values(userMatches).includes(index);
                                        const optionImage = currentQuestion.imageOptions?.[index];

                                        return (
                                          <motion.div
                                            key={index}
                                            whileHover={!isUsed ? { scale: 1.02, x: 5 } : {}}
                                            whileTap={!isUsed ? { scale: 0.95 } : {}}
                                            onClick={() => {
                                              if (!isUsed) {
                                                const newMatches = { ...userMatches, [pairIdx]: index };
                                                handleAnswerSelect(questionId, newMatches);
                                                setSelectedPair(null);
                                              }
                                            }}
                                            /* ปรับจาก grid ธรรมดา เป็น Card ที่มีขนาดสูงขึ้น (h-16) และตัวหนังสือใหญ่ขึ้น */
                                            className={`flex items-center gap-4 px-4 py-3 rounded-[1.5rem] border-3 transition-all cursor-pointer ${isUsed
                                              ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                                              : 'border-indigo-300 bg-white hover:border-indigo-500 hover:bg-indigo-50 shadow-md hover:shadow-lg'
                                              }`}
                                          >
                                            {/* ขยายขนาดรูปตัวเลือกจาก w-8 เป็น w-14 */}
                                            {optionImage && (
                                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl p-1 shadow-sm border border-gray-100 flex-shrink-0">
                                                <img
                                                  src={optionImage}
                                                  alt={option}
                                                  className="w-full h-full object-contain"
                                                />
                                              </div>
                                            )}

                                            {/* ขยายขนาดตัวหนังสือจาก text-xs เป็น text-lg */}
                                            <span className={`text-base sm:text-2xl font-black ${isUsed ? 'text-gray-400' : 'text-indigo-900'
                                              } truncate`}>
                                              {option}
                                            </span>

                                            {/* เพิ่มลูกศรเล็กๆ เพื่อบอกว่า "กดเลือกอันนี้" */}
                                            {!isUsed && (
                                              <div className="ml-auto text-indigo-300 group-hover:text-indigo-500">
                                                <ChevronRight size={24} />
                                              </div>
                                            )}
                                          </motion.div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setSelectedPair(pairIdx)}
                                      className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 text-sm font-medium hover:border-indigo-300 hover:text-indigo-400 transition-colors text-center"
                                    >
                                      แตะเพื่อเลือก
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div> {/* Closes Right Side: Options / Content (Line 470) */}
                  </div> {/* Closes Question Grid (Line 450) */}
                </div> {/* Closes Question Wrapper (Line 436) */}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation + Answer Dots - fixed bottom */}
          <div className="bg-white rounded-xl shadow-lg p-2 sm:p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => {
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                  setSelectedPair(null);
                }}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${currentQuestionIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-500'
                  }`}
              >
                <ChevronLeft size={16} />
                ก่อนหน้า
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => {
                    setCurrentQuestionIndex(currentQuestionIndex + 1);
                    setSelectedPair(null);
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-indigo-500 text-white rounded-lg font-semibold text-sm hover:bg-indigo-600 transition"
                >
                  ถัดไป
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmitTest}
                  disabled={!allAnswered}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-sm transition shadow-md ${!allAnswered
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                    }`}
                >
                  <CheckCircle size={18} />
                  ส่งคำตอบ
                </button>
              )}
            </div>

            {/* Question dots */}
            <div className="flex justify-center gap-1 sm:gap-1.5 flex-wrap overflow-x-auto py-1">
              {questions.map((q, idx) => {
                const questionId = q._id || q.id;
                const isAnswered = answers[questionId] !== undefined;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setSelectedPair(null);
                    }}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${isCurrent
                      ? 'bg-indigo-500 ring-2 ring-indigo-200 scale-125'
                      : isAnswered
                        ? 'bg-green-400'
                        : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    title={`ข้อที่ ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {testState === 'result' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 flex items-start justify-center">
          {!showReview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              {/* Premium Gradient Header */}
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 px-6 py-10 text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 100 }}
                  className="text-7xl mb-4 relative z-10 drop-shadow-lg"
                >
                  {calculateScore() >= (test?.passingScore || 60) ? '🏆' : '💪'}
                </motion.div>

                <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-sm">
                    {calculateScore() >= (test?.passingScore || 60) ? ' สอบผ่านแล้ว' : 'พยายามเข้านะ'}
                  </h2>
                  <AudioButton
                    text={calculateScore() >= (test?.passingScore || 60) ? 'คุณสอบผ่านแล้ว เก่งมากเลย' : 'พยายามเข้านะ ลองทำใหม่อีกครั้ง'}
                    variant="mini"
                    className="!bg-white/20 !text-white hover:!bg-white/40"
                    iconSize={20}
                  />
                </div>

                <div className="flex justify-center gap-2">
                  {[1, 2, 3].map((star) => (
                    <motion.div
                      key={star}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{
                        scale: star <= getStarRating(calculateScore()) ? 1 : 0.8,
                        rotate: 0,
                        opacity: star <= getStarRating(calculateScore()) ? 1 : 0.4
                      }}
                      transition={{ delay: 0.2 + (star * 0.1) }}
                    >
                      <Star
                        size={32}
                        className={star <= getStarRating(calculateScore())
                          ? 'text-yellow-300 fill-yellow-300 drop-shadow-md'
                          : 'text-white/30'
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-8">
                <div className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-6 mb-8 shadow-inner">
                  <div className="flex justify-around items-end">
                    <div className="text-center">
                      <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">คะแนน</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-black text-indigo-600 leading-none">{calculateScore()}</span>
                        <span className="text-xl font-bold text-indigo-300">/100</span>
                        <AudioButton text={`คุณได้ ${calculateScore()} คะแนน`} variant="mini" iconSize={14} className="ml-1" />
                      </div>
                    </div>
                    <div className="w-px h-12 bg-indigo-100" />
                    <div className="text-center">
                      <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-1">ถูกต้อง</p>
                      <div className="flex items-baseline justify-center">
                        <span className="text-5xl font-black text-purple-600 leading-none">{getCorrectCount()}</span>
                        <span className="text-xl font-bold text-purple-300 ml-1">/{questions.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {test?.type === 'POST_TEST' && calculateScore() < (test?.passingScore || 60) ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startTest}
                      className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-black text-lg hover:shadow-xl transition shadow-lg shadow-indigo-100"
                    >
                      🔄 ลองทำใหม่อีกครั้ง
                    </motion.button>
                  ) : test?.type === 'PRE_TEST' ? (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const lessonId = test?.lessonId || test?.lesson_id || test?.lesson?.id || test?.lesson?._id;
                        if (lessonId) {
                          navigate(`/dashboard/student/lessons/${lessonId}`);
                        } else {
                          navigate('/dashboard/student/lessons');
                        }
                      }}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-black text-lg hover:shadow-xl transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      <span className="text-2xl"></span>
                      ไปเรียนบทเรียนต่อ
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const isTeacher = user?.role === 'TEACHER';
                        const lessonId = test?.lessonId || test?.lesson_id;

                        // Try to find the first playable game for students
                        const playableGames = (test?.lesson?.games || []).filter(g => !g?.isDeleted && g?.type !== 'DRAG_DROP');
                        const firstGameId = playableGames.length > 0 ? (playableGames[0].id || playableGames[0]._id) : null;

                        if (test?.type === 'POST_TEST' && !isTeacher && firstGameId) {
                          navigate(`/dashboard/student/games/${firstGameId}`);
                        } else if (lessonId) {
                          navigate(isTeacher ? `/dashboard/teacher/lessons/${lessonId}` : `/dashboard/student/lessons/${lessonId}`);
                        } else {
                          navigate(isTeacher ? '/dashboard/teacher' : '/dashboard/student');
                        }
                      }}
                      className="w-full py-4 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 text-white rounded-2xl font-black text-lg hover:shadow-xl transition shadow-lg shadow-orange-100 flex items-center justify-center gap-2"
                    >
                      <span className="text-2xl animate-bounce">{test?.type === 'POST_TEST' ? '🎮' : '📚'}</span>
                      {test?.type === 'POST_TEST' ? 'ไปเล่นเกมกัน' : 'กลับไปบทเรียน'}
                    </motion.button>
                  )}

                  <button
                    onClick={() => setShowReview(true)}
                    className="w-full py-3.5 bg-white text-gray-500 hover:text-indigo-600 font-bold text-base rounded-2xl transition border-2 border-gray-100 hover:border-indigo-100 flex items-center justify-center gap-2"
                  >
                    <FileText size={20} />
                    ดูสรุปคำตอบละเอียด
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Answer Summary View */
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col h-[85vh]"
            >
              {/* Summary Header */}
              <div className="p-5 border-b flex items-center justify-between bg-indigo-50/50">
                <button
                  onClick={() => setShowReview(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors"
                >
                  <ArrowLeft size={24} className="text-indigo-600" />
                </button>
                <h3 className="text-xl font-black text-indigo-900">สรุปคำตอบของคุณ</h3>
                <div className="w-10" />
              </div>

              {/* Summary List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-6">
                {questions.map((q, idx) => {
                  const questionId = q._id || q.id;
                  const userAnswer = answers[questionId];
                  const correctAnswer = q.correctAnswer;

                  let isCorrect = false;
                  if (q.isMatching) {
                    const matchingPairs = q.matchingPairs || [];
                    isCorrect = true;
                    for (let i = 0; i < matchingPairs.length; i++) {
                      if (userAnswer?.[i] !== q.options.indexOf(matchingPairs[i].right)) {
                        isCorrect = false; break;
                      }
                    }
                  } else if (q.isMultipleChoice) {
                    isCorrect = [...(userAnswer || [])].sort().join(',') === [...(correctAnswer || [])].sort().join(',');
                  } else {
                    isCorrect = userAnswer === correctAnswer;
                  }

                  const getAnswerLabel = (val) => {
                    if (val === undefined || val === null) return 'ไม่ได้ตอบ';
                    if (Array.isArray(val)) return val.map(idx => q.options[idx]).join(', ');
                    if (typeof val === 'object') {
                      return (q.matchingPairs || []).map((pair, i) => `${pair.left} → ${q.options[val[i]] || '?'}`).join(', ');
                    }
                    return q.options[val] || val;
                  };

                  const getCorrectLabel = () => {
                    if (q.isMatching) {
                      return (q.matchingPairs || []).map(p => `${p.left} → ${p.right}`).join(', ');
                    }
                    if (Array.isArray(correctAnswer)) return correctAnswer.map(idx => q.options[idx]).join(', ');
                    return q.options[correctAnswer] || correctAnswer;
                  };

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`relative p-5 rounded-3xl border-2 transition-all ${isCorrect ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'
                        }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`mt-1 p-2 rounded-2xl ${isCorrect ? 'bg-green-500 shadow-green-100' : 'bg-red-500 shadow-red-100'} shadow-lg text-white shrink-0`}>
                          {isCorrect ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              ข้อที่ {idx + 1}
                            </span>
                            <button
                              onClick={() => {
                                const ans = getAnswerLabel(userAnswer);
                                const cor = getCorrectLabel();
                                let text = `โจทย์คือ ${q.question} คุณตอบ ${ans}`;
                                if (!isCorrect) {
                                  text += ` แต่คำตอบที่ถูกคือ ${cor}`;
                                } else {
                                  text += ` ถูกต้องเก่งมากค่ะ`;
                                }
                                speakText(text);
                              }}
                              className="p-1 text-indigo-400 hover:text-indigo-600"
                            >
                              <Volume2 size={16} />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-gray-800 leading-snug">{q.question}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
                        <div className="p-3 bg-white/60 rounded-2xl border border-white shadow-sm">
                          <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-wider">คุณตอบ:</p>
                          <p className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{getAnswerLabel(userAnswer)}</p>
                        </div>
                        {!isCorrect && (
                          <div className="p-3 bg-green-50/50 rounded-2xl border border-green-100 shadow-sm">
                            <p className="text-[10px] text-green-400 font-black uppercase mb-1 tracking-wider">คำตอบที่ถูก:</p>
                            <p className="text-sm font-bold text-green-600">{getCorrectLabel()}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-5 border-t bg-gray-50/50">
                <button
                  onClick={() => setShowReview(false)}
                  className="w-full py-3 bg-white text-indigo-600 font-black rounded-2xl border-2 border-indigo-100 hover:bg-indigo-50 transition"
                >
                  กลับไปหน้าคะแนน
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default MockTestPage;
