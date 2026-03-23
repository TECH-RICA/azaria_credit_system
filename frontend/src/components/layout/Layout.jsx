import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown, ArrowLeft, Eye, ShieldAlert, Zap } from 'lucide-react';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Layout = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const { user, activeRole, godModeActing, activateActMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isInGodMode = user?.is_owner && activeRole !== user?.role;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isSidebarOpen ? "xl:pl-64" : "pl-0"
      )}>
        <Navbar 
          title={title} 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
        />
        
        {/* God Mode Persistent Banner */}
        {isInGodMode && (
          <div className={cn(
            "border-b px-4 lg:px-6 py-2.5 flex items-center justify-between flex-shrink-0 sticky top-16 z-30 transition-colors duration-300",
            godModeActing 
              ? "bg-amber-600 border-amber-500 text-white shadow-lg" 
              : "bg-blue-600 border-blue-500 text-white shadow-md"
          )}>
            <div className="flex items-center gap-4">
              <div className="p-1.5 bg-white/20 rounded-lg">
                {godModeActing ? <ShieldAlert className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {godModeActing ? "ACTING AS" : "OBSERVING AS"} {activeRole?.replace(/_/g, ' ')}
                  </span>
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  <span className="text-[10px] font-bold opacity-80">
                    {godModeActing ? "MASKED SESSION ACTIVE" : "PREVIEW MODE (READ-ONLY)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!godModeActing && (
                <button
                  onClick={activateActMode}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  Enable Actions
                </button>
              )}
              <button
                onClick={() => navigate('/owner/dashboard')}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg transition-all border border-white/10"
              >
                <ArrowLeft className="w-3 h-3 text-white" />
                Exit God Mode
              </button>
            </div>
          </div>
        )}

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
