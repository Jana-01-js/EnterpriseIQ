import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';
import { UploadDocModal } from '../components/documents/UploadDocModal';
import { CompareDocsModal } from '../components/documents/CompareDocsModal';

export const DashboardPage: React.FC = () => {
  const { user, openDocumentViewer } = useAuth();
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-400/30">
                EnterpriseIQ RAG Engine Active
              </span>
              <span className="text-xs text-slate-400">• Role: {user?.role}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Access grounded organizational intelligence, ask policy questions to the AI assistant, or manage department documents with permission enforcement.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => navigate('/assistant')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI Assistant</span>
            </button>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Documents</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{analytics?.totalDocuments || documents.length}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+{analytics?.docsAddedThisMonth || 8} added this month</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indexed Vectors</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{analytics?.indexedDocuments || documents.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">100% vector store readiness</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Knowledge Queries</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Search className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{analytics?.knowledgeQueries || 384}</p>
          <p className="text-[11px] text-slate-500 mt-1">Across all departments</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Retrieval Score</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{analytics?.avgRetrievalScore || 94.2}%</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">High Grounded Confidence</p>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Queries over time & Documents by Department */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Queries Over Time Visual Chart */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900">Knowledge Queries Over Time</h3>
                <p className="text-xs text-slate-500">Weekly natural language AI assistant usage</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">Last 7 Days</span>
            </div>

            {/* SVG Line / Bar Graph */}
            <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-200">
              {analytics?.queriesOverTime.map((q, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {q.queries}
                  </div>
                  <div
                    style={{ height: `${(q.queries / 140) * 100}%` }}
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg group-hover:from-blue-500 group-hover:to-sky-400 transition-all shadow-xs"
                  ></div>
                  <span className="text-xs font-bold text-slate-600 mt-2">{q.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Documents by Department</h3>
                <p className="text-xs text-slate-500">Distribution of indexed enterprise knowledge</p>
              </div>
              <button
                onClick={() => navigate('/departments')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5 pt-2">
              {analytics?.documentsByDepartment.map((dep, idx) => {
                const total = analytics.totalDocuments || 1;
                const pct = Math.round((dep.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{dep.department}</span>
                      <span className="text-slate-500">{dep.count} docs ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(pct, 12)}%` }}
                        className="h-full bg-blue-600 rounded-full"
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
          <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Smart Enterprise Actions
            </h3>

            <button
              onClick={() => navigate('/assistant')}
              className="w-full p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition-colors flex items-center gap-3"
            >
              <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Ask AI Assistant</p>
                <p className="text-[11px] text-slate-400">Grounded natural language Q&A</p>
              </div>
            </button>

            <button
              onClick={() => setCompareModalOpen(true)}
              className="w-full p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition-colors flex items-center gap-3"
            >
              <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-lg">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Compare 2 Documents</p>
                <p className="text-[11px] text-slate-400">Side-by-side policy analysis</p>
              </div>
            </button>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="w-full p-3 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-left transition-colors flex items-center gap-3"
            >
              <div className="p-2 bg-sky-600/30 text-sky-400 rounded-lg">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Upload New Document</p>
                <p className="text-[11px] text-slate-400">Index PDF, DOCX, TXT into RAG</p>
              </div>
            </button>
          </div>

          {/* Recent Activity Timeline */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Recent System Activity
              </h3>
            </div>

            <div className="space-y-3.5">
              {analytics?.recentActivity.slice(0, 5).map((log, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] truncate">{log.details || log.action}</p>
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
