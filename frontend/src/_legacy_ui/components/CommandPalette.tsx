import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Brain, 
  Eye, 
  BarChart3, 
  Calculator, 
  Settings, 
  Zap,
  FileText,
  Home,
  ArrowRight,
  Command
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  category: 'navigation' | 'actions' | 'tools' | 'settings';
}

interface CommandPaletteProps {
  onNavigate?: (path: string) => void;
  onToggleDemo?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  onNavigate = () => {},
  onToggleDemo = () => {},
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandAction[] = [
    {
      id: 'home',
      title: 'Go to Dashboard',
      subtitle: 'Return to home overview',
      icon: <Home className="h-4 w-4" />,
      action: () => onNavigate('/'),
      category: 'navigation'
    },
    {
      id: 'studio',
      title: 'Open Chromatogram Studio',
      subtitle: 'Upload and analyze chromatograms',
      icon: <Eye className="h-4 w-4" />,
      action: () => onNavigate('/chromatogram-analyzer'),
      category: 'navigation'
    },
    {
      id: 'troubleshooter',
      title: 'Start AI Troubleshooter',
      subtitle: 'Get intelligent diagnostics',
      icon: <Brain className="h-4 w-4" />,
      action: () => onNavigate('/ai-assistant'),
      category: 'actions'
    },
    {
      id: 'simulators',
      title: 'Open Simulators',
      subtitle: 'Detection limit and oven ramp tools',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => onNavigate('/detection-limit'),
      category: 'tools'
    },
    {
      id: 'calculations',
      title: 'Open Calculators',
      subtitle: 'Analytical calculations and conversions',
      icon: <Calculator className="h-4 w-4" />,
      action: () => onNavigate('/split-ratio'),
      category: 'tools'
    },
    {
      id: 'demo-mode',
      title: 'Toggle Demo Mode',
      subtitle: 'Switch between demo and live data',
      icon: <Zap className="h-4 w-4" />,
      action: onToggleDemo,
      category: 'settings'
    },
    {
      id: 'reports',
      title: 'Generate Report',
      subtitle: 'Create analysis reports',
      icon: <FileText className="h-4 w-4" />,
      action: () => onNavigate('/field-reports'),
      category: 'actions'
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    command.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
    }
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const getCategoryColor = (category: CommandAction['category']) => {
    switch (category) {
      case 'navigation': return 'bg-theme-primary-500/10 text-theme-primary-400';
      case 'actions': return 'bg-theme-accent-mint/10 text-theme-accent-mint';
      case 'tools': return 'bg-theme-accent-orange/10 text-theme-accent-orange';
      case 'settings': return 'bg-theme-surface/20 text-theme-text-muted';
      default: return 'bg-theme-surface/10 text-theme-text-muted';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-theme-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="glass-card w-full max-w-2xl mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-theme-border">
            <Search className="h-5 w-5 text-theme-text-muted" />
            <input
              type="text"
              placeholder="Type a command or search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-theme-text placeholder-theme-text-muted outline-none text-lg"
              autoFocus
            />
            <div className="flex items-center gap-2 text-sm text-theme-text-muted">
              <kbd className="px-2 py-1 bg-theme-surface/50 rounded text-xs">
                <Command className="h-3 w-3 inline mr-1" />K
              </kbd>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-theme-text-muted">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>No commands found</p>
                <p className="text-sm mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredCommands.map((command, index) => (
                  <motion.button
                    key={command.id}
                    className={`w-full flex items-center gap-4 p-3 rounded-lg text-left transition-all duration-200 ${
                      index === selectedIndex 
                        ? 'bg-theme-primary-500/10 border border-theme-primary-500/20' 
                        : 'hover:bg-theme-surface/30'
                    }`}
                    onClick={() => {
                      command.action();
                      onClose();
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className={`p-2 rounded ${getCategoryColor(command.category)}`}>
                      {command.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-theme-text truncate">
                        {command.title}
                      </div>
                      {command.subtitle && (
                        <div className="text-sm text-theme-text-muted truncate">
                          {command.subtitle}
                        </div>
                      )}
                    </div>

                    {command.shortcut && (
                      <Badge variant="outline" className="text-xs">
                        {command.shortcut}
                      </Badge>
                    )}

                    {index === selectedIndex && (
                      <ArrowRight className="h-4 w-4 text-theme-primary-500" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 border-t border-theme-border text-xs text-theme-text-muted">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-theme-surface/50 rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-theme-surface/50 rounded">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-theme-surface/50 rounded">esc</kbd>
                Close
              </span>
            </div>
            <div>{filteredCommands.length} commands</div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};