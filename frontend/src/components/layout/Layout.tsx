import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  currentSection: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentSection,
  currentPath,
  onNavigate
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        currentSection={currentSection}
        onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
          collapsed={sidebarCollapsed}
        />

        {/* Main Content */}
        <main className={cn(
          'flex-1 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64',
          'pt-16' // Account for header height
        )}>
          <div className="px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};