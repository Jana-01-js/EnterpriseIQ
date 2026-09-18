import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Cpu,
  ArrowRight,
  ShieldCheck,
  Search,
  Bot,
  Layers,
  Database,
  Lock,
  CheckCircle2,
  FileText,
  Users,
  Sparkles,
  GitBranch,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, isAuthenticated, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleDemoClick = async (email: string) => {
    await loginAsDemo(email);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-sky-400">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight">
                Enterprise<span className="text-blue-400">IQ</span><span className="text-sky-400 text-sm font-semibold font-mono">.fp.JKKN</span>
              </span>
              <span className="ml-2 text-[11px] font-mono text-slate-400 font-bold hidden sm:inline">
                /dashboard
              </span>
              <span className="ml-2 text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                RAG System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleDemoClick('admin@enterpriseiq.com')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors hidden sm:block"
            >
              Quick Demo Access
            </button>
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400 mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Enterprise Knowledge Management Using RAG</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight">
            Turn Enterprise Knowledge Into <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">Intelligent Answers</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Securely search, discover, and interact with organizational knowledge using AI-powered Retrieval-Augmented Generation. Ask your enterprise. Get intelligent, grounded answers with strict permission enforcement.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-600/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-3"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => handleDemoClick('admin@enterpriseiq.com')}
              className="px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-bold text-sm rounded-2xl transition-all flex items-center gap-3"
            >
              <Bot className="w-4 h-4 text-sky-400" />
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          {/* Quick Demo Shortcuts Cards */}
          <div className="mt-16 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div
              onClick={() => handleDemoClick('admin@enterpriseiq.com')}
              className="p-5 bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">ADMIN ROLE</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="font-bold text-white text-sm">Sarah Connor</p>
              <p className="text-xs text-slate-400">admin@enterpriseiq.com</p>
              <p className="text-[11px] text-slate-500 mt-2">Full system admin, user management, doc uploads & audit logs.</p>
            </div>

            <div
              onClick={() => handleDemoClick('manager@enterpriseiq.com')}
              className="p-5 bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">MANAGER ROLE</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="font-bold text-white text-sm">David Miller</p>
              <p className="text-xs text-slate-400">manager@enterpriseiq.com</p>
              <p className="text-[11px] text-slate-500 mt-2">Engineering manager with department & manager-level document access.</p>
            </div>

            <div
              onClick={() => handleDemoClick('employee@enterpriseiq.com')}
              className="p-5 bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">EMPLOYEE ROLE</span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="font-bold text-white text-sm">Alex Rivera</p>
              <p className="text-xs text-slate-400">employee@enterpriseiq.com</p>
              <p className="text-[11px] text-slate-500 mt-2">HR employee with access to public & HR department knowledge.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Why EnterpriseIQ Pillars */}
      <section className="py-20 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Why EnterpriseIQ?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3">
              Built specifically for modern enterprise teams that require accuracy, security, and full source transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl flex items-center justify-center mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Centralized Knowledge</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Single source of truth for PDF, DOCX, TXT, CSV, and Markdown documents across all enterprise departments.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-sky-600/20 text-sky-400 border border-sky-500/30 rounded-xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Semantic Vector Search</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Understands natural language intent beyond keyword matches using high-dimensional vector embeddings.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl flex items-center justify-center mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Grounded AI Answers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero hallucination policy. AI answers strictly using retrieved context or acknowledges missing data.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Permission-Aware RAG</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter documents by user role and department BEFORE sending vector chunks to LLMs. Strict access privacy.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Clickable Source Citations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every AI answer cites exact document names, page numbers, and relevance percentages with integrated preview.
              </p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="w-12 h-12 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Role-Based Collaboration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Admin, Manager, and Employee tiers with audit logging, knowledge gap detection, and analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            End-to-End RAG Pipeline
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            How EnterpriseIQ converts raw organizational documents into grounded intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-center">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 bg-blue-600/30 text-blue-400 rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-xs">1</div>
            <p className="font-bold text-xs text-white">Upload Knowledge</p>
            <p className="text-[11px] text-slate-400 mt-1">PDF, DOCX, TXT, CSV, MD</p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 bg-blue-600/30 text-blue-400 rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-xs">2</div>
            <p className="font-bold text-xs text-white">Clean & Chunk</p>
            <p className="text-[11px] text-slate-400 mt-1">Text parsing & overlap</p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 bg-blue-600/30 text-blue-400 rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-xs">3</div>
            <p className="font-bold text-xs text-white">Vector Embeddings</p>
            <p className="text-[11px] text-slate-400 mt-1">Index in Vector DB</p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 bg-blue-600/30 text-blue-400 rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-xs">4</div>
            <p className="font-bold text-xs text-white">Natural Query</p>
            <p className="text-[11px] text-slate-400 mt-1">User asks question</p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 bg-blue-600/30 text-blue-400 rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-xs">5</div>
            <p className="font-bold text-xs text-white">Permission Search</p>
            <p className="text-[11px] text-slate-400 mt-1">Retrieve top chunks</p>
          </div>

          <div className="p-4 bg-slate-900/80 border border-blue-500/50 rounded-2xl bg-blue-900/10">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mx-auto mb-3 font-bold text-xs">6</div>
            <p className="font-bold text-xs text-white">Grounded Answer</p>
            <p className="text-[11px] text-blue-300 mt-1">LLM + Citations</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
        <p>EnterpriseIQ – AI-Powered Enterprise Knowledge Management System Using RAG</p>
        <p className="mt-1">“Ask your enterprise. Get intelligent, grounded answers.”</p>
      </footer>

    </div>
  );
};
