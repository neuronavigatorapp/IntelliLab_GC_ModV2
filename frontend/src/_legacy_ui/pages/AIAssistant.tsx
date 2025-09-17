import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/Badge';
import { Input } from '../components/ui/input';
import { 
  Bot, 
  Send, 
  Microscope, 
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  Target,
  TrendingUp,
  FileText,
  Settings,
  MessageSquare,
  Cpu,
  Activity
} from 'lucide-react';

interface AIAssistantProps {
  onNavigate: (path: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  category?: 'troubleshooting' | 'method-development' | 'optimization' | 'general';
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your GC Analysis AI Assistant. I can help you with:\n\n• Troubleshooting chromatographic issues\n• Method development and optimization\n• Peak identification and analysis\n• Instrument maintenance guidance\n• Data interpretation\n\nWhat can I help you with today?",
      timestamp: new Date(),
      category: 'general'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulated AI responses for different categories
  const getAIResponse = (userMessage: string): { content: string; category: string } => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('peak') && (message.includes('tailing') || message.includes('fronting') || message.includes('shape'))) {
      return {
        content: "Peak shape issues are common in GC analysis. Here's what to check:\n\n🔍 **Peak Tailing:**\n• Column overload - reduce injection volume\n• Active sites on column - condition or replace\n• Inlet discrimination - check temperature and liner\n\n🔍 **Peak Fronting:**\n• Column overload - most common cause\n• Detector saturation - reduce sample concentration\n• Split ratio too low - increase split ratio\n\n💡 **Quick Fix:** Try reducing your injection volume by 50% first!",
        category: 'troubleshooting'
      };
    }
    
    if (message.includes('baseline') && (message.includes('drift') || message.includes('noise'))) {
      return {
        content: "Baseline issues can affect quantification. Here's the systematic approach:\n\n📊 **Baseline Drift:**\n• Temperature programming too aggressive\n• Column bleeding - check max temperature\n• Contaminated inlet - clean or replace liner\n\n📊 **Baseline Noise:**\n• Electronic interference - check grounding\n• Detector issues - clean FID jet or replace filament\n• Carrier gas impurities - check gas quality\n\n🎯 **Recommended Action:** Run a blank method at your highest temperature to isolate the issue.",
        category: 'troubleshooting'
      };
    }
    
    if (message.includes('retention') && (message.includes('time') || message.includes('shift'))) {
      return {
        content: "Retention time shifts indicate system changes:\n\n⏱️ **Common Causes:**\n• Flow rate variation - check pressure regulation\n• Column temperature instability - calibrate oven\n• Column degradation - check efficiency\n• Injection technique variation - use autosampler\n\n⚙️ **Preventive Measures:**\n• Use internal standards for compensation\n• Regular system suitability testing\n• Maintain consistent environmental conditions\n\n🔧 **Immediate Check:** Verify your carrier gas flow rate and pressure settings.",
        category: 'troubleshooting'
      };
    }
    
    if (message.includes('method') && (message.includes('development') || message.includes('optimize'))) {
      return {
        content: "Method development strategy for GC analysis:\n\n📋 **Step 1: Sample Preparation**\n• Determine analyte volatility and polarity\n• Choose appropriate extraction method\n• Consider derivatization if needed\n\n📋 **Step 2: Column Selection**\n• Match stationary phase to analytes\n• Consider column length vs. analysis time\n• Factor in resolution requirements\n\n📋 **Step 3: Temperature Programming**\n• Start 20°C below lowest boiling point\n• Use 5-10°C/min ramp rates initially\n• Optimize for resolution vs. speed\n\n🎯 **Pro Tip:** Use the Method Development Tracker to document your optimization steps!",
        category: 'method-development'
      };
    }
    
    if (message.includes('resolution') || message.includes('separation')) {
      return {
        content: "Improving chromatographic resolution:\n\n📈 **Resolution Equation Factors:**\n\n**Efficiency (N):**\n• Use longer columns\n• Smaller particle size (for packed columns)\n• Optimize linear velocity\n\n**Selectivity (α):**\n• Change stationary phase\n• Adjust temperature program\n• Modify mobile phase (for LC)\n\n**Retention (k):**\n• Adjust temperature\n• Change flow rate\n• Modify column dimensions\n\n🎯 **Quick Win:** Decrease temperature by 10-20°C to increase retention and improve separation.",
        category: 'optimization'
      };
    }
    
