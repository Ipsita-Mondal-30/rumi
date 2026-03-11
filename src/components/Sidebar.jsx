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
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/discover', icon: Compass, label: 'Discover Matches' },
  { to: '/matches', icon: Heart, label: 'My Matches' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/activity', icon: BarChart3, label: 'Activity & Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 min-w-[16rem] flex-shrink-0 flex flex-col bg-white border-r border-slate-100 min-h-screen shadow-sm overflow-hidden">
      <div className="p-6 flex items-center gap-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#2F80ED] flex items-center justify-center">
          <Home size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold text-slate-900">Rumi</span>
      </div>
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1 min-h-0">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-r-xl text-sm font-medium transition-colors flex-shrink-0 ${
                isActive
                  ? 'bg-[#2F80ED] text-white'
                  : 'text-slate-600 hover:bg-blue-50 rounded-l-xl'
              }`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-100 space-y-2 flex-shrink-0">
        <div className="rounded-xl bg-[#2F80ED] p-4 text-white shadow-md">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <Sparkles size={18} />
            AI in action
          </div>
          <p className="text-sm text-white/90 leading-snug">
            Find your perfect match! Explore and complete new matches with higher precision.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
