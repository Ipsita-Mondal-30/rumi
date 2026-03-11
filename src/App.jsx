import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { MainLayout } from './components/MainLayout.jsx';
import { Login } from './pages/Login.jsx';
import { Signup } from './pages/Signup.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Discover } from './pages/Discover.jsx';
import { Matches } from './pages/Matches.jsx';
import { Messages } from './pages/Messages.jsx';
import { Profile } from './pages/Profile.jsx';
import { Settings } from './pages/Settings.jsx';
import { Activity } from './pages/Activity.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="discover" element={<Discover />} />
            <Route path="matches" element={<Matches />} />
            <Route path="messages" element={<Messages />} />
            <Route path="activity" element={<Activity />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
