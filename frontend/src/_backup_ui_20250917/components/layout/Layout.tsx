import React, { useState, useEffect } from 'react';
import { 
  Search, Settings, Menu, X, ChevronLeft, ChevronRight, Bell, Command,
  LayoutDashboard, Microscope, FileText, Activity, Target, BarChart3,
  Brain, Wrench, TrendingDown, Bot, Eye, GitCompare, Thermometer,
  Zap, Calculator, User, Home, BookOpen, AlertCircle, HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  currentSection?: string;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

// Navigation items following the new structure
const navigationItems = [
  { id: 'home', label: 'Home', path: '/', icon: Home },
  { id: 'studio', label: 'Studio', path: '/chromatogram-analyzer', icon: Eye },
  { id: 'troubleshooter', label: 'Troubleshooter', path: '/ai-assistant', icon: Bot },
  { id: 'simulators', label: 'Simulators', path: '/detection-limit', icon: Calculator, 
    submenu: [
      { id: 'detection-limit', label: 'Detection Limit', path: '/detection-limit', icon: Target },
      { id: 'oven-ramp', label: 'Oven Ramp', path: '/oven-ramp', icon: Thermometer },
      { id: 'inlet-simulator', label: 'Inlet', path: '/inlet-simulator', icon: Zap },
    ]
  },
  { id: 'ocr', label: 'OCR', path: '/batch-analyzer', icon: Eye },
  { id: 'knowledge', label: 'Knowledge', path: '/ai-dashboard', icon: BookOpen },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
  { id: 'validity', label: 'About / Validity', path: '/about-validity', icon: AlertCircle },
];

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentSection = "Home",
  currentPath = "/",
  onNavigate = () => {}
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Auto-collapse sidebar on medium screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
        setSidebarOpen(false);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      // Escape to close panels
      if (e.key === 'Escape') {
        setInsightsOpen(false);
        setCommandPaletteOpen(false);
      }
      // Alt + I for insights
      if (e.altKey && e.key === 'i') {
        e.preventDefault();
        setInsightsOpen(!insightsOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [insightsOpen, commandPaletteOpen]);

  // Check API connectivity
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (path: string) => {
    onNavigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-theme-surface border-b border-theme-border backdrop-blur-xl bg-opacity-95">
        <div className="flex items-center h-full px-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-theme-surface-2 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo/Title */}
          <div className="flex items-center space-x-3 lg:ml-0 ml-2">
            <div className="w-8 h-8 rounded-lg bg-grad-primary flex items-center justify-center">
              <Microscope className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-theme-text">IntelliLab GC</h1>
              <div className="text-xs text-theme-muted">Professional Edition</div>
            </div>
          </div>

          {/* Environment Badge */}
          <div className="ml-auto flex items-center space-x-4">
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              isOnline 
                ? "bg-success-bg text-success border border-success-border"
                : "bg-error-bg text-error border border-error-border"
            )}>
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {/* Command palette hint */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-theme-surface-2 hover:bg-theme-border transition-colors rounded-lg text-sm text-theme-muted"
            >
              <Command className="w-4 h-4" />
              <span>⌘K</span>
            </button>

            {/* Insights toggle */}
            <button
              onClick={() => setInsightsOpen(!insightsOpen)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                insightsOpen 
                  ? "bg-theme-primary-500 text-white" 
                  : "hover:bg-theme-surface-2 text-theme-muted"
              )}
              aria-label="Toggle insights panel"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Left Navigation */}
      <nav className={cn(
        "fixed left-0 top-16 bottom-0 z-40 bg-theme-surface border-r border-theme-border transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64",
        "hidden lg:block"
      )}>
        <div className="flex flex-col h-full">
          {/* Collapse toggle */}
          <div className="p-4 border-b border-theme-border">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 hover:bg-theme-surface-2 rounded-lg transition-colors"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation items */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              
              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                      isActive 
                        ? "bg-theme-primary-500 text-white" 
                        : "app-nav-item hover:bg-theme-surface-2"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                  
                  {/* Submenu for simulators */}
                  {!sidebarCollapsed && item.submenu && isActive && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = currentPath === subItem.path;
                        
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleNavigation(subItem.path)}
                            className={cn(
                              "w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors text-left",
                              isSubActive 
                                ? "text-theme-primary-500 bg-theme-surface-2" 
                                : "text-theme-muted hover:text-theme-text hover:bg-theme-surface-2"
                            )}
                          >
                            <SubIcon className="w-4 h-4" />
                            <span>{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <nav className="fixed left-0 top-0 bottom-0 w-64 bg-theme-surface z-40 lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-theme-border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-grad-primary flex items-center justify-center">
                  <Microscope className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-theme-text">IntelliLab GC</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-theme-surface-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                      isActive 
                        ? "bg-theme-primary-500 text-white" 
                        : "app-nav-item hover:bg-theme-surface-2"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}

      {/* Main Content */}
      <main className={cn(
        "pt-16 transition-all duration-300",
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="app-card p-6 min-h-[calc(100vh-8rem)]">
            {children}
          </div>
        </div>
      </main>

      {/* Right Insight Drawer */}
      {insightsOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setInsightsOpen(false)}
          />
          <div className="fixed right-0 top-16 bottom-0 w-80 bg-theme-surface border-l border-theme-border z-50 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-theme-text">Insights & Context</h3>
                <button
                  onClick={() => setInsightsOpen(false)}
                  className="p-2 hover:bg-theme-surface-2 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-theme-surface-2 rounded-lg">
                  <h4 className="text-sm font-medium text-theme-text mb-2">Recent Activity</h4>
                  <p className="text-sm text-theme-muted">No recent activity to display.</p>
                </div>
                
                <div className="p-3 bg-theme-surface-2 rounded-lg">
                  <h4 className="text-sm font-medium text-theme-text mb-2">Citations</h4>
                  <p className="text-sm text-theme-muted">Context citations will appear here.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Command Palette */}
      {commandPaletteOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setCommandPaletteOpen(false)}
          />
          <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-theme-surface border border-theme-border rounded-lg shadow-xl z-50">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Search className="w-5 h-5 text-theme-muted" />
                <input
                  type="text"
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent border-none outline-none text-theme-text placeholder-theme-muted"
                  autoFocus
                />
              </div>
              
              <div className="space-y-1">
                {navigationItems.slice(0, 5).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleNavigation(item.path);
                        setCommandPaletteOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-theme-surface-2 rounded-lg transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-theme-muted" />
                      <span className="text-theme-text">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};