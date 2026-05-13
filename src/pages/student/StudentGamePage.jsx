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
  ChevronRight,
  Star,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { getApiUrl } from '../../utils/apiConfig';
import { speak } from '../../utils/textToSpeech';

const StudentGamePage = () => {
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
  const [feedback, setFeedback] = useState(null);
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
          setGame(gameData);
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
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleGameComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
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

    try {
      const token = localStorage.getItem('token');
      const timeSpent = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : null;
      await axios.post(
        getApiUrl(`/student/games/${gameId}/submit`),
        {
          score: finalScore,
          level: 1,
          timeSpent,
          data: { matches, totalPairs: game?.settings?.pairs?.length || 0 }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) { console.error('Error submitting game:', err); }

    if (finalScore >= 80) setShowConfetti(true);
  };

  const calculateScore = () => {
    if (!game) return 0;
    const pairs = game.settings.pairs || [];
    const correctMatches = Object.entries(matches).filter(([key, value]) => key === value).length;
    return pairs.length > 0 ? Math.round((correctMatches / pairs.length) * 100) : 0;
  };

  const handleMatch = (item, target) => {
    const newMatches = { ...matches, [item.word]: target.word };
    setMatches(newMatches);
    setSelectedItem(null);

    if (item.word === target.word) {
      setFeedback({ type: 'correct', message: 'เก่งมาก' });
    } else {
      setFeedback({ type: 'incorrect', message: 'ลองอีกครั้ง' });
      setTimeout(() => {
        setMatches(prev => {
          const updated = { ...prev };
          delete updated[item.word];
          return updated;
        });
      }, 1000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !game) {
    return (
      <div className="h-dvh flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100 font-prompt">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      <AnimatePresence>{feedback && <FeedbackOverlay type={feedback.type} message={feedback.message} onComplete={closeFeedback} />}</AnimatePresence>

      {/* Header - Fixed Height */}
      <div className="h-16 sm:h-20 bg-white border-b-4 border-purple-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
        <button onClick={() => navigate('/dashboard/student')} className="flex items-center gap-2 text-gray-500 font-black hover:text-purple-600 transition shrink-0">
          <ArrowLeft size={24} /> <span className="hidden sm:inline">กลับ</span>
        </button>
        {gameState === 'playing' && (
          <div className="flex items-center gap-4 sm:gap-8">
             <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-2xl border-2 border-purple-100">
                <Target className="text-purple-600" size={20} />
                <span className="text-xl font-black text-purple-700">{calculateScore()}%</span>
             </div>
             <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-2xl border-2 border-blue-100">
                <Clock className="text-blue-600" size={20} />
                <span className="text-xl font-black text-blue-700">{formatTime(timeLeft)}</span>
             </div>
          </div>
        )}
        <h1 className="text-lg font-black text-gray-900 truncate max-w-[200px] hidden md:block">{game.title}</h1>
      </div>

      {/* Main Game Area - FIXED VIEWPORT, NO SCROLL */}
      <div className="flex-1 min-h-0 p-3 sm:p-6 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-center">
               <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-10 text-white relative">
                    <div className="text-7xl mb-4">👯</div>
                    <h3 className="text-3xl font-black">{game.title}</h3>
                  </div>
                  <div className="p-8">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame} className="w-full py-5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-3xl font-black text-2xl shadow-xl shadow-purple-100">
                      เริ่มเล่นเกม
                    </motion.button>
                  </div>
               </div>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 min-h-0 bg-white rounded-[3rem] shadow-xl border-4 border-white p-4 sm:p-8 flex flex-col gap-6 overflow-hidden">
                <MatchingGame game={game} matches={matches} selectedItem={selectedItem} onSelect={setSelectedItem} onMatch={handleMatch} onComplete={handleGameComplete} />
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex items-center justify-center">
               <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden text-center">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-12 text-white">
                    <div className="text-8xl mb-4 drop-shadow-xl">🏆</div>
                    <h2 className="text-4xl font-black mb-2">สุดยอดไปเลย!</h2>
                    <p className="text-xl font-bold opacity-90">คุณทำได้ {calculateScore()}%</p>
                  </div>
                  <div className="p-8 space-y-4">
                    <button onClick={() => navigate('/dashboard/student/lessons')} className="w-full py-5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-3xl font-black text-xl shadow-xl shadow-purple-100">
                      กลับหน้าหลัก
                    </button>
                    <button onClick={startGame} className="w-full py-3 text-gray-500 font-bold hover:text-purple-600 transition">เล่นอีกครั้ง</button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const MatchingGame = ({ game, matches, selectedItem, onSelect, onMatch }) => {
  const pairs = game.settings.pairs || [];
  const shuffledWords = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs.length]);
  const shuffledImages = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs.length]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 sm:gap-8 overflow-hidden">
        {/* Words Column */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-hide">
          {shuffledWords.map((pair, idx) => {
            const isMatched = matches[pair.word] !== undefined;
            const isSelected = selectedItem?.word === pair.word;
            return (
              <motion.button key={`w-${idx}`} whileHover={{ scale: isMatched ? 1 : 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => !isMatched && onSelect(pair)} className={`flex-1 min-h-[80px] rounded-3xl border-4 font-black text-xl sm:text-3xl transition-all ${isSelected ? 'bg-indigo-500 text-white border-indigo-400 shadow-lg' : isMatched ? 'bg-green-100 text-green-600 border-green-200 opacity-50' : 'bg-gray-50 text-gray-700 border-gray-100 hover:border-indigo-300'}`}>
                {pair.word}
              </motion.button>
            );
          })}
        </div>
        {/* Images Column */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-hide">
          {shuffledImages.map((pair, idx) => {
            const matchedKey = Object.entries(matches).find(([k, v]) => v === pair.word)?.[0];
            const isMatched = matchedKey !== undefined;
            return (
              <motion.button key={`i-${idx}`} whileHover={{ scale: isMatched ? 1 : 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => selectedItem && onMatch(selectedItem, pair)} disabled={isMatched} className={`flex-1 min-h-[80px] rounded-3xl border-4 p-2 transition-all ${isMatched ? 'bg-green-100 border-green-200 opacity-50' : 'bg-gray-50 border-gray-100 hover:border-purple-300'}`}>
                {pair.image ? <img src={pair.image} className="h-full w-full object-contain mx-auto" /> : <ImageIcon size={32} className="mx-auto text-gray-300" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FeedbackOverlay = ({ type, message, onComplete }) => {
  useEffect(() => {
    speak(type === 'correct' ? 'ถูกต้องคร้าบ เก่งมากเลย' : 'ยังไม่ถูกจ้า ลองใหม่อีกครั้งนะ');
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [type, onComplete]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className={`bg-white rounded-[3rem] p-12 text-center border-[12px] ${type === 'correct' ? 'border-green-400' : 'border-red-400'}`}>
        <div className="text-8xl mb-4">{type === 'correct' ? '✅' : '❌'}</div>
        <h2 className={`text-5xl font-black ${type === 'correct' ? 'text-green-600' : 'text-red-600'}`}>{message}</h2>
      </motion.div>
    </motion.div>
  );
};

export default StudentGamePage;
