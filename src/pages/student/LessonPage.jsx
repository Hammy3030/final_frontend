import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  CheckCircle,
  FileText,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../../contexts/MockAuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';

const LessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Fetch lesson details
  const { data: lessonData, isLoading } = useQuery(
    ['lesson', lessonId],
    async () => {
      const response = await axios.get(`/api/lessons/${lessonId}`);
      return response.data.data.lesson;
    }
  );

  // Complete lesson mutation
  const completeLessonMutation = useMutation(
    async () => {
      const response = await axios.post(`/api/student/lessons/${lessonId}/complete`);
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('student-lessons');
        setShowConfetti(true);
        toast.success('เรียนจบบทเรียนแล้ว');

        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  );

  const handleCompleteLesson = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าจบการเรียนบทเรียนนี้แล้ว?')) {
      completeLessonMutation.mutate();
    }
  };

  const handleAudioToggle = () => {
    setIsAudioPlaying(!isAudioPlaying);
  };

  const handleNextAction = () => {
    if (lessonData?.postTest && lessonData.postTest.length > 0) {
      navigate(`/dashboard/student/tests/${lessonData.postTest[0].id}`);
    } else if (lessonData?.games && lessonData.games.length > 0) {
      navigate(`/dashboard/student/games/${lessonData.games[0].id}`);
    } else {
      navigate('/dashboard/student');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard/student')}
                className="p-2 text-gray-400 hover:text-gray-600 transition duration-200 mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  บทที่ {lessonData?.order}: {lessonData?.title}
                </h1>
                <p className="text-sm text-gray-500">
                  บทเรียนภาษาไทย ป.1
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {lessonData?.audioUrl && (
                <button
                  onClick={handleAudioToggle}
                  className={`p-2 rounded-lg transition duration-200 ${isAudioPlaying
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                >
                  {isAudioPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border mb-8"
        >
          <div className="p-8">
            {/* Audio Player */}
            {lessonData?.audioUrl && (
              <div className="mb-6">
                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                  <Volume2 className="w-6 h-6 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">เสียงบรรยายบทเรียน</p>
                    <audio
                      controls
                      className="w-full mt-2"
                      onPlay={() => setIsAudioPlaying(true)}
                      onPause={() => setIsAudioPlaying(false)}
                    >
                      <source src={lessonData.audioUrl} type="audio/mpeg" />
                      เบราว์เซอร์ของคุณไม่รองรับการเล่นเสียง
                    </audio>
                  </div>
                </div>
              </div>
            )}

            {/* Lesson Image */}
            {lessonData?.imageUrl && (
              <div className="mb-6 text-center">
                <img
                  src={lessonData.imageUrl}
                  alt={lessonData.title}
                  className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                />
              </div>
            )}

            {/* Lesson Content */}
            <div className="prose prose-lg max-w-none">
              <div
                className="text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: lessonData?.content }}
              />
            </div>

            {/* Interactive Elements */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <h4 className="font-semibold text-green-800 mb-2">แบบฝึกหัด</h4>
                <p className="text-green-700 text-sm">
                  ทดสอบความเข้าใจด้วยแบบฝึกหัดต่างๆ
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
              >
                <h4 className="font-semibold text-purple-800 mb-2">เกมการเรียนรู้</h4>
                <p className="text-purple-700 text-sm">
                  เล่นเกมเพื่อความสนุกและความเข้าใจ
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard/student')}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition duration-200"
          >
            กลับ
          </button>

          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCompleteLesson}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition duration-200 flex items-center"
              disabled={completeLessonMutation.isLoading}
            >
              {completeLessonMutation.isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              เรียนจบแล้ว
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextAction}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 flex items-center"
            >
              {lessonData?.postTest && lessonData.postTest.length > 0 ? (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  ทำแบบทดสอบ
                </>
              ) : lessonData?.games && lessonData.games.length > 0 ? (
                <>
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  เล่นเกม
                </>
              ) : (
                'ต่อไป'
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
