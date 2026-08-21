import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Bot,
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

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Knowledge Assistant', path: '/assistant', icon: Bot, badge: 'Main RAG' },
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 hidden md:flex flex-col min-h-[calc(100vh-4rem)]">
      
      {/* Navigation List */}
      <div className="p-4 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Enterprise Knowledge
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  item.badge === 'Main RAG'
                    ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Role Permission Info */}
      <div className="p-4 m-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
        <div className="flex items-center gap-2 mb-1.5">
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-bold text-white">Permission Scope</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Role: <strong className="text-slate-200">{user?.role}</strong> ({user?.departmentName})
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
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
