import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Menu, Bell, User, Settings, Wifi, WifiOff } from 'lucide-react';
import { useApiStatus } from '../../hooks/useApiStatus';

interface HeaderProps {
  currentSection: string;
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onMenuToggle,
  sidebarCollapsed
}) => {
  const { status } = useApiStatus();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-elevated border-b border-border">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="p-2"
          >
            <Menu size={20} />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IL</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                IntelliLab GC
              </h1>
              <p className="text-xs text-text-secondary -mt-1">
                {currentSection}
              </p>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* API Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-md bg-surface-sunken">
            {status.isConnected ? (
              <Wifi size={16} className="text-status-success" />
            ) : (
              <WifiOff size={16} className="text-status-error" />
            )}
            <Badge 
              variant={status.isConnected ? "success" : "error"}
              className="text-xs"
            >
              {status.isLoading ? 'Checking...' : 
               status.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <Button variant="ghost" size="sm" className="p-2">
            <Bell size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <User size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
};