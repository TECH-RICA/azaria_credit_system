import React, { useState, useMemo } from 'react';
import { AlertTriangle, Clock, Activity, TrendingDown, Search, Filter } from 'lucide-react';
import { Card, Table, Button, StatCard, Badge } from '../../components/ui/Shared';
import { useOwnerAnalytics } from '../../hooks/useQueries';
import DateRangeFilter from '../../components/ui/DateRangeFilter';
import { SkeletonStatCards, SkeletonCard } from '../../components/ui/Skeleton';

const OwnerOverduePage = () => {
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [displayCount, setDisplayCount] = useState(10);

  const { data: ownerData, isLoading } = useOwnerAnalytics();

  const overdueTracker = useMemo(() => {
    let raw = ownerData?.overdue_tracker || [];
    
    // Search
    if (search) {
      const q = search.toLowerCase();
      raw = raw.filter(o => 
        o.customer?.toLowerCase().includes(q) || 
        o.phone?.toLowerCase().includes(q) ||
        o.field_officer?.toLowerCase().includes(q) ||
        o.loan_id?.toString().includes(q)
      );
    }

    // Branch filter
    if (selectedBranch !== 'all') {
      raw = raw.filter(o => o.branch === selectedBranch);
    }

    // Date range
    if (dateRange.from) {
      raw = raw.filter(o => new Date(o.last_payment_date) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      raw = raw.filter(o => new Date(o.last_payment_date) <= new Date(dateRange.to + 'T23:59:59'));
    }

    // Sort by days_overdue descending
    return [...raw].sort((a, b) => b.days_overdue - a.days_overdue);
  }, [ownerData, search, selectedBranch, dateRange]);

  const branches = useMemo(() => {
    const raw = (ownerData?.overdue_tracker || []).map(o => o.branch);
    return ['all', ...new Set(raw.filter(b => b && b !== 'N/A'))];
  }, [ownerData]);

  const stats = useMemo(() => {
    const count = overdueTracker.length;
    const amountAtRisk = overdueTracker.reduce((sum, o) => sum + Number(o.principal || 0), 0);
    const criticalOverdue = overdueTracker.filter(o => o.days_overdue > 30).length;
    const avgDays = count > 0 ? (overdueTracker.reduce((sum, o) => sum + o.days_overdue, 0) / count) : 0;
    return { count, amountAtRisk, criticalOverdue, avgDays };
  }, [overdueTracker]);

  const formatKES = (val) => new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES',
    maximumFractionDigits: 0 
  }).format(val);

  const getDaysOverdueStyle = (days) => {
    if (days >= 30) return 'text-red-600 bg-red-50 dark:bg-red-900/10 font-black px-2 py-0.5 rounded-lg';
    if (days >= 14) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/10 font-bold px-2 py-0.5 rounded-lg';
    return 'text-amber-600 bg-amber-50 dark:bg-amber-900/10 font-semibold px-2 py-0.5 rounded-lg';
  };

  if (isLoading) return <div className="space-y-6"><SkeletonStatCards count={4} /><SkeletonCard /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System-Wide Overdue Tracker</h1>
          <p className="text-sm font-bold text-slate-500">Live monitoring of delinquent accounts across all branches</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Overdue Loans" value={stats.count.toLocaleString()} icon={Clock} variant="danger" />
        <StatCard label="Amount at Risk" value={formatKES(stats.amountAtRisk)} icon={TrendingDown} variant="danger" />
        <StatCard label="Overdue > 30 Days" value={stats.criticalOverdue.toLocaleString()} icon={AlertTriangle} variant="danger" className="border-red-500 bg-red-50" />
        <StatCard label="Avg. Days Overdue" value={`${stats.avgDays.toFixed(1)} Days`} icon={Activity} variant="warning" />
      </div>

      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer, phone, officer..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm py-2 px-4 focus:ring-2 focus:ring-primary-500"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">All Branches</option>
              {branches.filter(b => b !== 'all').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <DateRangeFilter
              onFilter={(from, to) => setDateRange({ from, to })}
              className="bg-slate-50 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            headers={['Customer', 'Phone', 'Branch', 'Field Officer', 'Principal', 'Days Overdue', 'Last Payment', 'Last Amount']}
            data={overdueTracker.slice(0, displayCount)}
            renderRow={(row) => (
              <tr key={row.loan_id} className="text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors">
                <td className="px-4 py-4 font-bold text-slate-900 dark:text-white leading-tight">
                  <div className="flex flex-col">
                    <span>{row.customer}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">#{row.loan_id.slice(0,8)}</span>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-slate-500">{row.phone}</td>
                <td className="px-4 py-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600">
                    {row.branch}
                  </span>
                </td>
                <td className="px-4 py-4 font-bold text-slate-600">{row.field_officer}</td>
                <td className="px-4 py-4 font-mono text-slate-900 dark:text-white">{formatKES(row.principal)}</td>
                <td className="px-4 py-4">
                  <span className={getDaysOverdueStyle(row.days_overdue)}>
                    {row.days_overdue} Days
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-500">{row.last_payment_date}</td>
                <td className="px-4 py-4 font-mono font-bold text-slate-400">{formatKES(row.last_payment_amount)}</td>
              </tr>
            )}
          />
        </div>

        {overdueTracker.length === 0 && (
          <div className="py-12 text-center text-slate-400 italic font-medium">No overdue loans matching your filters.</div>
        )}

        <div className="mt-6 flex justify-center gap-4">
          {displayCount < overdueTracker.length && (
            <Button variant="outline" onClick={() => setDisplayCount(prev => prev + 10)}>Show More</Button>
          )}
          {displayCount > 10 && (
            <Button variant="outline" onClick={() => setDisplayCount(10)}>Show Less</Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default OwnerOverduePage;