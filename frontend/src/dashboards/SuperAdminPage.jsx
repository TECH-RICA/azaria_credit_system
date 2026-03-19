import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Zap, AlertCircle, Ban, ArrowDown, UserMinus, UserPlus, X, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { loanService } from '../api/api';

const SuperAdminPage = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invitation state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState('SUPER_ADMIN');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteFullName) {
      toast.error('Please fill in name and email');
      return;
    }
    setInviteLoading(true);
    try {
      await loanService.api.post('/invitations/', {
        email: inviteEmail,
        full_name: inviteFullName,
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteFullName('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await loanService.api.get('/admins/?role=ADMIN');
      // Handle paginated responses
      const data = res.data.results || res.data;
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load super admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleSuspend = async (admin) => {
    const reason = window.prompt(`Reason for suspending ${admin.full_name}:`);
    if (!reason) return;
    try {
      await loanService.api.post(`/admins/${admin.id}/suspend/`, { reason });
      toast.success("Admin suspended");
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  const handleUnsuspend = async (admin) => {
    try {
      await loanService.api.post(`/admins/${admin.id}/unsuspend/`);
      toast.success("Admin unsuspended");
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite buttons — Owner only */}
      {user?.is_owner && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => { setInviteRole('SUPER_ADMIN'); setShowInviteModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Super Admin
          </button>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Invite {inviteRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">They will receive an email with a signup link</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800"
                />
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {inviteRole === 'SUPER_ADMIN'
                    ? 'Super Admins can manage M-Pesa settings, SMS, and all staff below Admin level.'
                    : 'Admins can manage customers, loans, managers, and branches.'}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleInvite}
                  disabled={inviteLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  {inviteLoading
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <Mail className="w-4 h-4" />}
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">System Admins</h2>
              <p className="text-xs text-slate-500 font-medium">Core staff management</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-left border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Administrator</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="p-12 text-center text-slate-400 animate-pulse">Scanning records...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan="4" className="p-12 text-center text-slate-400">No administrators found</td></tr>
              ) : admins.map(admin => (
                <tr key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs">
                        {admin.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{admin.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {admin.branch_details?.name || 'Central Board'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {admin.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 uppercase">
                        <Zap className="w-3 h-3 fill-current" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 uppercase">
                        <Ban className="w-3 h-3 fill-current" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {admin.is_active ? (
                        <button 
                          onClick={() => handleSuspend(admin)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUnsuspend(admin)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                        >
                          <Zap className="w-4 h-4" />
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
    </div>
  );
};

export default SuperAdminPage;
