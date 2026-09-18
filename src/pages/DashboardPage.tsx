import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkTime } from '../context/WorkTimeContext';
import { api } from '../services/api';
import { SystemAnalytics, DocumentItem, Department } from '../types';
import {
  FileText,
  CheckCircle2,
  Users,
  Search,
  Sparkles,
  TrendingUp,
  Activity,
  Upload,
  Bot,
  GitCompare,
  Building2,
  ArrowRight,
  Clock,
  Coffee,
  AlertTriangle,
  Play,
  Pause,
} from 'lucide-react';
import { UploadDocModal } from '../components/documents/UploadDocModal';
import { CompareDocsModal } from '../components/documents/CompareDocsModal';

export const DashboardPage: React.FC = () => {
  const { user, openDocumentViewer } = useAuth();
  const {
    tasks,
    activeTask,
    timerRunning,
    elapsedSeconds,
    shiftStats,
    startTaskTimer,
    pauseTaskTimer,
    resumeTaskTimer,
    alerts,
    unreadAlertsCount,
  } = useWorkTime();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [an, docs, deps] = await Promise.all([
        api.getAnalytics(),
        api.getDocuments(),
        api.getDepartments(),
      ]);
      setAnalytics(an);
      setDocuments(docs);
      setDepartments(deps);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800/80 text-white shadow-2xl relative overflow-hidden">
        {/* Ambient lighting effects */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-ambient-glow"></div>
        <div className="absolute -left-12 -top-12 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="text-[11px] font-bold bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  Gemini 3.8 RAG Engine Active
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Role: <strong className="text-white">{user?.role}</strong> ({user?.departmentName})
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Welcome back, {user?.name}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed font-normal">
                Query grounded enterprise knowledge across corporate policies, technical architecture, and compliance guidelines with strict role-based access control.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                onClick={() => navigate('/assistant')}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                <span>Ask AI Assistant</span>
              </button>

              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          {/* Quick AI Exploration Prompt Pills */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Inquiries:
            </span>
            {[
              'Annual leave & sick day policies',
              'Password & 2FA security protocols',
              'Onboarding schedule for week 1',
              'Pull request review requirements',
            ].map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => navigate(`/assistant?q=${encodeURIComponent(prompt)}`)}
                className="px-3 py-1 bg-slate-800/80 hover:bg-blue-600/30 hover:border-blue-400/50 border border-slate-700/70 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-all"
              >
                💬 {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Documents</span>
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{analytics?.totalDocuments || documents.length}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold mt-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{analytics?.docsAddedThisMonth || 8} added this month</span>
          </div>
        </div>

        <div className="p-5 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indexed Vectors</span>
            <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-xl shadow-xs shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{analytics?.indexedDocuments || documents.length}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>100% vector store readiness</span>
          </div>
        </div>

        <div className="p-5 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Knowledge Queries</span>
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-xl shadow-xs shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{analytics?.knowledgeQueries || 384}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1.5">
            <span>Across all departments</span>
          </div>
        </div>

        <div className="p-5 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Retrieval Precision</span>
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-xs shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{analytics?.avgRetrievalScore || 94.2}%</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>High Grounded Confidence</span>
          </div>
        </div>
      </div>

      {/* Work Time & Labor Policy Alert Section */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-slate-800/80 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-400" />
                Shift & Work Time Engine
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                shiftStats.workloadBalance === 'Overload Deficit'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : shiftStats.workloadBalance === 'Caution'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {shiftStats.workloadBalance}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {activeTask
                ? `Active Work Item: ${activeTask.title}`
                : `Daily Work Pacing: ${shiftStats.pendingTasksCount} Tasks Pending (${Math.floor(shiftStats.pendingTasksRequiredMinutes / 60)}h ${shiftStats.pendingTasksRequiredMinutes % 60}m required)`}
            </h2>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {shiftStats.workloadBalance === 'Overload Deficit'
                ? `⚠️ Workload Deficit Alert: Scheduled work requires ${shiftStats.pendingTasksRequiredMinutes}m, exceeding your remaining shift by ${shiftStats.deficitMinutes}m. Adjust priorities or request reallocation.`
                : activeTask
                ? `Logged ${activeTask.loggedMinutes + Math.floor(elapsedSeconds / 60)}m of ${activeTask.estimatedMinutes}m planned. Automated alert triggers at 80% and 100% capacity.`
                : `Labor & ergonomics policy active: 10m rest recommended every 50m of continuous screen work.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {activeTask ? (
              <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 shadow-inner">
                <div className="px-3 py-1 font-mono font-extrabold text-sm text-amber-300">
                  {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                </div>
                {timerRunning ? (
                  <button
                    onClick={pauseTaskTimer}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
                    title="Pause timer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={resumeTaskTimer}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                    title="Resume timer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </div>
            ) : tasks.length > 0 ? (
              <button
                onClick={() => startTaskTimer(tasks[0].id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start: {tasks[0].title.slice(0, 24)}...</span>
              </button>
            ) : null}

            <button
              onClick={() => navigate('/work-time')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>Manage Work & Alerts</span>
              {unreadAlertsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadAlertsCount}
                </span>
              )}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Queries over time & Documents by Department */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Queries Over Time Visual Chart */}
          <div className="p-6 bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Knowledge Queries Over Time</span>
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Weekly natural language AI assistant usage across teams</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100/80 border border-slate-200 text-slate-700 rounded-full">Last 7 Days</span>
            </div>

            {/* SVG Line / Bar Graph */}
            <div className="h-52 flex items-end justify-between gap-3 pt-6 px-3 border-b border-slate-100 bg-slate-50/50 rounded-2xl">
              {analytics?.queriesOverTime.map((q, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-y-1">
                    {q.queries}
                  </div>
                  <div
                    style={{ height: `${(q.queries / 140) * 100}%` }}
                    className="w-full max-w-[42px] bg-gradient-to-t from-blue-600 via-indigo-500 to-sky-400 rounded-t-xl group-hover:from-blue-500 group-hover:to-sky-300 transition-all shadow-md shadow-blue-500/10 group-hover:scale-y-105 origin-bottom"
                  ></div>
                  <span className="text-xs font-bold text-slate-600 mt-2 mb-2">{q.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="p-6 bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Documents by Department</h3>
                <p className="text-xs text-slate-500 mt-0.5">Distribution of indexed enterprise knowledge in vector store</p>
              </div>
              <button
                onClick={() => navigate('/departments')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              {analytics?.documentsByDepartment.map((dep, idx) => {
                const total = analytics.totalDocuments || 1;
                const pct = Math.round((dep.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 font-bold">{dep.department}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{dep.count} docs ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        style={{ width: `${Math.max(pct, 12)}%` }}
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Quick Actions & Recent Activity */}
        <div className="space-y-8">
          
          {/* Quick AI Tools */}
          <div className="p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

            <h3 className="font-extrabold text-base flex items-center gap-2 relative z-10">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Smart Enterprise Actions
            </h3>

            <button
              onClick={() => navigate('/assistant')}
              className="w-full p-3.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition-all flex items-center gap-3.5 group"
            >
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-white group-hover:text-blue-400 transition-colors">Ask AI Assistant</p>
                <p className="text-[11px] text-slate-400">Grounded natural language Q&A</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => setCompareModalOpen(true)}
              className="w-full p-3.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition-all flex items-center gap-3.5 group"
            >
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-xl shadow-xs shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <GitCompare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors">Compare 2 Documents</p>
                <p className="text-[11px] text-slate-400">Side-by-side policy analysis</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="w-full p-3.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition-all flex items-center gap-3.5 group"
            >
              <div className="p-2.5 bg-gradient-to-tr from-sky-600 to-cyan-500 text-white rounded-xl shadow-xs shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-white group-hover:text-sky-400 transition-colors">Upload New Document</p>
                <p className="text-[11px] text-slate-400">Auto-fill & index into RAG</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Recent Activity Timeline */}
          <div className="p-6 bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Recent System Activity
              </h3>
            </div>

            <div className="space-y-3">
              {analytics?.recentActivity.slice(0, 5).map((log, idx) => (
                <div key={idx} className="p-3 bg-slate-50/80 hover:bg-blue-50/40 border border-slate-200/60 rounded-xl text-xs space-y-1 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {log.userName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] truncate font-medium">{log.details || log.action}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Modals */}
      {uploadModalOpen && (
        <UploadDocModal
          departments={departments}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      {compareModalOpen && (
        <CompareDocsModal
          documents={documents}
          onClose={() => setCompareModalOpen(false)}
        />
      )}

    </div>
  );
};
