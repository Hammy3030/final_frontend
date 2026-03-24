import { 
  mockClassrooms, 
  mockLessons, 
  mockTests, 
  mockGames, 
  mockProgress, 
  mockTestAttempts, 
  mockGameAttempts, 
  mockNotifications,
  mockFirestore 
} from '../config/mockData';
import { API_DELAYS, ERROR_MESSAGES } from './constants';

/**
 * Generic error handler for service operations
 * @param {Error} error - Error object
 * @param {string} operation - Operation name for logging
 * @throws {Error} - Re-throws the error
 */
function handleServiceError(error, operation) {
  console.error(`Error in ${operation}:`, error);
  throw error;
}

/**
 * Simulates API delay
 * @param {number} delay - Delay in milliseconds
 * @returns {Promise<void>}
 */
function simulateDelay(delay = API_DELAYS.MEDIUM) {
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Generates a unique ID with timestamp
 * @param {string} prefix - ID prefix
 * @returns {string} - Unique ID
 */
function generateId(prefix) {
  return `${prefix}-${Date.now()}`;
}

export class MockFirestoreService {
  // Classroom operations
  static async getClassrooms(teacherId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      return mockClassrooms.filter(classroom => classroom.teacherId === teacherId);
    } catch (error) {
      handleServiceError(error, 'getClassrooms');
    }
  }

  static async createClassroom(classroomData) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const newClassroom = {
        id: generateId('classroom'),
        ...classroomData,
        studentIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockClassrooms.push(newClassroom);
      return newClassroom;
    } catch (error) {
      handleServiceError(error, 'createClassroom');
    }
  }

  static async getClassroomById(classroomId) {
    try {
      await simulateDelay(API_DELAYS.SHORT);
      return mockClassrooms.find(classroom => classroom.id === classroomId);
    } catch (error) {
      handleServiceError(error, 'getClassroomById');
    }
  }

  static async updateClassroom(classroomId, updateData) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const classroomIndex = mockClassrooms.findIndex(classroom => classroom.id === classroomId);
      if (classroomIndex === -1) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      }
      mockClassrooms[classroomIndex] = {
        ...mockClassrooms[classroomIndex],
        ...updateData,
        updatedAt: new Date()
      };
      return mockClassrooms[classroomIndex];
    } catch (error) {
      handleServiceError(error, 'updateClassroom');
    }
  }

  static async deleteClassroom(classroomId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const classroomIndex = mockClassrooms.findIndex(classroom => classroom.id === classroomId);
      if (classroomIndex === -1) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      }
      mockClassrooms.splice(classroomIndex, 1);
      return { success: true };
    } catch (error) {
      handleServiceError(error, 'deleteClassroom');
    }
  }

  // Lesson operations
  static async getLessons(classroomId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      return mockLessons.filter(lesson => lesson.classroomId === classroomId);
    } catch (error) {
      handleServiceError(error, 'getLessons');
    }
  }

  static async createLesson(lessonData) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const newLesson = {
        id: generateId('lesson'),
        ...lessonData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockLessons.push(newLesson);
      return newLesson;
    } catch (error) {
      handleServiceError(error, 'createLesson');
    }
  }

  static async getLessonById(lessonId) {
    try {
      await simulateDelay(API_DELAYS.SHORT);
      return mockLessons.find(lesson => lesson.id === lessonId);
    } catch (error) {
      handleServiceError(error, 'getLessonById');
    }
  }

  // Test operations
  static async getTests(classroomId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      return mockTests.filter(test => test.classroomId === classroomId);
    } catch (error) {
      handleServiceError(error, 'getTests');
    }
  }

  static async createTest(testData) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const newTest = {
        id: generateId('test'),
        ...testData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockTests.push(newTest);
      return newTest;
    } catch (error) {
      handleServiceError(error, 'createTest');
    }
  }

  static async getTestById(testId) {
    try {
      await simulateDelay(API_DELAYS.SHORT);
      return mockTests.find(test => test.id === testId);
    } catch (error) {
      handleServiceError(error, 'getTestById');
    }
  }

  // Game operations
  static async getGames(classroomId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      return mockGames.filter(game => game.classroomId === classroomId);
    } catch (error) {
      handleServiceError(error, 'getGames');
    }
  }

  static async createGame(gameData) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const newGame = {
        id: generateId('game'),
        ...gameData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockGames.push(newGame);
      return newGame;
    } catch (error) {
      handleServiceError(error, 'createGame');
    }
  }

  // Progress operations
  static async getProgress(studentId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      return mockProgress.filter(progress => progress.studentId === studentId);
    } catch (error) {
      handleServiceError(error, 'getProgress');
    }
  }

  static async updateProgress(progressData) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const progressIndex = mockProgress.findIndex(progress => 
        progress.studentId === progressData.studentId && 
        progress.lessonId === progressData.lessonId
      );
      
      if (progressIndex !== -1) {
        mockProgress[progressIndex] = {
          ...mockProgress[progressIndex],
          ...progressData,
          updatedAt: new Date()
        };
      } else {
        const newProgress = {
          id: generateId('progress'),
          ...progressData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockProgress.push(newProgress);
      }
      return { success: true };
    } catch (error) {
      handleServiceError(error, 'updateProgress');
    }
  }

  // Test Attempt operations
  static async submitTestAttempt(attemptData) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const newAttempt = {
        id: generateId('attempt'),
        ...attemptData,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockTestAttempts.push(newAttempt);
      return newAttempt;
    } catch (error) {
      handleServiceError(error, 'submitTestAttempt');
    }
  }

  static async getTestAttempts(studentId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      return mockTestAttempts.filter(attempt => attempt.studentId === studentId);
    } catch (error) {
      handleServiceError(error, 'getTestAttempts');
    }
  }

  // Game Attempt operations
  static async submitGameAttempt(attemptData) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const newAttempt = {
        id: generateId('game-attempt'),
        ...attemptData,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockGameAttempts.push(newAttempt);
      return newAttempt;
    } catch (error) {
      handleServiceError(error, 'submitGameAttempt');
    }
  }

  static async getGameAttempts(studentId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      return mockGameAttempts.filter(attempt => attempt.studentId === studentId);
    } catch (error) {
      handleServiceError(error, 'getGameAttempts');
    }
  }

  // Notification operations
  static async getNotifications(userId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      return mockNotifications.filter(notification => notification.userId === userId);
    } catch (error) {
      handleServiceError(error, 'getNotifications');
    }
  }

  static async markNotificationAsRead(notificationId) {
    try {
      await simulateDelay(API_DELAYS.SHORT);
      const notification = mockNotifications.find(notif => notif.id === notificationId);
      if (notification) {
        notification.isRead = true;
        notification.updatedAt = new Date();
      }
      return { success: true };
    } catch (error) {
      handleServiceError(error, 'markNotificationAsRead');
    }
  }

  // Student operations
  static async createStudent(studentData) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      const newStudent = {
        id: generateId('student'),
        ...studentData,
        role: 'STUDENT',
        qrCode: `STU${Date.now().toString().slice(-6)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      // Add to mock users (this would be in a real app)
      return newStudent;
    } catch (error) {
      handleServiceError(error, 'createStudent');
    }
  }

  static async getStudents(classroomId) {
    try {
      await simulateDelay(API_DELAYS.MEDIUM);
      // In a real app, this would query the database
      return [];
    } catch (error) {
      handleServiceError(error, 'getStudents');
    }
  }
}
