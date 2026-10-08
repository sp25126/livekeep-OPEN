'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Box
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
        setFeedbackMsg({ type: 'success', text: `Staff user ${fullName} provisioned successfully!` });

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Failed to provision user' });
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
    <div className="min-h-screen bg-[#ecebe6] p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center font-sans">
      {/* Master Container */}
      <div className="master-super-card w-full max-w-[1480px] min-h-[900px] flex flex-col p-6 sm:p-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e3dc] pb-5">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2.5 rounded-full bg-[#f6f5f0] hover:bg-[#edece6] text-[#232528] transition btn-pill"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-[#232528] tracking-tight flex items-center gap-2">
                <Users className="h-6 w-6 text-[#f5ba41]" /> Staff & Roles Management
              </h1>
              <p className="text-xs text-[#88898b]">Manage user roles, Maker-Checker authorization & access controls</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#f5ba41] hover:bg-[#e6ab33] text-[#232528] text-xs font-black shadow-md shadow-[#f5ba41]/30 transition btn-pill"
          >
            <UserPlus className="h-4 w-4" /> Add Team Member
          </button>
        </header>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            feedbackMsg.type === 'success' 
              ? 'bg-[#D2DEC9] text-[#2b3e24]' 
              : 'bg-[#F8D7DA] text-[#721C24]'
          }`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-[#2b3e24]" /> : <AlertCircle className="h-4 w-4 text-[#721C24]" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Key Metric Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-[24px] bg-[#f6f5f0] space-y-1">
            <div className="text-[11px] font-black text-[#88898b] uppercase tracking-wider">Total Staff</div>
            <div className="text-2xl font-black text-[#232528] font-mono">{users.length}</div>
            <div className="text-[11px] text-[#88898b]">Active Accounts</div>
          </div>

          <div className="p-5 rounded-[24px] bg-[#8F94FB]/20 space-y-1">
            <div className="text-[11px] font-black text-[#2c307a] uppercase tracking-wider">Administrators</div>
            <div className="text-2xl font-black text-[#2c307a] font-mono">{adminCount}</div>
            <div className="text-[11px] text-[#5b5fd8]">Full Governance</div>
          </div>

          <div className="p-5 rounded-[24px] bg-[#FBE29D] space-y-1">
            <div className="text-[11px] font-black text-[#4d3809] uppercase tracking-wider">Accountant Checkers</div>
            <div className="text-2xl font-black text-[#4d3809] font-mono">{checkerCount}</div>
            <div className="text-[11px] text-[#4d3809]">Audit Authority</div>
          </div>

          <div className="p-5 rounded-[24px] bg-[#D2DEC9] space-y-1">
            <div className="text-[11px] font-black text-[#2b3e24] uppercase tracking-wider">Sales Makers</div>
            <div className="text-2xl font-black text-[#2b3e24] font-mono">{makerCount}</div>
            <div className="text-[11px] text-[#2b3e24]">Field Invoicing</div>
          </div>
        </div>

        {/* User Table Card */}
        <div className="rounded-[28px] bg-[#fafaf8] border border-[#e5e3dc] overflow-hidden flex-1 flex flex-col">
          {/* Table Filters & Search */}
          <div className="p-4 border-b border-[#e5e3dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f6f5f0]">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#88898b]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name or email..."
                className="w-full bg-white border-none rounded-full pl-11 pr-4 py-2.5 text-xs sm:text-sm text-[#232528] placeholder-[#88898b] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-full text-xs overflow-x-auto">
              {['all', 'admin', 'manager', 'checker', 'maker'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-full capitalize font-bold transition btn-pill ${
                    roleFilter === r ? 'bg-[#232528] text-white shadow-sm' : 'text-[#88898b] hover:text-[#232528]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs text-[#232528]">
              <thead className="bg-[#f6f5f0] text-[11px] text-[#88898b] font-black uppercase tracking-wider border-b border-[#e5e3dc]">
                <tr>
                  <th className="py-4 px-6">User / Staff Details</th>
                  <th className="py-4 px-6">Assigned Role</th>
                  <th className="py-4 px-6">Account Status</th>
                  <th className="py-4 px-6">Created Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efeee9]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#f6f5f0]/80 transition">
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-sm text-[#232528]">{u.full_name}</div>
                      <div className="text-[#88898b] flex items-center gap-1 font-mono text-[11px] mt-0.5">
                        <Mail className="h-3 w-3 text-[#88898b]" /> {u.email}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                        u.role === 'admin'
                          ? 'bg-[#8F94FB]/20 text-[#2c307a]'
                          : u.role === 'checker'
                          ? 'bg-[#FBE29D] text-[#4d3809]'
                          : u.role === 'manager'
                          ? 'bg-[#f6f5f0] text-[#232528]'
                          : 'bg-[#D2DEC9] text-[#2b3e24]'
                      }`}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#D2DEC9] text-[#2b3e24]">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[#88898b]">
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
                          className="px-3.5 py-1.5 text-xs font-bold text-[#232528] bg-white hover:bg-[#f6f5f0] rounded-full border border-[#e5e3dc] transition flex items-center gap-1 btn-pill"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-[#5b5fd8]" /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsDeleteModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-[#F8D7DA] hover:bg-[#f5c6cb] rounded-full transition flex items-center gap-1 btn-pill"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-lg font-black text-[#232528] flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#f5ba41]" /> Provision New Staff Account
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#88898b] hover:text-[#232528]">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@enterprise.com"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Assigned System Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
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
                  className="rounded border-[#e5e3dc] text-[#f5ba41] focus:ring-0"
                />
                <label htmlFor="forceReset" className="text-xs text-[#88898b] cursor-pointer">
                  Force password reset on initial login
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e3dc]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-[#88898b] hover:text-[#232528] bg-[#f6f5f0] rounded-full btn-pill"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="min-h-[44px] px-6 py-2 text-xs font-bold text-[#232528] bg-[#f5ba41] hover:bg-[#e6ab33] rounded-full shadow-md shadow-[#f5ba41]/30 transition disabled:opacity-50 flex items-center gap-1.5 btn-pill"
                >
                  {actionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE & RESET PASSWORD MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-lg font-black text-[#232528] flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#8F94FB]" /> Edit Permissions: {selectedUser.full_name}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#88898b] hover:text-[#232528]">✕</button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Update System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                >
                  <option value="maker">Sales Maker</option>
                  <option value="checker">Accountant Checker</option>
                  <option value="manager">Operations Manager</option>
                  <option value="admin">Root Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#232528] mb-1">Reset Password (Optional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  className="w-full bg-[#f6f5f0] border-none rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#232528] focus:outline-none focus:ring-2 focus:ring-[#f5ba41]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e3dc]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-[#88898b] hover:text-[#232528] bg-[#f6f5f0] rounded-full btn-pill"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="min-h-[44px] px-6 py-2 text-xs font-bold text-[#232528] bg-[#f5ba41] hover:bg-[#e6ab33] rounded-full transition disabled:opacity-50 btn-pill shadow-md shadow-[#f5ba41]/30"
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
        <div className="fixed inset-0 z-50 bg-[#232528]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fafaf8] border border-[#e5e3dc] rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#e5e3dc] pb-3">
              <h3 className="text-lg font-black text-rose-700 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-700" /> Revoke User Access?
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-[#88898b] hover:text-[#232528]">✕</button>
            </div>

            <p className="text-xs text-[#232528] leading-relaxed">
              Are you sure you want to permanently revoke credentials for <strong>{selectedUser.full_name}</strong> ({selectedUser.email})? They will immediately lose access to the Livekeeping Open portal.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#e5e3dc]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="min-h-[44px] px-5 py-2 text-xs font-bold text-[#88898b] hover:text-[#232528] bg-[#f6f5f0] rounded-full btn-pill"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="min-h-[44px] px-6 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-full transition disabled:opacity-50 btn-pill shadow-md"
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
