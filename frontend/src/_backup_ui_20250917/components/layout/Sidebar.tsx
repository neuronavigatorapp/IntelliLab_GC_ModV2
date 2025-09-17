import React from 'react';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Target, 
  Thermometer, 
  Zap, 
  Microscope,
  Menu,
  ChevronLeft,
  Bot,
  X
} from 'lucide-react';
import { Button } from '../ui/button';

interface SidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileToggle?: (open: boolean) => void;
}

// Navigation items with icons and paths
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    id: 'detection-limit',
    label: 'Detection Limit',
    path: '/detection-limit',
    icon: Target,
  },
  {
    id: 'oven-ramp',
    label: 'Oven Ramp',
    path: '/oven-ramp',
    icon: Thermometer,
  },
  {
    id: 'inlet-simulator',
    label: 'Inlet Simulator',
    path: '/inlet-simulator',
    icon: Zap,
  },
  {
    id: 'instruments',
    label: 'Instruments',
    path: '/instruments',
    icon: Microscope,
  },
  {
    id: 'ai-assistant',
    label: 'AI Assistant',
    path: '/ai-assistant',
    icon: Bot,
    isNew: true,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath = "/dashboard",
  onNavigate = () => {},
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileToggle
}) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-white border-r border-gray-200 transition-all duration-300 shadow-sm hidden lg:flex lg:flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            {/* IntelliLab GC Logo */}
            <div className="relative w-10 h-10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                {/* Chromatography-inspired logo with coiled column and peaks */}
                <div className="relative w-6 h-6">
                  {/* Coiled column representation */}
                  <div className="absolute left-0 top-1/2 w-4 h-4 border border-white/30 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute left-1 top-1/2 w-2 h-2 border border-white/50 rounded-full transform -translate-y-1/2"></div>
                  
                  {/* Chromatogram peaks */}
                  <div className="absolute right-0 top-1/2 w-1 h-1 bg-blue-300 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-1 top-1/2 w-1 h-1 bg-teal-300 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-2 top-1/2 w-1 h-1 bg-green-300 rounded-full transform -translate-y-1/2"></div>
                  
                  {/* Base line */}
                  <div className="absolute left-0 top-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-300 via-teal-300 to-green-300 transform -translate-y-1/2"></div>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-inter">IntelliLab GC</h1>
              <p className="text-xs text-gray-500 font-inter">Professional Platform</p>
            </div>
          </div>
        )}
        
        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle?.(!collapsed)}
          className="p-1.5 hover:bg-gray-100"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200 font-inter",
                collapsed ? "px-2" : "px-3",
                isActive && "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md",
                !isActive && "hover:bg-blue-50 hover:text-blue-600 text-gray-700"
              )}
              onClick={() => onNavigate(item.path)}
            >
              <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span>{item.label}</span>
                  {item.isNew && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-medium">
                      NEW
                    </span>
                  )}
                </div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Status Strip */}
      <div className="p-3 border-t border-gray-200">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-inter">Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-700 font-medium font-inter">Field Ready</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
      </div>

      {/* Mobile Sidebar */}
      <div 
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-xl transition-transform duration-300 lg:hidden flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <div className="relative w-6 h-6">
                  <div className="absolute left-0 top-1/2 w-4 h-4 border border-white/30 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute left-1 top-1/2 w-2 h-2 border border-white/50 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-0 top-1/2 w-1 h-1 bg-blue-300 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-1 top-1/2 w-1 h-1 bg-teal-300 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute right-2 top-1/2 w-1 h-1 bg-green-300 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute left-0 top-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-300 via-teal-300 to-green-300 transform -translate-y-1/2"></div>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-inter">IntelliLab GC</h1>
              <p className="text-xs text-gray-500 font-inter">Professional Platform</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMobileToggle?.(false)}
            className="p-1.5 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200 font-inter px-3",
                  isActive && "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md",
                  !isActive && "hover:bg-blue-50 hover:text-blue-600 text-gray-700"
                )}
                onClick={() => {
                  onNavigate(item.path);
                  onMobileToggle?.(false);
                }}
              >
                <Icon className="h-5 w-5 mr-3" />
                <div className="flex items-center justify-between w-full">
                  <span>{item.label}</span>
                  {item.isNew && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full font-medium">
                      NEW
                    </span>
                  )}
                </div>
              </Button>
            );
          })}
        </nav>

        {/* Mobile Status Strip */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 font-inter">Status</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-700 font-medium font-inter">Field Ready</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};