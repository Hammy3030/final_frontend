import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Clock,
  RotateCcw,
  Target,
  Volume2,
  CheckCircle,
  XCircle,
  Medal,
  Gamepad2,
  ChevronRight,
  Star,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { getApiUrl } from '../../utils/apiConfig';
import { speak } from '../../utils/textToSpeech';


const MockGamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [gameState, setGameState] = useState('intro'); // intro, playing, result
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [matches, setMatches] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'correct' | 'incorrect', message: string }
  const closeFeedback = useCallback(() => setFeedback(null), []);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(getApiUrl(`/lessons/games/${gameId}`), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.success) {
          const gameData = response.data.data.game;
          if (gameData?.type === 'DRAG_DROP') {
            toast('เกมแยกหมวดหมู่ปิดใช้งานชั่วคราว');
            navigate('/dashboard/student');
            return;
          }

          // Guard: ห้ามเข้าเกมโดยตรงถ้ายังไม่ปลดล็อก (ต้องผ่านบทเรียน + post-test ก่อน)
          try {
            const token = localStorage.getItem('token');
            const lessonsRes = await axios.get(getApiUrl('/student/lessons'), {
              headers: { Authorization: `Bearer ${token}` }
            });
            const lessons = lessonsRes.data?.data?.lessons || [];
            const lessonId = gameData.lessonId || gameData.lesson?.id || gameData.lesson?._id;
            const lesson = lessons.find(l => String(l.id || l._id) === String(lessonId));
            const status = lesson?.status;
            const canAccessGame = status === 'GAMES_READY' || status === 'COMPLETED';

            if (!canAccessGame) {
              toast.error('เกมนี้ยังไม่ปลดล็อก');
              navigate('/dashboard/student/lessons');
              return;
            }
          } catch (_) {
            // ถ้าเช็กสถานะไม่ได้ ให้ fallback ต่อด้วย flow เดิม
          }

          setGame(gameData);
          // ถ้า API ไม่ส่ง lesson.games มา แต่มี lessonId ให้โหลดบทเรียนเพื่อใช้ปุ่ม "เกมถัดไป"
          if (!gameData?.lesson?.games?.length && (gameData?.lessonId || gameData?.lesson?.id)) {
            const lid = gameData.lessonId ?? gameData.lesson?.id;
            try {
              const lessonRes = await axios.get(getApiUrl(`/lessons/${lid}`), {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (lessonRes.data?.success && lessonRes.data.data?.lesson?.games?.length) {
                setGame(prev => ({ ...prev, lesson: lessonRes.data.data.lesson }));
              }
            } catch (_) { /* ignore */ }
          }
        }
      } catch (error) {
        console.error('Error fetching game:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดเกม');
        navigate('/dashboard/student');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [gameId, navigate]);

  useEffect(() => {
    // Timer
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleGameComplete();
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setMatches({});
    setTimeLeft(300);
    setGameStartTime(Date.now());
    toast.success('เริ่มเกม');
  };

  const handleGameComplete = async () => {
    setGameState('result');
    const finalScore = calculateScore();
    setScore(finalScore);

    // Submit game result to backend
    try {
      const token = localStorage.getItem('token');
      const timeSpent = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : null;

      await axios.post(
        getApiUrl(`/student/games/${gameId}/submit`),
        {
          score: finalScore,
          level: 1,
          timeSpent,
          data: {
            matches,
            totalPairs: game?.settings?.pairs?.length || game?.settings?.items?.length || 0
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Error submitting game result:', error);
      // Don't show error toast to avoid interrupting user experience
    }

    if (finalScore >= 80) {
      setShowConfetti(true);
      toast.success('ยอดเยี่ยม');
    } else if (finalScore >= 60) {
      toast.success('ดีมาก');
    } else {
      toast('พยายามต่อไป');
    }
  };

  const calculateScore = () => {
    if (!game) return 0;

    const totalPairs = game.settings.pairs?.length || game.settings.items?.length || 0;

    if (game.type === 'DRAG_DROP') {
      const items = game.settings.items || [];
      const correctMatches = Object.entries(matches).filter(([itemId, zoneId]) => {
        const item = items.find(i => i.id === itemId);
        return item && item.groupId === zoneId;
      }).length;
      return totalPairs > 0 ? Math.round((correctMatches / totalPairs) * 100) : 0;
    }

    // Default Matching Game
    const correctMatches = Object.entries(matches).filter(([key, value]) => key === value).length;
    return totalPairs > 0 ? Math.round((correctMatches / totalPairs) * 100) : 0;
  };

  const handleMatch = (item, target) => {
    if (game.type === 'DRAG_DROP') {
      const newMatches = { ...matches, [item.id]: target.id };
      setMatches(newMatches);

      // Check correctness (item.groupId should match zone.id)
      if (item.groupId === target.id) {
        setFeedback({ type: 'correct', message: 'เก่งมาก' });
        setScore(prev => prev + 10);
      } else {
        setFeedback({ type: 'incorrect', message: 'ลองอีกครั้ง' });
        setTimeout(() => {
          setMatches(prev => {
            const updated = { ...prev };
            delete updated[item.id];
            return updated;
          });
        }, 1000);
      }
    } else {
      // DEFAULT: MATCHING GAME logic
      const newMatches = { ...matches, [item.word]: target.word };
      setMatches(newMatches);
      setSelectedItem(null);

      // Check if they belong to the same pair (correct match)
      if (item.word === target.word) {
        setFeedback({ type: 'correct', message: 'เก่งมาก' });
        setScore(prev => prev + 10);
      } else {
        setFeedback({ type: 'incorrect', message: 'ลองอีกครั้ง' });
        // Auto-reset wrong match after 1 second
        setTimeout(() => {
          setMatches(prev => {
            const updated = { ...prev };
            delete updated[item.word];
            return updated;
          });
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    setGameState('intro');
    setScore(0);
    setMatches({});
    setTimeLeft(300);
    setShowConfetti(false);
    setGameStartTime(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMedalRating = () => {
    // For games: 100% = 3 medals (เหรียญทอง)
    if (score >= 100) return 3;
    if (score >= 80) return 2;
    if (score >= 60) return 1;
    return 0;
  };

  if (isLoading || !game) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">กำลังโหลดเกม...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

      <AnimatePresence>
        {feedback && (
          <FeedbackOverlay
            type={feedback.type}
            message={feedback.message}
            onComplete={closeFeedback}
          />
        )}
      </AnimatePresence>

      {/* Header - Fixed at top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-lg p-3 sm:p-4 shrink-0 border-b-2 border-purple-300"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
            <button
              onClick={() => navigate('/dashboard/student')}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition text-sm sm:text-base"
            >
              <ArrowLeft size={18} />
              กลับ
            </button>

            {gameState === 'playing' && (
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                  <Target size={18} className="text-purple-600" />
                  <span className="font-bold text-lg sm:text-2xl text-purple-600">{score}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600">
                  <Clock size={18} className="text-blue-600" />
                  <span className="font-semibold text-base sm:text-lg text-blue-600">{formatTime(timeLeft)}</span>
                </div>
              </div>
            )}
          </div>

          <h1 className="text-lg sm:text-2xl md:text-1xl font-bold text-gray-900 break-words line-clamp-2">{game.title}</h1>
        </div>
      </motion.div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto w-full min-w-0">
          {/* Game Content */}
          <AnimatePresence mode="wait">
            {gameState === 'intro' && (
              <GameIntro game={game} onStart={startGame} />
            )}

            {gameState === 'playing' && game.type === 'MATCHING' && (
              <MatchingGame
                game={game}
                matches={matches}
                selectedItem={selectedItem}
                onSelect={setSelectedItem}
                onMatch={handleMatch}
                onComplete={handleGameComplete}
              />
            )}

            {gameState === 'playing' && game.type === 'LINKING' && (
              <LinkingGame
                game={game}
                matches={matches}
                onMatch={handleMatch}
                onComplete={handleGameComplete}
              />
            )}



            {gameState === 'result' && (
              <GameResult
                game={game}
                gameId={gameId}
                score={score}
                medals={getMedalRating()}
                onReset={resetGame}
                onExit={() => navigate('/dashboard/student')}
                onGoToNextGame={() => {
                  const games = game?.lesson?.games;
                  const list = Array.isArray(games) ? games.filter(g => !g?.isDeleted && g?.type !== 'DRAG_DROP') : [];
                  const idx = list.findIndex(g => (g.id || g._id) === gameId);
                  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
                  const nextId = next?.id ?? next?._id;
                  if (nextId) navigate(`/dashboard/student/games/${nextId}`);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const GameIntro = ({ game, onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // เอา backdrop-blur-sm ออก และใช้สีพื้นหลังที่ทึบขึ้นเล็กน้อยเพื่อให้ Card ลอยเด่น
      className="fixed inset-0 w-full h-full flex items-center justify-center p-4 z-50 bg-black/40"
    >
      {/* Main Card */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-[350px] overflow-hidden border-[6px] border-white relative flex flex-col">

        {/* 1. Header: ปรับ Gradient ให้เข้มและสดใสชัดเจน */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 pt-8 pb-10 text-center overflow-hidden shrink-0">
          {/* แสงวิ้งๆ แบบทึบแสง (ไม่เบลอ) */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full translate-x-10 -translate-y-10" />

          {/* Game Icon */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 shadow-lg border border-white/30 shrink-0"
          >
            <span className="text-4xl filter drop-shadow-md">
              {game?.type === 'MATCHING' ? '👯' :
                game?.type === 'DRAG_DROP' ? '🎯' :
                  game?.type === 'WORD_CONNECT' ? '🔗' : '🎮'}
            </span>
          </motion.div>

          <div className="block w-fit mx-auto px-4 py-1 bg-black/20 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-3 border border-white/10">
            {game?.type === 'MATCHING' ? 'Matching Game' : 'Mini Game'}
          </div>

          <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md line-clamp-2 px-2">
            {game?.title?.replace(/จับคู่ภาพกับคำศัพท์\s*[-\:]?\s*/g, '') || 'มาสนุกกันเลย'}
          </h3>
        </div>

        {/* 2. Content Area */}
        <div className="px-6 pb-8 pt-2 bg-white relative shrink-0">

          {/* Speak Button: เปลี่ยนเป็นสไตล์ Flat ที่ดูพรีเมียมขึ้น */}
          <div className="flex justify-center -mt-10 mb-6 relative z-20">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => speak(game?.title)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-full font-black border-4 border-purple-50 shadow-xl text-sm transition-all"
            >
              <Volume2 size={20} fill="currentColor" fillOpacity={0.1} />

            </motion.button>
          </div>

          {/* Info Grid: เน้นความเรียบง่าย สะอาดตา */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {[
              { icon: <Clock size={18} />, label: 'เวลา', value: '5 นาที' },
              { icon: <Trophy size={18} />, label: 'คะแนน', value: '100' },
              { icon: <Medal size={18} />, label: 'รางวัล', value: '3 เหรียญ' } // ใช้ Medal แทน Star เพื่อความชัวร์
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center bg-gray-50 py-3 rounded-2xl border border-gray-100">
                <div className="text-purple-500 mb-1">
                  {item.icon}
                </div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</p>
                <p className="text-xs font-black text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>

          {/* 3. Action Button: ปุ่มเริ่มเกมที่ดู Clickable มากๆ */}
          <div className="space-y-4 text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              เริ่มเล่นเกมเลย
            </motion.button>


          </div>
        </div>
      </div>
    </motion.div>
  );
};
// --- Utils: Shuffle แบบ Modern ---
const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

// --- MATCH_COLORS: ปรับสีให้พาสเทลพรีเมียม (นวลตาขึ้น ไม่แยงตาเด็ก) ---
const MATCH_COLORS = [
  { bg: 'bg-emerald-50', border: 'border-emerald-300', shadow: 'shadow-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-500' },
  { bg: 'bg-sky-50', border: 'border-sky-300', shadow: 'shadow-sky-200', text: 'text-sky-800', icon: 'text-sky-500' },
  { bg: 'bg-amber-50', border: 'border-amber-300', shadow: 'shadow-amber-200', text: 'text-amber-800', icon: 'text-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-300', shadow: 'shadow-rose-200', text: 'text-rose-800', icon: 'text-rose-500' },
  { bg: 'bg-violet-50', border: 'border-violet-300', shadow: 'shadow-violet-200', text: 'text-violet-800', icon: 'text-violet-500' },
  { bg: 'bg-orange-50', border: 'border-orange-300', shadow: 'shadow-orange-200', text: 'text-orange-800', icon: 'text-orange-500' },
  { bg: 'bg-pink-50', border: 'border-pink-300', shadow: 'shadow-pink-200', text: 'text-pink-800', icon: 'text-pink-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-300', shadow: 'shadow-cyan-200', text: 'text-cyan-800', icon: 'text-cyan-500' },
];

// Matching Game Component
const MatchingGame = ({ game, matches, selectedItem, onSelect, onMatch, onComplete }) => {
  const pairs = game.settings.pairs || [];
  const correctMatches = Object.entries(matches).filter(([key, value]) => key === value).length;

  const shuffledWords = useMemo(() => shuffleArray(pairs), [pairs.length, pairs[0]?.word]);
  const shuffledImages = useMemo(() => shuffleArray(pairs), [pairs.length, pairs[0]?.word]);

  useEffect(() => {
    if (correctMatches === pairs.length && pairs.length > 0) {
      setTimeout(() => onComplete(), 1000);
    }
  }, [correctMatches, pairs.length, onComplete]);

  const getPairColor = (word) => {
    const idx = pairs.findIndex(p => p.word === word);
    return idx >= 0 ? MATCH_COLORS[idx % MATCH_COLORS.length] : MATCH_COLORS[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-[2.5rem] shadow-2xl p-4 sm:p-6 md:p-8 h-full flex flex-col gap-4 border-4 border-purple-100"
    >
      {/* Progress Bar */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <p className="text-gray-600 text-xs sm:text-sm font-bold">จับคู่: <span className="text-purple-600 text-sm sm:text-base">{correctMatches} / {pairs.length}</span></p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => speak('จับคู่คำกับรูปภาพ')}
            className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition"
            aria-label="ฟังเสียง"
          >
            <Volume2 size={16} />
          </motion.button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner border border-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(correctMatches / pairs.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-500 shadow-lg"
          />
        </div>
      </div>

      {/* Game Grid - Scrollable if needed */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {/* Words Column */}
          {shuffledWords.map((pair, index) => {
            const isMatched = matches[pair.word] !== undefined;
            const isSelected = selectedItem?.word === pair.word;
            const isCorrect = matches[pair.word] === pair.word;
            const colors = isCorrect ? getPairColor(pair.word) : null;

            return (
              <motion.button
                key={`word-${pair.word}-${index}`}
                whileHover={{ scale: isMatched ? 1 : 1.05, y: isMatched ? 0 : -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !isMatched && onSelect(pair)}
                disabled={isMatched}
                className={`p-3 sm:p-4 lg:p-6 rounded-2xl text-lg sm:text-xl lg:text-2xl font-black transition-all duration-300 shadow-lg flex items-center justify-center min-h-[80px] sm:min-h-[110px] lg:min-h-[140px] relative border-4 ${isSelected
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-yellow-300 shadow-yellow-200 scale-105'
                  : isMatched
                    ? isCorrect
                      ? `${colors?.bg || 'bg-green-100'} ${colors?.text || 'text-green-800'} ${colors?.border || 'border-green-400'} ${colors?.shadow || 'shadow-green-100'} opacity-80 cursor-default`
                      : 'bg-red-100 text-red-800 border-red-400 shadow-red-100'
                    : 'bg-white border-gray-100 hover:border-purple-300 hover:shadow-purple-100 text-gray-700'
                  }`}
              >
                {pair.word}
                {isMatched && isCorrect && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-2 -right-2 ${colors?.icon || 'text-green-600'} bg-white rounded-full p-1 shadow-md`}
                  >
                    <CheckCircle size={20} />
                  </motion.span>
                )}
                {isMatched && !isCorrect && (
                  <span className="absolute -top-2 -right-2 text-red-600 bg-white rounded-full p-1 shadow-md">
                    <XCircle size={20} />
                  </span>
                )}
              </motion.button>
            );
          })}

          {/* Images Column */}
          {shuffledImages.map((pair, index) => {
            const listMatches = Object.entries(matches);
            const matchedKey = listMatches.find(([key, val]) => val === pair.word)?.[0];
            const isMatched = matchedKey !== undefined;
            const isCorrect = matchedKey === pair.word;
            const isImagePath = pair.image && (pair.image.startsWith('/') || pair.image.startsWith('http'));
            const colors = isCorrect ? getPairColor(pair.word) : null;

            return (
              <motion.button
                key={`img-${pair.word}-${index}`}
                whileHover={{ scale: isMatched ? 1 : 1.05, y: isMatched ? 0 : -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectedItem && onMatch(selectedItem, pair)}
                disabled={isMatched}
                className={`p-3 sm:p-4 lg:p-6 rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center min-h-[80px] sm:min-h-[110px] lg:min-h-[140px] relative border-4 ${isMatched
                  ? isCorrect
                    ? `${colors?.bg || 'bg-green-100'} ${colors?.border || 'border-green-400'} ${colors?.shadow || 'shadow-green-100'} opacity-80 cursor-default`
                    : 'bg-red-100 border-red-400 shadow-red-100'
                  : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-blue-100'
                  }`}
              >
                {isImagePath ? (
                  <>
                    <img
                      src={pair.image}
                      alt={pair.word}
                      className="w-14 h-14 sm:w-20 h-20 lg:w-28 h-28 object-contain mx-auto transition-transform group-hover:scale-110"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <ImageIcon className="w-12 h-12 text-gray-400" style={{ display: 'none' }} aria-hidden />
                  </>
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-400" aria-hidden />
                )}

                {isMatched && isCorrect && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-2 -right-2 ${colors?.icon || 'text-green-600'} bg-white rounded-full p-1 shadow-md`}
                  >
                    <CheckCircle size={20} />
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// Linking Game Component
const LinkingGame = ({ game, matches, onMatch, onComplete }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const words = game.settings.words || [];
  const definitions = game.settings.definitions || [];

  const handleWordClick = (word, index) => {
    setSelectedWord({ word, index });
  };

  const handleDefinitionClick = (definition, index) => {
    if (selectedWord) {
      onMatch({ id: selectedWord.index, word: selectedWord.word }, { id: index, word: definition });
      setSelectedWord(null);
    }
  };

  const correctMatches = Object.keys(matches).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-[2.5rem] shadow-2xl p-4 sm:p-6 md:p-8 h-full flex flex-col gap-4 border-4 border-blue-100"
    >
      {/* Progress */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <p className="text-gray-600 text-xs sm:text-sm font-bold">จับคู่: <span className="text-purple-600 text-sm sm:text-base">{correctMatches} / {words.length}</span></p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => speak('โยงคำกับความหมายที่ถูกต้อง')}
            className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition"
          >
            <Volume2 size={16} />
          </motion.button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner border border-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(correctMatches / words.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-lg"
          />
        </div>
      </div>

      {/* Content Grid - Scrollable if needed */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {/* Words */}
          {words.map((word, index) => (
            <motion.button
              key={`word-${index}`}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleWordClick(word, index)}
              className={`p-3 sm:p-4 lg:p-6 rounded-2xl font-black transition-all duration-300 shadow-lg text-xs sm:text-sm lg:text-xl min-h-[70px] sm:min-h-[90px] lg:min-h-[120px] border-4 flex items-center justify-center ${selectedWord?.index === index
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-400 shadow-blue-200 scale-105'
                : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-blue-100 text-gray-700'
                }`}
            >
              {word}
            </motion.button>
          ))}

          {/* Definitions */}
          {definitions.map((def, index) => (
            <motion.button
              key={`def-${index}`}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDefinitionClick(def, index)}
              className="p-3 sm:p-4 lg:p-6 rounded-2xl font-black transition-all duration-300 shadow-lg text-xs sm:text-sm lg:text-xl min-h-[70px] sm:min-h-[90px] lg:min-h-[120px] border-4 bg-white border-gray-100 hover:border-blue-300 hover:shadow-blue-100 text-gray-700 flex items-center justify-center text-center"
            >
              {def}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={onComplete}
        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition text-sm sm:text-base shrink-0"
      >
        ส่งคำตอบ
      </motion.button>
    </motion.div>
  );
};

// Drag Drop Game Component
const DragDropGame = ({ game, matches, onMatch, onComplete }) => {
  const items = game.settings.items || [];
  const zones = game.settings.zones || game.settings.targets || [];

  const handleDragEnd = (event, info, item) => {
    // Robust collision detection using elementsFromPoint
    // Must use native clientX/Y because info.point might be Page-relative (scrolled),
    // which causes "Top -> Below" targeting errors in document.elementsFromPoint
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;

    const elements = document.elementsFromPoint(clientX, clientY);

    // Find the dropped zone element
    const zoneElement = elements.find(el => el.id && el.id.toString().startsWith('zone-'));

    if (zoneElement) {
      const zoneId = zoneElement.id.replace('zone-', '');
      // Loose comparison for string vs number ID
      const targetZone = zones.find(z => z.id == zoneId);

      if (targetZone) {
        onMatch(item, targetZone);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8"
    >
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-2">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 text-center">ลากไปวางในกลุ่มที่ถูกต้อง</h2>
          <button
            onClick={() => speak('ลากคำไปวางในกลุ่มที่ถูกต้อง')}
            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 shrink-0"
          >
            <Volume2 size={20} />
          </button>
        </div>
      </div>

      {/* Zones */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {zones.map((zone) => (
          <div
            key={zone.id}
            id={`zone-${zone.id}`}
            className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-4 sm:p-6 min-h-[180px] sm:min-h-[250px] md:min-h-[300px] transition-colors hover:bg-blue-100"
          >
            {/* Display Zone Image if available */}
            {zone.image && (
              <img src={zone.image} alt={zone.label} className="w-16 h-16 sm:w-24 sm:h-24 object-contain mx-auto mb-2" />
            )}
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-800 text-center mb-2 sm:mb-4">{zone.label}</h3>
            <div className="space-y-2">
              {items.filter(item => matches[item.id] === zone.id).map((item) => (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={item.id}
                  className="bg-white p-3 rounded-lg border border-blue-200 text-center font-semibold shadow-sm"
                >
                  {item.text || item.word}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-700 text-center mb-3 sm:mb-4">คำที่ต้องจัดหมวดหมู่:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 relative z-10">
          {items.filter(item => !matches[item.id]).map((item) => (
            <motion.button
              key={item.id}
              drag
              dragSnapToOrigin
              whileDrag={{ scale: 1.1, zIndex: 50, cursor: 'grabbing' }}
              whileHover={{ scale: 1.05, cursor: 'grab' }}
              onDragEnd={(e, info) => handleDragEnd(e, info, item)}
              className="p-3 sm:p-4 bg-white rounded-lg border-2 border-gray-300 hover:border-purple-500 font-semibold transition shadow-sm touch-none text-sm sm:text-base"
            >
              {item.text || item.word}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
        >
          ตรวจคำตอบ
        </button>
      </div>
    </motion.div>
  );
};

// Game Result Component
const GameResult = ({ game, gameId, score, medals, onReset, onExit, onGoToNextGame }) => {
  const games = game?.lesson?.games;
  const list = Array.isArray(games) ? games.filter(g => !g?.isDeleted && g?.type !== 'DRAG_DROP') : [];
  const currentIdx = list.findIndex(g => (g.id || g._id) === gameId);
  const hasNextGame = currentIdx >= 0 && currentIdx < list.length - 1;

  const getMessage = () => {
    if (score >= 100) return { text: 'สุดเยี่ยม', emoji: '🏆', color: 'from-yellow-400 to-yellow-500' };
    if (score >= 80) return { text: 'ยอดเยี่ยม', emoji: '🎉', color: 'from-purple-500 to-pink-500' };
    if (score >= 60) return { text: 'ดีมาก', emoji: '👏', color: 'from-blue-500 to-cyan-500' };
    return { text: 'พยายามต่อไป', emoji: '💪', color: 'from-green-500 to-emerald-500' };
  };

  const { text, emoji, color } = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full h-full flex flex-col items-center justify-center px-2 sm:px-4 overflow-y-auto"
    >
      {/* Main Result Card */}
      <div className="bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg my-4">
        {/* Top accent bar */}
        <div className={`h-1 bg-gradient-to-r ${color}`}></div>

        <div className="p-5 sm:p-8 md:p-10 text-center flex flex-col items-center gap-3 sm:gap-5">
          {/* Trophy/Medal Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12 }}
            className="text-5xl sm:text-6xl"
          >
            {emoji}
          </motion.div>

          {/* Message */}
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}
          >
            {text}
          </motion.h2>

          {/* Score Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`bg-gradient-to-r ${color} rounded-xl sm:rounded-2xl p-5 sm:p-8 text-white shadow-xl w-full`}
          >
            <p className="text-sm sm:text-base font-semibold opacity-90 mb-2">คะแนนที่ได้</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-4xl sm:text-5xl md:text-6xl font-black mb-2"
            >
              {score}
            </motion.p>
            <p className="text-xs sm:text-sm opacity-90">100 คะแนนเต็ม</p>
          </motion.div>

          {/* Medals Display */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <div className="flex justify-center gap-2 sm:gap-3 mb-3">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                  className={`${i < medals ? 'scale-125 sm:scale-150' : 'opacity-30'}`}
                >
                  <Medal size={36} className={i < medals ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                </motion.div>
              ))}
            </div>
            {medals > 0 && (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-base sm:text-lg font-bold text-gray-800"
              >
                🎁 ได้รับ {medals} เหรียญ{medals === 3 ? ' (เหรียญทอง)' : ''}
              </motion.p>
            )}
          </motion.div>

          {/* Celebration Emojis */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-2 text-2xl sm:text-3xl"
          >
            <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
              ✨
            </motion.span>
            <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}>
              🌟
            </motion.span>
            <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}>
              💫
            </motion.span>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col gap-2 sm:gap-3 w-full"
          >
            {hasNextGame && onGoToNextGame && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={onGoToNextGame}
                className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl font-bold shadow-lg hover:shadow-xl transition text-sm sm:text-base"
              >
                <ChevronRight size={20} />
                เกมถัดไป
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg sm:rounded-xl font-bold shadow-lg hover:shadow-xl transition text-sm sm:text-base"
            >
              <RotateCcw size={20} />
              เล่นอีกครั้ง
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExit}
              className="px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white rounded-lg sm:rounded-xl font-bold shadow-lg hover:shadow-xl transition text-sm sm:text-base"
            >
              กลับหน้าหลัก
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const FeedbackOverlay = ({ type, message, onComplete }) => {
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!hasSpoken.current) {
      const text = type === 'correct' ? 'ถูกต้องคร้าบ เก่งมากเลย' : 'ยังไม่ถูกจ้า ลองใหม่อีกครั้งนะ';
      // Small delay to ensure visual is up
      speak(text);
      hasSpoken.current = true;
    }

    const closeTimer = setTimeout(onComplete, 1600);
    return () => {
      clearTimeout(closeTimer);
    };
  }, [type, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.5, y: 50, rotate: -10 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`bg-white rounded-[3rem] shadow-2xl p-8 sm:p-16 flex flex-col items-center gap-6 border-[12px] ${type === 'correct' ? 'border-green-400 shadow-green-200' : 'border-red-400 shadow-red-200'
          }`}
      >
        <motion.div
          animate={type === 'correct' ? { y: [0, -20, 0] } : { x: [-10, 10, -10, 10, 0] }}
          transition={{ duration: 0.5, repeat: type === 'correct' ? 1 : 0 }}
          className="text-8xl sm:text-[10rem] mb-2"
        >
          {type === 'correct' ? '✔️' : '❌'}
        </motion.div>
        <h2 className={`text-5xl sm:text-7xl font-black ${type === 'correct' ? 'text-green-600' : 'text-red-600'
          }`}>
          {message}
        </h2>
      </motion.div>
    </motion.div>
  );
};

export default MockGamePage;
