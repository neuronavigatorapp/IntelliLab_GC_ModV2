import React, { useState, useEffect, useRef } from 'react';
import { Settings, Clock, Menu, Search, Command, Bell, User, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface TopbarProps {
  currentSection: string;
  lastUpdated?: Date;
  onSettingsClick?: () => void;
  onMobileMenuClick?: () => void;
  onNavigate?: (path: string) => void;
  isOnline?: boolean;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentSection,
  lastUpdated,
  onSettingsClick,
  onMobileMenuClick,
  onNavigate = () => {},
  isOnline = true,
  className
}) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update API status based on isOnline prop
  useEffect(() => {
    setApiStatus(isOnline ? 'connected' : 'offline');
  }, [isOnline]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <>
      <header className={cn(
        "h-16 bg-theme-surface/90 backdrop-blur-xl border-b border-theme-primary-700/20",
        "flex items-center justify-between px-6 relative",
        className
      )}>
        {/* Accent gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-grad-primary opacity-60" />
        
        {/* Left Section */}
        <div className="flex items-center space-x-4 relative z-10">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuClick}
            aria-label="Open navigation menu"
            className={cn(
              "lg:hidden p-2 hover:bg-theme-primary-700/20 transition-colors",
              "focus:ring-2 focus:ring-theme-primary-500/20"
            )}
          >
            <Menu className="h-5 w-5 text-theme-text-muted" />
          </Button>

          {/* Logo & Section */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-grad-primary rounded-lg flex items-center justify-center shadow-glow-primary">
              <div className="w-4 h-4 bg-theme-text rounded-sm opacity-90" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-theme-text">IntelliLab GC</h1>
              <p className="text-xs text-theme-text-muted -mt-0.5 tracking-wide">
                {currentSection}
              </p>
            </div>
          </div>
        </div>

        {/* Center Section - Command Palette */}
        <div className="flex-1 max-w-md mx-8">
          <button
            onClick={() => setIsCommandOpen(true)}
            className={cn(
              "w-full flex items-center space-x-3 px-4 py-2 rounded-lg",
              "bg-theme-background/50 border border-theme-primary-700/30",
              "hover:border-theme-primary-500/50 transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-theme-primary-500/20"
            )}
          >
            <Search className="w-4 h-4 text-theme-text-muted" />
            <span className="flex-1 text-left text-theme-text-muted text-sm">
              Search or run command...
            </span>
            <div className="hidden sm:flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 text-xs bg-theme-primary-700/30 text-theme-text-muted rounded">
                ⌘
              </kbd>
              <kbd className="px-1.5 py-0.5 text-xs bg-theme-primary-700/30 text-theme-text-muted rounded">
                K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3 relative z-10">
          {/* Status Indicators */}
          <div className="hidden md:flex items-center space-x-4">
            {/* API Status */}
            <div 
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-lg border",
                "bg-theme-surface/50 backdrop-blur-sm",
                apiStatus === 'connected' 
                  ? "border-theme-accent-mint/30 bg-success-bg" 
                  : "border-error/30 bg-error-bg"
              )}
              role="status"
              aria-label={`API Status: ${apiStatus}`}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                apiStatus === 'connected' ? "bg-theme-accent-mint animate-pulse" : "bg-error"
              )} />
              <span className={cn(
                "text-xs font-medium",
                apiStatus === 'connected' ? "text-theme-accent-mint" : "text-error"
              )}>
                {apiStatus === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-theme-surface/30 rounded-lg border border-theme-primary-700/20">
                <Clock className="w-3 h-3 text-theme-text-muted" />
                <span className="text-xs text-theme-text-muted font-mono">
                  {formatLastUpdated(lastUpdated)}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-2 hover:bg-theme-primary-700/20 transition-colors",
                "focus:ring-2 focus:ring-theme-primary-500/20"
              )}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-theme-text-muted" />
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className={cn(
                "p-2 hover:bg-theme-primary-700/20 transition-colors group",
                "focus:ring-2 focus:ring-theme-primary-500/20"
              )}
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-theme-text-muted group-hover:rotate-90 transition-transform duration-200" />
            </Button>

            {/* User Profile */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-2 hover:bg-theme-primary-700/20 transition-colors",
                "focus:ring-2 focus:ring-theme-primary-500/20"
              )}
              aria-label="User profile"
            >
              <User className="w-4 h-4 text-theme-text-muted" />
            </Button>
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      {isCommandOpen && (
        <div className="fixed inset-0 bg-theme-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]">
          <div className={cn(
            "w-full max-w-lg mx-4 bg-theme-surface border border-theme-primary-700/30",
            "rounded-xl shadow-xl animate-fade-in"
          )}>
            <div className="flex items-center px-4 py-3 border-b border-theme-primary-700/20">
              <Command className="w-4 h-4 text-theme-primary-500 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type a command or search..."
                className={cn(
                  "flex-1 bg-transparent text-theme-text placeholder-theme-text-muted",
                  "focus:outline-none"
                )}
                autoFocus
              />
              <button
                onClick={() => setIsCommandOpen(false)}
                className="p-1 rounded hover:bg-theme-primary-700/20 transition-colors"
                aria-label="Close command palette"
              >
                <X className="w-4 h-4 text-theme-text-muted" />
              </button>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {/* Quick Actions */}
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-theme-text-muted uppercase tracking-wider">
                  Quick Actions
                </div>
                {[
                  { label: 'Open Troubleshooter', shortcut: '⌘⇧T', action: () => onNavigate('/ai-assistant') },
                  { label: 'Simulation Lab', shortcut: '⌘⇧S', action: () => onNavigate('/detection-limit') },
                  { label: 'Chromatography Analysis', shortcut: '⌘⇧C', action: () => onNavigate('/chromatogram-analyzer') },
                  { label: 'Settings', shortcut: '⌘,', action: () => onSettingsClick?.() },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.action();
                      setIsCommandOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg",
                      "hover:bg-theme-primary-700/20 transition-colors text-left group"
                    )}
                  >
                    <span className="text-theme-text group-hover:text-theme-primary-500 transition-colors">
                      {item.label}
                    </span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-theme-primary-700/30 text-theme-text-muted rounded">
                      {item.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};