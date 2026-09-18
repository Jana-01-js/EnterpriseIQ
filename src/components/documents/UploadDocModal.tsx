import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Building2, Shield, Tag, Sparkles, Wand2 } from 'lucide-react';
import { api } from '../../services/api';
import { Department, AccessLevel } from '../../types';

interface UploadDocModalProps {
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadDocModal: React.FC<UploadDocModalProps> = ({ departments, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dep-hr');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('Public');
  const [tags, setTags] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');
  const [statusStep, setStatusStep] = useState<'idle' | 'uploading' | 'extracting' | 'vectorizing' | 'indexed'>('idle');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }

      // If it's a plain text/markdown file, read into textContent for immediate AI parsing
      if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setTextContent(event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleAiAutoFill = async () => {
    const contentToAnalyze = textContent.trim() || title.trim();
    if (!contentToAnalyze && !selectedFile) {
      setError('Please paste document text or upload a file first to analyze with AI.');
      return;
    }

    setAiClassifying(true);
    setError('');
    setAiSuccessMsg('');

    try {
      const res = await api.suggestMetadata(contentToAnalyze || 'Enterprise Policy', selectedFile?.name);
      if (res.title) setTitle(res.title);
      if (res.description) setDescription(res.description);
      if (res.departmentId && departments.some(d => d.id === res.departmentId)) {
        setDepartmentId(res.departmentId);
      }
      if (res.accessLevel) setAccessLevel(res.accessLevel);
      if (res.tags && res.tags.length > 0) setTags(res.tags.join(', '));

      setAiSuccessMsg('AI successfully classified document, target department, access level, and tags!');
      setTimeout(() => setAiSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'AI Auto-Fill could not infer metadata');
    } finally {
      setAiClassifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Document title is required');
      return;
    }

    setUploading(true);
    setError('');
    setStatusStep('uploading');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('departmentId', departmentId);
      formData.append('description', description.trim());
      formData.append('accessLevel', accessLevel);
      formData.append('tags', tags);
      formData.append('textContent', textContent);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.uploadDocument(formData);

      setStatusStep('indexed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
      setStatusStep('idle');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Upload Enterprise Document</h2>
              <p className="text-xs text-slate-400">Add organizational knowledge for document search and the assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm text-slate-700">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Auto-Fill Helper Card */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-purple-50/90 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">Gemini 3.8 Auto-Classifier</p>
                <p className="text-[11px] text-indigo-700/80">Paste content or pick a file, then click Auto-Fill to populate department, access level & tags.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAiAutoFill}
              disabled={aiClassifying}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Wand2 className={`w-3.5 h-3.5 ${aiClassifying ? 'animate-spin' : ''}`} />
              <span>{aiClassifying ? 'Classifying...' : 'Auto-Fill with AI'}</span>
            </button>
          </div>

          {aiSuccessMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{aiSuccessMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q3 Financial Audit & Compliance Manual 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {departments.map((dep) => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Access Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Access Level Permission <span className="text-rose-500">*</span>
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Public">Public (All Authorized Employees)</option>
                <option value="Department only">Department Only ({departments.find(d => d.id === departmentId)?.name})</option>
                <option value="Managers only">Managers Only</option>
                <option value="Restricted">Restricted (Admin & Named Roles)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Summary / Purpose
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of policies or procedures in this document"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Search Tags (Comma Separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., HR, Leave, PTO, 2026, Benefits"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* File Picker or Text Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload File (PDF, DOCX, TXT, CSV, Markdown)
            </label>
            <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-center relative cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.csv,.md,.markdown"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              {selectedFile ? (
                <div className="text-xs font-medium text-slate-800">
                  <span className="text-blue-600 font-bold">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-700">Click or drag & drop file here</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, DOCX, TXT, CSV, Markdown up to 20MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Direct Text Input Fallback */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Or Paste Text Content
            </label>
            <textarea
              rows={3}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste document text here. Required for PDF and DOCX files."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Processing Progress Bar */}
          {statusStep !== 'idle' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="capitalize">RAG Pipeline Status: {statusStep}...</span>
                <span>{statusStep === 'indexed' ? '100%' : '65%'}</span>
              </div>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className={`h-full bg-blue-600 transition-all duration-500 ${statusStep === 'indexed' ? 'w-full' : statusStep === 'vectorizing' ? 'w-3/4' : 'w-1/3'}`}></div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? 'Uploading & Indexing...' : 'Upload & Index Knowledge'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
