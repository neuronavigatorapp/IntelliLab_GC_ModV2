import React from 'react';
import { Settings, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface TopbarProps {
  currentSection: string;
  lastUpdated?: Date;
  onSettingsClick?: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentSection,
  lastUpdated,
  onSettingsClick,
  className
}) => {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-white border-b border-gray-200",
      className
    )}>
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentSection}
        </h2>
        <Badge variant="outline" className="text-xs">
          Professional Tools
        </Badge>
      </div>
      
      <div className="flex items-center space-x-4">
        {lastUpdated && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="text-gray-600 hover:text-gray-900"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
