import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Toasts } from '../components/Toasts';
import { cn } from '../lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  currentSection: string;
  onNavigate: (path: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentPath,
  currentSection,
  onNavigate
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastUpdated] = useState(new Date());

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <Topbar
          currentSection={currentSection}
          lastUpdated={lastUpdated}
          onSettingsClick={() => console.log('Settings clicked')}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Toasts */}
      <Toasts />
    </div>
  );
};
