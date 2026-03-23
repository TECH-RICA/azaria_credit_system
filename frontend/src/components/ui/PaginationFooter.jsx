import React from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const PaginationFooter = ({
  hasMore,
  canShowLess,
  onShowMore,
  onShowLess,
  isFetching,
  totalCount,
  currentCount,
}) => {
  if (!hasMore && !canShowLess) return null;

  return (
    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-slate-400 font-medium whitespace-nowrap">
        Showing {currentCount} of {totalCount} records
      </p>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
        {canShowLess && (
          <button
            onClick={onShowLess}
            disabled={isFetching}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            Show Less
          </button>
        )}
        {hasMore && (
          <button
            onClick={onShowMore}
            disabled={isFetching}
            className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all disabled:opacity-50"
          >
            {isFetching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            {isFetching ? 'Loading...' : 'Show More (+10)'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaginationFooter;