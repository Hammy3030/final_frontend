import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Volume2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Target
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { getApiUrl } from '../../utils/apiConfig';
import { speakText } from '../../utils/speechHelper';
import { useAuth } from '../../contexts/AuthContext';
import AudioButton from '../../components/AudioButton';

const StudentTestPage = () => {
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
          setTest(testData);
          setTimeLeft((testData.timeLimit || 30) * 60); // Convert to seconds
          setQuestions(testData.questions || []);

          // Fetch lesson games for the "Play Game" button if needed
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

  useEffect(() => {
    setSelectedPair(null);
  }, [currentQuestionIndex]);

  useEffect(() => {
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
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = async () => {
    const score = calculateScore();
    const timeSpent = test?.timeLimit ? (test.timeLimit * 60 - timeLeft) : null;

    const formattedAnswers = {};
    questions.forEach(q => {
      const questionId = q._id || q.id;
      if (answers[questionId] !== undefined) {
        formattedAnswers[questionId] = answers[questionId];
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
          toast.success(`คะแนน ${score}%`);
        }
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกผลแบบทดสอบ');
      setTestState('result');
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const questionId = q._id || q.id;
      const userAnswer = answers[questionId];
      const correctAnswer = q.correctAnswer;

      if (q.isMultipleChoice) {
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) correct++;
        }
      } else if (q.isMatching) {
        if (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)) {
          const matchingPairs = q.matchingPairs || [];
          let allCorrect = true;
          for (let i = 0; i < matchingPairs.length; i++) {
            const correctOptionIndex = q.options.indexOf(matchingPairs[i].right);
            if (userAnswer[i] !== correctOptionIndex) {
              allCorrect = false;
              break;
            }
          }
          if (allCorrect && Object.keys(userAnswer).length === matchingPairs.length) correct++;
        }
      } else {
        if (userAnswer === correctAnswer) correct++;
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
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
          const userSorted = [...userAnswer].sort().join(',');
          const correctSorted = [...correctAnswer].sort().join(',');
          if (userSorted === correctSorted) correct++;
        }
      } else if (q.isMatching) {
        if (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)) {
          const matchingPairs = q.matchingPairs || [];
          let allCorrect = true;
          for (let i = 0; i < matchingPairs.length; i++) {
            const correctOptionIndex = q.options.indexOf(matchingPairs[i].right);
            if (userAnswer[i] !== correctOptionIndex) {
              allCorrect = false;
              break;
            }
          }
          if (allCorrect && Object.keys(userAnswer).length === matchingPairs.length) correct++;
        }
      } else {
        if (userAnswer === correctAnswer) correct++;
      }
    });
    return correct;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTestTitle = (title) => {
    if (!title) return title;
    return title.replace(/แบบทดสอบ(ก่อน|หลัง)เรียน\s*[-\:]?\s*/g, '').trim();
  };

  const getStarRating = (score) => {
    if (score >= 90) return 3;
    if (score >= 80) return 2;
    if (score >= 60) return 1;
    return 0;
  };

  if (isLoading || !test || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-dvh bg-gradient-to-br from-indigo-50 to-purple-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-indigo-500 mx-auto"></div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionId = currentQuestion?._id || currentQuestion?.id;
  const allAnswered = questions.every(q => answers[q._id || q.id] !== undefined);

  return (
    <div className="h-dvh bg-gradient-to-br from-indigo-50 to-purple-100 overflow-hidden flex flex-col font-prompt">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      {/* Intro Screen */}
      {testState === 'intro' && (
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-10 text-center text-white relative">
              <div className="text-6xl mb-4">{test.type === 'PRE_TEST' ? '📝' : '🏆'}</div>
              <h1 className="text-3xl font-black mb-2">{formatTestTitle(test.title)}</h1>
              <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-bold uppercase tracking-widest">
                {test.type === 'PRE_TEST' ? 'แบบทดสอบก่อนเรียน' : 'แบบทดสอบหลังเรียน'}
              </div>
            </div>
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="mb-10 flex flex-col items-center justify-center">
                <AudioButton 
                  text={test.type === 'PRE_TEST' 
                    ? "มาลองทำกันเถอะ ไม่มีสอบตกจ้า" 
                    : "แบบทดสอบหลังเรียน ต้องได้คะแนนเกินหกสิบเปอร์เซ็นต์ถึงจะผ่านนะจ๊ะ"} 
                  variant="large" 
                  iconSize={64} 
                  className="bg-indigo-500 text-white border-indigo-400 shadow-2xl scale-125 hover:scale-150 transition-transform"
                  autoPlay={true}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100">
                  <Clock className="mx-auto mb-1 text-indigo-500" size={24} />
                  <p className="text-xs text-indigo-400 font-bold uppercase">เวลา</p>
                  <p className="text-xl font-black text-indigo-900">{test.timeLimit} นาที</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-3xl border border-purple-100">
                  <FileText className="mx-auto mb-1 text-purple-500" size={24} />
                  <p className="text-xs text-purple-400 font-bold uppercase">จำนวน</p>
                  <p className="text-xl font-black text-purple-900">{questions.length} ข้อ</p>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startTest} className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-indigo-100">
                เริ่มทำแบบทดสอบ
              </motion.button>
              <button onClick={() => navigate(-1)} className="mt-4 text-gray-400 font-bold hover:text-gray-600 transition">ย้อนกลับ</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Testing Screen - FIXED VIEWPORT, NO SCROLL */}
      {testState === 'testing' && currentQuestion && (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Header Bar - Fixed Height */}
          <div className="h-16 sm:h-20 bg-white border-b-4 border-indigo-100 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm relative z-20">
            <button onClick={() => confirm('ต้องการออกจากแบบทดสอบหรือไม่?') && navigate(-1)} className="flex items-center gap-2 text-gray-500 font-black hover:text-indigo-600 transition shrink-0">
              <ArrowLeft size={24} /> <span className="hidden sm:inline">ออก</span>
            </button>
            <div className="flex-1 flex justify-center px-4">
              <div className="w-full max-w-md bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                <motion.div initial={{ width: 0 }} animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-2xl border-2 border-red-100 shrink-0">
              <Clock className="text-red-500" size={20} />
              <span className="text-lg font-black text-red-600">{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Main Question Area - Takes up remaining screen */}
          <div className="flex-1 min-h-0 p-3 sm:p-6 lg:p-8 flex flex-col gap-4 overflow-hidden">
            {/* Question Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border-4 border-white flex-1 flex flex-col p-4 sm:p-6 min-h-0 overflow-hidden relative">
              {/* Question Text & Audio */}
              <div className="flex items-start gap-3 mb-4 shrink-0">
                <AudioButton text={currentQuestion.question} variant="normal" iconSize={24} className="shrink-0 mt-1" />
                <h2 className="text-xl sm:text-3xl font-black text-indigo-900 leading-tight flex-1">
                  {currentQuestion.question}
                </h2>
                <div className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shrink-0">
                   <span className="text-indigo-600 font-black">ข้อ {currentQuestionIndex + 1}/{questions.length}</span>
                </div>
              </div>

              {/* Media and Options Row */}
              <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 overflow-hidden">
                {!currentQuestion.isMatching ? (
                  <>
                    {/* Media Section - Scales to fit */}
                    {currentQuestion.imageUrl && !currentQuestion.imageUrl.startsWith('emoji:') && (
                      <div className="flex-1 min-h-0 flex items-center justify-center bg-indigo-50/30 rounded-[2rem] border-2 border-indigo-50 overflow-hidden p-4">
                        <img src={currentQuestion.imageUrl} alt="Question" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                      </div>
                    )}

                    {/* Options Section - Scales to fit */}
                    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto lg:overflow-hidden scrollbar-hide">
                      <div className={`grid ${currentQuestion.imageUrl ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'} gap-3 sm:gap-4 h-full content-center`}>
                        {currentQuestion.options.map((option, index) => {
                          const questionId = currentQuestion._id || currentQuestion.id;
                          const isSelected = currentQuestion.isMultipleChoice
                            ? Array.isArray(answers[questionId]) && answers[questionId].includes(index)
                            : answers[questionId] === index;
                          const optionImage = currentQuestion.imageOptions && currentQuestion.imageOptions[index];
                          const displayText = option.split('→').pop().trim();
                          const colors = ['border-rose-200 bg-rose-50/40', 'border-amber-200 bg-amber-50/40', 'border-emerald-200 bg-emerald-50/40', 'border-sky-200 bg-sky-50/40'];

                          return (
                            <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {
                              if (currentQuestion.isMultipleChoice) {
                                const curr = Array.isArray(answers[questionId]) ? answers[questionId] : [];
                                handleAnswerSelect(questionId, curr.includes(index) ? curr.filter(i => i !== index) : [...curr, index]);
                              } else {
                                handleAnswerSelect(questionId, index);
                              }
                            }} className={`p-3 rounded-3xl border-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[100px] sm:min-h-[140px] ${isSelected ? 'border-indigo-500 bg-indigo-100 shadow-lg' : `${colors[index % colors.length]} hover:border-indigo-300`}`}>
                              {optionImage && <img src={optionImage} className="h-16 sm:h-24 object-contain mb-1" />}
                              <div className="flex items-center gap-2">
                                <span className={`text-xl sm:text-2xl font-black text-center ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{displayText}</span>
                                <AudioButton text={displayText} variant="mini" iconSize={16} className="shrink-0" onClick={e => e.stopPropagation()} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Matching Question - Reverted to Original Left-Right UI */
                  <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
                    <div className="flex items-center justify-center gap-3 bg-indigo-50/50 px-6 py-2 rounded-full border border-indigo-100 shadow-sm shrink-0 w-fit mx-auto">
                      <p className="text-base sm:text-xl font-black text-indigo-600">แตะที่ตัวเลือกฝั่งซ้าย แล้วเลือกคู่ที่ถูกต้อง</p>
                      <AudioButton text="แตะที่ตัวเลือกฝั่งซ้าย แล้วเลือกคู่ที่ถูกต้อง" variant="mini" iconSize={20} />
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4">
                      {currentQuestion.matchingPairs && currentQuestion.matchingPairs.map((pair, pairIdx) => {
                        const questionId = currentQuestion._id || currentQuestion.id;
                        const userMatches = answers[questionId] || {};
                        const selectedOption = userMatches[pairIdx];
                        const isActive = selectedPair === pairIdx;
                        const matchedImage = currentQuestion.imageOptions?.[selectedOption];

                        return (
                          <div key={pairIdx} className="flex items-center gap-4">
                            {/* Left: Item button */}
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedPair(isActive ? null : pairIdx)}
                              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-4 flex items-center justify-center text-2xl sm:text-4xl font-black shrink-0 transition-all ${isActive
                                ? 'border-indigo-500 bg-indigo-500 text-white shadow-xl scale-105'
                                : selectedOption !== undefined
                                  ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-lg'
                                  : 'border-gray-200 bg-white text-indigo-600 hover:border-indigo-300 shadow-md'
                                }`}
                            >
                              {pair.left}
                            </motion.button>

                            <span className="text-gray-300 text-2xl shrink-0">→</span>

                            {/* Right: Option choices or matched result */}
                            {selectedOption !== undefined ? (
                              <div className="flex-1 flex items-center gap-4 bg-blue-50 border-4 border-blue-200 rounded-3xl px-6 py-4 shadow-inner min-h-[80px] sm:min-h-[96px]">
                                {matchedImage && (
                                  <img src={matchedImage} alt="" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
                                )}
                                <span className="text-lg sm:text-2xl font-black text-blue-700">{currentQuestion.options?.[selectedOption]}</span>
                                <button
                                  onClick={() => {
                                    const newMatches = { ...userMatches };
                                    delete newMatches[pairIdx];
                                    handleAnswerSelect(questionId, newMatches);
                                  }}
                                  className="ml-auto p-2 text-red-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 size={24} />
                                </button>
                              </div>
                            ) : isActive ? (
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {currentQuestion.options.map((option, index) => {
                                  const isUsed = Object.values(userMatches).includes(index);
                                  const optionImage = currentQuestion.imageOptions?.[index];

                                  return (
                                    <motion.button
                                      key={index}
                                      whileHover={!isUsed ? { scale: 1.02 } : {}}
                                      whileTap={!isUsed ? { scale: 0.95 } : {}}
                                      onClick={() => {
                                        if (!isUsed) {
                                          const newMatches = { ...userMatches, [pairIdx]: index };
                                          handleAnswerSelect(questionId, newMatches);
                                          setSelectedPair(null);
                                        }
                                      }}
                                      className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 transition-all text-left ${isUsed
                                        ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                                        : 'border-indigo-100 bg-white hover:border-indigo-500 hover:bg-indigo-50 shadow-sm'
                                        }`}
                                    >
                                      {optionImage && <img src={optionImage} alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />}
                                      <span className="text-sm sm:text-base font-bold text-gray-700 truncate">{option}</span>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedPair(pairIdx)}
                                className="flex-1 py-4 border-4 border-dashed border-gray-200 rounded-3xl text-gray-400 font-black hover:border-indigo-300 hover:text-indigo-400 transition-all text-lg sm:text-xl"
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
              </div>
            </div>

            {/* Nav Buttons - Fixed Bottom */}
            <div className="h-16 flex items-center justify-between gap-4 shrink-0">
              <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className={`h-full px-6 rounded-2xl font-black text-lg flex items-center gap-2 transition ${currentQuestionIndex === 0 ? 'bg-gray-200 text-gray-400 opacity-50' : 'bg-white text-indigo-600 border-2 border-indigo-100 hover:border-indigo-500'}`}>
                <ChevronLeft size={24} /> ก่อนหน้า
              </button>
              
              <div className="flex-1 flex justify-center gap-1.5">
                {questions.map((_, idx) => (
                  <div key={idx} className={`w-3 h-3 rounded-full transition-all ${idx === currentQuestionIndex ? 'bg-indigo-500 scale-125' : answers[questions[idx]._id || questions[idx].id] !== undefined ? 'bg-green-400' : 'bg-gray-300'}`} />
                ))}
              </div>

              {currentQuestionIndex < questions.length - 1 ? (
                <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="h-full px-8 bg-indigo-500 text-white rounded-2xl font-black text-lg flex items-center gap-2 hover:bg-indigo-600 transition shadow-lg shadow-indigo-100">
                  ถัดไป <ChevronRight size={24} />
                </button>
              ) : (
                <button onClick={handleSubmitTest} disabled={!allAnswered} className={`h-full px-8 rounded-2xl font-black text-lg flex items-center gap-2 transition shadow-lg ${allAnswered ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-green-100' : 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'}`}>
                  <CheckCircle size={24} /> ส่งคำตอบ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {testState === 'result' && (
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden text-center">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-12 text-white relative flex flex-col items-center">
              <div className="text-8xl mb-6 drop-shadow-xl">
                {test.type === 'PRE_TEST' ? '✨' : calculateScore() >= 60 ? '🏆' : '✌🏻'}
              </div>
              <AudioButton 
                text={test.type === 'PRE_TEST' ? 'เก่งมากเลยจ้า ทำเสร็จแล้ว' : calculateScore() >= 60 ? 'เย้! เก่งมาก สอบผ่านแล้วนะ' : 'ไม่เป็นไรนะจ๊ะ ลองพยายามใหม่อีกครั้งนะ'} 
                variant="large" 
                iconSize={48} 
                className="bg-white/20 text-white border-white/30 mb-6 scale-110"
                autoPlay={true}
              />
              {test.type === 'POST_TEST' && (
                <div className="flex justify-center gap-3">
                  {[1, 2, 3].map(s => <Star key={s} size={40} className={s <= getStarRating(calculateScore()) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />)}
                </div>
              )}
            </div>
            <div className="p-8">
              <div className="bg-indigo-50 rounded-3xl p-6 mb-8 flex justify-around">
                <div>
                  <p className="text-xs font-black text-indigo-400 uppercase mb-1">คะแนน</p>
                  <p className="text-4xl font-black text-indigo-600">{calculateScore()}%</p>
                </div>
                <div className="w-px bg-indigo-100 h-10 self-center" />
                <div>
                  <p className="text-xs font-black text-indigo-400 uppercase mb-1">ถูกต้อง</p>
                  <p className="text-4xl font-black text-indigo-600">{getCorrectCount()}/{questions.length}</p>
                </div>
              </div>
              <div className="space-y-4">
                {test.type === 'PRE_TEST' ? (
                  <>
                    <motion.button whileHover={{ y: -4 }} onClick={() => navigate(`/dashboard/student/lessons/${test.lessonId || test.lesson_id}`)} className="w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
                      📖 เข้าสู่บทเรียน
                    </motion.button>
                    <button onClick={() => navigate('/dashboard/student/lessons')} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition">
                      กลับหน้าหลัก
                    </button>
                  </>
                ) : calculateScore() >= 60 ? (
                  <>
                    <motion.button 
                      whileHover={{ y: -4 }} 
                      onClick={() => {
                        const gameId = test?.lesson?.games?.[0]?._id || test?.lesson?.games?.[0]?.id;
                        if (gameId) {
                          navigate(`/dashboard/student/games/${gameId}`);
                        } else {
                          navigate('/dashboard/student/lessons');
                        }
                      }} 
                      className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                    >
                      🎮 ไปเล่นเกม
                    </motion.button>
                    <button onClick={() => navigate('/dashboard/student/lessons')} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition">
                      กลับหน้าหลัก
                    </button>
                  </>
                ) : (
                  <>
                    <motion.button whileHover={{ y: -4 }} onClick={startTest} className="w-full py-5 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-orange-100 flex items-center justify-center gap-3">
                      ทำใหม่อีกครั้ง
                    </motion.button>
                    <button onClick={() => navigate('/dashboard/student/lessons')} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition">
                      กลับหน้าหลัก
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentTestPage;
