import React, { useState, useEffect } from 'react';

import { EnhancedSidebar } from '../EnhancedSidebar';
import { Topbar } from './Topbar';
import { SettingsModal } from '../SettingsModal';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  currentSection?: string;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentSection = "Dashboard",
  currentPath = "/dashboard",
  onNavigate = () => {}
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto-collapse sidebar on medium screens
  useEffect(() => {
    const handleResize = () => {
      const isMediumScreen = window.innerWidth >= 768 && window.innerWidth < 1280;
      if (isMediumScreen) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 1280) {
        setSidebarCollapsed(false);
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Backend connectivity check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('http://localhost:8000/health', { 
          method: 'GET',
          signal: controller.signal
        }).catch(() => null);
        
        clearTimeout(timeoutId);
        
        setIsOnline(response?.ok ?? false);
        setLastUpdated(new Date());
      } catch {
        setIsOnline(false);
      }
    };

    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden dark">
      {/* IntelliLab GC Professional Dark Background System */}
      <div className="fixed inset-0 bg-intellilab-gradient" />
      <div className="fixed inset-0 bg-gradient-to-tr from-slate-800/20 via-transparent to-slate-600/10 pointer-events-none" />
      
      {/* Subtle Scientific Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="w-full h-full" 
             style={{
               backgroundImage: `
                 linear-gradient(rgba(20, 184, 166, 0.3) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(20, 184, 166, 0.3) 1px, transparent 1px)
               `,
               backgroundSize: '40px 40px'
             }} 
        />
      </div>
      
      {/* Professional Ambient Teal/Cyan Lighting */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/8 to-cyan-400/6 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-400/6 to-teal-500/8 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '3s' }} />
      
      {/* Sidebar */}
      <nav role="navigation" aria-label="Main navigation" className="relative z-20">
        <EnhancedSidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </nav>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-out relative z-10",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-80"
      )}>
        {/* Professional Dark Top Bar */}
        <header role="banner" className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 shadow-lg relative">
          {/* Subtle teal accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
          <div className="relative z-10">
            <Topbar
              currentSection={currentSection}
              lastUpdated={lastUpdated}
              onSettingsClick={handleSettingsClick}
              onMobileMenuClick={() => setSidebarOpen(true)}
              isOnline={isOnline}
            />
          </div>
        </header>

        {/* Enterprise Main Content */}
        <main role="main" className="flex-1 overflow-hidden relative">
          <div className="h-full overflow-auto">
            {/* Modern Content Container */}
            <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
              <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl min-h-[calc(100vh-8rem)] p-6 lg:p-8 relative overflow-hidden">
                {/* Subtle Inner Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/[0.02] via-transparent to-cyan-400/[0.02] rounded-2xl pointer-events-none" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-700/30 pointer-events-none" />
                
                {/* Content Container */}
                <div className="relative z-10 h-full">
                  {children}
                </div>
              </div>
              
              {/* Footer Space */}
              <div className="h-6" />
            </div>
          </div>
        </main>
      </div>

      {/* Professional Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
      />
      
      {/* Professional Connection Status Overlay */}
      {!isOnline && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center max-w-md mx-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-glow-red">
              <div className="w-8 h-8 border-2 border-white rounded-full border-t-transparent animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Connection Lost</h3>
            <p className="text-slate-300">
              Attempting to reconnect to analytical systems...
            </p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};