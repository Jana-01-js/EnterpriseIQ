import React, { useState } from 'react';
import { X, GitCompare, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { DocumentItem } from '../../types';

interface CompareDocsModalProps {
  documents: DocumentItem[];
  onClose: () => void;
}

export const CompareDocsModal: React.FC<CompareDocsModalProps> = ({ documents, onClose }) => {
  const [docId1, setDocId1] = useState(documents[0]?.id || '');
  const [docId2, setDocId2] = useState(documents[1]?.id || documents[0]?.id || '');
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState('');
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!docId1 || !docId2) {
      setError('Select two documents to compare');
      return;
    }
    if (docId1 === docId2) {
      setError('Please select two different documents to compare');
      return;
    }

    setComparing(true);
    setError('');
    setComparisonResult('');

    try {
      const res = await api.compareDocuments(docId1, docId2);
      setComparisonResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to compare documents');
    } finally {
      setComparing(false);
    }
  };

  const doc1 = documents.find(d => d.id === docId1);
  const doc2 = documents.find(d => d.id === docId2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-indigo-400">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">AI Document Comparison Engine</h2>
              <p className="text-xs text-slate-400">Compare policy differences, department rules, and operational requirements side-by-side</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-800">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Document 1
              </label>
              <select
                value={docId1}
                onChange={(e) => setDocId1(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.title} ({d.departmentName})</option>
                ))}
              </select>
              {doc1 && (
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  <p><span className="font-semibold">Dept:</span> {doc1.departmentName}</p>
                  <p><span className="font-semibold">Access:</span> {doc1.accessLevel}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Document 2
              </label>
              <select
                value={docId2}
                onChange={(e) => setDocId2(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>{d.title} ({d.departmentName})</option>
                ))}
              </select>
              {doc2 && (
                <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                  <p><span className="font-semibold">Dept:</span> {doc2.departmentName}</p>
                  <p><span className="font-semibold">Access:</span> {doc2.accessLevel}</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={comparing}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {comparing ? 'Analyzing policy vectors with Gemini AI...' : 'Run Side-by-Side Policy Comparison'}
          </button>

          {/* Result Output */}
          {comparisonResult && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Policy Comparison Analysis
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                {comparisonResult}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors"
          >
            Close Engine
          </button>
        </div>

      </div>
    </div>
  );
};
