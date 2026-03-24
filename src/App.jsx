import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import MockStudentDashboard from './pages/student/MockStudentDashboard';
import ClassroomPage from './pages/teacher/ClassroomPage';
import KidFriendlyLessonPage from './pages/student/KidFriendlyLessonPage';
import LessonDetailPage from './pages/student/LessonDetailPage';
import MockTestPage from './pages/student/MockTestPage';
import MockGamePage from './pages/student/MockGamePage';
import WritingPage from './pages/student/WritingPage';
import ProfilePage from './pages/ProfilePage';


// Components
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />


                  {/* Protected Routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Navigate to="/dashboard" replace />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Navigate to="/dashboard/teacher" replace />
                    </ProtectedRoute>
                  } />

                  {/* Teacher Routes */}
                  <Route path="/dashboard/teacher" element={
                    <ProtectedRoute role="TEACHER">
                      <TeacherDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/teacher/classrooms/:classroomId" element={
                    <ProtectedRoute role="TEACHER">
                      <ClassroomPage />
                    </ProtectedRoute>
                  } />



                  <Route path="/dashboard/teacher/lessons/:lessonId" element={
                    <ProtectedRoute role="TEACHER">
                      <LessonDetailPage />
                    </ProtectedRoute>
                  } />

                  {/* Student Routes */}
                  <Route path="/dashboard/student" element={
                    <ProtectedRoute role="STUDENT">
                      <StudentDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/student/lessons" element={
                    <ProtectedRoute role="STUDENT">
                      <MockStudentDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/student/lessons/:lessonId" element={
                    <ProtectedRoute role="STUDENT">
                      <LessonDetailPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/student/tests/:testId" element={
                    <ProtectedRoute>
                      <MockTestPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/student/games/:gameId" element={
                    <ProtectedRoute>
                      <MockGamePage />
                    </ProtectedRoute>
                  } />

                  <Route path="/dashboard/student/writing" element={
                    <ProtectedRoute role="STUDENT">
                      <WritingPage />
                    </ProtectedRoute>
                  } />

                  {/* Common Routes */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />

                  {/* 404 Route */}
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                        <p className="text-gray-600 mb-8">ไม่พบหน้าที่คุณกำลังหา</p>
                        <Navigate to="/dashboard" replace />
                      </div>
                    </div>
                  } />
                </Routes>

                {/* Toast Notifications */}
                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 5000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                      padding: '16px 24px',
                      borderRadius: '16px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      maxWidth: '500px',
                    },
                    success: {
                      duration: 4000,
                      iconTheme: {
                        primary: '#4ade80',
                        secondary: '#fff',
                      },
                      style: {
                        border: '2px solid #4ade80',
                        background: '#f0fdf4',
                        color: '#166534',
                      }
                    },
                    error: {
                      duration: 6000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                      style: {
                        border: '2px solid #ef4444',
                        background: '#fef2f2',
                        color: '#991b1b',
                      }
                    },
                  }}
                />
              </div>
            </Router>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider >
  );
}

export default App;
