import React from 'react';
import { X, Building2, ShieldCheck, MapPin } from 'lucide-react';

const BranchSelectorModal = ({ isOpen, onClose, branches, role, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-primary-50/50 dark:bg-primary-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Select Branch</h2>
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">Acting as {role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-medium">
            Please choose a branch to assign your session to. All actions taken while acting as a {role?.toLowerCase()?.replace('_', ' ')} will be associated with this branch.
          </p>
          
          <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => onSelect(branch)}
                className="group flex items-center gap-4 p-4 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-600/20 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:border-primary-400 overflow-hidden">
                   <MapPin className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-white transition-colors">
                    {branch.name}
                  </h3>
                  {branch.location && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-primary-100 truncate transition-colors">
                        {branch.location}
                    </p>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                   <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
                Identity Masking Active for this session
            </p>
        </div>
      </div>
    </div>
  );
};

export default BranchSelectorModal;
