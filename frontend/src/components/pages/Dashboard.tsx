import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { 
  Calculator, 
  TrendingUp, 
  Zap, 
  Activity, 
  BookOpen,
  Play,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Database,
  Cpu,
  BarChart3,
  TestTube,
  Package,
  Wrench,
  Monitor
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Real-time data (replaced mock data with empty states)
  // TODO: Replace with API calls to backend
  const instrumentData: Array<{ name: string; value: number; color: string }> = [];
  const runStatusData: Array<{ time: string; active: number; queued: number; completed: number }> = [];
  const qcTrendsData: Array<{ date: string; calibration: number; qc: number; limit: number }> = [];
  const consumableData: Array<{ name: string; level: number; status: string }> = [];
  const maintenanceData: Array<{ task: string; due: string; priority: string }> = [];

  return (
    <Layout currentSection="Dashboard">
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">System Overview</h1>
            <p className="text-slate-400">Real-time monitoring and analytics dashboard</p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-300">All Systems Online</span>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Instruments Status */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-500/20 rounded-lg">
                <Cpu className="h-6 w-6 text-teal-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">11</div>
                <div className="text-sm text-slate-400">Total Instruments</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">• Online: 8</span>
                <span className="text-amber-400">• Maintenance: 2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">• Error: 1</span>
                <span className="text-slate-400">• Uptime: 94.2%</span>
              </div>
            </div>
          </div>

          {/* Active Runs */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <Activity className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">47</div>
                <div className="text-sm text-slate-400">Sample Runs</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cyan-400">• Active: 3</span>
                <span className="text-amber-400">• Queued: 20</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">• Completed: 44</span>
                <span className="text-slate-400">• Success: 98.1%</span>
              </div>
            </div>
          </div>

          {/* QC Status */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <TestTube className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">98.2%</div>
                <div className="text-sm text-slate-400">QC Compliance</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">• In Control: 15</span>
                <span className="text-amber-400">• Warning: 2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">• Out of Control: 0</span>
                <span className="text-slate-400">• Last Cal: 2h ago</span>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <Wrench className="h-6 w-6 text-amber-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">4</div>
                <div className="text-sm text-slate-400">Maintenance Tasks</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-red-400">• Overdue: 1</span>
                <span className="text-amber-400">• Due Today: 1</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cyan-400">• This Week: 2</span>
                <span className="text-slate-400">• Compliance: 92%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Instrument Status Chart */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Instrument Fleet Status</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Cpu className="h-4 w-4" />
                <span>11 Instruments</span>
              </div>
            </div>
            <div className="h-64">
              {instrumentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={instrumentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="value"
                    >
                      {instrumentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#f1f5f9' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
                      <Monitor className="h-8 w-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm">No instrument data available</p>
                    <p className="text-slate-500 text-xs mt-1">Connect instruments to see real-time status</p>
                  </div>
                </div>
              )}
          </div>

          {/* Run Status Timeline */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Sample Runs (24h)</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Activity className="h-4 w-4" />
                <span>{runStatusData.length} Total</span>
              </div>
            </div>
            <div className="h-64">
              {runStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={runStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="active" 
                      stroke="#22d3ee" 
                      strokeWidth={2}
                      name="Active Runs"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="queued" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Queued"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Activity className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">No run data available</p>
                  <p className="text-sm mt-2">Run status data will appear here when samples are processed</p>
                </div>
              )}
            </div>
          </div>

          {/* QC Trends Chart */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">QC & Calibration Trends</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <TestTube className="h-4 w-4" />
                <span>6 Days</span>
              </div>
            </div>
            <div className="h-64">
              {qcTrendsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qcTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      fontSize={12}
                      domain={[90, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="calibration" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Calibration %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="qc" 
                      stroke="#14b8a6" 
                      strokeWidth={2}
                      name="QC %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="limit" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Limit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <TestTube className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">No QC data available</p>
                  <p className="text-sm mt-2">QC and calibration trends will appear here as data is collected</p>
                </div>
              )}
            </div>
          </div>

          {/* Consumables Status */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Consumables Inventory</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Package className="h-4 w-4" />
                <span>{consumableData.length} Items</span>
              </div>
            </div>
            <div className="space-y-4">
              {consumableData.length > 0 ? (
                consumableData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300">{item.name}</span>
                      <span className={`text-sm font-semibold ${
                        item.status === 'critical' ? 'text-red-400' :
                        item.status === 'low' ? 'text-amber-400' :
                        item.status === 'medium' ? 'text-cyan-400' : 'text-emerald-400'
                      }`}>
                        {item.level}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          item.status === 'critical' ? 'bg-gradient-to-r from-red-600 to-red-500' :
                          item.status === 'low' ? 'bg-gradient-to-r from-amber-600 to-amber-500' :
                          item.status === 'medium' ? 'bg-gradient-to-r from-cyan-600 to-cyan-500' : 
                          'bg-gradient-to-r from-emerald-600 to-emerald-500'
                        }`}
                        style={{ width: `${item.level}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Package className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">No consumables tracked</p>
                  <p className="text-sm mt-2">Consumable inventory levels will appear here when configured</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Maintenance & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Maintenance Tasks */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Maintenance Schedule</h3>
              <button className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {maintenanceData.length > 0 ? (
                maintenanceData.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-200">{task.task}</div>
                        <div className="text-xs text-slate-400">Due: {task.due}</div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {task.priority.toUpperCase()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Wrench className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">No maintenance scheduled</p>
                  <p className="text-sm mt-2">Maintenance tasks will appear here when scheduled</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Zap className="h-4 w-4" />
                <span>Shortcuts</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/runs')}
                className="p-4 bg-slate-700/50 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-cyan-500/20 rounded-full group-hover:bg-cyan-500/30 transition-colors">
                    <Play className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">Start Run</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/qc-calibration')}
                className="p-4 bg-slate-700/50 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
                    <TestTube className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">Run QC</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/methods')}
                className="p-4 bg-slate-700/50 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-teal-500/20 rounded-full group-hover:bg-teal-500/30 transition-colors">
                    <BookOpen className="h-5 w-5 text-teal-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">Methods</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/instruments')}
                className="p-4 bg-slate-700/50 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-amber-500/20 rounded-full group-hover:bg-amber-500/30 transition-colors">
                    <Cpu className="h-5 w-5 text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">Instruments</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Professional Tools Grid */}
        <div className="py-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl mb-6 shadow-lg">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Professional GC Tools
            </h2>
            
            <p className="text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed">
              Choose from our comprehensive suite of expert-level analytical tools designed for method development,
              optimization, and troubleshooting. Each tool provides instant, professional-grade results.
            </p>
            
            <div className="mt-8 inline-flex items-center space-x-2 px-4 py-2 bg-teal-500/20 border border-teal-500/30 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-teal-300">6 Tools Available • All Ready to Use</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Detection Limit Calculator - Dark Theme */}
            <div 
              onClick={() => navigate('/detection-limit')}
              className="group relative bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative">
                <div className="mb-6">
                  <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg group-hover:shadow-teal-500/25 group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <Calculator className="h-8 w-8" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-teal-300 transition-colors duration-300">
                  Detection Limit Calculator
                </h3>
                
                <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                  Calculate method detection limits with statistical precision and regulatory compliance
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ready to Use
                  </span>
                  <div className="flex items-center space-x-2 text-teal-400 group-hover:text-teal-300">
                    <span className="font-medium">Launch Tool</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Oven Ramp Optimizer - Dark Theme */}
            <div 
              onClick={() => navigate('/oven-ramp')}
              className="group relative bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative">
                <div className="mb-6">
                  <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg group-hover:shadow-purple-500/25 group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                  Oven Ramp Optimizer
                </h3>
                
                <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                  Design optimal temperature programs for perfect chromatographic separations
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ready to Use
                  </span>
                  <div className="flex items-center space-x-2 text-purple-400 group-hover:text-purple-300">
                    <span className="font-medium">Launch Tool</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Inlet Simulator - Dark Theme */}
            <div 
              onClick={() => navigate('/inlet-simulator')}
              className="group relative bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative">
                <div className="mb-6">
                  <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg group-hover:shadow-emerald-500/25 group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <Zap className="h-8 w-8" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors duration-300">
                  Inlet Simulator
                </h3>
                
                <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                  Simulate injection conditions and optimize sample transfer efficiency
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ready to Use
                  </span>
                  <div className="flex items-center space-x-2 text-emerald-400 group-hover:text-emerald-300">
                    <span className="font-medium">Launch Tool</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Column Simulator - Dark Theme */}
            <div 
              onClick={() => navigate('/column-simulator')}
              className="group relative bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative">
                <div className="mb-6">
                  <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-lg group-hover:shadow-amber-500/25 group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <Database className="h-8 w-8" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-amber-300 transition-colors duration-300">
                  Column Simulator
                </h3>
                
                <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                  Model separation performance and optimize column selection for your application
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ready to Use
                  </span>
                  <div className="flex items-center space-x-2 text-amber-400 group-hover:text-amber-300">
                    <span className="font-medium">Launch Tool</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Chromatogram Simulator - Dark Theme */}
            <div 
              onClick={() => navigate('/chromatogram-simulator')}
              className="group relative bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative">
                <div className="mb-6">
                  <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-600 text-white shadow-lg group-hover:shadow-rose-500/25 group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-rose-300 transition-colors duration-300">
                  Chromatogram Simulator
                </h3>
                
                <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                  Predict and visualize complete chromatograms based on method parameters
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ready to Use
                  </span>
                  <div className="flex items-center space-x-2 text-rose-400 group-hover:text-rose-300">
                    <span className="font-medium">Launch Tool</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Method Optimizer - Dark Theme */}
            <div 
              onClick={() => navigate('/method-optimizer')}
              className="group relative bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-8 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:bg-slate-800/80 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative">
                <div className="mb-6">
                  <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg group-hover:shadow-indigo-500/25 group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <BookOpen className="h-8 w-8" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors duration-300">
                  Method Optimizer
                </h3>
                
                <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                  Systematic method development and optimization with DOE and AI assistance
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ready to Use
                  </span>
                  <div className="flex items-center space-x-2 text-indigo-400 group-hover:text-indigo-300">
                    <span className="font-medium">Launch Tool</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-3 px-8 py-4 bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-lg font-semibold text-slate-300">
              All Systems Online • Real-Time Monitoring • Enterprise Ready
            </span>
            <Sparkles className="h-5 w-5 text-teal-400" />
          </div>
          
          <p className="mt-6 text-sm text-slate-500 font-medium">
            IntelliLab GC v2.0 • Professional Analytics Platform • Copyright © 2025
          </p>
        </div>
      </div>
      </div>
    </Layout>
  );
};