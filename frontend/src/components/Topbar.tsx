import React from 'react';
import { Settings, Clock, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface TopbarProps {
  currentSection: string;
  lastUpdated?: Date;
  onSettingsClick?: () => void;
  className?: string;
  isOnline?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentSection,
  lastUpdated,
  onSettingsClick,
  className,
  isOnline = true
}) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 bg-white border-b border-gray-200 glass-effect",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentSection}
        </h2>
        <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
          Professional Tools
        </Badge>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <div className="flex items-center space-x-1 text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="text-xs font-medium">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600">
              <WifiOff className="h-4 w-4" />
              <span className="text-xs font-medium">Backend Offline</span>
            </div>
          )}
        </div>

        {lastUpdated && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
        
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
