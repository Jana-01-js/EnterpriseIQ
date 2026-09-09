import React, { useEffect, useState } from 'react';
import { X, FileText, Sparkles, Building2, Shield, Calendar, Tag, Check, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { DocumentItem } from '../../types';

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
  const [activeTab, setActiveTab] = useState<'content' | 'summary' | 'chunks'>('content');

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError('');
    setSummary('');

    api.getDocumentById(documentId)
      .then(data => {
        setDoc(data);
        if (data.summary) setSummary(data.summary);
      })
      .catch(err => {
        setError(err.message || 'Failed to load document content');
      })
      .finally(() => setLoading(false));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 bg-slate-900 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-400">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getAccessBadgeClass(doc?.accessLevel || '')}`}>
                  {doc?.accessLevel || 'Protected'}
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                  {doc?.fileType || 'Doc'}
                </span>
                <span className="text-xs text-slate-400">
                  {doc?.fileSize}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {doc?.title || 'Loading Document...'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {doc?.departmentName}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Uploaded {doc?.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''}</span>
                <span>•</span>
                <span>By {doc?.uploadedBy}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${activeTab === 'content' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              Full Document Text
            </button>
            <button
              onClick={() => setActiveTab('chunks')}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${activeTab === 'chunks' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              Indexed Vector Chunks ({doc?.chunks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${activeTab === 'summary' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              AI Summary
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateSummary}
              disabled={summarizing || !doc}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-xs rounded-lg border border-indigo-200 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {summarizing ? 'Generating...' : 'AI Summarize'}
            </button>

            {doc && <button className="px-3 py-1.5 rounded-lg border text-xs" onClick={async () => {
              try {
                const saved = !doc.isBookmarked;
                await api.setBookmark(doc.id, saved);
                setDoc({ ...doc, isBookmarked: saved });
              } catch (err: any) { setError(err.message); }
            }}>{doc.isBookmarked ? 'Remove bookmark' : 'Save bookmark'}</button>}
            {doc && onAskThisDocument && (
              <button
                onClick={() => {
                  onAskThisDocument(doc.id, doc.title);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ask This Document
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 text-sm leading-relaxed">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Processing & loading document vectors...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          ) : doc ? (
            <div>
              {/* Tags bar */}
              <div className="flex items-center gap-2 flex-wrap mb-4 pb-3 border-b border-slate-100">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Tags:</span>
                {doc.tags.map((tag, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md border border-slate-200">
                    #{tag}
                  </span>
                ))}
              </div>

              {activeTab === 'content' && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700 selection:bg-blue-200">
                  {doc.content}
                </div>
              )}

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

              {activeTab === 'summary' && (
                <div className="p-5 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-3">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    EnterpriseIQ AI Executive Summary
                  </div>
                  {summary ? (
                    <div className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {summary}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs italic">
                      No summary generated yet. Click "AI Summarize" above to parse this document with Gemini.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Permission Verified: Encrypted Grounded RAG Data Source</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
