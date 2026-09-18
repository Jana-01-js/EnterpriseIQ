import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Building2,
  Shield,
  Calendar,
  Tag,
  Check,
  MessageSquare,
  Volume2,
  VolumeX,
  Copy,
  CheckSquare,
  Square,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Send,
  RefreshCw,
  Search,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { api } from '../../services/api';
import {
  DocumentItem,
  DocumentActionItem,
  DocumentRiskItem,
  QuizQuestion,
} from '../../types';

interface DocumentViewerModalProps {
  documentId: string | null;
  onClose: () => void;
  onAskThisDocument?: (docId: string, title: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ documentId, onClose, onAskThisDocument }) => {
  const [doc, setDoc] = useState<(DocumentItem & { chunks: any[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'tools' | 'qa' | 'chunks'>('content');

  // Tool sub-tabs
  const [activeTool, setActiveTool] = useState<'actions' | 'compliance' | 'quiz' | 'simplify'>('actions');
  const [toolLoading, setToolLoading] = useState(false);
  const [actionItems, setActionItems] = useState<DocumentActionItem[]>([]);
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});
  const [risks, setRisks] = useState<DocumentRiskItem[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [simplifiedText, setSimplifiedText] = useState('');

  // Grounded In-Doc Q&A
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<{ question: string; answer: string }[]>([]);
  const [qaLoading, setQaLoading] = useState(false);

  // Content viewer extras
  const [contentSearch, setContentSearch] = useState('');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError('');
    setSummary('');
    setActionItems([]);
    setRisks([]);
    setQuizQuestions([]);
    setQuizAnswers({});
    setCheckedActions({});
    setSimplifiedText('');
    setQaHistory([]);

    api.getDocumentById(documentId)
      .then(data => {
        setDoc(data);
        if (data.summary) setSummary(data.summary);
      })
      .catch(err => {
        setError(err.message || 'Failed to load document content');
      })
      .finally(() => setLoading(false));

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [documentId]);

  if (!documentId) return null;

  const handleGenerateSummary = async () => {
    if (!doc) return;
    setSummarizing(true);
    try {
      const sum = await api.summarizeDocument(doc.id);
      setSummary(sum);
      setActiveTab('summary');
    } catch (e: any) {
      console.error(e);
    } finally {
      setSummarizing(false);
    }
  };

  const handleRunAiTool = async (mode: 'actionItems' | 'complianceRisk' | 'quiz' | 'simplify') => {
    if (!doc) return;
    setToolLoading(true);
    try {
      const res = await api.executeAiTool(doc.id, mode);
      if (mode === 'actionItems' && res.actionItems) {
        setActionItems(res.actionItems);
      } else if (mode === 'complianceRisk' && res.risks) {
        setRisks(res.risks);
      } else if (mode === 'quiz' && res.quiz) {
        setQuizQuestions(res.quiz);
        setQuizAnswers({});
      } else if (mode === 'simplify' && res.simplified) {
        setSimplifiedText(res.simplified);
      }
    } catch (err: any) {
      setError(err.message || 'AI tool error');
    } finally {
      setToolLoading(false);
    }
  };

  const handleInDocQa = async (questionToAsk?: string) => {
    const q = (questionToAsk || qaQuestion).trim();
    if (!doc || !q) return;
    setQaLoading(true);
    try {
      const res = await api.executeAiTool(doc.id, 'customQa', q);
      setQaHistory(prev => [...prev, { question: q, answer: res.qaAnswer || 'No specific answer found.' }]);
      if (!questionToAsk) setQaQuestion('');
    } catch (err: any) {
      setError(err.message || 'Q&A failed');
    } finally {
      setQaLoading(false);
    }
  };

  const toggleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ''));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAccessBadgeClass = (level: string) => {
    switch (level) {
      case 'Public': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Department only': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Managers only': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Restricted': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5.5 bg-slate-950 text-white border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-500/25 shrink-0 mt-0.5">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getAccessBadgeClass(doc?.accessLevel || '')}`}>
                  {doc?.accessLevel || 'Protected'}
                </span>
                <span className="text-[11px] bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                  {doc?.fileType || 'Doc'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {doc?.fileSize}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {doc?.title || 'Loading Document...'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-400" /> {doc?.departmentName}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Uploaded {doc?.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}</span>
                <span>•</span>
                <span>By {doc?.uploadedBy}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {doc && (
              <button
                onClick={async () => {
                  try {
                    const saved = !doc.isBookmarked;
                    await api.setBookmark(doc.id, saved);
                    setDoc({ ...doc, isBookmarked: saved });
                  } catch (err: any) { setError(err.message); }
                }}
                className={`px-3 py-1.5 rounded-xl transition-all border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${
                  doc.isBookmarked
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Bookmark document"
              >
                {doc.isBookmarked ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
                <span className="hidden sm:inline">{doc.isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50/90 border-b border-slate-200 text-xs overflow-x-auto gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'content' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/70'}`}
            >
              Full Document Text
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'summary' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/70'}`}
            >
              AI Summary
            </button>
            <button
              onClick={() => {
                setActiveTab('tools');
                if (actionItems.length === 0) handleRunAiTool('actionItems');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'tools' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Knowledge Tools
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'qa' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/70'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              In-Document Q&A
            </button>
            <button
              onClick={() => setActiveTab('chunks')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${activeTab === 'chunks' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-200/70'}`}
            >
              Vector Chunks ({doc?.chunks?.length || 0})
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {doc && onAskThisDocument && (
              <button
                onClick={() => {
                  onAskThisDocument(doc.id, doc.title);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 transition-colors shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ask in Assistant
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 text-sm leading-relaxed">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Retrieving encrypted document vectors...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : doc ? (
            <div className="space-y-4">
              {/* Tags bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Tags:</span>
                  {doc.tags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md border border-slate-200">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyText(doc.content)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: FULL DOCUMENT */}
              {activeTab === 'content' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-100/70 p-2.5 rounded-xl border border-slate-200">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={contentSearch}
                        onChange={(e) => setContentSearch(e.target.value)}
                        placeholder="Search keywords inside this document..."
                        className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                      <span className="text-slate-400 mr-1">Font:</span>
                      <button
                        onClick={() => setFontSize('sm')}
                        className={`px-2 py-0.5 rounded ${fontSize === 'sm' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'}`}
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setFontSize('base')}
                        className={`px-2 py-0.5 rounded ${fontSize === 'base' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'}`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => setFontSize('lg')}
                        className={`px-2 py-0.5 rounded ${fontSize === 'lg' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'}`}
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  <div className={`p-6 bg-slate-50/70 rounded-xl border border-slate-200 whitespace-pre-wrap font-mono leading-relaxed text-slate-700 selection:bg-blue-200 ${
                    fontSize === 'sm' ? 'text-xs' : fontSize === 'base' ? 'text-sm' : 'text-base'
                  }`}>
                    {doc.content}
                  </div>
                </div>
              )}

              {/* TAB 2: AI SUMMARY */}
              {activeTab === 'summary' && (
                <div className="p-6 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Gemini 3.8 Flash Executive Summary
                    </div>
                    <div className="flex items-center gap-2">
                      {summary && (
                        <button
                          onClick={() => toggleSpeak(summary)}
                          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                            speaking
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          {speaking ? <VolumeX className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-600" />}
                          <span>{speaking ? 'Stop Audio' : 'Listen Aloud'}</span>
                        </button>
                      )}
                      <button
                        onClick={handleGenerateSummary}
                        disabled={summarizing}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-medium text-xs rounded-lg border border-indigo-200 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${summarizing ? 'animate-spin' : ''}`} />
                        <span>{summarizing ? 'Regenerating...' : 'Regenerate'}</span>
                      </button>
                    </div>
                  </div>

                  {summary ? (
                    <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-sans bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
                      {summary}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/70 rounded-xl border border-dashed border-indigo-200">
                      <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-medium mb-3">
                        No executive summary generated yet for this policy.
                      </p>
                      <button
                        onClick={handleGenerateSummary}
                        disabled={summarizing}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
                      >
                        {summarizing ? 'Processing with Gemini...' : 'Generate AI Summary'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ADVANCED AI KNOWLEDGE TOOLS */}
              {activeTab === 'tools' && (
                <div className="space-y-4">
                  {/* Tool selector buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => {
                        setActiveTool('actions');
                        if (actionItems.length === 0) handleRunAiTool('actionItems');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeTool === 'actions'
                          ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs mb-1 text-blue-700">
                        <CheckSquare className="w-4 h-4" />
                        Action Checklist
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">Deadlines & responsibilities</p>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool('compliance');
                        if (risks.length === 0) handleRunAiTool('complianceRisk');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeTool === 'compliance'
                          ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs mb-1 text-rose-700">
                        <AlertTriangle className="w-4 h-4" />
                        Risk & Audit
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">Compliance vulnerabilities</p>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool('quiz');
                        if (quizQuestions.length === 0) handleRunAiTool('quiz');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeTool === 'quiz'
                          ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs mb-1 text-purple-700">
                        <HelpCircle className="w-4 h-4" />
                        Knowledge Quiz
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">Test team comprehension</p>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTool('simplify');
                        if (!simplifiedText) handleRunAiTool('simplify');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeTool === 'simplify'
                          ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs mb-1 text-amber-700">
                        <Lightbulb className="w-4 h-4" />
                        Plain English
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">60-sec executive TL;DR</p>
                    </button>
                  </div>

                  {toolLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-medium">Gemini 3.8 Flash analyzing document structure...</p>
                    </div>
                  ) : (
                    <div>
                      {/* ACTION ITEMS CHECKLIST */}
                      {activeTool === 'actions' && (
                        <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                              Operational Action Items & Required Milestones
                            </h3>
                            <button
                              onClick={() => handleRunAiTool('actionItems')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Refresh
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {actionItems.map((item, idx) => {
                              const isChecked = !!checkedActions[idx];
                              return (
                                <div
                                  key={idx}
                                  onClick={() => setCheckedActions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                                    isChecked
                                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                                      : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                                  }`}
                                >
                                  <div className="mt-0.5 text-blue-600">
                                    {isChecked ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                                  </div>
                                  <div className="flex-1 text-xs">
                                    <p className={`font-medium ${isChecked ? 'text-slate-400' : 'text-slate-800'}`}>
                                      {item.item}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                      <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                                        item.priority === 'High' ? 'bg-rose-100 text-rose-700' : item.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {item.priority} Priority
                                      </span>
                                      {item.owner && <span><strong>Role:</strong> {item.owner}</span>}
                                      {item.deadline && <span><strong>Timeline:</strong> {item.deadline}</span>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* COMPLIANCE & RISK AUDIT */}
                      {activeTool === 'compliance' && (
                        <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              Compliance Vulnerability & Risk Matrix
                            </h3>
                            <button
                              onClick={() => handleRunAiTool('complianceRisk')}
                              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Re-audit
                            </button>
                          </div>

                          <div className="space-y-3">
                            {risks.map((risk, idx) => (
                              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                      risk.severity === 'High'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                        : risk.severity === 'Medium'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                                    }`}>
                                      {risk.severity} Risk
                                    </span>
                                    <span className="font-bold text-xs text-slate-900">{risk.title}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{risk.description}</p>
                                <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-emerald-800">
                                  <strong>Recommended Mitigation:</strong> {risk.recommendation}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* KNOWLEDGE QUIZ */}
                      {activeTool === 'quiz' && (
                        <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-purple-600" />
                                Interactive Comprehension & Compliance Quiz
                              </h3>
                              <p className="text-[11px] text-slate-500">Answer the questions below to verify your policy retention</p>
                            </div>
                            <button
                              onClick={() => handleRunAiTool('quiz')}
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> New Quiz
                            </button>
                          </div>

                          <div className="space-y-4">
                            {quizQuestions.map((q, qIdx) => {
                              const selected = quizAnswers[q.id];
                              const isAnswered = selected !== undefined;
                              const isCorrect = selected === q.correctIndex;

                              return (
                                <div key={q.id || qIdx} className="p-4 bg-purple-50/40 border border-purple-100 rounded-xl space-y-3">
                                  <p className="text-xs font-bold text-slate-900">
                                    {qIdx + 1}. {q.question}
                                  </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {q.options.map((option, optIdx) => {
                                      let optStyle = 'bg-white border-slate-200 hover:border-purple-300 text-slate-700';
                                      if (isAnswered) {
                                        if (optIdx === q.correctIndex) {
                                          optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-medium';
                                        } else if (optIdx === selected) {
                                          optStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                                        } else {
                                          optStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                                        }
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          disabled={isAnswered}
                                          onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                          className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2 ${optStyle}`}
                                        >
                                          <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-bold">
                                            {String.fromCharCode(65 + optIdx)}
                                          </span>
                                          <span>{option}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {isAnswered && (
                                    <div className={`p-2.5 rounded-lg text-xs border ${
                                      isCorrect ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}>
                                      <p className="font-semibold">{isCorrect ? '✓ Correct!' : '✗ Not quite correct'}</p>
                                      <p className="mt-0.5 text-[11px]">{q.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* PLAIN ENGLISH SIMPLIFIER */}
                      {activeTool === 'simplify' && (
                        <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-600" />
                              Executive Plain-English Breakdown
                            </h3>
                            <button
                              onClick={() => handleRunAiTool('simplify')}
                              className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Re-digest
                            </button>
                          </div>

                          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {simplifiedText}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: IN-DOCUMENT Q&A CHAT */}
              {activeTab === 'qa' && (
                <div className="space-y-4">
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-1">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Grounded In-Document Assistant
                    </div>
                    <p className="text-xs text-slate-600 mb-3">
                      Ask questions answered exclusively by the text of <strong>{doc.title}</strong>:
                    </p>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <span className="text-[11px] font-semibold text-slate-500">Quick Prompts:</span>
                      {[
                        'What are the mandatory approval thresholds?',
                        'Who is responsible for record keeping?',
                        'What happens in case of policy violations?',
                      ].map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleInDocQa(prompt)}
                          className="text-[11px] bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full transition-colors"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={qaQuestion}
                        onChange={(e) => setQaQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInDocQa()}
                        placeholder="Type any question about this document..."
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleInDocQa()}
                        disabled={qaLoading || !qaQuestion.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {qaLoading ? 'Searching...' : 'Ask'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {qaHistory.map((item, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-blue-600 font-semibold">Q:</span> {item.question}
                        </p>
                        <div className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {item.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: VECTOR CHUNKS */}
              {activeTab === 'chunks' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 mb-2">
                    These are the exact semantic text chunks indexed in the vector database for RAG retrieval:
                  </p>
                  {doc.chunks?.map((chunk, idx) => (
                    <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors shadow-xs">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          Chunk #{chunk.chunkIndex} (Page {chunk.pageNumber})
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">ID: {chunk.id}</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Grounded Knowledge Engine: Gemini 3.8 Flash Powered</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};

