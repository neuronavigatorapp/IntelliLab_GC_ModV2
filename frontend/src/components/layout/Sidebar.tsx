import React from 'react';
import { cn } from '../../lib/utils';
import { 
  Home, 
  Microscope, 
  TestTube, 
  Bot, 
  Eye, 
  Calculator,
  BarChart3,
  Settings,
  ChevronRight,
  Beaker,
  Clock,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'home', label: 'Home', path: '/', icon: Home },
      { id: 'sandbox', label: 'Sandbox', path: '/sandbox', icon: TestTube },
      { id: 'troubleshooter', label: 'Troubleshooter', path: '/troubleshooter', icon: Bot },
    ]
  },
  {
    id: 'calculations',
    label: 'Professional Calculations',
    items: [
      { id: 'split-ratio', label: 'Split Ratio', path: '/tools/split-ratio', icon: Calculator },
      { id: 'void-volume', label: 'Void Volume', path: '/tools/void-volume', icon: Beaker },
      { id: 'peak-capacity', label: 'Peak Capacity', path: '/tools/peak-capacity', icon: TrendingUp },
      { id: 'backflush-timing', label: 'Backflush Timing', path: '/tools/backflush-timing', icon: Clock },
    ]
  },
  {
    id: 'simulators',
    label: 'Simulators',
    items: [
      { id: 'chromatogram', label: 'Chromatogram', path: '/tools/chromatogram', icon: BarChart3 },
      { id: 'detection-limit', label: 'Detection Limit', path: '/simulators/detection-limit', icon: Calculator },
    ]
  },
  {
    id: 'analysis',
    label: 'Analysis',
    items: [
      { id: 'ocr', label: 'OCR Vision', path: '/analysis/ocr', icon: Eye },
      { id: 'analytics', label: 'Analytics', path: '/analytics', icon: BarChart3 },
    ]
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'validity', label: 'Validity', path: '/validity', icon: Microscope },
      { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed
}) => {
  const isActive = (path: string) => currentPath === path;

  return (
    <aside className={cn(
      'fixed left-0 top-16 bottom-0 bg-surface-elevated border-r border-border',
      'transition-all duration-300 z-40',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto py-4">
          {navigationSections.map((section) => (
            <div key={section.id} className="mb-6">
              {!collapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  {section.label}
                </h3>
              )}
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.path)}
                      className={cn(
                        'w-full flex items-center px-4 py-2 text-sm font-medium transition-all duration-200',
                        'hover:bg-surface-hover group',
                        active && 'bg-accent-50 text-accent-600 border-r-2 border-accent-500',
                        !active && 'text-text-secondary hover:text-text-primary'
                      )}
                    >
                      <Icon 
                        size={18} 
                        className={cn(
                          'flex-shrink-0 transition-colors duration-200',
                          active && 'text-accent-500',
                          collapsed ? 'mr-0' : 'mr-3'
                        )} 
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs bg-accent-100 text-accent-700 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          {active && (
                            <ChevronRight size={14} className="text-accent-500" />
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="text-xs text-text-tertiary">
              <p className="font-medium">IntelliLab GC v2.0</p>
              <p>Professional Edition</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};