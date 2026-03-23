import React, { useMemo, useState } from 'react';
import { Users2, Shield, Activity, TrendingUp, Search, Filter, Building2, Briefcase, History, Star } from 'lucide-react';
import { Card, Table, Button, StatCard, Badge } from '../../components/ui/Shared';
import { useOwnerAnalytics } from '../../hooks/useQueries';
import { SkeletonStatCards, SkeletonCard } from '../../components/ui/Skeleton';

const OwnerStaffPage = () => {
  const { data: ownerData, isLoading } = useOwnerAnalytics();
  const [activeTab, setActiveTab] = useState('field_officers');

  const formatKES = (val) => new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES',
    maximumFractionDigits: 0 
  }).format(val || 0);

  const getOverdueStyle = (count, thresholds = [1, 3]) => {
    if (count >= thresholds[1]) return 'text-red-600 bg-red-50 dark:bg-red-900/10 font-black px-2 py-0.5 rounded-lg';
    if (count >= thresholds[0]) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/10 font-bold px-2 py-0.5 rounded-lg';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 font-black px-2 py-0.5 rounded-lg';
  };

  const getRejectedStyle = (count) => {
    if (count >= 4) return 'text-amber-600 font-bold';
    if (count >= 1) return 'text-slate-600 font-bold';
    return 'text-emerald-600 font-bold';
  };

  const fieldOfficers = useMemo(() => {
    return [...(ownerData?.field_officer_stats || [])].sort((a, b) => b.loans_submitted - a.loans_submitted);
  }, [ownerData]);

  const managers = useMemo(() => {
    return [...(ownerData?.manager_stats || [])].sort((a, b) => b.loans_approved - a.loans_approved);
  }, [ownerData]);

  const financeOfficers = ownerData?.finance_officer_stats || [];
  const admins = ownerData?.admin_stats || [];

  const topFieldOfficer = useMemo(() => {
    return fieldOfficers.length > 0 && fieldOfficers[0].loans_submitted > 0 ? fieldOfficers[0] : null;
  }, [fieldOfficers]);

  if (isLoading) return <div className="space-y-6"><SkeletonStatCards count={1} /><SkeletonCard /></div>;

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all ${
        activeTab === id 
          ? 'bg-primary-600 text-white rounded-lg shadow-sm shadow-primary-200 dark:shadow-none' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Staff Performance Intelligence</h1>
          <p className="text-sm font-bold text-slate-500">Comprehensive leaderboard for all branch and HQ roles — Last 30 Days</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-fit">
        <TabButton id="field_officers" label="Field Officers" icon={Users2} />
        <TabButton id="managers" label="Managers" icon={Building2} />
        <TabButton id="finance_officers" label="Finance Officers" icon={Briefcase} />
        <TabButton id="admins" label="Admins" icon={Shield} />
      </div>

      {activeTab === 'field_officers' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {topFieldOfficer && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 p-5 rounded-2xl flex items-center justify-between shadow-sm lg:max-w-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-200 dark:bg-emerald-800/20 rounded-xl">
                  <Star className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Top Performer</p>
                  <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-200 leading-tight">{topFieldOfficer.name}</h3>
                  <p className="text-xs font-bold text-emerald-600/70">{topFieldOfficer.branch}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Impact</p>
                <div className="flex items-baseline gap-1 text-emerald-900 dark:text-emerald-200">
                  <span className="text-3xl font-black">{topFieldOfficer.loans_submitted}</span>
                  <span className="text-xs font-bold opacity-60">Submitted</span>
                </div>
              </div>
            </div>
          )}

          <Card className="p-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Field Officer Leaderboard</h3>
            <div className="overflow-x-auto">
              <Table
                headers={['Officer', 'Branch', 'Reg. Customers', 'Submitted', 'Verified', 'Overdue', 'Portfolio', 'Last Active']}
                data={fieldOfficers}
                initialCount={10}
                renderRow={(row) => (
                  <tr key={row.email} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white leading-tight">{row.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{row.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="primary" className="text-[10px] uppercase font-black">{row.branch}</Badge>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300">{row.customers_registered}</td>
                    <td className="px-4 py-4 font-black text-primary-600">{row.loans_submitted}</td>
                    <td className="px-4 py-4 font-bold text-emerald-600">{row.loans_verified}</td>
                    <td className="px-4 py-4">
                      <span className={getOverdueStyle(row.overdue_loans)}>
                        {row.overdue_loans}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300">{formatKES(row.total_portfolio)}</td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-400">{row.last_active}</td>
                  </tr>
                )}
              />
            </div>
            {fieldOfficers.length === 0 && <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No field officer staff found</div>}
          </Card>
        </div>
      )}

      {activeTab === 'managers' && (
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Regional Management Performance</h3>
          <div className="overflow-x-auto">
            <Table
              headers={['Manager', 'Branch', 'Team Size', 'Approved', 'Rejected', 'Overdue in Branch', 'Branch Portfolio', 'Last Active']}
              data={managers}
              initialCount={10}
              renderRow={(row) => (
                <tr key={row.email} className="text-sm border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white leading-tight">{row.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">{row.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-black text-slate-600">{row.branch}</td>
                  <td className="px-4 py-4 font-bold text-slate-700">{row.field_officers_count} Officers</td>
                  <td className="px-4 py-4 font-black text-primary-600">{row.loans_approved}</td>
                  <td className="px-4 py-4">
                    <span className={getRejectedStyle(row.loans_rejected)}>
                      {row.loans_rejected}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={getOverdueStyle(row.overdue_in_branch, [1, 6])}>
                      {row.overdue_in_branch}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-700">{formatKES(row.branch_portfolio)}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-400">{row.last_active}</td>
                </tr>
              )}
            />
          </div>
          {managers.length === 0 && <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No manager staff found</div>}
        </Card>
      )}

      {activeTab === 'finance_officers' && (
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Finance Integrity Activity</h3>
          <div className="overflow-x-auto">
            <Table
              headers={['Finance Officer', 'Disbursements', 'Total Value (KES)', 'Unmatched Resolved', 'Last Active']}
              data={financeOfficers}
              initialCount={10}
              renderRow={(row) => (
                <tr key={row.email} className="text-sm border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white leading-tight">{row.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">{row.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-black text-primary-600">{row.loans_disbursed}</td>
                  <td className="px-4 py-4 font-black text-emerald-600">{formatKES(row.total_disbursed_amount)}</td>
                  <td className="px-4 py-4 font-bold text-slate-700">{row.unmatched_resolved}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-400">{row.last_active}</td>
                </tr>
              )}
            />
          </div>
          {financeOfficers.length === 0 && <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No finance staff found</div>}
        </Card>
      )}

      {activeTab === 'admins' && (
        <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Administrative Operations</h3>
          <div className="overflow-x-auto">
            <Table
              headers={['Name', 'Email', 'Managers Invited', 'Officers Invited', 'Last Active']}
              data={admins}
              initialCount={10}
              renderRow={(row) => (
                <tr key={row.email} className="text-sm border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">{row.name}</td>
                  <td className="px-4 py-4 font-mono text-slate-400">{row.email}</td>
                  <td className="px-4 py-4 font-bold text-primary-600">{row.managers_invited}</td>
                  <td className="px-4 py-4 font-bold text-slate-700">{row.officers_invited}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-400">{row.last_active}</td>
                </tr>
              )}
            />
          </div>
          {admins.length === 0 && <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No admin staff found</div>}
        </Card>
      )}
    </div>
  );
};

export default OwnerStaffPage;
