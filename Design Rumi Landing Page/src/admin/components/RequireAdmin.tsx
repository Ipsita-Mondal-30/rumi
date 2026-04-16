import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/** Ensures `rumi_admin_token` exists before rendering nested admin routes. */
export function RequireAdmin() {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('rumi_admin_token') : null;
  if (!token) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
