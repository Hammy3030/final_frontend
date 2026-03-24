/**
 * Lesson Helper Functions
 * Utility functions for lesson-related calculations
 */

import { CheckCircle, BookOpen, Unlock, Lock } from 'lucide-react';

/**
 * Get lesson status information
 * @param {Object} lesson - Lesson object
 * @returns {Object} Status object with icon, color, bgColor, and canAccess
 */
export function getLessonStatus(lesson) {
  const status = lesson.status || 'LOCKED';
  const canAccess = lesson.canAccess || false;

  switch (status) {
    case 'COMPLETED':
      return { 
        status: 'COMPLETED', 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bgColor: 'bg-green-100', 
        canAccess: true 
      };
    case 'POST_TEST_READY':
      return { 
        status: 'POST_TEST_READY', 
        icon: BookOpen, 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-100', 
        canAccess: false 
      };
    case 'GAMES_READY':
      return { 
        status: 'GAMES_READY', 
        icon: BookOpen, 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-100', 
        canAccess: false 
      };
    case 'IN_PROGRESS':
      return { 
        status: 'IN_PROGRESS', 
        icon: BookOpen, 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100', 
        canAccess: true 
      };
    case 'PRE_TEST_READY':
      return { 
        status: 'PRE_TEST_READY', 
        icon: BookOpen, 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-100', 
        canAccess: false 
      };
    case 'UNLOCKED':
      return { 
        status: 'UNLOCKED', 
        icon: Unlock, 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100', 
        canAccess: true 
      };
    case 'LOCKED':
    default:
      return { 
        status: 'LOCKED', 
        icon: Lock, 
        color: 'text-gray-400', 
        bgColor: 'bg-gray-100', 
        canAccess: false 
      };
  }
}

/**
 * Get lesson score from progress
 * @param {string} lessonId - Lesson ID
 * @param {Object} progress - Progress object
 * @returns {number|null} Average score or null
 */
export function getLessonScore(lessonId, progress) {
  const lessonTests = progress?.testAttempts?.filter(attempt => {
    const testLessonId = attempt.test?.lessonId || attempt.test?.lesson_id;
    return testLessonId === lessonId;
  }) || [];

  if (lessonTests.length === 0) return null;

  const avgScore = lessonTests.reduce((sum, test) => sum + test.score, 0) / lessonTests.length;
  return Math.round(avgScore);
}

/**
 * Get star rating from score
 * @param {number} score - Score percentage
 * @returns {number} Number of stars (0-3)
 */
export function getStarRating(score) {
  if (score >= 90) return 3;
  if (score >= 80) return 2;
  if (score >= 60) return 1;
  return 0;
}

/**
 * Calculate total stars from test attempts
 * @param {Array} testAttempts - Array of test attempts
 * @returns {number} Total stars
 */
export function calculateTotalStars(testAttempts) {
  return testAttempts.reduce((total, attempt) => {
    const score = attempt.score || 0;
    if (score >= 90) return total + 3;
    if (score >= 80) return total + 2;
    if (score >= 60) return total + 1;
    return total;
  }, 0);
}

/**
 * Calculate gold medals from game attempts (100% score)
 * @param {Array} gameAttempts - Array of game attempts
 * @returns {number} Number of gold medals
 */
export function calculateGoldMedals(gameAttempts) {
  return gameAttempts.filter(attempt => (attempt.score || 0) === 100).length;
}

/**
 * Calculate stamps from completed lessons
 * @param {Array} lessons - Array of lessons
 * @returns {number} Number of stamps
 */
export function calculateStamps(lessons) {
  return lessons.filter(lesson => {
    if (lesson.status === 'COMPLETED') return true;
    if (lesson.progress && lesson.progress.isCompleted === true) return true;
    return false;
  }).length;
}
