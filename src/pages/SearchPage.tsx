import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SearchResult, Department } from '../types';
import {
  Search,
  Filter,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Tag,
  Shield,
  X,
} from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { openDocumentViewer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filter dropdowns
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('');

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(console.error);
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, []);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.search({
        query: searchQuery.trim(),
        departmentId: selectedDept || undefined,
        fileType: selectedFileType || undefined,
        accessLevel: selectedAccessLevel || undefined,
      });
      setResults(res);
      setSearchParams({ q: searchQuery.trim() });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const clearFilters = () => {
    setSelectedDept('');
    setSelectedFileType('');
    setSelectedAccessLevel('');
    executeSearch(query);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Global Semantic Search</h1>
        <p className="text-xs text-slate-500 mt-1">
          Search across indexed enterprise documents with semantic similarity matching and strict permission filtering
        </p>
      </div>

      {/* Main Search Input Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask or search enterprise knowledge (e.g. employee leave days, VPN setup, code reviews)..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Searching Vectors...' : 'Search Knowledge'}</span>
          </button>
        </form>

        {/* Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Filters:</span>
            </div>

            {/* Department */}
            <select
              value={selectedDept}
              onChange={e => { setSelectedDept(e.target.value); executeSearch(query); }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* File Type */}
            <select
              value={selectedFileType}
              onChange={e => { setSelectedFileType(e.target.value); executeSearch(query); }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All File Formats</option>
              <option value="PDF">PDF Documents</option>
              <option value="DOCX">DOCX Files</option>
              <option value="TXT">TXT Text Files</option>
              <option value="CSV">CSV Spreadsheets</option>
              <option value="Markdown">Markdown (.md)</option>
            </select>

            {/* Access Level */}
            <select
              value={selectedAccessLevel}
              onChange={e => { setSelectedAccessLevel(e.target.value); executeSearch(query); }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Access Levels</option>
              <option value="Public">Public</option>
              <option value="Department only">Department Only</option>
              <option value="Managers only">Managers Only</option>
              <option value="Restricted">Restricted</option>
            </select>
          </div>

          {(selectedDept || selectedFileType || selectedAccessLevel) && (
            <button
              onClick={clearFilters}
              className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            {loading ? 'Performing vector search...' : `Found ${results.length} matching knowledge chunk(s)`}
          </span>
          {query && <span className="font-mono">Term: "{query}"</span>}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-medium">Scanning high-dimensional vector embeddings...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Semantic Matches Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try rephrasing your question or selecting "All Departments" to expand search scope.
            </p>
          </div>
        ) : (
          results.map((res, idx) => (
            <div
              key={idx}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                      Relevance: {res.relevanceScore}%
                    </span>
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {res.departmentName}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {res.fileType}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Page {res.pageNumber}
                    </span>
                  </div>

                  <h3
                    onClick={() => openDocumentViewer(res.documentId)}
                    className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors pt-1"
                  >
                    📄 {res.documentTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openDocumentViewer(res.documentId)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>View Doc</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => navigate(`/assistant?docId=${res.documentId}&title=${encodeURIComponent(res.documentTitle)}`)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Ask AI</span>
                  </button>
                </div>
              </div>

              {/* Matched Excerpt Snippet */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans">
                "{res.snippet}"
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" /> Access: {res.accessLevel}
                </span>
                <span>Uploaded by {res.uploadedBy}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
