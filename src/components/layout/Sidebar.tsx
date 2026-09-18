import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkTime } from '../../context/WorkTimeContext';
import {
  LayoutDashboard,
  Bot,
  Clock,
  Search,
  FileText,
  Building2,
  Bookmark,
  BarChart3,
  Activity,
  Users,
  Settings,
  Lock,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { unreadAlertsCount, timerRunning } = useWorkTime();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Knowledge Assistant', path: '/assistant', icon: Bot, badge: 'Main RAG' },
    {
      label: 'Work Time & Alerts',
      path: '/work-time',
      icon: Clock,
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount} Alerts` : timerRunning ? 'Active' : 'Policy',
      badgeVariant: unreadAlertsCount > 0 ? 'alert' : timerRunning ? 'active' : 'default',
    },
    { label: 'Global Search', path: '/search', icon: Search },
    { label: 'Documents', path: '/documents', icon: FileText },
    { label: 'Departments', path: '/departments', icon: Building2 },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'System Activity', path: '/activity', icon: Activity },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'User Management', path: '/admin', icon: Users, badge: 'Admin' });
  }

  navItems.push({ label: 'Settings', path: '/settings', icon: Settings });

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/80 shrink-0 hidden md:flex flex-col min-h-[calc(100vh-4rem)]">
      
      {/* Navigation List */}
      <div className="p-4 space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>Enterprise Knowledge</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (item as any).badgeVariant === 'alert'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                    : (item as any).badgeVariant === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : item.badge === 'Main RAG'
                    ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Role Permission Info */}
      <div className="p-4 m-4 bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-white tracking-wide">Permission Scope</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
        </div>
        <p className="text-[11px] text-slate-300 font-medium leading-tight">
          Role: <strong className="text-blue-400">{user?.role}</strong>
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Dept: <span className="text-slate-300 font-semibold">{user?.departmentName}</span>
        </p>
        <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80 leading-normal">
          {user?.role === 'ADMIN'
            ? 'Full access to all documents & admin settings'
            : user?.role === 'MANAGER'
            ? 'Access to public & department manager docs'
            : 'Access to public & assigned department docs'}
        </p>
      </div>

    </aside>
  );
};
