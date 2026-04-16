import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import { AdminApp } from './admin/AdminApp';

/** Top-level routes: marketing app + isolated admin SPA under `/admin`. */
export function RootRoutes() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<App />} />
    </Routes>
  );
}
