import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Home,
  HeartHandshake,
  Flag,
  LogOut,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

const nav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/rooms', label: 'Rooms', icon: Home },
  { to: '/admin/matches', label: 'Matches', icon: HeartHandshake },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
];

/** Shell: left sidebar, top bar, main content area. */
export function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('rumi_admin_token');
    localStorage.removeItem('rumi_admin_user');
    toast.message('Signed out');
    navigate('/admin', { replace: true });
  };

  let adminLabel = 'Admin';
  try {
    const raw = localStorage.getItem('rumi_admin_user');
    if (raw) {
      const u = JSON.parse(raw) as { username?: string; displayName?: string };
      adminLabel = u.displayName || u.username || 'Admin';
    }
  } catch {
    // ignore
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
        <div className="p-5 flex items-center gap-2 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Rumi Admin</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Console</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 opacity-90" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="m-3 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">Roommate matching — operations</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:inline">{adminLabel}</span>
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
              {adminLabel.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
