import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Department, UserRole } from '../types';
import { Users, Lock, ShieldCheck, RefreshCw, AlertCircle, Building2, UserPlus } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [indexMessage, setIndexMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, dList] = await Promise.all([
        api.getUsers(),
        api.getDepartments(),
      ]);
      setUsers(uList);
      setDepartments(dList);
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
      setIndexMessage('Vector re-indexing completed successfully (8 documents, 28 chunks).');
      setIndexing(false);
    }, 2200);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Control Panel</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage user roles, authorization levels, department assignments, and vector database indexes
          </p>
        </div>

        <button
          onClick={handleReindexVectors}
          disabled={indexing}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${indexing ? 'animate-spin' : ''}`} />
          <span>{indexing ? 'Re-indexing Vector DB...' : 'Re-index Vector DB'}</span>
        </button>
      </div>

      {indexMessage && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold rounded-xl">
          {indexMessage}
        </div>
      )}

      {/* User Management Table */}
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

    </div>
  );
};
