import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { navigationSections } from '../lib/routes';
import { 
  LayoutDashboard, 
  Target, 
  Thermometer, 
  Zap, 
  Microscope,
  Settings,
  Menu,
  Eye,
  User,
  Calculator,
  Brain,
  Wrench,
  TrendingDown,
  BarChart3,
  GitCompare,
  Activity,
  FileText,
  ChevronDown,
  ChevronRight,
  Bot,
  Beaker,
  PlayCircle,
  CheckCircle,
  Package
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
  Eye,
  User,
  Calculator,
  Brain,
  Wrench,
  TrendingDown,
  BarChart3,
  GitCompare,
  Activity,
  FileText,
  Bot,
  Settings,
  Beaker,
  PlayCircle,
  CheckCircle,
  Package,
};

export const EnhancedSidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed = false,
  onToggleCollapse
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['main', 'ai-assistant']);

  const toggleSection = (sectionId: string) => {
    if (collapsed) return;
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case 'main': return <LayoutDashboard className="h-4 w-4" />;
      case 'ai-assistant': return <Brain className="h-4 w-4" />;
      case 'analysis-tools': return <Eye className="h-4 w-4" />;
      case 'calculators': return <Calculator className="h-4 w-4" />;
      case 'simulation': return <BarChart3 className="h-4 w-4" />;
      case 'management': return <Settings className="h-4 w-4" />;
      case 'utilities': return <Wrench className="h-4 w-4" />;
      case 'demo': return <Zap className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 z-50 h-full transition-all duration-500 ease-out shadow-enterprise-xl hidden lg:flex lg:flex-col backdrop-dark-premium",
        collapsed ? "w-16" : "w-80"
      )}
      style={{
        background: 'linear-gradient(180deg, rgba(24, 31, 36, 0.98) 0%, rgba(24, 31, 36, 0.95) 50%, rgba(24, 31, 36, 0.97) 100%)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderRight: '1px solid rgba(91, 140, 146, 0.15)'
      }}
    >
      {/* Ultra-Premium Header */}
      <div 
        className="flex items-center justify-between p-6 border-b border-theme-border/20 relative"
        style={{
          background: 'linear-gradient(135deg, rgba(24, 31, 36, 0.9) 0%, rgba(24, 31, 36, 0.8) 100%)',
          borderImageSource: 'linear-gradient(90deg, transparent, rgba(91, 140, 146, 0.2), transparent)',
          borderImageSlice: 1
        }}
      >
        {/* Subtle header glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-theme-primary-500/5 via-theme-accent-mint/5 to-theme-primary-500/5" />
        {!collapsed && (
          <div className="flex items-center space-x-4 relative z-10">
            {/* Ultra-Premium IntelliLab GC Logo */}
            <div className="relative w-14 h-14">
              <div className="w-14 h-14 bg-grad-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-theme-primary-500/30 ring-2 ring-theme-primary-500/30 backdrop-blur-sm border border-white/10">
                {/* Advanced Chromatography Logo */}
                <div className="relative w-10 h-10">
                  {/* Premium Coiled Column Design */}
                  <div className="absolute left-0 top-1/2 w-7 h-7 border-2 border-white/40 rounded-full transform -translate-y-1/2 animate-pulse"></div>
                  <div className="absolute left-1 top-1/2 w-5 h-5 border-2 border-white/60 rounded-full transform -translate-y-1/2"></div>
                  <div className="absolute left-2 top-1/2 w-3 h-3 border-2 border-white/90 rounded-full transform -translate-y-1/2"></div>
                  
                  {/* Advanced Chromatogram Peaks */}
                  <div className="absolute right-0 top-1/2 w-2.5 h-2.5 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full transform -translate-y-1/2 shadow-lg"></div>
                  <div className="absolute right-1 top-1/2 w-2.5 h-2.5 bg-gradient-to-br from-emerald-300 to-teal-400 rounded-full transform -translate-y-1/2 shadow-lg"></div>
                  <div className="absolute right-2 top-1/2 w-2.5 h-2.5 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full transform -translate-y-1/2 shadow-lg"></div>
                  <div className="absolute right-3 top-1/2 w-2.5 h-2.5 bg-gradient-to-br from-orange-300 to-red-400 rounded-full transform -translate-y-1/2 shadow-lg"></div>
                  
                  {/* Premium Spectrum Line */}
                  <div className="absolute left-0 top-1/2 w-9 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 via-yellow-400 to-orange-400 transform -translate-y-1/2 rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-theme-text via-theme-accent-mint to-theme-text bg-clip-text text-transparent drop-shadow-lg">
                IntelliLab GC
              </h1>
              <p className="text-sm text-theme-primary-300/90 font-medium tracking-wide">
                Enterprise Analytics Platform
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-12 h-12 bg-grad-primary rounded-xl flex items-center justify-center mx-auto shadow-xl shadow-theme-primary-500/30 ring-2 ring-theme-primary-500/20 backdrop-blur-sm border border-white/10 relative z-10">
            <Brain className="h-6 w-6 text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Ultra-Premium Navigation */}
      <nav className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-theme-border/50 scrollbar-track-transparent relative">
        {/* Navigation gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-theme-surface/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
        {navigationSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const hasActiveItem = section.items.some(item => currentPath === item.path);
          
          return (
            <div key={section.id} className="space-y-3">
              {/* Premium Section Header */}
              {!collapsed && (
                <Button
                  variant="ghost"
                  aria-label={`Toggle ${section.label} section`}
                  className={cn(
                    "w-full justify-between text-sm font-semibold transition-all duration-300 px-3 py-2.5 h-auto rounded-xl group",
                    hasActiveItem 
                      ? "text-blue-300 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 shadow-lg shadow-blue-500/10" 
                      : "text-theme-text-muted hover:text-theme-text hover:bg-gradient-to-r hover:from-theme-surface/50 hover:to-theme-surface/40 border border-transparent"
                  )}
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "transition-transform duration-300",
                      hasActiveItem && "text-blue-400 drop-shadow-lg"
                    )}>
                      {getSectionIcon(section.id)}
                    </div>
                    <span className="uppercase tracking-widest text-xs font-bold">{section.label}</span>
                  </div>
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </Button>
              )}

              {/* Premium Section Items */}
              {(collapsed || isExpanded) && (
                <div className={cn("space-y-1.5", !collapsed && "ml-3 pl-3 border-l border-theme-border/30")}>
                  {section.items.map((item) => {
                    const Icon = iconMap[item.icon as keyof typeof iconMap];
                    const isActive = currentPath === item.path;
                    
                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start transition-all duration-300 h-11 group relative overflow-hidden",
                          collapsed ? "px-2" : "px-4",
                          isActive 
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25 border border-blue-400/50" 
                            : "text-theme-text-muted hover:text-theme-text hover:bg-gradient-to-r hover:from-theme-surface/60 hover:to-theme-surface/50 border border-transparent hover:border-theme-border/30",
                          collapsed && "justify-center rounded-xl"
                        )}
                        onClick={() => onNavigate(item.path)}
                      >
                        {/* Premium Active Indicator */}
                        {isActive && !collapsed && (
                          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-400 shadow-lg shadow-blue-400/50" />
                        )}
                        
                        <div className={cn(
                          "transition-all duration-300",
                          isActive && "drop-shadow-lg scale-110"
                        )}>
                          <Icon className={cn("h-5 w-5", !collapsed && "mr-4")} />
                        </div>
                        
                        {!collapsed && (
                          <span className="text-sm font-medium tracking-wide">{item.label}</span>
                        )}
                        
                        {/* Premium collapsed active indicator */}
                        {collapsed && isActive && (
                          <div className="absolute -right-1 top-1/2 w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full transform -translate-y-1/2 shadow-lg" />
                        )}
                        
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Premium Divider */}
              {!collapsed && section.id !== 'demo' && (
                <div className="h-px bg-gradient-to-r from-transparent via-theme-border/40 to-transparent mx-4 my-4" />
              )}
            </div>
          );
        })}
        </div>
      </nav>

      {/* Ultra-Premium AI Status & Controls */}
      <div 
        className="p-6 border-t space-y-4 relative"
        style={{
          borderTopColor: 'rgba(91, 140, 146, 0.15)',
          background: 'linear-gradient(135deg, rgba(24, 31, 36, 0.95) 0%, rgba(24, 31, 36, 0.9) 100%)'
        }}
      >
        {/* Status glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-theme-primary-500/3 via-transparent to-transparent" />
        {!collapsed && (
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-theme-text tracking-wide">AI Analytics</span>
              <Badge className="bg-gradient-to-r from-emerald-500/25 to-green-500/25 text-emerald-300 border-emerald-400/40 text-xs font-bold shadow-lg shadow-emerald-500/20 px-3 py-1 backdrop-blur-sm">
                ACTIVE
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-theme-text-muted font-medium tracking-wider uppercase">Enterprise Engines</span>
              <div className="flex gap-2">
                <div className="status-light bg-emerald-400 shadow-lg shadow-emerald-500/40" />
                <div className="status-light bg-cyan-400 shadow-lg shadow-blue-500/40" />
                <div className="status-light bg-purple-400 shadow-lg shadow-purple-500/40" />
              </div>
            </div>
            <div className="glass-card p-3 text-xs text-theme-text-muted font-mono tracking-wider">
              <div className="flex items-center justify-between">
                <span>v2.1.0 Enterprise</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center space-y-4 relative z-10">
            <div className="relative">
              <div className="status-light bg-emerald-400 shadow-lg shadow-emerald-500/50" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full animate-pulse shadow-lg" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              aria-label="Toggle sidebar"
              className="p-2 h-10 w-10 rounded-xl hover:bg-theme-surface/50 transition-all duration-300 group glass-card"
            >
              <Menu className="h-5 w-5 text-theme-text-muted group-hover:text-theme-text transition-colors drop-shadow-lg" />
            </Button>
          </div>
        )}
        {!collapsed && onToggleCollapse && (
          <div className="relative z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              aria-label="Toggle sidebar"
              className="w-full justify-start px-4 h-11 rounded-xl hover:bg-theme-surface/50 transition-all duration-300 group text-theme-text-muted hover:text-theme-text glass-card"
            >
              <Menu className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform drop-shadow-lg" />
              <span className="text-sm font-medium tracking-wide">Collapse Menu</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};