import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import QuestionsPage from './pages/QuestionsPage.jsx';
import AssessmentsPage from './pages/AssessmentsPage.jsx';
import StudentDashboardPage from './pages/StudentDashboardPage.jsx';
import AssessmentRunnerPage from './pages/AssessmentRunnerPage.jsx';
import SubmissionResultsPage from './pages/SubmissionResultsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Shell from './components/Shell.jsx';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={<HomeRedirect />} />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Shell>
                  <AdminDashboardPage />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute role="admin">
                <Shell>
                  <QuestionsPage />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assessments"
            element={
              <ProtectedRoute role="admin">
                <Shell>
                  <AssessmentsPage />
                </Shell>
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <Shell>
                  <StudentDashboardPage />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assessments"
            element={
              <ProtectedRoute role="student">
                <Shell>
                  <StudentDashboardPage />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assessments/:assessmentId/questions/:questionId"
            element={
              <ProtectedRoute role="student">
                <AssessmentRunnerPage />
              </ProtectedRoute>
            }
          />

          {/* Shared routes */}
          <Route
            path="/results/:submissionId"
            element={
              <ProtectedRoute>
                <Shell>
                  <SubmissionResultsPage />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}