import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DocumentItem, Department, AccessLevel } from '../types';
import {
  FileText,
  Upload,
  GitCompare,
  Search,
  Filter,
  Eye,
  Trash2,
  MessageSquare,
  Building2,
  Shield,
  Tag,
  Grid,
  List,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { UploadDocModal } from '../components/documents/UploadDocModal';
import { CompareDocsModal } from '../components/documents/CompareDocsModal';

export const DocumentsPage: React.FC = () => {
  const { user, openDocumentViewer } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const [docs, deps] = await Promise.all([
        api.getDocuments(),
        api.getDepartments(),
      ]);
      setDocuments(docs);
      setDepartments(deps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleDelete = async (docId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove its vectors from the database.`)) {
      return;
    }
    setDeletingId(docId);
    try {
      await api.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesText = doc.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                        doc.tags.some(t => t.toLowerCase().includes(searchFilter.toLowerCase())) ||
                        doc.description?.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesDept = deptFilter ? doc.departmentId === deptFilter : true;
    const matchesAccess = accessFilter ? doc.accessLevel === accessFilter : true;
    return matchesText && matchesDept && matchesAccess;
  });

  const getAccessBadgeClass = (level: AccessLevel) => {
    switch (level) {
      case 'Public': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Department only': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Managers only': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Restricted': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Enterprise Knowledge Repository</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized document storage indexed into high-dimensional vector embeddings
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setCompareModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <GitCompare className="w-4 h-4 text-indigo-600" />
            <span>AI Compare Docs</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Filter documents by title, tags, description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dropdowns & View Mode */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={accessFilter}
            onChange={e => setAccessFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Access Levels</option>
            <option value="Public">Public</option>
            <option value="Department only">Department Only</option>
            <option value="Managers only">Managers Only</option>
            <option value="Restricted">Restricted</option>
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'table' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'grid' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Documents View */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-medium">Loading document repository...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Documents Match Filters</h3>
          <p className="text-xs text-slate-500">Try clearing your search query or uploading a new document.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Document Title</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Access Level</th>
                  <th className="px-4 py-3.5">Size / Type</th>
                  <th className="px-4 py-3.5">Uploaded</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p
                            onClick={() => openDocumentViewer(doc.id)}
                            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors text-xs"
                          >
                            {doc.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {doc.tags.map((t, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.2 rounded font-mono">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {doc.departmentName}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getAccessBadgeClass(doc.accessLevel)}`}>
                        {doc.accessLevel}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {doc.fileType} ({doc.fileSize})
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDocumentViewer(doc.id)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="View document text & vectors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => navigate(`/assistant?docId=${doc.id}&title=${encodeURIComponent(doc.title)}`)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                          title="Ask AI about this document"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.departmentId === doc.departmentId)) && (
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            disabled={deletingId === doc.id}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getAccessBadgeClass(doc.accessLevel)}`}>
                    {doc.accessLevel}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    {doc.fileType} • {doc.fileSize}
                  </span>
                </div>

                <h3
                  onClick={() => openDocumentViewer(doc.id)}
                  className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer transition-colors leading-snug"
                >
                  📄 {doc.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {doc.description || 'No summary description provided.'}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {doc.tags.map((t, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.2 rounded font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {doc.departmentName}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDocumentViewer(doc.id)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => navigate(`/assistant?docId=${doc.id}&title=${encodeURIComponent(doc.title)}`)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] rounded-lg shadow-2xs flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Ask AI</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {uploadModalOpen && (
        <UploadDocModal
          departments={departments}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={loadDocs}
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
