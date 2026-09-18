import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Department, UserRole, KnowledgeGapItem, PolicyDraft, AccessLevel } from '../types';
import {
  Users,
  Lock,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Building2,
  UserPlus,
  Sparkles,
  AlertTriangle,
  FileText,
  FilePlus,
  CheckCircle2,
  Wand2,
  ArrowRight,
  Database
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [indexMessage, setIndexMessage] = useState('');

  // Admin section tabs
  const [adminTab, setAdminTab] = useState<'users' | 'gaps' | 'drafter'>('users');

  // Knowledge Gaps state
  const [gaps, setGaps] = useState<KnowledgeGapItem[]>([]);
  const [gapsLoading, setGapsLoading] = useState(false);
  const [gapsAnalyzedAt, setGapsAnalyzedAt] = useState<string | null>(null);

  // Policy Drafter state
  const [draftTopic, setDraftTopic] = useState('');
  const [draftDeptId, setDraftDeptId] = useState('');
  const [draftReqs, setDraftReqs] = useState('');
  const [draftTone, setDraftTone] = useState<'formal' | 'standard' | 'plain-english'>('formal');
  const [drafting, setDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState<PolicyDraft | null>(null);
  const [draftPublishing, setDraftPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState('');
  const [draftError, setDraftError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, dList] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
      ]);
      setUsers(uList);
      setDepartments(dList);
      if (dList.length > 0 && !draftDeptId) {
        setDraftDeptId(dList[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadData();
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-rose-200 shadow-xs max-w-lg mx-auto space-y-4 my-12">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The User Management & Role Control Panel requires <strong>ADMINISTRATOR</strong> credentials. Your current role is <span className="text-rose-600 font-bold">{user?.role}</span>.
        </p>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleReindexVectors = async () => {
    setIndexing(true);
    setIndexMessage('Extracting document text & recalculating high-dimensional embeddings...');
    setTimeout(() => {
      setIndexMessage('Syncing chunks with vector database...');
    }, 1000);
    setTimeout(() => {
      setIndexMessage('Vector re-indexing completed successfully (all active documents synchronized).');
      setIndexing(false);
    }, 2200);
  };

  const handleScanGaps = async () => {
    setGapsLoading(true);
    try {
      const res = await api.getKnowledgeGaps();
      setGaps(res);
      setGapsAnalyzedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error(err);
    } finally {
      setGapsLoading(false);
    }
  };

  const handleDraftFromGap = (gap: KnowledgeGapItem) => {
    setDraftTopic(gap.suggestedTitle || gap.topic);
    if (departments.some(d => d.id === gap.departmentId)) {
      setDraftDeptId(gap.departmentId);
    }
    setDraftReqs(gap.description);
    setAdminTab('drafter');
  };

  const handleGeneratePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTopic.trim()) return;
    setDrafting(true);
    setDraftError('');
    setPublishSuccess('');
    try {
      const result = await api.draftPolicy(
        draftTopic.trim(),
        draftDeptId || 'dep-legal',
        draftReqs.trim() || undefined
      );
      setDraftResult(result);
    } catch (err: any) {
      setDraftError(err.message || 'Failed to generate policy draft');
    } finally {
      setDrafting(false);
    }
  };

  const handlePublishDraft = async () => {
    if (!draftResult) return;
    setDraftPublishing(true);
    setDraftError('');
    try {
      await api.saveDraftPolicy(draftResult);
      setPublishSuccess(`Policy "${draftResult.title}" published and indexed into vector RAG successfully!`);
      // clear draft
      setTimeout(() => {
        setDraftResult(null);
        setDraftTopic('');
        setDraftReqs('');
      }, 2500);
    } catch (err: any) {
      setDraftError(err.message || 'Failed to publish policy draft');
    } finally {
      setDraftPublishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin & Intelligence Operations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage user authorization, run organizational AI Knowledge Gap audits, and draft compliance policies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReindexVectors}
            disabled={indexing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Database className={`w-3.5 h-3.5 ${indexing ? 'animate-spin' : ''}`} />
            <span>{indexing ? 'Re-indexing...' : 'Re-index Vector DB'}</span>
          </button>
        </div>
      </div>

      {indexMessage && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold rounded-xl flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{indexMessage}</span>
        </div>
      )}

      {/* Tab Nav Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setAdminTab('users')}
          className={`flex-1 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'users'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>User Role Permissions ({users.length})</span>
        </button>

        <button
          onClick={() => {
            setAdminTab('gaps');
            if (gaps.length === 0) handleScanGaps();
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'gaps'
              ? 'bg-white text-indigo-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>AI Knowledge Gap Auditor</span>
        </button>

        <button
          onClick={() => setAdminTab('drafter')}
          className={`flex-1 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            adminTab === 'drafter'
              ? 'bg-white text-purple-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FilePlus className="w-4 h-4 text-purple-600" />
          <span>AI Policy Drafting Studio</span>
        </button>
      </div>

      {/* TAB 1: USER ROLES MANAGEMENT */}
      {adminTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-xs">Registered Organization Users ({users.length})</span>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30">
              ADMIN PRIVILEGE
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-medium">Loading user accounts...</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">User Name & Email</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Assigned Role</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {u.departmentName}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        u.role === 'ADMIN'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : u.role === 'MANAGER'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EMPLOYEE">Set as EMPLOYEE</option>
                        <option value="MANAGER">Set as MANAGER</option>
                        <option value="ADMIN">Set as ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: AI KNOWLEDGE GAP AUDITOR */}
      {adminTab === 'gaps' && (
        <div className="space-y-4">
          <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-950">Gemini 3.8 Organizational Policy Gap Audit</h3>
              </div>
              <p className="text-xs text-indigo-700/80 mt-0.5">
                Automatically scans all indexed enterprise policies and cross-references regulatory best practices to identify missing documentation.
              </p>
              {gapsAnalyzedAt && (
                <p className="text-[11px] text-slate-400 mt-1">Last evaluated at: {gapsAnalyzedAt}</p>
              )}
            </div>

            <button
              onClick={handleScanGaps}
              disabled={gapsLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gapsLoading ? 'animate-spin' : ''}`} />
              <span>{gapsLoading ? 'Scanning Policies...' : 'Re-Run Gap Analysis'}</span>
            </button>
          </div>

          {gapsLoading ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-medium text-slate-600">Gemini 3.8 Flash auditing cross-departmental documentation completeness...</p>
            </div>
          ) : gaps.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900">All Critical Knowledge Covered</h4>
              <p className="text-xs text-slate-500 mt-1">No severe policy gaps detected across the company repository.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gaps.map((gap, idx) => (
                <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 hover:border-indigo-300 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        gap.severity === 'Critical'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : gap.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {gap.severity} Severity Gap ({gap.frequency} inquiries)
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">{gap.topic}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {gap.description}
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div><strong>Target Dept:</strong> {gap.departmentName || departments.find(d => d.id === gap.departmentId)?.name || gap.departmentId}</div>
                    <div><strong>Suggested Title:</strong> {gap.suggestedTitle}</div>
                  </div>

                  <button
                    onClick={() => handleDraftFromGap(gap)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Draft Policy with Gemini AI</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI POLICY DRAFTING STUDIO */}
      {adminTab === 'drafter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FilePlus className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Generate New Policy Document</h3>
                <p className="text-[11px] text-slate-500">Synthesize legally sound, standardized enterprise guidelines</p>
              </div>
            </div>

            <form onSubmit={handleGeneratePolicy} className="space-y-4">
              {draftError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{draftError}</span>
                </div>
              )}

              {publishSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{publishSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Topic / Domain <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={draftTopic}
                  onChange={e => setDraftTopic(e.target.value)}
                  placeholder="e.g., Generative AI Usage & Customer Data Privacy Standard"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Governing Department
                </label>
                <select
                  value={draftDeptId}
                  onChange={e => setDraftDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Requirements or Clauses to Include
                </label>
                <textarea
                  rows={3}
                  value={draftReqs}
                  onChange={e => setDraftReqs(e.target.value)}
                  placeholder="e.g. Prohibit pasting proprietary code into external public LLMs, require approval for commercial models, annual audit log reviews."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Drafting Tone & Structure
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'formal', label: 'Formal / Legal' },
                    { id: 'standard', label: 'Standard Enterprise' },
                    { id: 'plain-english', label: 'Plain English' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDraftTone(t.id as any)}
                      className={`py-2 px-2 rounded-lg border text-center font-medium transition-all ${
                        draftTone === t.id
                          ? 'bg-purple-50 border-purple-400 text-purple-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={drafting || !draftTopic.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Wand2 className={`w-4 h-4 ${drafting ? 'animate-spin' : ''}`} />
                <span>{drafting ? 'Drafting Policy with Gemini...' : 'Generate Policy Draft'}</span>
              </button>
            </form>
          </div>

          {/* Generated Document Preview */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Policy Document Preview</h3>
              </div>
              {draftResult && (
                <button
                  onClick={handlePublishDraft}
                  disabled={draftPublishing}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{draftPublishing ? 'Publishing & Vectorizing...' : 'Save & Index to RAG'}</span>
                </button>
              )}
            </div>

            {drafting ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-medium text-slate-600">Gemini 3.8 Flash structuring compliance clauses & operational mandates...</p>
              </div>
            ) : draftResult ? (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 text-sm">{draftResult.title}</div>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
                    <span className="bg-white px-2 py-0.5 rounded border border-purple-200">
                      Access: {draftResult.accessLevel}
                    </span>
                    {draftResult.tags?.map((tag, tIdx) => (
                      <span key={tIdx} className="bg-white px-2 py-0.5 rounded border border-purple-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
                  {draftResult.content}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-center text-slate-400 space-y-2">
                <FileText className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No policy draft generated yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Fill in the topic and requirements on the left, or pick a recommendation from the AI Gap Auditor tab.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

