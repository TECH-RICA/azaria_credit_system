import React, { useEffect, useState, useMemo } from 'react';
import { format, differenceInMinutes, formatDistanceToNow, isAfter, subHours, subDays } from 'date-fns';
import { loanService } from '../api/api';
import { usePaginatedQuery } from '../hooks/usePaginatedQuery';
import PaginationFooter from '../components/ui/PaginationFooter';
import { Table, Button, Card } from '../components/ui/Shared';
import { UserPlus, Shield, Activity, ShieldOff, Send, ShieldAlert, Lock } from 'lucide-react';
import AdminActivityModal from '../components/ui/AdminActivityModal';
import DeactivationRequestModal from '../components/ui/DeactivationRequestModal';
import BulkInviteModal from '../components/forms/BulkInviteModal';
import DirectEmailModal from '../components/ui/DirectEmailModal';
import { useAuth } from '../context/AuthContext';

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

const AdminOfficers = ({ role = 'FINANCIAL_OFFICER' }) => {
  const { user } = useAuth();
  const isSuperAdminOrOwner = user?.is_super_admin || user?.is_owner || user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';
  // Allow Managers only to invite Field Officers
  const canInvite = isSuperAdminOrOwner || (isManager && role === 'FIELD_OFFICER');

  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailTargets, setEmailTargets] = useState(null);
  const [bulkEmail, setBulkEmail] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  const { 
    data: officersData, 
    isLoading: loading, 
    isFetching,
    error, 
    hasMore, 
    showMore: fetchNext, 
    showLess,
    reset 
  } = usePaginatedQuery({
    queryKey: ['admins', { role }],
    queryFn: (params) => loanService.getAdmins({ ...params, role })
  });

  const officers = officersData || [];

  useEffect(() => {
    reset();
  }, [role]);

  // Deactivation Request State
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [officerToDeactivate, setOfficerToDeactivate] = useState(null);
  const [submittingDeactivation, setSubmittingDeactivation] = useState(false);

  const userRole = user?.role || user?.admin?.role;

  const handleDeactivationSubmit = async (officerId, reason) => {
    setSubmittingDeactivation(true);
    try {
      await loanService.createDeactivationRequest({
        officer: officerId,
        reason: reason
      });
      setIsDeactivateModalOpen(false);
      setOfficerToDeactivate(null);
      alert("Deactivation request submitted successfully. Admin will review it.");
    } catch (err) {
      console.error("Error submitting deactivation request:", err);
      alert(err.response?.data?.error || "Failed to submit request.");
    } finally {
      setSubmittingDeactivation(false);
    }
  };

  const isAnyAdmin = user?.role === 'ADMIN' || user?.is_super_admin || user?.is_owner;
  const canInviteAny = isAnyAdmin || (isManager && role === 'FIELD_OFFICER');

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading officers...</div>


  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        {error.message || 'Error loading officers'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{role === 'FIELD_OFFICER' ? 'Field Officers' : 'Finance Officers'}</h3>
          <p className="text-sm text-slate-500">View and manage all active {role === 'FIELD_OFFICER' ? 'field' : 'finance'} officers.</p>
        </div>
        <div className="flex items-center gap-4">
          {(isSuperAdminOrOwner || (isManager && role === 'FIELD_OFFICER')) && (
            <Button 
              variant="secondary"
              className="flex items-center"
              onClick={() => {
                setEmailTargets(officers);
                setBulkEmail(true);
                setShowEmail(true);
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Bulk Email
            </Button>
          )}
          {canInviteAny && (
            <Button 
              className="flex items-center"
              onClick={() => {
                console.log('Opening invitation modal for:', role);
                setIsInviting(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite {role === 'FIELD_OFFICER' ? 'Field Officer' : 'Finance Officer'}
            </Button>
          )}
        </div>
      </div>

      {officers.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <p>No {role === 'FIELD_OFFICER' ? 'field' : 'finance'} officers registered yet</p>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table
            headers={['Name', 'Email/Phone', 'Branch', 'Last Active', 'Status', 'Actions']}
            data={officers}
            initialCount={10}
            maxHeight="max-h-[500px]"
            disableLocalPagination={true}
            renderRow={(officer) => {
              const diff = officer.last_login_at && officer.last_logout_at ? differenceInMinutes(new Date(officer.last_logout_at), new Date(officer.last_login_at)) : null;
              const duration = diff !== null ? `${Math.floor(diff / 60)}h ${diff % 60}m` : null;
              const statusInfo = formatLastActive(officer.last_login_at);

              return (
                <tr key={officer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{officer.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">#{officer.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600 dark:text-slate-400">{officer.email}</p>
                    <p className="text-[10px] text-slate-400">{officer.phone || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {officer.branch_name || officer.branch || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {officer.failed_login_attempts > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[9px] font-black uppercase ring-1 ring-red-100 w-fit">
                            <ShieldAlert className="w-2.5 h-2.5 mr-0.5" />
                            {officer.failed_login_attempts} Failed
                          </span>
                      )}
                      {officer.is_locked_out && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-black uppercase w-fit">
                          <Lock className="w-2.5 h-2.5 mr-0.5" />
                          LOCKED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-xs text-indigo-600 font-medium">
                      <Shield className="w-3 h-3 mr-1" />
                      {officer.is_verified ? 'Verified' : 'Pending'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                          onClick={() => {
                              setEmailTargets(officer);
                              setBulkEmail(false);
                              setShowEmail(true);
                          }}
                          className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                          title="Send Official Email"
                      >
                          <Send className="w-4 h-4" />
                      </button>
                      <button 
                          onClick={() => {
                              setSelectedAdmin({...officer, role});
                              setShowActivity(true);
                          }}
                          className="flex items-center gap-1 text-slate-500 hover:text-primary-600 transition-colors"
                          title="View Activity"
                      >
                          <Activity className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (userRole === 'MANAGER') {
                            setOfficerToDeactivate(officer);
                            setIsDeactivateModalOpen(true);
                          } else if (window.confirm(`Are you sure you want to deactivate ${officer.full_name}? They will be immediately logged out.`)) {
                            loanService.updateAdmin(officer.id, { is_blocked: true })
                              .then(() => {
                                alert("Officer deactivated successfully.");
                                window.location.reload();
                              })
                              .catch(err => alert("Error: " + (err.response?.data?.error || err.message)));
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                      >
                        {userRole === 'MANAGER' ? 'Request Suspension' : 'Deactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }}
          />
          <PaginationFooter
            resultsCount={officers.length}
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

      <DeactivationRequestModal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        officer={officerToDeactivate}
        onSubmit={handleDeactivationSubmit}
        loading={submittingDeactivation}
      />

      <BulkInviteModal 
        isOpen={isInviting}
        onClose={() => setIsInviting(false)}
        defaultRole={role}
        branches={['Kagio', 'Embu', 'Thika', 'Naivasha']}
      />
    </div>
  );
};

export default AdminOfficers;
