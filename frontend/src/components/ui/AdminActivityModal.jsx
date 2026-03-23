import React, { useEffect, useState } from 'react';
import { loanService } from '../../api/api';
import { Card, Button, Table } from '../ui/Shared';
import { X, Activity, User, Calendar, ExternalLink } from 'lucide-react';

const AdminActivityModal = ({ admin, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('LOGS');

  useEffect(() => {
    if (isOpen && admin) {
      fetchActivity();
    }
  }, [isOpen, admin]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const data = await loanService.getAuditLogs({ 
        page_size: 1000 
      });
      const allLogs = data?.results || (Array.isArray(data) ? data : []);
      
      const adminLogs = allLogs.filter(log => String(log.admin) === String(admin.id) || String(log.user) === String(admin.id));
      setLogs(adminLogs);
    } catch (err) {
      console.error('Error fetching admin activity:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 bg-white dark:bg-slate-900 border-none shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-2xl shadow-inner border border-primary-200 dark:border-primary-800">
              {admin.full_name?.[0]}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{admin.full_name}</h3>
              <p className="text-sm font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-primary-500" /> 
                {admin.role?.replace(/_/g, ' ')} • ID: {admin.id.slice(0,8)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all hover:rotate-90">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="bg-slate-50/30 dark:bg-slate-800/20 px-6 py-2 border-b border-slate-100 dark:border-slate-800 flex gap-6">
           {['LOGS', 'PROFILE_DETAILS'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                 activeTab === tab 
                   ? 'border-primary-500 text-primary-600' 
                   : 'border-transparent text-slate-400 hover:text-slate-600'
               }`}
             >
               {tab.replace('_', ' ')}
             </button>
           ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'LOGS' ? (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold italic uppercase text-xs tracking-widest">Synthesizing activity trail...</p>
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((log, idx) => (
                  <div key={log.id || idx} className="flex gap-4 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all shadow-sm hover:shadow-md">
                    <div className={`mt-1 p-2.5 rounded-xl shrink-0 ${
                      log.action?.includes('CREATE') ? 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/10' :
                      log.action?.includes('UPDATE') ? 'bg-blue-100 text-blue-600 shadow-sm shadow-blue-500/10' :
                      log.action?.includes('DELETE') ? 'bg-rose-100 text-rose-600 shadow-sm shadow-rose-500/10' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-slate-800 dark:text-slate-100 uppercase text-[10px] tracking-widest">
                          {log.action?.replace(/_/g, ' ')}
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                          <Calendar className="w-3 h-3" /> {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1.5 flex items-center gap-2">
                         Impacted <span className="text-primary-600 dark:text-primary-400 font-black uppercase text-xs">{log.table_name}</span> record
                      </p>
                      {log.details && (
                          <div className="mt-3 text-[11px] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-3 rounded-xl font-mono text-slate-500 break-all leading-relaxed shadow-inner">
                              {log.details}
                          </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
                  <Activity className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No recent footprint found.</p>
              </div>
            )
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Full Access Name', value: admin.full_name },
                    { label: 'Identity Email', value: admin.email },
                    { label: 'Phone Reference', value: admin.phone || 'NO PHONE ATTACHED' },
                    { label: 'Role Authorization', value: admin.role?.replace(/_/g, ' ') },
                    { label: 'Branch Access', value: admin.branch || 'CENTRAL / ALL BRANCHES' },
                    { label: 'Verification Status', value: admin.is_verified ? 'VERIFIED IDENTITY' : 'PENDING VERIFICATION' },
                    { label: 'Account Created', value: admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
                    { label: 'Security Status', value: admin.is_blocked ? 'LOCKED / SUSPENDED' : 'ACTIVE & SECURED' }
                  ].map((item, id) => (
                    <div key={id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{item.label}</p>
                       <p className="text-sm font-bold text-slate-700 dark:text-slate-200 break-all">{item.value}</p>
                    </div>
                  ))}
               </div>
               
               <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20 flex gap-3">
                  <ExternalLink className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    This profile information is retrieved from the central official registry. Any modifications to these details must be authorized by a Super Admin or the Primary Owner.
                  </p>
               </div>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-b-3xl">
            <p className="text-xs text-slate-400 italic">Logs are immutable and system-generated</p>
            <Button onClick={onClose}>Finish Review</Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminActivityModal;
