import React from 'react';
import { Settings, Clock, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface TopbarProps {
  currentSection: string;
  lastUpdated?: Date;
  onSettingsClick?: () => void;
  onMobileMenuClick?: () => void;
  isOnline?: boolean;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentSection,
  lastUpdated,
  onSettingsClick,
  onMobileMenuClick,
  isOnline = true,
  className
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <header className={cn(
      "flex items-center justify-between px-8 py-5 relative",
      className
    )}>
      {/* Premium Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-slate-50/90 to-blue-50/95" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/20" />
      
      {/* Left: Premium Section Header */}
      <div className="flex items-center space-x-6 relative z-10">
        {/* Elite Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuClick}
          aria-label="Open mobile menu"
          className="lg:hidden p-3 hover:bg-slate-100/70 text-slate-700 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Premium Section Title */}
        <div className="flex items-center space-x-4">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/30" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-blue-800 bg-clip-text text-transparent tracking-tight">
            {currentSection}
          </h2>
        </div>
      </div>

      {/* Right: Premium Controls and Status */}
      <div className="flex items-center space-x-6 relative z-10">
        {/* Enterprise Connection Status */}
        <div 
          className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-slate-200/60 shadow-sm"
          aria-label={`Backend connection status: ${isOnline ? 'Connected' : 'Disconnected'}`}
          role="status"
        >
          <div className={cn(
            "w-3 h-3 rounded-full relative",
            isOnline ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-red-500 shadow-lg shadow-red-500/50"
          )}>
            {isOnline && (
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
            )}
          </div>
          <span className={cn(
            "text-sm font-semibold tracking-wide",
            isOnline ? "text-emerald-700" : "text-red-700"
          )}>
            {isOnline ? "CONNECTED" : "OFFLINE"}
          </span>
        </div>

        {/* Premium Last Updated */}
        {lastUpdated && (
          <div className="flex items-center space-x-3 bg-white/40 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-slate-200/40">
            <Clock className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-600 font-mono">
              {formatTime(lastUpdated)}
            </span>
          </div>
        )}

        {/* Elite Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          aria-label="Open settings"
          className="p-3 hover:bg-white/70 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md group"
        >
          <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
        </Button>
      </div>
    </header>
  );
};