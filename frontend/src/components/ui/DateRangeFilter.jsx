import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  subDays, 
  format, 
  isSameDay, 
  startOfDay,
  endOfDay
} from 'date-fns';

const DateRangeFilter = ({ value = { from: '', to: '' }, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const today = new Date();

  const presets = [
    { label: 'All Time', range: { from: '', to: '' } },
    { label: 'Today', range: { from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } },
    { label: 'Yesterday', range: { from: format(subDays(today, 1), 'yyyy-MM-dd'), to: format(subDays(today, 1), 'yyyy-MM-dd') } },
    { label: 'This Week', range: { from: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } },
    { label: 'Last 7 Days', range: { from: format(subDays(today, 7), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } },
    { label: 'This Month', range: { from: format(startOfMonth(today), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } },
    { label: 'Last 30 Days', range: { from: format(subDays(today, 30), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } },
    { label: 'Last 3 Months', range: { from: format(subDays(today, 90), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } },
    { label: 'This Year', range: { from: format(startOfYear(today), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') } },
    { label: 'Custom Range', range: 'custom' },
  ];

  const getLabel = () => {
    if (!value.from && !value.to) return 'All Time';
    
    // Check if it matches a preset (except custom)
    const activePreset = presets.find(p => 
      p.range !== 'custom' && 
      p.range.from === value.from && 
      p.range.to === value.to
    );
    
    if (activePreset) return activePreset.label;
    
    // Formatting custom or non-preset range
    const fromStr = value.from ? format(new Date(value.from), 'dd MMM') : '';
    const toStr = value.to ? format(new Date(value.to), 'dd MMM yyyy') : '';
    return fromStr && toStr ? `${fromStr} – ${toStr}` : 'All Time';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset) => {
    if (preset.range === 'custom') {
      // Don't close, keep open for custom inputs
      return;
    }
    onChange(preset.range);
    setIsOpen(false);
  };

  const isPresetActive = (preset) => {
    if (preset.range === 'custom') {
      return presets.filter(p => p.range !== 'custom').every(p => 
        p.range.from !== value.from || 
        p.range.to !== value.to
      ) && (value.from || value.to);
    }
    return preset.range.from === value.from && preset.range.to === value.to;
  };

  // Improved check for active preset to avoid reference issues
  const currentActivePreset = presets.find(p => 
    p.range !== 'custom' && 
    p.range.from === value.from && 
    p.range.to === value.to
  ) || ( (value.from || value.to) ? presets.find(p => p.range === 'custom') : presets[0] );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all min-w-[140px]"
      >
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="truncate">{getLabel()}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {presets.map((preset, idx) => {
              const isActive = currentActivePreset.label === preset.label;
              return (
                <div key={idx}>
                  <button
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                      isActive 
                        ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 font-bold' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {preset.label}
                    {isActive && <Check className="w-4 h-4" />}
                  </button>
                  
                  {preset.range === 'custom' && isActive && (
                    <div className="px-3 py-3 space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg mt-1 mx-1 border border-slate-100 dark:border-slate-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-slate-400">From</label>
                          <input
                            type="date"
                            value={value.from}
                            onChange={(e) => onChange({ ...value, from: e.target.value })}
                            className="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-slate-400">To</label>
                          <input
                            type="date"
                            value={value.to}
                            onChange={(e) => onChange({ ...value, to: e.target.value })}
                            className="w-full text-xs p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-full py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors"
                      >
                        Apply Range
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;