import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Search, Bell, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/discover': 'Discover Matches',
  '/matches': 'My Matches',
  '/messages': 'Messages',
  '/activity': 'Activity & Stats',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export function MainLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard';
  const photo = user?.photo || user?.profilePicture;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-slate-100 shadow-sm rounded-none">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-[#2F80ED] flex items-center justify-center">
              <Home size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Rumi</span>
            <span className="text-xl font-bold text-slate-800 hidden sm:inline">{pageTitle}</span>
          </div>
          <div className="flex-1 max-w-xl mx-4 hidden sm:block">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search matches, locations, preferences"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100 border-0 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 flex-shrink-0 bg-white shadow-sm">
              {photo ? (
                <img src={photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <span className="text-sm font-medium">{user?.name?.[0] || '?'}</span>
                </div>
              )}
            </Link>
          </div>
        </header>
        <main className="flex-1 min-w-0 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
