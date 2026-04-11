import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  ChevronRight,
  ChevronLeft,
  Home
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { speakText, stopSpeech } from '../../utils/speechHelper';
import { getApiUrl } from '../../utils/apiConfig';

const KidFriendlyLessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(getApiUrl(`/lessons/${lessonId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data?.success) {
          setLesson(res.data.data.lesson);
        }
      } catch (err) {
        console.error('Fetch lesson failed:', err?.response?.data || err?.message);
        toast.error('เกิดข้อผิดพลาดในการโหลดบทเรียน');
        navigate('/dashboard/student');
      }
    };

    fetchLesson();
  }, [lessonId, navigate]);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100">
        <div className="text-center">
          <div className="text-9xl animate-bounce">🐻</div>
          <p className="text-3xl font-bold text-gray-700 mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Lesson steps - มากกว่านี้อาจจะเยอะเกินไปสำหรับเด็ก ป.1
  const lessonSteps = [
    {
      id: 'intro',
      emoji: '👋',
      title: 'สวัสดี',
      type: 'intro'
    },
    {
      id: 'sound',
      emoji: '🔊',
      title: 'ฟังเสียง',
      type: 'sound'
    },
    {
      id: 'words',
      emoji: '📝',
      title: 'คำศัพท์',
      type: 'words'
    },
    {
      id: 'game1',
      emoji: '🎯',
      title: 'เกมที่ 1',
      type: 'listen-select'
    },
    {
      id: 'game2',
      emoji: '🎮',
      title: 'เกมที่ 2',
      type: 'matching'
    },
    {
      id: 'summary',
      emoji: '🎉',
      title: 'เยี่ยม',
      type: 'summary'
    }
  ];

  const [vocabulary, setVocabulary] = useState([
    { word: 'กา', emoji: '🦅', sound: 'นกกา' },
    { word: 'ขา', emoji: '🦵', sound: 'ขาคน' },
    { word: 'คา', emoji: '🚫', sound: 'ติดคา' },
    { word: 'งา', emoji: '🌾', sound: 'เมล็ดงา' },
    { word: 'จา', emoji: '👋', sound: 'ลาจาก' },
    { word: 'ชา', emoji: '🍵', sound: 'ชาเขียว' }
  ]);

  useEffect(() => {
    if (lesson?.content && lesson.content.includes('[MEDIA]')) {
      try {
        const mediaMatch = lesson.content.match(/\[MEDIA\]([\s\S]*?)\[\/MEDIA\]/);
        if (mediaMatch && mediaMatch[1]) {
          const mediaData = JSON.parse(mediaMatch[1]);
          if (mediaData.items && Array.isArray(mediaData.items)) {
            // Map items to vocabulary format
            const newVocab = mediaData.items.map(item => ({
              word: item.label || item.word,
              emoji: null, // Use image instead
              image: item.image,
              sound: item.label || item.word
            }));
            setVocabulary(newVocab);
          }
        }
      } catch (e) {
        console.error('Failed to parse media content:', e);
      }
    }
  }, [lesson]);

  const handleNext = () => {
    if (currentStep < lessonSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      playSound('next');
    } else {
      setShowConfetti(true);
      playSound('complete');
      setTimeout(() => {
        navigate('/dashboard/student');
      }, 3000);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      playSound('back');
    }
  };

  const playSound = (type) => {
    // In production, play actual sounds
    const sounds = {
      'next': '✨',
      'back': '◀️',
      'complete': '🎉',
      'correct': '✅',
      'wrong': '❌'
    };
    console.log('Sound:', sounds[type]);
  };

  const currentStepData = lessonSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 p-4">
      {showConfetti && <Confetti recycle={false} numberOfPieces={1000} />}

      <div className="max-w-5xl mx-auto">
        {/* Very Simple Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard/student')}
            className="w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          >
            <Home size={40} className="text-blue-500" />
          </button>

          <div className="text-6xl">
            {currentStepData.emoji}
          </div>

          <div className="w-20"></div>
        </div>

        {/* Progress Dots - Simple & Visual */}
        <div className="flex justify-center gap-3 mb-8">
          {lessonSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`transition-all ${index === currentStep
                ? 'w-16 h-16'
                : index < currentStep
                  ? 'w-12 h-12'
                  : 'w-10 h-10'
                }`}
            >
              <div className={`w-full h-full rounded-full flex items-center justify-center text-2xl ${index < currentStep
                ? 'bg-green-400'
                : index === currentStep
                  ? 'bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse'
                  : 'bg-gray-300'
                }`}>
                {index < currentStep ? '✓' : step.emoji}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content - Maximized */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 min-h-[600px]"
          >
            {/* Intro Step */}
            {currentStepData.type === 'intro' && (
              <IntroStep lesson={lesson} playSound={playSound} />
            )}

            {/* Sound Step */}
            {currentStepData.type === 'sound' && (
              <SoundStep lesson={lesson} playSound={playSound} />
            )}

            {/* Words Step */}
            {currentStepData.type === 'words' && (
              <WordsStep vocabulary={vocabulary} playSound={playSound} />
            )}

            {/* Listen & Select Game */}
            {currentStepData.type === 'listen-select' && (
              <ListenSelectGame vocabulary={vocabulary} playSound={playSound} />
            )}

            {/* Matching Game */}
            {currentStepData.type === 'matching' && (
              <MatchingGameStep vocabulary={vocabulary} playSound={playSound} />
            )}

            {/* Summary Step */}
            {currentStepData.type === 'summary' && (
              <SummaryStep lesson={lesson} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Big Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full shadow-2xl flex items-center justify-center transition-all ${currentStep === 0
              ? 'bg-gray-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-400 to-blue-600 hover:shadow-3xl'
              }`}
          >
            <ChevronLeft className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 ${currentStep === 0 ? 'text-gray-400' : 'text-white'}`} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-r from-green-400 to-green-600 shadow-2xl flex items-center justify-center hover:shadow-3xl"
          >
            <ChevronRight className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// Intro Step - Minimal Text, Big Visual
const IntroStep = ({ lesson }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const playIntroAudio = () => {
    setIsPlaying(true);
    // Use high-quality Gemini TTS instead of old static files
    speakText(`สวัสดี วันนี้เราจะเรียนเรื่อง ${lesson.title}`);

    setTimeout(() => setIsPlaying(false), 3000);
  };

  useEffect(() => {
    playIntroAudio();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12">
      {/* Big Bear Logo */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1
        }}
        className="text-[120px] md:text-[160px] lg:text-[200px]"
      >
        🐻
      </motion.div>

      {/* Lesson Title - Big and Colorful */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {lesson.title.split(':')[1] || lesson.title}
        </motion.div>
      </div>

      {/* Big Audio Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={playIntroAudio}
        className={`w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full shadow-2xl flex items-center justify-center transition-all ${isPlaying
          ? 'bg-gradient-to-r from-green-400 to-green-600 animate-pulse'
          : 'bg-gradient-to-r from-blue-400 to-purple-600'
          }`}
      >
        <Volume2 size={80} className="text-white" />
      </motion.button>
    </div>
  );
};

// Sound Step - Focus on Listening
const SoundStep = ({ lesson }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const playSoundLesson = () => {
    setIsPlaying(true);

    // Use Gemini TTS for the core sound instruction
    speakText(`ฟังนะ ${lesson.title.split(':')[1]} ออกเสียง อาา ลองออกเสียงตาม อาาาา`);

    setTimeout(() => setIsPlaying(false), 5000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12">
      {/* Animated Mouth */}
      <motion.div
        animate={{
          scale: isPlaying ? [1, 1.2, 1] : 1
        }}
        transition={{
          duration: 0.5,
          repeat: isPlaying ? Infinity : 0
        }}
        className="text-[150px] md:text-[200px] lg:text-[250px]"
      >
        👄
      </motion.div>

      {/* Big Text */}
      <motion.div
        animate={{
          scale: isPlaying ? [1, 1.1, 1] : 1
        }}
        transition={{
          duration: 0.5,
          repeat: isPlaying ? Infinity : 0
        }}
        className="text-5xl md:text-7xl lg:text-9xl font-bold text-blue-600"
      >
        อา
      </motion.div>

      {/* Huge Audio Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={playSoundLesson}
        className={`w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all ${isPlaying
          ? 'bg-gradient-to-r from-green-400 to-green-600 animate-pulse'
          : 'bg-gradient-to-r from-blue-400 to-purple-600'
          }`}
      >
        <Volume2 size={60} className="md:w-20 md:h-20 lg:w-25 lg:h-25 text-white mb-2" />
        <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white">ฟัง</span>
      </motion.button>
    </div>
  );
};

// Words Step - Visual Cards
const WordsStep = ({ vocabulary }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentWord = vocabulary[currentWordIndex];

  const playWordSound = () => {
    setIsPlaying(true);

    // Use Gemini TTS for vocabulary words
    speakText(`${currentWord.word} ${currentWord.sound}`);

    setTimeout(() => setIsPlaying(false), 2000);
  };

  useEffect(() => {
    playWordSound();
  }, [currentWordIndex]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      {/* Big Emoji */}
      <motion.div
        key={currentWordIndex}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className="flex items-center justify-center p-4 h-[250px] md:h-[320px] lg:h-[400px]"
      >
        {currentWord.image ? (
          <img
            src={currentWord.image}
            alt={currentWord.word}
            className="h-full w-auto object-contain drop-shadow-2xl"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<span class="text-[150px]">🤔</span>';
            }}
          />
        ) : (
          <div className="text-[180px] md:text-[240px] lg:text-[300px]">
            {currentWord.emoji}
          </div>
        )}
      </motion.div>

      {/* Big Word */}
      <motion.div
        key={`word-${currentWordIndex}`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-7xl lg:text-9xl font-bold text-purple-600"
      >
        {currentWord.word}
      </motion.div>

      {/* Audio Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={playWordSound}
        className={`w-40 h-40 rounded-full shadow-2xl flex items-center justify-center ${isPlaying
          ? 'bg-gradient-to-r from-green-400 to-green-600 animate-pulse'
          : 'bg-gradient-to-r from-orange-400 to-red-600'
          }`}
      >
        <Volume2 size={80} className="text-white" />
      </motion.button>

      {/* Navigation Dots - Big & Colorful */}
      <div className="flex gap-4">
        {vocabulary.map((_, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentWordIndex(index)}
            className={`transition-all rounded-full ${index === currentWordIndex
              ? 'w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500'
              : index < currentWordIndex
                ? 'w-12 h-12 bg-green-400'
                : 'w-10 h-10 bg-gray-300'
              }`}
          >
            <span className="text-2xl">{index < currentWordIndex ? '✓' : index + 1}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Listen & Select Game - Audio First!
const ListenSelectGame = ({ vocabulary }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  const question = vocabulary[currentQuestion];
  const options = [
    question,
    vocabulary[(currentQuestion + 1) % vocabulary.length],
    vocabulary[(currentQuestion + 2) % vocabulary.length],
    vocabulary[(currentQuestion + 3) % vocabulary.length]
  ].sort(() => Math.random() - 0.5);

  const playQuestionAudio = () => {
    speakText(question.word);
  };

  useEffect(() => {
    setTimeout(() => playQuestionAudio(), 500);
  }, [currentQuestion]);

  const handleSelect = (option) => {
    setSelected(option);

    if (option.word === question.word) {
      playCorrectSound();
      setScore(score + 1);
      setTimeout(() => {
        if (currentQuestion < vocabulary.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setSelected(null);
        }
      }, 1500);
    } else {
      playWrongSound();
      setTimeout(() => setSelected(null), 1000);
    }
  };

  const playCorrectSound = () => {
    speakText('ถูกต้อง เก่งมาก');
  };

  const playWrongSound = () => {
    speakText('ลองใหม่นะ');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12">
      {/* Huge Audio Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={playQuestionAudio}
        className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-2xl flex flex-col items-center justify-center"
      >
        <Volume2 className="w-16 h-16 md:w-20 md:h-20 lg:w-30 lg:h-30 text-white mb-4" />
        <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">ฟัง</span>
      </motion.button>

      {/* Score Display */}
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-purple-600">
        ⭐ {score} / {vocabulary.length}
      </div>

      {/* Big Option Cards with Emojis */}
      <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
        {options.map((option, index) => {
          const isSelected = selected?.word === option.word;
          const isCorrect = option.word === question.word;
          const showResult = isSelected;

          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(option)}
              className={`p-8 rounded-3xl shadow-xl transition-all ${showResult
                ? isCorrect
                  ? 'bg-gradient-to-br from-green-300 to-green-500 ring-8 ring-green-300'
                  : 'bg-gradient-to-br from-red-300 to-red-500 ring-8 ring-red-300'
                : 'bg-gradient-to-br from-white to-gray-100 hover:shadow-2xl'
                }`}
            >
              <div className="h-32 md:h-40 lg:h-48 mb-4 flex items-center justify-center">
                {option.image ? (
                  <img
                    src={option.image}
                    alt={option.word}
                    className="h-full w-auto object-contain"
                  />
                ) : (
                  <div className="text-6xl md:text-7xl lg:text-9xl">{option.emoji}</div>
                )}
              </div>
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">{option.word}</div>
              {showResult && (
                <div className="text-7xl mt-4">
                  {isCorrect ? '✅' : '❌'}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// Matching Game - Drag and Click
const MatchingGameStep = ({ vocabulary }) => {
  const [matches, setMatches] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);

  const pairs = vocabulary.slice(0, 4); // Use first 4 words

  const handleWordClick = (word) => {
    setSelectedWord(word);

    // Play word sound
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'th-TH';
    window.speechSynthesis.speak(utterance);
  };

  const handleEmojiClick = (word) => {
    if (selectedWord) {
      const newMatches = {
        ...matches,
        [selectedWord.word]: word.word
      };
      setMatches(newMatches);

      if (selectedWord.word === word.word) {
        speakText('ถูกต้อง', { rate: 0.5 });
        toast.success('ถูกต้อง');
      } else {
        speakText('ลองใหม่', { rate: 0.5 });
        toast.error('ลองอีกครั้ง');
      }

      setSelectedWord(null);
    }
  };

  const correctCount = Object.entries(matches).filter(([k, v]) => k === v).length;

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      {/* Score */}
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-purple-600">
        🎯 {correctCount} / {pairs.length}
      </div>

      <div className="grid grid-cols-2 gap-12 w-full max-w-5xl">
        {/* Words Column */}
        <div className="space-y-6">
          {pairs.map((word) => {
            const isMatched = matches[word.word] !== undefined;
            const isSelected = selectedWord?.word === word.word;
            const isCorrect = matches[word.word] === word.word;

            return (
              <motion.button
                key={word.word}
                whileHover={{ scale: isMatched ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !isMatched && handleWordClick(word)}
                disabled={isMatched}
                className={`w-full h-20 md:h-24 lg:h-32 rounded-3xl text-3xl md:text-4xl lg:text-6xl font-bold shadow-xl transition-all ${isSelected
                  ? 'bg-gradient-to-r from-blue-400 to-purple-600 text-white ring-8 ring-blue-300'
                  : isMatched
                    ? isCorrect
                      ? 'bg-gradient-to-r from-green-300 to-green-500'
                      : 'bg-gradient-to-r from-red-300 to-red-500'
                    : 'bg-gradient-to-br from-white to-gray-100'
                  }`}
              >
                {word.word}
                {isMatched && isCorrect && <span className="ml-4">✅</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Emojis Column */}
        <div className="space-y-6">
          {pairs.map((word) => {
            const isMatched = Object.values(matches).includes(word.word);

            return (
              <motion.button
                key={word.emoji}
                whileHover={{ scale: isMatched ? 1 : 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleEmojiClick(word)}
                disabled={isMatched}
                className={`w-full h-32 rounded-3xl shadow-xl transition-all flex items-center justify-center ${isMatched
                  ? 'bg-gradient-to-r from-green-300 to-green-500'
                  : 'bg-gradient-to-br from-yellow-100 to-orange-100'
                  }`}
              >
                <span className="text-9xl">
                  {word.image ? (
                    <img
                      src={word.image}
                      alt={word.word}
                      className="h-24 w-24 object-contain"
                    />
                  ) : (
                    word.emoji
                  )}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Success Message */}
      {correctCount === pairs.length && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-8xl"
        >
          🎉
        </motion.div>
      )}
    </div>
  );
};

// Summary Step
const SummaryStep = ({ lesson }) => {
  useEffect(() => {
    speakText('เยี่ยมมาก เรียนจบแล้ว');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12">
      {/* Big Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-[150px] md:text-[200px] lg:text-[250px]"
      >
        🏆
      </motion.div>

      {/* Big Text */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          เยี่ยม
        </div>
      </motion.div>

      {/* Stars */}
      <div className="flex gap-6">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.2, type: 'spring' }}
            className="text-8xl"
          >
            ⭐
          </motion.div>
        ))}
      </div>

      {/* Next Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-6xl animate-bounce"
      >
        👇
      </motion.div>
    </div>
  );
};

export default KidFriendlyLessonPage;
