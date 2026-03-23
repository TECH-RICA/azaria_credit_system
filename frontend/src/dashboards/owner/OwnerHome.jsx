import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Users, Wallet, Landmark, 
  MapPin, Shield, Activity, RefreshCcw,
  CheckCircle2, AlertTriangle, Clock, 
  Database, Server, Globe, Cpu, Bell, ArrowRight
} from 'lucide-react';
import { Card, StatCard, Button, Badge } from '../../components/ui/Shared';
import { SkeletonStatCards, SkeletonCard } from '../../components/ui/Skeleton';
import { loanService, branchService } from '../../api/api';
import { 
  useFinancialAnalytics, useBranches, useSecurityLogs, 
  useAuditLogs, useCapitalBalance, useSystemHealth, useOwnerAnalytics 
} from '../../hooks/useQueries';
import { useNavigate } from 'react-router-dom';

const OwnerHome = () => {
  const navigate = useNavigate();

  const { data: analyticsData, isLoading: statsLoading } = useFinancialAnalytics();
  const { data: ownerData, isLoading: ownerLoading } = useOwnerAnalytics();
  const { data: branchesData, isLoading: branchesLoading } = useBranches();
  const { data: securityData, isLoading: securityLoading } = useSecurityLogs({ limit: 5 });
  const { data: auditData, isLoading: auditLoading } = useAuditLogs({ limit: 5 });
  const { data: capitalData, isLoading: capitalLoading } = useCapitalBalance();
  const { data: healthData } = useSystemHealth();

  const stats = useMemo(() => {
    return {
      totalPortfolio: analyticsData?.money_out || 0,
      totalProfit: (() => {
        // Interest = total_repayable - principal across all active loans
        // Use money_in minus money_out as a proxy for collected interest
        const collected = analyticsData?.money_in || 0;
        const principal = analyticsData?.money_out || 0;
        return Math.max(0, collected - principal);
      })(),
      portfolioAtRisk: (
        analyticsData?.aging_report?.days_30 || 0) +
        (analyticsData?.aging_report?.days_60 || 0) +
        (analyticsData?.aging_report?.days_90 || 0),
      totalDisbursements: analyticsData?.money_out || 0,
      activeLoans: analyticsData?.active_loans || (() => {
        const history = analyticsData?.history || [];
        return history.filter(h => !h.is_future).length;
      })(),
      totalCustomers: analyticsData?.total_customers || analyticsData?.collection_log?.length || 0,
      treasuryBalance: capitalData?.balance || 0,
      treasuryDisbursed: capitalData?.total_disbursed || 0,
      treasuryRepaid: capitalData?.total_repaid || 0,
      recoveryRate: analyticsData?.money_out > 0 ? ((analyticsData?.money_in / analyticsData?.money_out) * 100).toFixed(1) : "0.0",
      roi: "0.0",
      alerts: ownerData?.alerts || []
    };
  }, [analyticsData, capitalData, ownerData]);

  const branches = useMemo(() => branchesData?.results || branchesData || [], [branchesData]);
  const recentSecurity = useMemo(() => securityData?.results || securityData || [], [securityData]);
  const recentAudit = useMemo(() => auditData?.results || auditData || [], [auditData]);

  const systemHealth = useMemo(() => ({
    database: healthData?.database || 'Connecting...',
    api: healthData?.api || 'Operational',
    sms_provider: healthData?.sms_provider || 'Checking...',
    payment_gateway: healthData?.payment_gateway || 'Checking...'
  }), [healthData]);

  const formatKES = (val) => new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES',
    maximumFractionDigits: 0 
  }).format(val);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Owner Command Center</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Cross-branch Performance & System Integrity</p>
        </div>
      </div>

      {/* Critical Alerts Bar */}
      {stats.alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">Critical System Alerts</h4>
          </div>
          <div className="space-y-2">
            {stats.alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <Badge variant={alert.type === 'error' ? 'danger' : 'warning'} className="px-1.5 py-0.5 text-[10px]">
                    {alert.type.toUpperCase()}
                  </Badge>
                  <span>{alert.message}</span>
                </div>
                <span className="text-[10px] opacity-70">{new Date(alert.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {statsLoading || capitalLoading || ownerLoading ? <SkeletonStatCards count={4} /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Portfolio Value" value={formatKES(stats.totalPortfolio)} icon={TrendingUp} variant="primary" />
            <StatCard label="Net Interest (YTD)" value={formatKES(stats.totalProfit)} icon={Landmark} variant="success" />
            <StatCard label="Portfolio at Risk" value={formatKES(stats.portfolioAtRisk)} icon={AlertTriangle} variant="danger" />
            <StatCard label="Active Customers" value={stats.totalCustomers.toLocaleString()} icon={Users} variant="info" />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Database className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Company Treasury</h3>
                <p className="text-xs font-bold text-slate-500">Live system capital & cashflow tracking</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Available Capital</span>
                </div>
                <p className="text-2xl font-black text-emerald-600">{formatKES(stats.treasuryBalance)}</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Funds Disbursed</span>
                </div>
                <p className="text-2xl font-black text-blue-600">{formatKES(stats.treasuryDisbursed)}</p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Funds Repaid</span>
                </div>
                <p className="text-2xl font-black text-indigo-600">{formatKES(stats.treasuryRepaid)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" /> Branch Performance Matrix
          </h3>
          <button onClick={() => navigate('/owner/branches')} className="text-xs font-bold text-primary-600 hover:underline px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            Detailed Analytics
          </button>
        </div>

        {branchesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5].map(i => <SkeletonCard key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Branches', count: branches.length, path: '/owner/branches', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50/50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-800/20' },
              { label: 'Active Loans', count: stats.activeLoans, path: '/admin/loans', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', border: 'border-emerald-100 dark:border-emerald-800/20' },
              { label: 'Total Disbursed', count: formatKES(stats.totalDisbursements), path: '/admin/loans', icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50/50 dark:bg-indigo-900/10', border: 'border-indigo-100 dark:border-indigo-800/20' },
              { label: 'In Recovery', count: `${stats.recoveryRate}%`, path: '/finance/repayments', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50 dark:bg-amber-900/10', border: 'border-amber-100 dark:border-amber-800/20' },
              { label: 'Avg ROI', count: `${stats.roi}%`, path: '/finance/overview', icon: CheckCircle2, color: 'text-rose-600', bg: 'bg-rose-50/50 dark:bg-rose-900/10', border: 'border-rose-100 dark:border-rose-800/20' }
            ].map((card, idx) => (
              <button key={idx} onClick={() => navigate(card.path)} className={`p-4 rounded-xl border text-left hover:shadow-md transition-all ${card.bg} ${card.border} hover:border-slate-200 dark:hover:border-slate-700`}>
                <p className={`text-2xl font-black ${card.color}`}>{card.count}</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">{card.label}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {securityLoading ? <Card><SkeletonCard className="h-64" /></Card> : (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500 dark:text-red-400" /> Recent Security Events
              </h3>
              <button onClick={() => navigate('/owner/security-logs')} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {recentSecurity.length === 0 ? <p className="text-sm text-slate-400 italic text-center py-6">No security events</p> : 
                recentSecurity.slice(0, 5).map((log, i) => (
                  <div key={i} className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20 rounded-lg">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{log.action}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{log.ip_address || '—'}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </Card>
        )}

        {auditLoading ? <Card><SkeletonCard className="h-64" /></Card> : (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Recent Audit Activity
              </h3>
              <button onClick={() => navigate('/owner/audit')} className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {recentAudit.length === 0 ? <p className="text-sm text-slate-400 italic text-center py-6">No audit entries yet</p> : 
                recentAudit.slice(0, 5).map((log, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{log.action}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{log.admin_name || 'System'}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </Card>
        )}
      </div>

      <Card>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-primary-500" /> System Ecosystem Health
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Core database', status: systemHealth.database, icon: Database },
            { label: 'API Gateway', status: systemHealth.api, icon: Cpu },
            { label: 'SMS Provider', status: systemHealth.sms_provider, icon: Globe },
            { label: 'M-PESA Gateway', status: systemHealth.payment_gateway, icon: Wallet },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{item.label}</span>
              </div>
              <Badge 
                variant={
                  ['Connected', 'Operational', 'Active', 'Idle (Linked)'].includes(item.status) 
                    ? "success" 
                    : item.status === "Connecting..." || item.status === "Checking..."
                    ? "info"
                    : "danger"
                } 
                className="text-[10px] uppercase font-black"
              >
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default OwnerHome;
