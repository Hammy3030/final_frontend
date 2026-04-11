// Mock data for development
export const mockUsers = [
  {
    id: 'teacher-1',
    email: 'teacher@test.com',
    role: 'TEACHER',
    name: 'ครูสมชาย ใจดี',
    school: 'โรงเรียนวัดไทย',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'student-1',
    email: 'student1@test.com',
    role: 'STUDENT',
    name: 'ด.ช. สมชาย แก้วใส',
    classroomId: 'classroom-1',
    qrCode: 'STU001',
    studentCode: 'STU001',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'student-2',
    email: 'student2@test.com',
    role: 'STUDENT',
    name: 'ด.ญ. สมหญิง ดีงาม',
    classroomId: 'classroom-1',
    qrCode: 'STU002',
    studentCode: 'STU002',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'student-3',
    email: 'student3@test.com',
    role: 'STUDENT',
    name: 'ด.ช. วิทยา รักเรียน',
    classroomId: 'classroom-1',
    qrCode: 'STU003',
    studentCode: 'STU003',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'student-4',
    email: 'student4@test.com',
    role: 'STUDENT',
    name: 'ด.ญ. กัญญา สุขใจ',
    classroomId: 'classroom-1',
    qrCode: 'STU004',
    studentCode: 'STU004',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'student-5',
    email: 'student5@test.com',
    role: 'STUDENT',
    name: 'ด.ช. ชัยชนะ เก่งกาจ',
    classroomId: 'classroom-2',
    qrCode: 'STU005',
    studentCode: 'STU005',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const mockClassrooms = [
  {
    id: 'classroom-1',
    name: 'ห้องเรียน ป.1/1',
    description: 'ห้องเรียนภาษาไทย ป.1 ภาคเรียนที่ 1',
    teacherId: 'teacher-1',
    studentIds: ['student-1', 'student-2', 'student-3', 'student-4'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'classroom-2',
    name: 'ห้องเรียน ป.1/2',
    description: 'ห้องเรียนภาษาไทย ป.1 ภาคเรียนที่ 1',
    teacherId: 'teacher-1',
    studentIds: ['student-5'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const mockLessons = [
  {
    id: 'lesson-1',
    title: 'บทที่ 1: สระ อา',
    content: 'เรียนรู้สระ อา และการออกเสียง พร้อมตัวอย่างคำศัพท์ เช่น กา ขา คา',
    audioUrl: '/audio/lesson1.mp3',
    imageUrl: '/images/lesson1.jpg',
    order: 1,
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    hasPreTest: true,
    hasPostTest: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'lesson-2',
    title: 'บทที่ 2: สระ อี',
    content: 'เรียนรู้สระ อี และการออกเสียง พร้อมตัวอย่างคำศัพท์ เช่น กี ขี คี',
    audioUrl: '/audio/lesson2.mp3',
    imageUrl: '/images/lesson2.jpg',
    order: 2,
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    hasPreTest: true,
    hasPostTest: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'lesson-3',
    title: 'บทที่ 3: สระ อือ',
    content: 'เรียนรู้สระ อือ และการออกเสียง พร้อมตัวอย่างคำศัพท์ เช่น กือ ขือ คือ',
    audioUrl: '/audio/lesson3.mp3',
    imageUrl: '/images/lesson3.jpg',
    order: 3,
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    hasPreTest: true,
    hasPostTest: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'lesson-4',
    title: 'บทที่ 4: สระ อุ',
    content: 'เรียนรู้สระ อุ และการออกเสียง พร้อมตัวอย่างคำศัพท์ เช่น กุ ขุ คุ',
    audioUrl: '/audio/lesson4.mp3',
    imageUrl: '/images/lesson4.jpg',
    order: 4,
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    hasPreTest: true,
    hasPostTest: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'lesson-5',
    title: 'บทที่ 5: สระ เอ',
    content: 'เรียนรู้สระ เอ และการออกเสียง พร้อมตัวอย่างคำศัพท์ เช่น เก เข เค',
    audioUrl: '/audio/lesson5.mp3',
    imageUrl: '/images/lesson5.jpg',
    order: 5,
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    hasPreTest: true,
    hasPostTest: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const mockTests = [
  // Lesson 1: สระ อา
  {
    id: 'test-1-pre',
    title: 'แบบทดสอบก่อนเรียน - สระ อา',
    type: 'PRE_TEST',
    timeLimit: 10,
    lessonId: 'lesson-1',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    passingScore: 60,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'test-1-post',
    title: 'แบบทดสอบหลังเรียน - สระ อา',
    type: 'POST_TEST',
    timeLimit: 15,
    lessonId: 'lesson-1',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    passingScore: 70,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'test-1-normal',
    title: 'แบบทดสอบธรรมดา - สระ อา',
    type: 'NORMAL',
    timeLimit: 20,
    lessonId: 'lesson-1',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    passingScore: 80,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  // Lesson 2: สระ อี
  {
    id: 'test-2-pre',
    title: 'แบบทดสอบก่อนเรียน - สระ อี',
    type: 'PRE_TEST',
    timeLimit: 10,
    lessonId: 'lesson-2',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    passingScore: 60,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'test-2-post',
    title: 'แบบทดสอบหลังเรียน - สระ อี',
    type: 'POST_TEST',
    timeLimit: 15,
    lessonId: 'lesson-2',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    passingScore: 70,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'test-2-normal',
    title: 'แบบทดสอบธรรมดา - สระ อี',
    type: 'NORMAL',
    timeLimit: 20,
    lessonId: 'lesson-2',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    passingScore: 80,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  // Lesson 3: สระ อือ
  {
    id: 'test-3-pre',
    title: 'แบบทดสอบก่อนเรียน - สระ อือ',
    type: 'PRE_TEST',
    timeLimit: 10,
    lessonId: 'lesson-3',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    passingScore: 60,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'test-3-post',
    title: 'แบบทดสอบหลังเรียน - สระ อือ',
    type: 'POST_TEST',
    timeLimit: 15,
    lessonId: 'lesson-3',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    passingScore: 70,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'test-3-normal',
    title: 'แบบทดสอบธรรมดา - สระ อือ',
    type: 'NORMAL',
    timeLimit: 20,
    lessonId: 'lesson-3',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    passingScore: 80,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const mockQuestions = [
  // Pre-test Lesson 1
  {
    id: 'question-1-pre-1',
    testId: 'test-1-pre',
    question: 'สระ อา อ่านว่าอะไร?',
    options: ['อา', 'อี', 'อือ', 'อุ'],
    correctAnswer: 0,
    explanation: 'สระ อา อ่านว่า อา',
    imageUrl: '/images/sara-aa.jpg',
    audioUrl: '/audio/sara-aa.mp3',
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'question-1-pre-2',
    testId: 'test-1-pre',
    question: 'คำใดมีสระ อา?',
    options: ['กา', 'กี', 'กือ', 'กุ'],
    correctAnswer: 0,
    explanation: 'คำว่า กา มีสระ อา',
    imageUrl: '/images/ka.jpg',
    audioUrl: '/audio/ka.mp3',
    order: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  // Post-test Lesson 1
  {
    id: 'question-1-post-1',
    testId: 'test-1-post',
    question: 'ข อา อ่านว่าอะไร?',
    options: ['ขา', 'ขี', 'ขือ', 'ขุ'],
    correctAnswer: 0,
    explanation: 'ข อา อ่านว่า ขา',
    imageUrl: '/images/kha.jpg',
    audioUrl: '/audio/kha.mp3',
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'question-1-post-2',
    testId: 'test-1-post',
    question: 'คำใดไม่มีสระ อา?',
    options: ['กี', 'กา', 'ขา', 'คา'],
    correctAnswer: 0,
    explanation: 'คำว่า กี ไม่มีสระ อา มีสระ อี',
    imageUrl: '/images/ki.jpg',
    audioUrl: '/audio/ki.mp3',
    order: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  // Normal test Lesson 1
  {
    id: 'question-1-normal-1',
    testId: 'test-1-normal',
    question: 'คำใดเขียนถูกต้อง?',
    options: ['กา', 'กา', 'ก า', 'ก-า'],
    correctAnswer: 0,
    explanation: 'คำว่า กา เขียนถูกต้อง',
    imageUrl: '/images/ka-correct.jpg',
    audioUrl: '/audio/ka-correct.mp3',
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'question-1-normal-2',
    testId: 'test-1-normal',
    question: 'รูปภาพนี้คือคำว่าอะไร? [รูปขา]',
    options: ['ขา', 'กา', 'คา', 'งา'],
    correctAnswer: 0,
    explanation: 'รูปภาพนี้คือคำว่า ขา',
    imageUrl: '/images/kha-picture.jpg',
    audioUrl: '/audio/kha-picture.mp3',
    order: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const mockGames = [
  // Lesson 1: สระ อา
  {
    id: 'game-1-matching',
    title: 'เกมจับคู่สระ อา',
    type: 'MATCHING',
    settings: {
      pairs: [
        { word: 'กา', image: '/images/ka.jpg', audio: '/audio/ka.mp3' },
        { word: 'ขา', image: '/images/kha.jpg', audio: '/audio/kha.mp3' },
        { word: 'คา', image: '/images/kha.jpg', audio: '/audio/kha.mp3' },
        { word: 'งา', image: '/images/nga.jpg', audio: '/audio/nga.mp3' }
      ]
    },
    lessonId: 'lesson-1',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'game-1-linking',
    title: 'เกมโยงคำสระ อา',
    type: 'LINKING',
    settings: {
      words: ['กา', 'ขา', 'คา', 'งา'],
      definitions: ['นก', 'ขาคน', 'ติดขัด', 'งา'],
      images: ['/images/bird.jpg', '/images/leg.jpg', '/images/stuck.jpg', '/images/sesame.jpg']
    },
    lessonId: 'lesson-1',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'game-1-drag',
    title: 'เกมลากวางสระ อา',
    type: 'DRAG_DROP',
    settings: {
      items: [
        { id: 'item-1', word: 'กา', correctZone: 'zone-aa' },
        { id: 'item-2', word: 'กี', correctZone: 'zone-ii' },
        { id: 'item-3', word: 'ขา', correctZone: 'zone-aa' },
        { id: 'item-4', word: 'ขี', correctZone: 'zone-ii' }
      ],
      zones: [
        { id: 'zone-aa', label: 'สระ อา' },
        { id: 'zone-ii', label: 'สระ อี' }
      ]
    },
    lessonId: 'lesson-1',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  // Lesson 2: สระ อี
  {
    id: 'game-2-matching',
    title: 'เกมจับคู่สระ อี',
    type: 'MATCHING',
    settings: {
      pairs: [
        { word: 'กี', image: '/images/ki.jpg', audio: '/audio/ki.mp3' },
        { word: 'ขี', image: '/images/khi.jpg', audio: '/audio/khi.mp3' },
        { word: 'คี', image: '/images/khi.jpg', audio: '/audio/khi.mp3' },
        { word: 'งี', image: '/images/ngi.jpg', audio: '/audio/ngi.mp3' }
      ]
    },
    lessonId: 'lesson-2',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'game-2-linking',
    title: 'เกมโยงคำสระ อี',
    type: 'LINKING',
    settings: {
      words: ['กี', 'ขี', 'คี', 'งี'],
      definitions: ['กี่', 'ขี้', 'คี่', 'งี่เง่า'],
      images: ['/images/how-many.jpg', '/images/dirt.jpg', '/images/odd.jpg', '/images/foolish.jpg']
    },
    lessonId: 'lesson-2',
    classroomId: 'classroom-1',
    teacherId: 'teacher-1',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const mockProgress = [
  // Student 1 - มีความคืบหน้าดี
  {
    id: 'progress-1-1',
    studentId: 'student-1',
    lessonId: 'lesson-1',
    isCompleted: true,
    hasPassedPreTest: true,
    hasPassedPostTest: true,
    isUnlocked: true,
    completedAt: new Date('2024-01-15'),
    timeSpent: 1200, // 20 minutes
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'progress-1-2',
    studentId: 'student-1',
    lessonId: 'lesson-2',
    isCompleted: true,
    hasPassedPreTest: true,
    hasPassedPostTest: true,
    isUnlocked: true,
    completedAt: new Date('2024-01-20'),
    timeSpent: 900, // 15 minutes
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'progress-1-3',
    studentId: 'student-1',
    lessonId: 'lesson-3',
    isCompleted: false,
    hasPassedPreTest: true,
    hasPassedPostTest: false,
    isUnlocked: true,
    completedAt: null,
    timeSpent: 300, // 5 minutes (กำลังเรียนอยู่)
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21')
  },

  // Student 2 - เพิ่งเริ่มเรียน
  {
    id: 'progress-2-1',
    studentId: 'student-2',
    lessonId: 'lesson-1',
    isCompleted: true,
    hasPassedPreTest: true,
    hasPassedPostTest: false,
    isUnlocked: true,
    completedAt: null,
    timeSpent: 600, // 10 minutes
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },

  // Student 3 - ยังไม่เริ่มเรียน
  {
    id: 'progress-3-1',
    studentId: 'student-3',
    lessonId: 'lesson-1',
    isCompleted: false,
    hasPassedPreTest: false,
    hasPassedPostTest: false,
    isUnlocked: true,
    completedAt: null,
    timeSpent: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

export const mockTestAttempts = [
  // Student 1 - Lesson 1 (ทำครบทุกแบบทดสอบ)
  {
    id: 'attempt-1-1-pre',
    studentId: 'student-1',
    testId: 'test-1-pre',
    answers: { 'question-1-pre-1': 0, 'question-1-pre-2': 0 },
    score: 100,
    isPassed: true,
    attemptNumber: 1,
    timeSpent: 300, // 5 minutes
    completedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'attempt-1-1-post',
    studentId: 'student-1',
    testId: 'test-1-post',
    answers: { 'question-1-post-1': 0, 'question-1-post-2': 0 },
    score: 100,
    isPassed: true,
    attemptNumber: 1,
    timeSpent: 420, // 7 minutes
    completedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'attempt-1-1-normal',
    studentId: 'student-1',
    testId: 'test-1-normal',
    answers: { 'question-1-normal-1': 0, 'question-1-normal-2': 0 },
    score: 100,
    isPassed: true,
    attemptNumber: 1,
    timeSpent: 600, // 10 minutes
    completedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },

  // Student 1 - Lesson 2 (ทำครบทุกแบบทดสอบ)
  {
    id: 'attempt-1-2-pre',
    studentId: 'student-1',
    testId: 'test-2-pre',
    answers: { 'question-2-pre-1': 0, 'question-2-pre-2': 0 },
    score: 100,
    isPassed: true,
    attemptNumber: 1,
    timeSpent: 240, // 4 minutes
    completedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'attempt-1-2-post',
    studentId: 'student-1',
    testId: 'test-2-post',
    answers: { 'question-2-post-1': 0, 'question-2-post-2': 0 },
    score: 100,
    isPassed: true,
    attemptNumber: 1,
    timeSpent: 360, // 6 minutes
    completedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },

  // Student 2 - Lesson 1 (ทำเฉพาะ Pre-test)
  {
    id: 'attempt-2-1-pre',
    studentId: 'student-2',
    testId: 'test-1-pre',
    answers: { 'question-1-pre-1': 0, 'question-1-pre-2': 1 },
    score: 50,
    isPassed: false,
    attemptNumber: 1,
    timeSpent: 600, // 10 minutes
    completedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  }
];

export const mockGameAttempts = [
  // Student 1 - Lesson 1 Games
  {
    id: 'game-attempt-1-1-matching',
    studentId: 'student-1',
    gameId: 'game-1-matching',
    score: 100,
    level: 1,
    isPassed: true,
    attemptNumber: 1,
    timeSpent: 240, // 4 minutes
    data: { pairs: 4, correct: 4, wrong: 0 },
    completedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'game-attempt-1-1-linking',
    studentId: 'student-1',
    gameId: 'game-1-linking',
    score: 100,
    level: 1,
    isPassed: true,
    attemptNumber: 1,
    timeSpent: 300, // 5 minutes
    data: { links: 4, correct: 4, wrong: 0 },
    completedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'game-attempt-1-1-drag',
    studentId: 'student-1',
    gameId: 'game-1-drag',
    score: 100,
    level: 1,
    isPassed: true,
    attemptNumber: 1,
    timeSpent: 180, // 3 minutes
    data: { items: 4, correct: 4, wrong: 0 },
    completedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },

  // Student 1 - Lesson 2 Games
  {
    id: 'game-attempt-1-2-matching',
    studentId: 'student-1',
    gameId: 'game-2-matching',
    score: 75,
    level: 1,
    isPassed: true,
    attemptNumber: 1,
    timeSpent: 360, // 6 minutes
    data: { pairs: 4, correct: 3, wrong: 1 },
    completedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

export const mockNotifications = [
  // Student 1 Notifications
  {
    id: 'notification-1-1',
    userId: 'student-1',
    title: '🎉 ยินดีด้วย คุณผ่านแบบทดสอบหลังเรียน',
    message: 'คุณทำคะแนนได้ 100 คะแนนในแบบทดสอบหลังเรียน - สระ อา',
    type: 'SUCCESS',
    isRead: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'notification-1-2',
    userId: 'student-1',
    title: '🔓 ปลดล็อกแบบทดสอบธรรมดาแล้ว',
    message: 'คุณสามารถทำแบบทดสอบธรรมดา - สระ อา ได้แล้ว',
    type: 'INFO',
    isRead: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'notification-1-3',
    userId: 'student-1',
    title: '📚 มีบทเรียนใหม่',
    message: 'ครูได้เปิดบทเรียนใหม่: บทที่ 3 สระ อือ',
    type: 'INFO',
    isRead: false,
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: 'notification-1-4',
    userId: 'student-1',
    title: '⏰ อย่าลืมทำแบบทดสอบ',
    message: 'คุณยังทำแบบทดสอบหลังเรียน - สระ อือ ไม่เสร็จ',
    type: 'WARNING',
    isRead: false,
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22')
  },

  // Student 2 Notifications
  {
    id: 'notification-2-1',
    userId: 'student-2',
    title: '❌ แบบทดสอบไม่ผ่าน',
    message: 'คุณทำคะแนนได้ 50 คะแนน ซึ่งต่ำกว่าเกณฑ์ผ่าน กรุณาทบทวนบทเรียนและลองใหม่อีกครั้ง',
    type: 'ERROR',
    isRead: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'notification-2-2',
    userId: 'student-2',
    title: '📢 ประกาศจากครู',
    message: 'กรุณาทำแบบทดสอบก่อนเรียนให้เสร็จภายในวันศุกร์นี้',
    type: 'INFO',
    isRead: false,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18')
  },

  // Student 3 Notifications
  {
    id: 'notification-3-1',
    userId: 'student-3',
    title: '👋 ยินดีต้อนรับ',
    message: 'ยินดีต้อนรับสู่ระบบเรียนภาษาไทย ป.1 เริ่มต้นการเรียนรู้กันเลย',
    type: 'INFO',
    isRead: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

// Mock authentication state
export const mockAuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false
};

// Mock functions
export const mockAuth = {
  login: async (credentials) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u =>
      u.email === credentials.email &&
      u.role === (credentials.role || 'TEACHER')
    );

    if (user) {
      return {
        success: true,
        user,
        token: `mock-token-${user.id}`
      };
    }

    throw new Error('ไม่พบผู้ใช้ในระบบ');
  },

  qrLogin: async (qrCode) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u => u.qrCode === qrCode);

    if (user) {
      return {
        success: true,
        user,
        token: `mock-token-${user.id}`
      };
    }

    throw new Error('ไม่พบ QR Code นี้ในระบบ');
  },

  register: async (userData) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newUser = {
      id: `user-${Date.now()}`,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      school: userData.school,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockUsers.push(newUser);

    return {
      success: true,
      user: newUser
    };
  },

  logout: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }
};

// Mock Firestore functions
export const mockFirestore = {
  getClassrooms: async (teacherId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockClassrooms.filter(c => c.teacherId === teacherId);
  },

  createClassroom: async (classroomData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newClassroom = {
      id: `classroom-${Date.now()}`,
      ...classroomData,
      studentIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockClassrooms.push(newClassroom);
    return newClassroom;
  },

  getLessons: async (classroomId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockLessons.filter(l => l.classroomId === classroomId);
  },

  getTests: async (classroomId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTests.filter(t => t.classroomId === classroomId);
  },

  getGames: async (classroomId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockGames.filter(g => g.classroomId === classroomId);
  },

  getProgress: async (studentId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProgress.filter(p => p.studentId === studentId);
  },

  getNotifications: async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockNotifications.filter(n => n.userId === userId);
  }
};
