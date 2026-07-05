import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/useAuth';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import JoinTeam from './pages/JoinTeam';
import Dashboard from './pages/Dashboard';
import Missions from './pages/Missions';
import CreateMission from './pages/CreateMission';
import MissionWorkspace from './pages/MissionWorkspace';
import Analytics from './pages/Analytics';
import Workload from './pages/Workload';
import Settings from './pages/Settings';
import MyObjectives from './pages/MyObjectives';

const CaptainOnly = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'Crew') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/join" element={<JoinTeam />} />
            <Route path="/join/:inviteCode" element={<JoinTeam />} />

            {/* Protected Command Center Console Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/missions" element={<Missions />} />
              <Route path="/missions/create" element={<CaptainOnly><CreateMission /></CaptainOnly>} />
              <Route path="/missions/:id" element={<MissionWorkspace />} />
              <Route path="/missions/:id/edit" element={<CaptainOnly><CreateMission /></CaptainOnly>} />
              <Route path="/analytics" element={<CaptainOnly><Analytics /></CaptainOnly>} />
              <Route path="/workload" element={<CaptainOnly><Workload /></CaptainOnly>} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/my-objectives" element={<MyObjectives />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              className: 'glass-card border-white/10 text-white font-display text-sm',
              style: {
                background: 'rgba(10, 14, 39, 0.86)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                backdropFilter: 'blur(14px)',
              },
              success: {
                iconTheme: {
                  primary: '#06d6a0',
                  secondary: '#fff',
                },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
