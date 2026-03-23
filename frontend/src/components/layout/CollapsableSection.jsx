import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const CollapsableSection = ({ icon: Icon, label, links, setSidebarOpen, activeClass, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-1 rounded-md transition-colors", open ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200")}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          {label}
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 opacity-60", open && "rotate-180")} />
      </button>
      {open && (
        <div className="ml-5 mt-1 space-y-0.5 border-l border-slate-200 dark:border-slate-800 pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
          {links.map(link => (
            <NavLink 
              key={link.to} 
              to={link.to} 
              onClick={() => {
                if (setSidebarOpen) setSidebarOpen(false);
              }}
              className={({ isActive }) => cn(
                "flex items-center px-4 py-2 text-xs font-bold rounded-lg transition-all border border-transparent",
                isActive 
                  ? "bg-primary-50 text-primary-600 border-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-900/30" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/30"
              )}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <link.icon className="w-3.5 h-3.5 mr-2.5 opacity-70" />
                  {link.label}
                </div>
                {link.threatBadge && (
                   <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollapsableSection;
