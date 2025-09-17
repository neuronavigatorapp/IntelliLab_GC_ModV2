import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Badge, Button, Input, Textarea } from '../components/ui';
import { Bot, Send, Lightbulb, AlertTriangle, CheckCircle, MessageSquare, Play, RefreshCw } from 'lucide-react';
import { TroubleshooterEngine, TroubleshooterRules, RuleResult, mockChromatogramData } from '../lib/troubleshooter';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export const Troubleshooter: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI troubleshooting assistant. I can analyze your chromatogram data against expert rules and provide targeted recommendations. Upload your data or run a demo analysis to get started.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ruleResults, setRuleResults] = useState<RuleResult[]>([]);
  const [troubleshooterEngine, setTroubleshooterEngine] = useState<TroubleshooterEngine | null>(null);

  const suggestions: Suggestion[] = [
    {
      id: '1',
      title: 'Peak Tailing Issue',
      description: 'Multiple peaks showing excessive tailing in your chromatogram',
      priority: 'high',
      category: 'Peak Shape'
    },
    {
      id: '2',
      title: 'Baseline Drift',
      description: 'Gradual baseline shift observed during temperature programming',
      priority: 'medium',
      category: 'Baseline'
    },
    {
      id: '3',
      title: 'Low Sensitivity',
      description: 'Signal intensity lower than expected for standard concentrations',
      priority: 'medium',
      category: 'Detection'
    }
  ];

  const quickIssues = [
    'Peak splitting or tailing',
    'Baseline noise or drift',
    'Poor resolution between peaks',
    'Inconsistent retention times',
    'Low signal intensity',
    'Column performance issues'
  ];

  // Load troubleshooter rules on component mount
  useEffect(() => {
    const loadRules = async () => {
      try {
        // In a real app, this would fetch from the backend
        // For demo, we'll create the rules programmatically
        const demoRules: TroubleshooterRules = {
          version: 1,
          checks: [
            {
              id: 'early_tailing',
              when: 'any_peak.tailing_factor > 1.5 and any_peak.rt < 3.0',
              ask: 'Is split flow stable (±5%) for 2 minutes after injection?',
              if_yes: {
                advise: [
                  'Inspect/replace inlet liner; check for active sites.',
                  'Reduce inlet temperature by 10–20 °C and re-check tailing.'
                ]
              },
              if_no: {
                advise: [
                  'Suspect split-vent restriction. Inspect split vent path and trap.',
                  'Simulate lower split ratio and confirm area response.'
                ]
              }
            },
            {
              id: 'baseline_rise_backflush',
              when: 'baseline.slope_increase and near(method.backflush_start, 0.3)',
              advise: [
                'Move backflush start earlier by 0.2–0.5 min and re-run.',
                'Check bleed/contamination on post-column path.'
              ]
            },
            {
              id: 'c3_c4_coelution',
              when: "coelution('C3','C4', threshold=0.08)",
              advise: [
                'Add 0.2–0.5 min hold before ramp or reduce ramp rate by 2–4 °C/min.',
                'Simulate alternate oven step and confirm ΔRT > 0.1 min.'
              ]
            }
          ]
        };
        
        setTroubleshooterEngine(new TroubleshooterEngine(demoRules));
      } catch (error) {
        console.error('Failed to load troubleshooter rules:', error);
      }
    };

    loadRules();
  }, []);

  const runAnalysis = () => {
    if (!troubleshooterEngine) return;

    setIsProcessing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      const results = troubleshooterEngine.evaluateRules(mockChromatogramData);
      setRuleResults(results);
      
      // Add analysis results to chat
      const triggeredRules = results.filter(r => r.triggered);
      let analysisMessage = `Analysis complete! Found ${triggeredRules.length} potential issues:\n\n`;
      
      triggeredRules.forEach((result, index) => {
        analysisMessage += `${index + 1}. **${result.rule.id.replace('_', ' ').toUpperCase()}**\n`;
        if (result.rule.ask) {
          analysisMessage += `   Question: ${result.rule.ask}\n`;
        }
        if (result.recommendations.length > 0) {
          analysisMessage += `   Recommendations:\n`;
          result.recommendations.forEach(rec => {
            analysisMessage += `   • ${rec}\n`;
          });
        }
        analysisMessage += '\n';
      });

      if (triggeredRules.length === 0) {
        analysisMessage = 'Analysis complete! No issues detected with the current chromatogram data. All parameters appear to be within acceptable ranges.';
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: analysisMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 2000);
  };

  const handleUserResponse = (ruleId: string, response: 'yes' | 'no') => {
    if (!troubleshooterEngine) return;

    setRuleResults(prev => prev.map(result => {
      if (result.rule.id === ruleId) {
        return troubleshooterEngine.applyUserResponse(result, response);
      }
      return result;
    }));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Based on your description "${inputMessage}", I recommend checking the following:\n\n1. **Column Condition**: Verify column temperature and conditioning\n2. **Sample Preparation**: Ensure consistent sample matrix\n3. **Injection Parameters**: Check injection volume and temperature\n\nWould you like me to provide specific guidance for any of these areas?`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
    }, 2000);
  };

  const handleQuickIssue = (issue: string) => {
    setInputMessage(issue);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">AI Troubleshooter</h1>
          <p className="text-text-secondary mt-2">
            Intelligent diagnostic assistant for GC method optimization and problem solving
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success">AI Online</Badge>
          <Badge variant="info">Expert Mode</Badge>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card variant="elevated" className="h-96">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bot className="text-accent-500" size={20} />
                <CardTitle>Diagnostic Chat</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col h-80">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-accent-500 text-white'
                            : 'bg-surface border border-border text-text-primary'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-accent-100' : 'text-text-tertiary'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-surface border border-border px-4 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin h-4 w-4 border-2 border-accent-500 border-t-transparent rounded-full" />
                          <span className="text-sm text-text-secondary">AI is analyzing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="border-t border-border p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Describe your GC issue or ask a question..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isProcessing}
                      className="px-3"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rules Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rules Analysis</CardTitle>
                <Button 
                  size="sm" 
                  onClick={runAnalysis}
                  disabled={!troubleshooterEngine || isProcessing}
                  className="px-3"
                >
                  {isProcessing ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {ruleResults.length > 0 ? (
                <div className="space-y-3">
                  {ruleResults.filter(r => r.triggered).map((result) => (
                    <div key={result.rule.id} className="p-3 bg-surface rounded-lg border-l-4 border-l-warning-500">
                      <h4 className="font-medium text-text-primary text-sm mb-2">
                        {result.rule.id.replace('_', ' ').toUpperCase()}
                      </h4>
                      {result.rule.ask && !result.userResponse && (
                        <div className="mb-2">
                          <p className="text-xs text-text-secondary mb-2">{result.rule.ask}</p>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs px-2 py-1"
                              onClick={() => handleUserResponse(result.rule.id, 'yes')}
                            >
                              Yes
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs px-2 py-1"
                              onClick={() => handleUserResponse(result.rule.id, 'no')}
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      )}
                      {result.recommendations.length > 0 && (
                        <div className="space-y-1">
                          {result.recommendations.map((rec, index) => (
                            <p key={index} className="text-xs text-text-secondary">• {rec}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {ruleResults.filter(r => r.triggered).length === 0 && (
                    <p className="text-sm text-success-600">✓ No issues detected</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  Click the play button to run automated troubleshooting analysis
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {quickIssues.map((issue, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickIssue(issue)}
                    className="w-full text-left px-3 py-2 text-sm bg-surface hover:bg-surface-hover rounded-lg transition-colors"
                  >
                    {issue}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-3 bg-surface rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-text-primary text-sm">{suggestion.title}</h4>
                      <Badge size="sm" variant={getPriorityColor(suggestion.priority) as any}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary mb-2">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-tertiary">{suggestion.category}</span>
                      <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                        Apply Fix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Knowledge Base */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lightbulb className="text-warning-500" size={20} />
            <CardTitle>Expert Knowledge Base</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-success-50 rounded-lg w-fit mx-auto mb-3">
                <CheckCircle className="text-success-600" size={24} />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Method Optimization</h3>
              <p className="text-sm text-text-secondary">
                Expert guidance for improving separation efficiency and peak resolution
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-warning-50 rounded-lg w-fit mx-auto mb-3">
                <AlertTriangle className="text-warning-600" size={24} />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Troubleshooting</h3>
              <p className="text-sm text-text-secondary">
                Systematic approach to diagnosing and resolving common GC problems
              </p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-info-50 rounded-lg w-fit mx-auto mb-3">
                <MessageSquare className="text-info-600" size={24} />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Interactive Support</h3>
              <p className="text-sm text-text-secondary">
                Real-time assistance with parameter adjustments and method development
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};