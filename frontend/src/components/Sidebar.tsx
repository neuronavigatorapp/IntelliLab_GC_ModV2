import React from 'react';
import { cn } from '../lib/utils';
import { navigationItems } from '../lib/routes';
import { 
  LayoutDashboard, 
  Target, 
  Thermometer, 
  Zap, 
  Microscope,
  Settings,
  Menu
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
    <div 
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            {/* IntelliLab GC Logo */}
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                {/* Chromatography-inspired logo */}
                <div className="relative w-8 h-8">
                  {/* Coiled column */}
                  <div className="absolute left-0 top-1/2 w-6 h-6 border-2 border-white/30 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute left-1 top-1/2 w-4 h-4 border-2 border-white/50 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute left-2 top-1/2 w-2 h-2 border-2 border-white rounded-full transform -translate-y-1/2"></div>
                  
                  {/* Chromatogram peaks */}
                  <div className="absolute right-0 top-1/2 w-2 h-2 bg-blue-300 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-1 top-1/2 w-2 h-2 bg-teal-300 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-2 top-1/2 w-2 h-2 bg-green-300 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-3 top-1/2 w-2 h-2 bg-orange-300 rounded-full transform -translate-y-1/2"></div>
                  
                  {/* Base line */}
                  <div className="absolute left-0 top-1/2 w-8 h-0.5 bg-gradient-to-r from-blue-300 via-teal-300 via-green-300 to-orange-300 transform -translate-y-1/2"></div>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">IntelliLab GC</h1>
              <p className="text-xs text-gray-500">Professional Platform</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center mx-auto">
            <div className="relative w-6 h-6">
              <div className="absolute left-0 top-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute left-1 top-1/2 w-2 h-2 bg-teal-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute left-2 top-1/2 w-2 h-2 bg-green-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute left-3 top-1/2 w-2 h-2 bg-orange-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute left-0 top-1/2 w-4 h-0.5 bg-gradient-to-r from-blue-400 via-teal-400 via-green-400 to-orange-400 transform -translate-y-1/2"></div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item, index) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = currentPath === item.path;
          
          return (
            <div key={item.id}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200",
                  collapsed ? "px-2" : "px-3",
                  isActive && "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg",
                  !isActive && "hover:bg-blue-50 hover:text-blue-600"
                )}
                onClick={() => onNavigate(item.path)}
              >
                <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && item.label}
              </Button>
            </div>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status</span>
            <Badge className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300 text-xs font-medium shadow-sm">
              Field Ready
            </Badge>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
