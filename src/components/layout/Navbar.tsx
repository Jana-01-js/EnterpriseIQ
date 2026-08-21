import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Bell,
  Cpu,
  Building2,
  Lock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-rose-500/10 text-rose-600 border-rose-200';
      case 'MANAGER': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-blue-400">
                  <Cpu className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">
                    Enterprise<span className="text-blue-400">IQ</span>
                  </span>
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-400/30">
                    RAG v2.6
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">AI Enterprise Knowledge Engine</p>
              </div>
            </Link>
          </div>

          {/* Quick Search Input in Navbar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask or search enterprise knowledge..."
                className="w-full pl-10 pr-4 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:bg-slate-800 transition-all"
              />
              <kbd className="absolute right-3 top-2 px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-300 rounded font-mono">
                ⌘K
              </kbd>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Grounded RAG Status */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-[11px]">RAG Grounded</span>
            </div>

            {/* Quick Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleSwitchOpen(!roleSwitchOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors"
                title="Switch role for testing"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Role: {user?.role || 'EMPLOYEE'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleSwitchOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs text-slate-200">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    Switch Account Role (Demo)
                  </div>
                  <button
                    onClick={() => { loginAsDemo('admin@enterpriseiq.com'); setRoleSwitchOpen(false); }}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center justify-between ${user?.role === 'ADMIN' ? 'bg-blue-600/20 text-blue-400 font-bold' : ''}`}
                  >
                    <span>Admin (Sarah Connor)</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">ADMIN</span>
                  </button>
                  <button
                    onClick={() => { loginAsDemo('manager@enterpriseiq.com'); setRoleSwitchOpen(false); }}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center justify-between ${user?.role === 'MANAGER' ? 'bg-blue-600/20 text-blue-400 font-bold' : ''}`}
                  >
                    <span>Manager (David Miller)</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">MANAGER</span>
                  </button>
                  <button
                    onClick={() => { loginAsDemo('employee@enterpriseiq.com'); setRoleSwitchOpen(false); }}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center justify-between ${user?.role === 'EMPLOYEE' ? 'bg-blue-600/20 text-blue-400 font-bold' : ''}`}
                  >
                    <span>Employee (Alex Rivera)</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">EMPLOYEE</span>
                  </button>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-blue-400/40">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold leading-none text-white">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{user?.departmentName}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs text-slate-200">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="font-bold text-white text-sm">{user?.name}</p>
                    <p className="text-slate-400 text-xs">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleColor(user?.role)}`}>
                        {user?.role}
                      </span>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {user?.departmentName}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 transition-colors text-slate-300"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Profile & Preferences
                  </Link>

                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 transition-colors text-rose-300"
                    >
                      <Lock className="w-4 h-4 text-rose-400" />
                      Admin Control Panel
                    </Link>
                  )}

                  <div className="border-t border-slate-700 my-1"></div>

                  <button
                    onClick={() => { logout(); setProfileOpen(false); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-rose-500/20 text-rose-400 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
