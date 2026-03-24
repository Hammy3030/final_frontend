/**
 * Service Constants
 * Centralized constants for service layer
 */

// API Delay Constants (for mock services)
export const API_DELAYS = {
  SHORT: 300,   // 300ms for quick operations
  MEDIUM: 500,  // 500ms for standard operations
  LONG: 1000    // 1000ms for heavy operations
};

// Error Messages
export const ERROR_MESSAGES = {
  FETCH_CLASSROOMS: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องเรียน',
  CREATE_CLASSROOM: 'เกิดข้อผิดพลาดในการสร้างห้องเรียน',
  UPDATE_CLASSROOM: 'เกิดข้อผิดพลาดในการอัปเดตห้องเรียน',
  DELETE_CLASSROOM: 'เกิดข้อผิดพลาดในการลบห้องเรียน',
  FETCH_LESSONS: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทเรียน',
  CREATE_LESSON: 'เกิดข้อผิดพลาดในการสร้างบทเรียน',
  FETCH_TESTS: 'เกิดข้อผิดพลาดในการดึงข้อมูลแบบทดสอบ',
  CREATE_TEST: 'เกิดข้อผิดพลาดในการสร้างแบบทดสอบ',
  FETCH_GAMES: 'เกิดข้อผิดพลาดในการดึงข้อมูลเกม',
  CREATE_GAME: 'เกิดข้อผิดพลาดในการสร้างเกม',
  FETCH_PROGRESS: 'เกิดข้อผิดพลาดในการดึงข้อมูลความคืบหน้า',
  UPDATE_PROGRESS: 'เกิดข้อผิดพลาดในการอัปเดตความคืบหน้า',
  FETCH_NOTIFICATIONS: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน',
  MARK_NOTIFICATION_READ: 'เกิดข้อผิดพลาดในการอัปเดตสถานะการแจ้งเตือน',
  CREATE_STUDENT: 'เกิดข้อผิดพลาดในการสร้างนักเรียน',
  FETCH_STUDENTS: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน',
  NOT_FOUND: 'ไม่พบข้อมูลที่ต้องการ',
  GENERIC: 'เกิดข้อผิดพลาด'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CLASSROOM_CREATED: 'สร้างห้องเรียนสำเร็จ',
  CLASSROOM_UPDATED: 'อัปเดตห้องเรียนสำเร็จ',
  CLASSROOM_DELETED: 'ลบห้องเรียนสำเร็จ',
  LESSON_CREATED: 'สร้างบทเรียนสำเร็จ',
  TEST_CREATED: 'สร้างแบบทดสอบสำเร็จ',
  GAME_CREATED: 'สร้างเกมสำเร็จ',
  PROGRESS_UPDATED: 'อัปเดตความคืบหน้าสำเร็จ',
  NOTIFICATION_MARKED_READ: 'อัปเดตสถานะการแจ้งเตือนแล้ว'
};
