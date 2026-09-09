import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { Bookmark, FileText, Trash2, ExternalLink, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const BookmarksPage: React.FC = () => {
  const { openDocumentViewer } = useAuth();
  const navigate = useNavigate();

  const [bookmarkedDocs, setBookmarkedDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load documents and simulate bookmarked set
    api.getBookmarks()
      .then(docs => {
        // Default to first 3 docs as bookmarked for demo
        setBookmarkedDocs(docs);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRemoveBookmark = async (docId: string) => {
    try {
      await api.setBookmark(docId, false);
      setBookmarkedDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Saved Knowledge Bookmarks</h1>
        <p className="text-xs text-slate-500 mt-1">
          Pinned enterprise documents and policies for rapid AI Q&A access
        </p>
      </div>

      {error && <p role="alert" className="text-red-600">{error}</p>}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-medium">Loading bookmarks...</p>
        </div>
      ) : bookmarkedDocs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Saved Bookmarks</h3>
          <p className="text-xs text-slate-500">You haven't bookmarked any enterprise documents yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookmarkedDocs.map(doc => (
            <div key={doc.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                    <Bookmark className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <h3
                      onClick={() => openDocumentViewer(doc.id)}
                      className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer transition-colors"
                    >
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.departmentName} • {doc.fileType}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveBookmark(doc.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {doc.description || 'Enterprise document saved for quick reference.'}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  onClick={() => openDocumentViewer(doc.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>View Doc</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                <button
                  onClick={() => navigate(`/assistant?docId=${doc.id}&title=${encodeURIComponent(doc.title)}`)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
