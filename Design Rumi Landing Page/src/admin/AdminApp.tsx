import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminLayout } from './layout/AdminLayout';
import { RequireAdmin } from './components/RequireAdmin';
import { AdminDashboardHome } from './pages/AdminDashboardHome';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminRoomsPage } from './pages/AdminRoomsPage';
import { AdminMatchesPage } from './pages/AdminMatchesPage';
import { AdminReportsPage } from './pages/AdminReportsPage';

/**
 * Admin SPA: `/admin` login, `/admin/dashboard` and siblings behind JWT.
 */
export function AdminApp() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route index element={<AdminLoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardHome />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="rooms" element={<AdminRoomsPage />} />
            <Route path="matches" element={<AdminMatchesPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
}
