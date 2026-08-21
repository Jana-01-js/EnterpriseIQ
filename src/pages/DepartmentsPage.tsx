import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Department, DocumentItem } from '../types';
import { Building2, FileText, Users, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const DepartmentsPage: React.FC = () => {
  const { openDocumentViewer } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDepartments(), api.getDocuments()])
      .then(([deps, docs]) => {
        setDepartments(deps);
        setDocuments(docs);
        if (deps.length > 0) setSelectedDeptId(deps[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedDept = departments.find(d => d.id === selectedDeptId);
  const deptDocs = documents.filter(d => d.departmentId === selectedDeptId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department Knowledge Hubs</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore knowledge boundaries, policy documentation, and indexed vectors partitioned by department
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs font-medium">Loading department structures...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Department Cards List */}
          <div className="space-y-3">
            {departments.map(dep => {
              const docCount = documents.filter(d => d.departmentId === dep.id).length;
              const isSelected = dep.id === selectedDeptId;

              return (
                <div
                  key={dep.id}
                  onClick={() => setSelectedDeptId(dep.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-800 shadow-md'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{dep.name}</h3>
                      <p className={`text-[11px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {dep.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {docCount} docs
                    </span>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-slate-400' : 'text-slate-300'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Department Knowledge Detail */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            {selectedDept ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{selectedDept.name} Knowledge Base</h2>
                      <p className="text-xs text-slate-500">{selectedDept.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/documents')}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Manage Repository
                  </button>
                </div>

                {/* Documents in Dept */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                    Indexed Documents ({deptDocs.length})
                  </h3>

                  {deptDocs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No documents currently assigned to {selectedDept.name}.
                    </div>
                  ) : (
                    deptDocs.map(doc => (
                      <div
                        key={doc.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <p
                              onClick={() => openDocumentViewer(doc.id)}
                              className="font-bold text-slate-900 hover:text-blue-600 text-xs cursor-pointer truncate"
                            >
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {doc.description || 'Enterprise indexed policy'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {doc.accessLevel}
                          </span>
                          <button
                            onClick={() => openDocumentViewer(doc.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>

        </div>
      )}

    </div>
  );
};
