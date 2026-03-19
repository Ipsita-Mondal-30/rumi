import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Heart,
  MessageCircle,
  BarChart3,
  User,
  Settings,
  LogOut,
  Home,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

const nav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/dashboard/discover', icon: Compass, label: 'Discover Matches' },
  { to: '/dashboard/matches', icon: Heart, label: 'My Matches' },
  { to: '/dashboard/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/dashboard/activity', icon: BarChart3, label: 'Activity & Stats' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-white shadow-sm min-h-screen overflow-hidden">
      <div className="p-6 flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Home size={18} className="text-white" />
        </div>
        <span className="text-xl font-semibold text-gray-900">Rumi</span>
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 min-h-0">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors text-sm font-medium ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mx-4 mb-4 flex-shrink-0">
        <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} />
            <span className="text-sm font-semibold">AI in action</span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            Find your perfect match! Explore and complete new matches with higher precision.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
