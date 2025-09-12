import React from 'react';
import { cn } from '../lib/utils';
import { navigationItems } from '../lib/routes';
import { 
  LayoutDashboard, 
  Target, 
  Thermometer, 
  Zap, 
  Microscope,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const iconMap = {
  LayoutDashboard,
  Target,
  Thermometer,
  Zap,
  Microscope,
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed = false,
  onToggleCollapse
}) => {
  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IL</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">IntelliLab GC</h1>
              <p className="text-xs text-gray-500">Professional Platform</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">IL</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = currentPath === item.path;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                collapsed ? "px-2" : "px-3",
                isActive && "bg-brand-primary text-white hover:bg-brand-primary/90"
              )}
              onClick={() => onNavigate(item.path)}
            >
              <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && item.label}
            </Button>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <Badge variant="success" className="text-xs">
              Field Ready
            </Badge>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <Badge variant="success" className="w-3 h-3 p-0 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
