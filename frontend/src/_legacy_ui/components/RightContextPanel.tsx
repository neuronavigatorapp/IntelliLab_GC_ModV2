import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Activity, 
  FileText, 
  Calculator, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
}

interface Citation {
  id: string;
  title: string;
  source: string;
  relevance: number;
  snippet: string;
  url?: string;
}

interface CalculatorTrace {
  id: string;
  operation: string;
  input: Record<string, any>;
  output: Record<string, any>;
  timestamp: string;
}

interface RightContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RightContextPanel: React.FC<RightContextPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('logs');

  // Mock data - in real app, this would come from context/API
  const logs: LogEntry[] = [
    {
      id: '1',
      timestamp: '14:32:15',
      level: 'success',
      message: 'Chromatogram analysis completed',
      details: 'Sample-GC-2024-089 processed successfully with 12 peaks detected'
    },
    {
      id: '2',
      timestamp: '14:28:43',
      level: 'info',
      message: 'AI model loaded',
      details: 'Peak detection model v2.1.0 initialized'
    },
    {
      id: '3',
      timestamp: '14:25:12',
      level: 'warning',
      message: 'Column temperature drift detected',
      details: 'Temperature variance of ±2°C observed at 250°C set point'
    },
    {
      id: '4',
      timestamp: '14:20:55',
      level: 'error',
      message: 'Baseline instability',
      details: 'Noise level exceeding 5% threshold in detector signal'
    }
  ];

  const citations: Citation[] = [
    {
      id: '1',
      title: 'Peak Identification in Gas Chromatography',
      source: 'Modern Practice of Gas Chromatography',
      relevance: 0.95,
      snippet: 'Peak identification relies on retention time matching and spectral library comparison...',
      url: '#'
    },
    {
      id: '2',
      title: 'Temperature Programming Effects',
      source: 'Journal of Chromatographic Science',
      relevance: 0.87,
      snippet: 'Temperature programming significantly affects peak resolution and analysis time...',
      url: '#'
    },
    {
      id: '3',
      title: 'Method Development Guidelines',
      source: 'Analytical Chemistry Handbook',
      relevance: 0.82,
      snippet: 'Systematic approach to method development includes column selection and optimization...',
      url: '#'
    }
  ];

  const calculatorTraces: CalculatorTrace[] = [
    {
      id: '1',
      operation: 'Detection Limit Calculation',
      input: {
        concentration: '10 ppm',
        signalToNoise: 3.2,
        replicates: 10
      },
      output: {
        mdl: '0.85 ppm',
        confidence: '99%'
      },
      timestamp: '14:15:30'
    },
    {
      id: '2',
      operation: 'Split Ratio Calculation',
      input: {
        splitFlow: '50 mL/min',
        columnFlow: '1.2 mL/min'
      },
      output: {
        splitRatio: '42:1',
        efficiency: 'Optimized'
      },
      timestamp: '13:45:22'
    }
  ];

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-theme-accent-orange" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'info': default: return <Info className="h-4 w-4 text-theme-primary-400" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'warning': return 'bg-theme-accent-orange/10 text-theme-accent-orange border-theme-accent-orange/30';
      case 'error': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'info': default: return 'bg-theme-primary-500/10 text-theme-primary-400 border-theme-primary-500/30';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-theme-background/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full lg:w-96 bg-theme-surface/95 backdrop-blur-xl border-l border-theme-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-theme-border">
              <h2 className="text-xl font-semibold text-theme-text flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-theme-primary-500" />
                Insights
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ⌥I
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-theme-text-muted hover:text-theme-text"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
                  <TabsTrigger value="logs" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Logs
                  </TabsTrigger>
                  <TabsTrigger value="citations" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Citations
                  </TabsTrigger>
                  <TabsTrigger value="calculations" className="text-xs">
                    <Calculator className="h-3 w-3 mr-1" />
                    Calcs
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto p-6 pt-4">
                  <TabsContent value="logs" className="space-y-4 mt-0">
                    {logs.map((log) => (
                      <Card key={log.id} className="glass-card">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {getLevelIcon(log.level)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getLevelColor(log.level)}>
                                  {log.level}
                                </Badge>
                                <span className="text-xs text-theme-text-muted font-mono">
                                  {log.timestamp}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-theme-text mb-1">
                                {log.message}
                              </p>
                              {log.details && (
                                <p className="text-xs text-theme-text-muted">
                                  {log.details}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(`${log.timestamp}: ${log.message}`)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="citations" className="space-y-4 mt-0">
                    {citations.map((citation) => (
                      <Card key={citation.id} className="glass-card">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-theme-text line-clamp-2">
                              {citation.title}
                            </h4>
                            <Badge className="ml-2 text-xs bg-theme-primary-500/10 text-theme-primary-400">
                              {Math.round(citation.relevance * 100)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-theme-accent-mint mb-2">
                            {citation.source}
                          </p>
                          <p className="text-xs text-theme-text-muted mb-3 line-clamp-3">
                            {citation.snippet}
                          </p>
                          <div className="flex items-center gap-2">
                            {citation.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Read More
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(citation.snippet)}
                              className="h-7 px-2 text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="calculations" className="space-y-4 mt-0">
                    {calculatorTraces.map((trace) => (
                      <Card key={trace.id} className="glass-card">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{trace.operation}</CardTitle>
                            <span className="text-xs text-theme-text-muted font-mono">
                              {trace.timestamp}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-xs font-medium text-theme-text mb-1">Input:</h5>
                              <div className="text-xs text-theme-text-muted space-y-1">
                                {Object.entries(trace.input).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span>{key}:</span>
                                    <span className="font-mono">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-theme-text mb-1">Output:</h5>
                              <div className="text-xs text-theme-text-muted space-y-1">
                                {Object.entries(trace.output).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span>{key}:</span>
                                    <span className="font-mono font-medium text-theme-primary-400">
                                      {value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-theme-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Export
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(trace, null, 2))}
                              className="h-7 px-2 text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};