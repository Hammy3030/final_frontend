import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  Image as ImageIcon,
  HelpCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { getApiUrl } from '../../utils/apiConfig';
import { speak } from '../../utils/textToSpeech';
import AudioButton from '../../components/AudioButton';

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
  const [mistakes, setMistakes] = useState(0);
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
    setMistakes(0);
    setTimeLeft(300);
    setGameStartTime(Date.now());
    toast.success('เริ่มเกม');
  };

  const handleMatch = (item, target) => {
    const isCorrect = item.word === target.word;
    const newMatches = { ...matches, [item.word]: target.word };
    setMatches(newMatches);
    setSelectedItem(null);

    if (isCorrect) {
      setFeedback({ type: 'correct', message: 'เก่งมาก' });
      
      // Check if this was the last pair
      const totalPairs = game?.settings?.pairs?.length || 0;
      const currentCorrect = Object.entries(newMatches).filter(([k, v]) => k === v).length;
      
      if (currentCorrect === totalPairs && totalPairs > 0) {
        // Trigger completion after a short delay for the feedback
        setTimeout(() => {
          handleGameComplete(newMatches);
        }, 1200);
      }
    } else {
      setMistakes(prev => prev + 1);
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

  const { refreshProfile } = useAuth();

  const handleGameComplete = async (finalMatches = matches) => {
    // If we're already in result state, don't do it again
    if (gameState === 'result') return;

    const finalScore = calculateScore(finalMatches);
    setScore(finalScore);
    setGameState('result'); // Switch UI immediately
    setShowConfetti(finalScore >= 60);

    try {
      const token = localStorage.getItem('token');
      const timeSpent = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : null;
      
      const earnedMedals = getStarRating(finalScore);

      // Submit to backend
      await axios.post(
        getApiUrl(`/student/games/${gameId}/submit`),
        {
          score: finalScore,
          earnedMedals, // Send earned medals as requested
          level: 1,
          timeSpent,
          data: { 
            matches: finalMatches, 
            mistakes,
            totalPairs: game?.settings?.pairs?.length || 0 
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // FORCE REFRESH: Update medals in the auth context/global state
      await refreshProfile();
    } catch (err) { 
      console.error('Submit Error:', err.response?.data || err.message);
    }
  };

  const getStarRating = (score) => {
    if (score >= 90) return 3;
    if (score >= 80) return 2;
    if (score >= 60) return 1;
    return 0;
  };

  const calculateScore = (currentMatches = matches) => {
    if (!game) return 0;
    const pairs = game.settings.pairs || [];
    const totalPairs = pairs.length;
    if (totalPairs === 0) return 0;

    const correctMatches = Object.entries(currentMatches).filter(([key, value]) => key === value).length;
    const baseScore = (correctMatches / totalPairs) * 100;
    const deduction = mistakes * 5;
    
    return Math.max(0, Math.round(baseScore - deduction));
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
        
        <div className="flex-1 flex justify-center px-4">
          <div className="flex items-center gap-3 bg-indigo-50 px-6 py-2 rounded-2xl border-2 border-indigo-100 shadow-sm max-w-[600px]">
             <h1 className="text-lg md:text-xl font-black text-indigo-900 leading-tight">
               {game.title}
             </h1>
             <button 
               onClick={() => speak("แตะคำศัพท์ฝั่งซ้าย แล้วไปแตะรูปภาพฝั่งขวาที่ตรงกันนะจ๊ะ")} 
               className="p-2 bg-white rounded-full shadow-sm hover:bg-indigo-100 text-indigo-500 transition-colors shrink-0"
               title="วิธีเล่น"
             >
               <HelpCircle size={24} />
             </button>
          </div>
        </div>

        {gameState === 'playing' ? (
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
        ) : (
          <div className="w-[100px] hidden sm:block opacity-0">spacer</div>
        )}
      </div>

      {/* Main Game Area - FIXED LANDSCAPE & NO SCROLL */}
      <div className="h-[calc(100dvh-80px)] flex flex-col overflow-hidden relative">
        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50" />
        
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-center p-4">
               <div className="relative group w-full max-w-2xl">
                  {/* Glassmorphism Card */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[4rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white/70 backdrop-blur-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/50 flex flex-col md:flex-row items-center">
                    <div className="bg-gradient-to-br from-purple-500/90 to-indigo-600/90 p-12 text-white flex flex-col items-center justify-center text-center md:w-1/2 h-full">
                      <div className="text-8xl mb-6 animate-bounce">👯</div>
                      <h3 className="text-4xl font-black mb-2">{game.title}</h3>
                      <div className="w-16 h-1.5 bg-white/30 rounded-full" />
                    </div>
                    <div className="p-10 flex flex-col items-center justify-center gap-10 md:w-1/2">
                      <AudioButton 
                        text="เกมนี้ต้องจับคู่ภาพที่เหมือนกันนะจ๊ะ" 
                        variant="large" 
                        iconSize={64} 
                        className="scale-125 hover:scale-150 transition-transform mb-4"
                        autoPlay={true}
                      />
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -5 }} 
                        whileTap={{ scale: 0.95 }} 
                        onClick={startGame} 
                        className="w-full py-5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-3xl font-black text-2xl shadow-xl shadow-purple-100 border-b-4 border-purple-700"
                      >
                        เริ่มเล่นเกม
                      </motion.button>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex-1 min-h-0 p-4 flex flex-col overflow-hidden">
                <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-[3rem] shadow-xl border-4 border-white p-4 flex flex-col overflow-hidden">
                   <MatchingGame game={game} matches={matches} selectedItem={selectedItem} onSelect={setSelectedItem} onMatch={handleMatch} onComplete={handleGameComplete} />
                </div>
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex items-center justify-center p-4">
               <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden text-center border-8 border-white">
                  <div className={`p-10 flex flex-col items-center ${calculateScore() >= 60 ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'} text-white relative`}>
                    <div className="absolute top-4 right-4 animate-pulse">
                      {calculateScore() >= 90 ? <Trophy size={48} className="text-white/40" /> : <Star size={48} className="text-white/40" />}
                    </div>
                    
                    <div className="text-8xl mb-4 drop-shadow-2xl animate-bounce">
                      {calculateScore() >= 90 ? '🏆' : calculateScore() >= 60 ? '⭐' : '💪'}
                    </div>

                    <div className="flex gap-4 mb-6">
                      {[1, 2, 3].map((s) => (
                        <motion.div
                          key={s}
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ 
                            scale: s <= getStarRating(calculateScore()) ? 1.2 : 1,
                            rotate: 0 
                          }}
                          transition={{ delay: 0.5 + (s * 0.2), type: "spring" }}
                        >
                          <Medal
                            size={64}
                            fill={s <= getStarRating(calculateScore()) ? "#fbbf24" : "none"}
                            className={`${s <= getStarRating(calculateScore()) ? 'text-yellow-400' : 'text-white/30'} drop-shadow-xl`}
                          />
                        </motion.div>
                      ))}
                    </div>

                    <h2 className="text-4xl font-black mb-2 drop-shadow-md">
                      {calculateScore() >= 90 ? 'ยอดเยี่ยมที่สุด!' : calculateScore() >= 60 ? 'เก่งมากเลยจ้า!' : 'พยายามอีกนิดนะ!'}
                    </h2>
                    
                    <AudioButton 
                      text={calculateScore() >= 80 ? "ยอดเยี่ยมไปเลยจ้า เก่งที่สุดเลย" : calculateScore() >= 60 ? "เก่งมากเลยจ้า ทำได้ดีมาก" : "พยายามอีกนิดนะจ๊ะ ลองใหม่อีกรอบนะ"} 
                      variant="large" 
                      iconSize={48} 
                      className="mb-4 bg-white/20 hover:bg-white/40 border-none text-white"
                      autoPlay={true}
                    />
                    
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-2 border border-white/30">
                      <p className="text-2xl font-black">คะแนน {calculateScore()}%</p>
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-2 gap-4">
                    <button 
                      onClick={startGame} 
                      className="py-5 bg-indigo-50 text-indigo-600 rounded-3xl font-black text-xl hover:bg-indigo-100 transition shadow-sm flex items-center justify-center gap-2 border-2 border-indigo-100"
                    >
                      <RotateCcw size={24} /> เล่นอีกครั้ง
                    </button>
                    <button 
                      onClick={() => navigate('/dashboard/student/lessons')} 
                      className="py-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-purple-100 flex items-center justify-center gap-2"
                    >
                      📖 กลับหน้าหลัก
                    </button>
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

  const matchColors = [
    { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
    { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
    { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
    { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
    { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
    { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700' },
    { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
    { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700' },
  ];

  const getMatchStyle = (word) => {
    const pairIndex = pairs.findIndex(p => p.word === word);
    if (pairIndex === -1) return '';
    const style = matchColors[pairIndex % matchColors.length];
    return `${style.bg} ${style.border} ${style.text}`;
  };

  return (
    <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 sm:gap-10 overflow-hidden px-2 sm:px-6">
        {/* Words Column */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-2 py-2">
          {shuffledWords.map((pair, idx) => {
            const isMatched = matches[pair.word] !== undefined;
            const isSelected = selectedItem?.word === pair.word;
            const matchStyle = isMatched ? getMatchStyle(pair.word) : '';
            
            return (
              <motion.button 
                key={`w-${idx}`} 
                whileHover={isMatched ? {} : { scale: 1.02, x: 5 }} 
                whileTap={isMatched ? {} : { scale: 0.98 }} 
                onClick={() => !isMatched && onSelect(pair)} 
                className={`flex-1 min-h-0 rounded-2xl border-2 font-black text-2xl sm:text-4xl transition-all flex items-center justify-center gap-3 ${isSelected ? 'bg-indigo-500 text-white border-indigo-400 shadow-xl scale-105' : isMatched ? `${matchStyle} shadow-inner` : 'bg-white text-gray-700 border-gray-100 hover:border-indigo-400 shadow-sm'}`}
              >
                {pair.word}
                <AudioButton text={pair.word} variant="mini" iconSize={20} className={`shrink-0 border-none ${isMatched ? 'bg-white/50' : 'bg-indigo-50'}`} onClick={e => e.stopPropagation()} />
              </motion.button>
            );
          })}
        </div>
        {/* Images Column */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-2 py-2">
          {shuffledImages.map((pair, idx) => {
            const matchedKey = Object.entries(matches).find(([k, v]) => v === pair.word)?.[0];
            const isMatched = matchedKey !== undefined;
            const matchStyle = isMatched ? getMatchStyle(pair.word) : '';

            return (
              <motion.button 
                key={`i-${idx}`} 
                whileHover={isMatched ? {} : { scale: 1.02, x: -5 }} 
                whileTap={isMatched ? {} : { scale: 0.98 }} 
                onClick={() => selectedItem && onMatch(selectedItem, pair)} 
                disabled={isMatched} 
                className={`flex-1 min-h-0 rounded-2xl border-2 p-2 transition-all flex items-center justify-center ${isMatched ? `${matchStyle} shadow-inner` : 'bg-white border-gray-100 hover:border-purple-400 shadow-sm'}`}
              >
                {pair.image ? <img src={pair.image} className={`h-full w-full object-contain mx-auto drop-shadow-sm transition-transform ${isMatched ? 'scale-110' : ''}`} /> : <ImageIcon size={48} className="mx-auto text-gray-300" />}
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
