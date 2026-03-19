import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/discover': 'Discover Matches',
  '/dashboard/matches': 'My Matches',
  '/dashboard/messages': 'Messages',
  '/dashboard/activity': 'Activity & Stats',
  '/dashboard/profile': 'Profile',
  '/dashboard/settings': 'Settings',
};

export function MainLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard';
  const photo = user?.photo || user?.profilePicture;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search matches, locations, preferences"
                  className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                />
              </div>
              <button type="button" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <Link to="/dashboard/profile" className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {photo ? (
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <span className="text-sm font-medium">{user?.name?.[0] || '?'}</span>
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 min-w-0 overflow-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
