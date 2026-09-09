import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [preferences, setPreferences] = useState(user?.preferences || { citations: true, suggestions: true });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const save = async (event: React.FormEvent, password = false) => {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      if (password) { await api.changePassword(currentPassword, newPassword); setCurrentPassword(''); setNewPassword(''); }
      else { await api.updateProfile(name, preferences); await refreshUser(); }
      setMessage(password ? 'Password updated.' : 'Profile and preferences saved.');
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  };
  const input = 'block w-full border border-slate-300 rounded-xl p-3 mt-1';
  return <div className="max-w-3xl mx-auto space-y-6">
    <h1 className="text-2xl font-bold">Account settings</h1>
    {message && <p role="status" className="text-emerald-700">{message}</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <form onSubmit={e => save(e)} className="bg-white border rounded-2xl p-6 space-y-4">
      <h2 className="font-bold">Profile and assistant preferences</h2>
      <label className="block">Full name<input className={input} required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></label>
      <p>{user?.email} ? {user?.departmentName} ? {user?.role}</p>
      <label className="block"><input type="checkbox" checked={preferences.citations} onChange={e => setPreferences({ ...preferences, citations: e.target.checked })} /> Show source citations</label>
      <label className="block"><input type="checkbox" checked={preferences.suggestions} onChange={e => setPreferences({ ...preferences, suggestions: e.target.checked })} /> Show follow-up suggestions</label>
      <button disabled={busy} className="bg-blue-600 text-white px-4 py-2 rounded-xl disabled:opacity-50">Save preferences</button>
    </form>
    <form onSubmit={e => save(e, true)} className="bg-white border rounded-2xl p-6 space-y-4">
      <h2 className="font-bold">Change password</h2>
      <label className="block">Current password<input type="password" autoComplete="current-password" required className={input} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>
      <label className="block">New password<input type="password" autoComplete="new-password" required minLength={8} maxLength={72} className={input} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
      <button disabled={busy} className="bg-blue-600 text-white px-4 py-2 rounded-xl disabled:opacity-50">Update password</button>
    </form>
  </div>;
};
