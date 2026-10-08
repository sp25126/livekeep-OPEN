'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { AppUser, UserRole } from '@/types/database';
import confetti from 'canvas-confetti';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Trash2, 
  Edit3, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  ArrowLeft,
  RefreshCw,
  Mail,
  UserCheck
} from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Form States
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>('maker');
  const [forceReset, setForceReset] = useState<boolean>(false);
  const [editRole, setEditRole] = useState<UserRole>('maker');
  const [editPassword, setEditPassword] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role: userRole,
          forcePasswordReset: forceReset
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUsers([data.user, ...users]);
        setIsCreateModalOpen(false);
        setFullName('');
        setEmail('');
        setPassword('');
        setFeedbackMsg({ type: 'success', text: `User ${fullName} created successfully!` });

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Failed to create user' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Handle Edit Role & Password Reset
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: editRole,
          newPassword: editPassword || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: editRole } : u));
        setIsEditModalOpen(false);
        setEditPassword('');
        setFeedbackMsg({ type: 'success', text: `Permissions updated for ${selectedUser.full_name}!` });
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Failed to update user' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id })
      });

      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== selectedUser.id));
        setIsDeleteModalOpen(false);
        setFeedbackMsg({ type: 'success', text: `Access revoked for ${selectedUser.full_name}!` });
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Failed to revoke access' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const checkerCount = users.filter(u => u.role === 'checker').length;
  const makerCount = users.filter(u => u.role === 'maker').length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* RBAC Sidebar */}
      <Sidebar currentRole={currentRole} onRoleChange={setCurrentRole} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navigation */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" /> User Management & Access Controls
              </h1>
              <p className="text-xs text-slate-400">Enterprise Role-Based Access Control & Credential Provisioning</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition"
          >
            <UserPlus className="h-4 w-4" /> Create User / Admin
          </button>
        </header>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className={`mx-6 mt-4 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
              : 'bg-rose-950/80 text-rose-300 border border-rose-800'
          }`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <main className="p-6 space-y-6">
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Team Members</div>
              <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
              <div className="text-[11px] text-slate-500 mt-1">Active Organization Staff</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Root Administrators</div>
              <div className="text-2xl font-bold text-purple-300 mt-1">{adminCount}</div>
              <div className="text-[11px] text-purple-400/80 mt-1">Full System Governance</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Accountant Checkers</div>
              <div className="text-2xl font-bold text-blue-300 mt-1">{checkerCount}</div>
              <div className="text-[11px] text-blue-400/80 mt-1">Audit & Approval Authority</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Sales Makers</div>
              <div className="text-2xl font-bold text-emerald-300 mt-1">{makerCount}</div>
              <div className="text-[11px] text-emerald-400/80 mt-1">Field Billing & Entry Access</div>
            </div>
          </div>

          {/* User Table Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            {/* Table Filters & Search */}
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by user name or email..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Role Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {['all', 'admin', 'manager', 'checker', 'maker'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition ${
                      roleFilter === r ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">User / Staff Details</th>
                    <th className="py-4 px-6">Assigned Role</th>
                    <th className="py-4 px-6">Account Status</th>
                    <th className="py-4 px-6">Created Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-4 px-6">
                        <div className="font-bold text-sm text-white">{u.full_name}</div>
                        <div className="text-slate-400 flex items-center gap-1 font-mono text-[11px] mt-0.5">
                          <Mail className="h-3 w-3 text-slate-500" /> {u.email}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                            : u.role === 'checker'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                            : u.role === 'manager'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}>
                          <ShieldCheck className="h-3 w-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-400">
                        {new Date(u.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setEditRole(u.role);
                              setIsEditModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-blue-400" /> Edit
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsDeleteModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-950/50 hover:bg-rose-900/60 rounded-lg border border-rose-800/60 transition flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-400" /> Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-400" /> Create System User / Admin
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@enterprise.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned System Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="maker">Sales Maker (Create & Draft Invoices)</option>
                  <option value="checker">Accountant Checker (Review & Approve)</option>
                  <option value="manager">Operations Manager (Reports & Monitoring)</option>
                  <option value="admin">Root Administrator (Full Privileges)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="forceReset"
                  checked={forceReset}
                  onChange={(e) => setForceReset(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                />
                <label htmlFor="forceReset" className="text-xs text-slate-400 cursor-pointer">
                  Force password reset on initial login
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE & RESET PASSWORD MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-400" /> Edit Permissions: {selectedUser.full_name}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Update System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="maker">Sales Maker</option>
                  <option value="checker">Accountant Checker</option>
                  <option value="manager">Operations Manager</option>
                  <option value="admin">Root Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reset Password (Optional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVOKE / DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-400" /> Revoke User Access?
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently revoke credentials for <strong>{selectedUser.full_name}</strong> ({selectedUser.email})? They will immediately lose access to the Livekeeping Open enterprise portal.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition disabled:opacity-50"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