    if (message.includes('detection') && message.includes('limit')) {
      return {
        content: "Detection limit optimization strategies:\n\n🎯 **Signal Enhancement:**\n• Optimize detector settings (FID: H₂/air ratio)\n• Use splitless injection for trace analysis\n• Concentrate samples through extraction\n• Consider large volume injection techniques\n\n🎯 **Noise Reduction:**\n• Use high-purity carrier gas\n• Maintain clean injection system\n• Optimize electronic filtering\n• Control laboratory temperature\n\n📊 **Calculation Methods:**\n• 3σ method: LOD = 3 × (noise/slope)\n• Signal-to-noise ratio approach\n• Statistical methods with blank replicates\n\n💡 Use our Detection Limit Calculator for accurate LOD/LOQ determination!",
        category: 'method-development'
      };
    }
    
    // Default response for unrecognized queries
    return {
      content: "I understand you're asking about GC analysis. Let me help you with that!\n\nFor the most accurate assistance, please provide more details about:\n\n• What specific issue are you experiencing?\n• What type of analysis are you performing?\n• What instrument configuration are you using?\n\nSome areas I excel at:\n🔬 Troubleshooting peak shape and retention issues\n⚗️ Method development and optimization\n📊 Data interpretation and quantification\n🔧 Instrument maintenance guidance\n\nFeel free to ask about any specific chromatographic challenge!",
      category: 'general'
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse = getAIResponse(inputMessage);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        category: aiResponse.category as any
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    { text: "Why are my peaks tailing?", category: "troubleshooting" },
    { text: "How to improve resolution?", category: "optimization" },
    { text: "Baseline drift troubleshooting", category: "troubleshooting" },
    { text: "Method development strategy", category: "method-development" },
    { text: "Detection limit optimization", category: "optimization" },
    { text: "Retention time reproducibility", category: "troubleshooting" }
  ];

  const categories = [
    { id: 'all', label: 'All Topics', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'method-development', label: 'Method Development', icon: <Lightbulb className="h-4 w-4" /> },
    { id: 'optimization', label: 'Optimization', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'general', label: 'General', icon: <Brain className="h-4 w-4" /> }
  ];

  const aiCapabilities = [
    {
      title: "Troubleshooting Assistant",
      description: "Diagnose chromatographic problems with step-by-step guidance",
      icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
      color: "from-red-50 to-red-100"
    },
    {
      title: "Method Optimization", 
      description: "AI-powered suggestions for improving separation and sensitivity",
      icon: <Target className="h-6 w-6 text-blue-500" />,
      color: "from-blue-50 to-blue-100"
    },
    {
      title: "Peak Analysis",
      description: "Intelligent peak identification and quantification assistance",
      icon: <Activity className="h-6 w-6 text-green-500" />,
      color: "from-green-50 to-green-100"
    },
    {
      title: "Data Interpretation",
      description: "Expert analysis of chromatographic data and results",
      icon: <Brain className="h-6 w-6 text-purple-500" />,
      color: "from-purple-50 to-purple-100"
    }
  ];

  const filteredMessages = selectedCategory === 'all' 
    ? messages 
    : messages.filter(msg => msg.type === 'user' || msg.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: '80rem', margin: '0 auto' }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl text-white">
              <Bot className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-gray-600">Your intelligent GC analysis companion</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Online
              </div>
            </div>
          </div>

          {/* AI Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {aiCapabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`bg-gradient-to-br ${capability.color} border-0 hover:shadow-lg transition-all duration-200 cursor-pointer`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {capability.icon}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{capability.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{capability.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface - Main Column */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-blue-500" />
                    <CardTitle>Chat with AI</CardTitle>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex gap-1">
                    {categories.map(category => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="h-8 px-2 text-xs"
                      >
                        {category.icon}
                        <span className="ml-1 hidden sm:inline">{category.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="p-4 space-y-4">
                  {filteredMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                      <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white ml-4'
                          : 'bg-gray-100 text-gray-900 mr-4'
                      }`}>
                        {message.type === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                            {message.category && (
                              <Badge variant="outline" className="text-xs">
                                {message.category}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="whitespace-pre-line text-sm">{message.content}</div>
                        <div className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ display: 'flex', justifyContent: 'flex-start' }}
                    >
                      <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3 mr-4">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-blue-500" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about GC troubleshooting, method development, or optimization..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            {/* Quick Prompts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Questions
                </CardTitle>
                <CardDescription>
                  Common GC analysis topics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto py-2 px-3 text-left"
                    onClick={() => {
                      setInputMessage(prompt.text);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                  >
                    <div className="text-xs">
                      <div className="font-medium">{prompt.text}</div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {prompt.category}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Related Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-500" />
                  Related Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onNavigate('/chromatogram-simulator')}
                >
                  <Microscope className="h-4 w-4 mr-2" />
                  Chromatogram Simulator
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onNavigate('/detection-limit')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Detection Limit Calculator
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onNavigate('/ai-method-optimization')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Method Optimization
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onNavigate('/ai-dashboard')}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  AI Analytics Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* AI Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  AI Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Knowledge Base</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Engine</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Learning Module</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};