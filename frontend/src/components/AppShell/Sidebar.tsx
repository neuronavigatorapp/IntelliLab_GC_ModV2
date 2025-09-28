import React, { useState, useEffect } from 'react';
import { 
  Home, TestTube, Bot, Target, Thermometer, Beaker, Calculator, 
  LineChart, Eye, Microscope, Circle, BarChart, Timer, Brain, 
  Filter, Flame, Activity, Zap, Settings, Radio, Server, History, 
  TrendingUp, ScanLine, ShieldCheck, Cog, Menu, X
} from 'lucide-react';
import { navigationConfig, NavItem, NavSection } from '../../config/nav';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  'home': Home,
  'test-tube': TestTube,
  'bot': Bot,
  'target': Target,
  'thermometer': Thermometer,
  'flask': Beaker,
  'calculator': Calculator,
  'line-chart': LineChart,
  'eye': Eye,
  'microscope': Microscope,
  'circle': Circle,
  'bar-chart': BarChart,
  'timer': Timer,
  'brain': Brain,
  'filter': Filter,
  'flame': Flame,
  'activity': Activity,
  'zap': Zap,
  'settings': Settings,
  'radio': Radio,
  'server': Server,
  'history': History,
  'trending-up': TrendingUp,
  'scan': ScanLine,
  'shield-check': ShieldCheck,
  'cog': Cog,
  'menu': Menu,
  'x': X
};

const getIcon = (iconName: string) => {
  return iconMap[iconName] || Calculator;
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isMobile,
  isOpen,
  onClose
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const handleNavigation = (path: string) => {
    onNavigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  const isItemActive = (item: NavItem) => {
    return currentPath === item.path;
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = getIcon(item.icon);
    const isActive = isItemActive(item);

    return (
      <button
        key={item.id}
        onClick={() => handleNavigation(item.path)}
        className={`nav-item ${isActive ? 'active' : ''}`}
        title={item.description}
      >
        <Icon className="nav-icon" size={20} />
        <span className="flex-1 text-left text-sm font-medium">
          {item.label}
        </span>
        {item.endpoint && (
          <span className="text-xs px-2 py-1 bg-brand-500/10 text-brand-600 rounded-full">
            API
          </span>
        )}
      </button>
    );
  };

  const renderNavSection = (section: NavSection) => {
    const isCollapsed = collapsedSections.has(section.id);
    const hasActiveItem = section.items.some(item => isItemActive(item));

    return (
      <div key={section.id} className="nav-section">
        <button
          onClick={() => toggleSection(section.id)}
          className={`nav-section-title w-full flex items-center justify-between hover:text-brand-600 transition-colors ${
            hasActiveItem ? 'text-brand-700' : ''
          }`}
        >
          <span>{section.title}</span>
          <span className={`transform transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
            ▶
          </span>
        </button>
        {!isCollapsed && (
          <div className="space-y-1">
            {section.items.map(renderNavItem)}
          </div>
        )}
      </div>
    );
  };

  const sidebarClasses = `
    sidebar
    ${isMobile ? (isOpen ? 'open' : '') : ''}
    transition-transform duration-300 ease-in-out
  `.trim();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text">Navigation</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Navigation Sections */}
          <div className="flex-1 overflow-y-auto py-4" data-testid="sidebar-nav">
            {navigationConfig.map(renderNavSection)}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted">
              <p className="font-medium">IntelliLab GC v2.0</p>
              <p>Blue Lab Edition</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};