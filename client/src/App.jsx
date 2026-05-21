import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import AlumniDashboard from './pages/AlumniDashboard';
import AlumniProfile from './pages/AlumniProfile';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import AlumniDirectory from './pages/AlumniDirectory';
import MentorshipRequests from './pages/MentorshipRequests';
import Chat from './pages/Chat';
import Conversations from './pages/Conversations';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import Stories from './pages/Stories';
import PostStory from './pages/PostStory';
import JobBoard from './pages/JobBoard';
import PostJob from './pages/PostJob';
import AdminAnalytics from './pages/AdminAnalytics';
import { SocketProvider } from './context/SocketContext';
import './index.css';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!user) return <Home />;
  switch (user.role) {
    case 'admin': return <Navigate to="/admin/dashboard" />;
    case 'alumni': return <Navigate to="/alumni/dashboard" />;
    case 'student': return <Navigate to="/student/dashboard" />;
    default: return <Home />;
  }
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />

              {/* Home redirect */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Alumni Routes */}
              <Route path="/alumni/dashboard" element={
                <ProtectedRoute roles={['alumni']}><AlumniDashboard /></ProtectedRoute>
              } />
              <Route path="/alumni/profile" element={
                <ProtectedRoute roles={['alumni']}><AlumniProfile /></ProtectedRoute>
              } />

              {/* Student Routes */}
              <Route path="/student/dashboard" element={
                <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
              } />
              <Route path="/student/profile" element={
                <ProtectedRoute roles={['student']}><StudentProfile /></ProtectedRoute>
              } />

              {/* Shared Routes */}
              <Route path="/directory" element={
                <ProtectedRoute roles={['admin', 'alumni', 'student']}><AlumniDirectory /></ProtectedRoute>
              } />
              <Route path="/mentorship" element={
                <ProtectedRoute roles={['student', 'alumni']}><MentorshipRequests /></ProtectedRoute>
              } />
              <Route path="/conversations" element={
                <ProtectedRoute roles={['student', 'alumni']}><Conversations /></ProtectedRoute>
              } />
              <Route path="/chat/:requestId" element={
                <ProtectedRoute roles={['student', 'alumni']}><Chat /></ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>
              } />

              {/* Phase 2 — Events */}
              <Route path="/events" element={
                <ProtectedRoute roles={['admin', 'alumni', 'student']}><Events /></ProtectedRoute>
              } />
              <Route path="/events/create" element={
                <ProtectedRoute roles={['admin']}><CreateEvent /></ProtectedRoute>
              } />
              <Route path="/events/edit/:id" element={
                <ProtectedRoute roles={['admin']}><CreateEvent /></ProtectedRoute>
              } />

              {/* Phase 2 — Stories */}
              <Route path="/stories" element={
                <ProtectedRoute roles={['admin', 'alumni', 'student']}><Stories /></ProtectedRoute>
              } />
              <Route path="/stories/post" element={
                <ProtectedRoute roles={['alumni']}><PostStory /></ProtectedRoute>
              } />

              {/* Phase 1 — Jobs */}
              <Route path="/jobs" element={
                <ProtectedRoute roles={['admin', 'alumni', 'student']}><JobBoard /></ProtectedRoute>
              } />
              <Route path="/jobs/post" element={
                <ProtectedRoute roles={['admin', 'alumni']}><PostJob /></ProtectedRoute>
              } />

              {/* Phase 1 — Admin Analytics */}
              <Route path="/admin/analytics" element={
                <ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>
              } />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
