import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { SocketProvider } from './context/SocketContext';
import './index.css';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AlumniDashboard = lazy(() => import('./pages/AlumniDashboard'));
const AlumniProfile = lazy(() => import('./pages/AlumniProfile'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const AlumniDirectory = lazy(() => import('./pages/AlumniDirectory'));
const MentorshipRequests = lazy(() => import('./pages/MentorshipRequests'));
const Chat = lazy(() => import('./pages/Chat'));
const Conversations = lazy(() => import('./pages/Conversations'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const Events = lazy(() => import('./pages/Events'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const Stories = lazy(() => import('./pages/Stories'));
const PostStory = lazy(() => import('./pages/PostStory'));
const JobBoard = lazy(() => import('./pages/JobBoard'));
const PostJob = lazy(() => import('./pages/PostJob'));
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));

const PageLoader = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={<HomeRedirect />} />

                  <Route path="/alumni/dashboard" element={
                    <ProtectedRoute roles={['alumni']}><AlumniDashboard /></ProtectedRoute>
                  } />
                  <Route path="/alumni/profile" element={
                    <ProtectedRoute roles={['alumni']}><AlumniProfile /></ProtectedRoute>
                  } />

                  <Route path="/student/dashboard" element={
                    <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
                  } />
                  <Route path="/student/profile" element={
                    <ProtectedRoute roles={['student']}><StudentProfile /></ProtectedRoute>
                  } />

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

                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>
                  } />
                  <Route path="/admin/analytics" element={
                    <ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>
                  } />

                  <Route path="/events" element={
                    <ProtectedRoute roles={['admin', 'alumni', 'student']}><Events /></ProtectedRoute>
                  } />
                  <Route path="/events/create" element={
                    <ProtectedRoute roles={['admin']}><CreateEvent /></ProtectedRoute>
                  } />
                  <Route path="/events/edit/:id" element={
                    <ProtectedRoute roles={['admin']}><CreateEvent /></ProtectedRoute>
                  } />

                  <Route path="/stories" element={
                    <ProtectedRoute roles={['admin', 'alumni', 'student']}><Stories /></ProtectedRoute>
                  } />
                  <Route path="/stories/post" element={
                    <ProtectedRoute roles={['alumni']}><PostStory /></ProtectedRoute>
                  } />

                  <Route path="/jobs" element={
                    <ProtectedRoute roles={['admin', 'alumni', 'student']}><JobBoard /></ProtectedRoute>
                  } />
                  <Route path="/jobs/post" element={
                    <ProtectedRoute roles={['admin', 'alumni']}><PostJob /></ProtectedRoute>
                  } />

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
