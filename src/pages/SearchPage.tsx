import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SearchResult, Department, AiSearchOverview } from '../types';
import {
  Search,
  Filter,
  FileText,
  Calendar,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Shield,
  X,
  HelpCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { openDocumentViewer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest'>('relevance');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('eiq_recent_searches') || '[]').slice(0, 5); } catch { return []; }
  });

  // AI Overview State
  const [aiOverview, setAiOverview] = useState<AiSearchOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Filter dropdowns
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('');

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(err => setError(err instanceof Error ? err.message : 'Could not load search filters.'));
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, []);

  const executeSearch = async (searchQuery: string, filters?: { departmentId?: string; fileType?: string; accessLevel?: string }) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setAiOverview(null);
    try {
      const res = await api.search({
        query: searchQuery.trim(),
        departmentId: filters ? filters.departmentId : selectedDept || undefined,
        fileType: filters ? filters.fileType : selectedFileType || undefined,
        accessLevel: filters ? filters.accessLevel : selectedAccessLevel || undefined,
      });
      setResults(res);
      setSearchParams({ q: searchQuery.trim() });
      const normalizedQuery = searchQuery.trim();
      const updatedSearches = [normalizedQuery, ...recentSearches.filter(item => item.toLowerCase() !== normalizedQuery.toLowerCase())].slice(0, 5);
      setRecentSearches(updatedSearches);
      try {
        localStorage.setItem('eiq_recent_searches', JSON.stringify(updatedSearches));
      } catch {
        // Search remains usable when browser storage is unavailable.
      }

      // Automatically trigger AI synthesis overview if we have results
      if (res.length > 0) {
        generateAiOverview(normalizedQuery, res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const generateAiOverview = async (searchQuery: string, searchResults: SearchResult[]) => {
    setOverviewLoading(true);
    try {
      const overview = await api.getSearchAiOverview(searchQuery, searchResults);
      setAiOverview(overview);
    } catch (err) {
      console.error('Failed to generate search overview:', err);
    } finally {
      setOverviewLoading(false);
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
    executeSearch(query, {});
  };

  const displayedResults = useMemo(() => [...results].sort((a, b) => sortBy === 'newest'
    ? new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    : b.relevanceScore - a.relevanceScore), [results, sortBy]);

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

        {recentSearches.length > 0 && <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Recent</span>{recentSearches.map(item => <button key={item} onClick={() => { setQuery(item); executeSearch(item); }} className="max-w-48 truncate rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100">{item}</button>)}<button onClick={() => { setRecentSearches([]); localStorage.removeItem('eiq_recent_searches'); }} className="text-[10px] font-semibold text-slate-400 hover:text-rose-600">Clear</button></div>}

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
              onChange={e => { const value = e.target.value; setSelectedDept(value); executeSearch(query, { departmentId: value || undefined, fileType: selectedFileType || undefined, accessLevel: selectedAccessLevel || undefined }); }}
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
              onChange={e => { const value = e.target.value; setSelectedFileType(value); executeSearch(query, { departmentId: selectedDept || undefined, fileType: value || undefined, accessLevel: selectedAccessLevel || undefined }); }}
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
              onChange={e => { const value = e.target.value; setSelectedAccessLevel(value); executeSearch(query, { departmentId: selectedDept || undefined, fileType: selectedFileType || undefined, accessLevel: value || undefined }); }}
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

      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">{error}</div>}

      {/* AI Search Overview Card */}
      {(overviewLoading || aiOverview) && (
        <div className="p-6 bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/70 rounded-2xl border border-indigo-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-indigo-950">Gemini 3.8 Flash AI Synthesis Overview</h3>
                <p className="text-[11px] text-indigo-600 font-medium">Grounded directly across retrieved enterprise knowledge chunks</p>
              </div>
            </div>
            {aiOverview && (
              <button
                onClick={() => generateAiOverview(query, results)}
                disabled={overviewLoading}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${overviewLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            )}
          </div>

          {overviewLoading ? (
            <div className="py-4 flex items-center gap-3 text-slate-500 text-xs">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Synthesizing enterprise policies and generating direct answer...</span>
            </div>
          ) : aiOverview ? (
            <div className="space-y-4">
              {/* Direct answer paragraph */}
              <p className="text-xs text-slate-800 leading-relaxed font-sans bg-white/80 p-4 rounded-xl border border-indigo-100/80">
                {aiOverview.summary}
              </p>

              {/* Key bullet takeaways */}
              {aiOverview.keyPoints && aiOverview.keyPoints.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Key Takeaways:</h4>
                  <ul className="space-y-1">
                    {aiOverview.keyPoints.map((point, pIdx) => (
                      <li key={pIdx} className="text-xs text-slate-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Citations badges */}
              {aiOverview.citations && aiOverview.citations.length > 0 && (
                <div className="pt-2 border-t border-indigo-100/60 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500">Cited Policies:</span>
                  {aiOverview.citations.map((cite, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => openDocumentViewer(cite.docId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                    >
                      <FileText className="w-3 h-3 text-indigo-500" />
                      <span>{cite.title}</span>
                      {cite.pageNumber && <span className="text-[10px] text-slate-400">p.{cite.pageNumber}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Follow-up question suggestion chips */}
              {aiOverview.relatedQueries && aiOverview.relatedQueries.length > 0 && (
                <div className="pt-2 border-t border-indigo-100/60 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                    Related Inquiries:
                  </span>
                  {aiOverview.relatedQueries.map((sq, sqIdx) => (
                    <button
                      key={sqIdx}
                      onClick={() => {
                        setQuery(sq);
                        executeSearch(sq);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/60 rounded-full text-[11px] font-medium transition-colors"
                    >
                      <span>{sq}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-indigo-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Results Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            {loading ? 'Performing vector search...' : `Found ${results.length} matching knowledge chunk(s)`}
          </span>
          <div className="flex items-center gap-2">{query && <span className="hidden font-mono sm:inline">Term: "{query}"</span>}<select aria-label="Sort search results" value={sortBy} onChange={event => setSortBy(event.target.value as 'relevance' | 'newest')} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600"><option value="relevance">Most relevant</option><option value="newest">Newest first</option></select></div>
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
          displayedResults.map((res, idx) => (
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

