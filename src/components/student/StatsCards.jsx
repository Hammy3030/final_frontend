import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, TrendingUp } from 'lucide-react';

/**
 * Stats Cards Component
 * Displays dashboard statistics
 */
const StatsCards = ({ totalLessons, completedLessons, overallProgress }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4"
      >
        <div className="p-3 bg-blue-100 rounded-full">
          <BookOpen className="text-blue-600" size={28} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">บทเรียนทั้งหมด</p>
          <h2 className="text-3xl font-bold text-gray-900">{totalLessons}</h2>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.03 }}
        className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4"
      >
        <div className="p-3 bg-green-100 rounded-full">
          <CheckCircle className="text-green-600" size={28} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">เรียนจบแล้ว</p>
          <h2 className="text-3xl font-bold text-gray-900">{completedLessons}</h2>
        </div>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.03 }}
        className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4"
      >
        <div className="p-3 bg-purple-100 rounded-full">
          <TrendingUp className="text-purple-600" size={28} />
        </div>
        <div>
          <p className="text-gray-500 text-sm">ความคืบหน้า</p>
          <h2 className="text-3xl font-bold text-gray-900">{overallProgress}%</h2>
        </div>
      </motion.div>
    </div>
  );
};

export default StatsCards;
