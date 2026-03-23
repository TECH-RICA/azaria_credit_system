import React, { useEffect, useState, useMemo } from 'react';
import { format, differenceInMinutes, formatDistanceToNow, isAfter, subHours, subDays } from 'date-fns';
import { loanService } from '../api/api';
import { useInvalidate, useBranches } from '../hooks/useQueries';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import PaginationFooter from '../components/ui/PaginationFooter';
import { useAuth } from '../context/AuthContext';
import { Table, Button, Card, Badge } from '../components/ui/Shared';
import { UserPlus, Mail, Phone, CheckCircle, Edit, MapPin, XCircle, Save, Loader2, Activity, Send, Building2, ShieldAlert, Lock } from 'lucide-react';
import AdminActivityModal from '../components/ui/AdminActivityModal';
import BulkInviteModal from '../components/forms/BulkInviteModal';
import DirectEmailModal from '../components/ui/DirectEmailModal';

const formatLastActive = (lastLogin) => {
  if (!lastLogin) return { label: 'Never Active', color: 'bg-slate-100 text-slate-500 border-slate-200' };
  
  const date = new Date(lastLogin);
  const now = new Date();
  const diffInMinutes = (now - date) / 1000 / 60;
  
  if (diffInMinutes < 5) return { label: 'Online Now', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse' };
  if (isAfter(date, subHours(now, 2))) return { label: 'Active recently', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  if (isAfter(date, subHours(now, 24))) return { label: 'Active today', color: 'bg-blue-50 text-blue-600 border-blue-100' };
  if (isAfter(date, subDays(now, 7))) return { label: formatDistanceToNow(date) + ' ago', color: 'bg-slate-50 text-slate-600 border-slate-200' };
  
  return { label: format(date, 'MMM d, yyyy'), color: 'bg-slate-100 text-slate-400 border-slate-200 opacity-60' };
};

const AdminManagers = () => {
  const { user } = useAuth();
  const isSuperAdminOrOwner = user?.is_super_admin || user?.is_owner || user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';
  const { invalidateAdmins } = useInvalidate();
  const [editingManager, setEditingManager] = useState(null);
  const [isInviting, setIsInviting] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailTargets, setEmailTargets] = useState(null);
  const [bulkEmail, setBulkEmail] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterBranch, setFilterBranch] = useState('all');
  const { data: branchesData } = useBranches();
  
  const { 
    data: managersData, 
    isLoading: loading, 
    isFetching,
    error, 
    hasMore, 
    showMore: fetchNext, 
    showLess,
    reset 
  } = usePaginatedQuery({
    queryKey: ['admins', { role: 'MANAGER', branch: filterBranch === 'all' ? undefined : filterBranch }],
    queryFn: (params) => loanService.getAdmins({ ...params, role: 'MANAGER', branch: filterBranch === 'all' ? undefined : filterBranch })
  });

  const managers = managersData || [];

  useEffect(() => {
    reset();
  }, [filterBranch]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    branch: ''
  });

  const branches = [
    'Kagio', 'Embu', 'Thika', 'Naivasha'
  ];

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await loanService.updateAdmin(editingManager.id, formData);
      setEditingManager(null);
      invalidateAdmins();
    } catch (err) {
      alert('Failed to update manager: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (manager) => {
    setEditingManager(manager);
    setFormData({
      full_name: manager.full_name || '',
      email: manager.email || '',
      phone: manager.phone || '',
      branch: manager.branch || ''
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading managers...</div>


  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        {error.message || 'Error loading managers'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Branchal Managers</h3>
          <p className="text-sm text-slate-500">Manage and oversee all branchal administrators.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            className="flex items-center"
            onClick={() => setIsInviting(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Manager
          </Button>
          {isSuperAdminOrOwner && (
            <Button 
              variant="secondary"
              className="flex items-center"
              onClick={() => {
                setEmailTargets(managers);
                setBulkEmail(true);
                setShowEmail(true);
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Bulk Email
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select 
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 py-2 pl-3 pr-8 focus:ring-primary-500 outline-none font-bold"
            >
              <option value="all">ALL BRANCHES</option>
              {Array.isArray(branchesData) && branchesData.map(b => (
                <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {managers.length === 0 && !loading ? (
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <p>No managers registered yet</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table
            headers={['Name', 'Contact', 'Branch', 'Last Active', 'Status', 'Actions']}
            data={managers}
            initialCount={10}
            maxHeight="max-h-[500px]"
            disableLocalPagination={true}
            renderRow={(manager) => {
              const diff = manager.last_login_at && manager.last_logout_at ? differenceInMinutes(new Date(manager.last_logout_at), new Date(manager.last_login_at)) : null;
              const duration = diff !== null ? `${Math.floor(diff / 60)}h ${diff % 60}m` : null;
              const statusInfo = formatLastActive(manager.last_login_at);

              return (
                <tr key={manager.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-3">
                        {manager.full_name?.[0] || 'M'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{manager.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Emp ID: {manager.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <span className="flex items-center text-xs text-slate-600 font-medium"><Mail className="w-3 h-3 mr-1" /> {manager.email}</span>
                      <span className="flex items-center text-xs text-slate-600 font-medium"><Phone className="w-3 h-3 mr-1" /> {manager.phone || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-slate-600 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
                      <span className="text-sm font-bold tracking-tight">{manager.branch_name || manager.branch || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {manager.failed_login_attempts > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[9px] font-black uppercase ring-1 ring-red-100 w-fit">
                            <ShieldAlert className="w-2.5 h-2.5 mr-0.5" />
                            {manager.failed_login_attempts} Failed
                          </span>
                      )}
                      {manager.is_locked_out && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-black uppercase w-fit">
                          <Lock className="w-2.5 h-2.5 mr-0.5" />
                          LOCKED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={manager.is_verified ? 'success' : 'warning'}>
                      {manager.is_verified ? 'VERIFIED' : 'PENDING'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex items-center p-2"
                        title="Send Official Email"
                        onClick={() => {
                          setEmailTargets(manager);
                          setBulkEmail(false);
                          setShowEmail(true);
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex items-center p-2"
                        title="View Activity"
                        onClick={() => {
                            setSelectedAdmin({...manager, role: 'MANAGER'});
                            setShowActivity(true);
                        }}
                      >
                        <Activity className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex items-center p-2"
                        onClick={() => startEdit(manager)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            }}
          />
          <PaginationFooter
            resultsCount={managers.length}
            hasMore={hasMore}
            isLoading={isFetching}
            onShowMore={fetchNext}
            onShowLess={showLess}
          />
        </Card>
      )}

      {/* Email Modal */}
      <DirectEmailModal 
        isOpen={showEmail}
        targets={emailTargets}
        bulk={bulkEmail}
        onClose={() => {
          setShowEmail(false);
          setEmailTargets(null);
        }}
      />

      {/* Edit Manager Modal */}
      {editingManager && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setEditingManager(null)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <XCircle className="w-6 h-6 text-slate-400" />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Update Manager Profile</h3>
              <p className="text-slate-500 text-sm">Modify account details and branchal assignment</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Phone Number</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Branchal Assignment</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                >
                  <option value="">Select a branch...</option>
                  {branches.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => setEditingManager(null)}
                >
                  Cancel
                </Button>
                <Button 
                  disabled={saving}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Bulk Invite Manager Modal */}
      <BulkInviteModal 
        isOpen={isInviting}
        onClose={() => setIsInviting(false)}
        defaultRole="MANAGER"
        branches={branches}
      />

      {selectedAdmin && (
          <AdminActivityModal 
            admin={selectedAdmin}
            isOpen={showActivity}
            onClose={() => {
                setShowActivity(false);
                setSelectedAdmin(null);
            }}
          />
      )}
    </div>
  );
};

export default AdminManagers;
