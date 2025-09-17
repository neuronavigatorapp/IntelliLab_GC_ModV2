import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Tool, TrendingUp, TrendingDown } from 'lucide-react';

// Performance Alert Component
const PerformanceAlert = ({ alert, onToolLaunch }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical - Immediate Action Required':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'High - Schedule Maintenance Soon':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'Medium - Monitor and Optimize':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const getSeverityIcon = (severity) => {
    if (severity.includes('Critical')) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    } else if (severity.includes('High')) {
      return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    }
    return <CheckCircle className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className={`border-l-4 p-4 mb-4 rounded-r-lg ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getSeverityIcon(alert.severity)}
          <div>
            <h4 className="font-semibold text-lg">{alert.issue_type}</h4>
            <p className="text-sm opacity-80">
              Detected with {Math.round(alert.confidence * 100)}% confidence at {alert.timestamp}
            </p>
            <p className="mt-2">{alert.message}</p>
            
            {alert.immediate_actions && alert.immediate_actions.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-sm mb-2">Immediate Actions:</p>
                <ul className="text-sm space-y-1">
                  {alert.immediate_actions.map((action, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {alert.recommended_tools && alert.recommended_tools.length > 0 && (
          <div className="ml-4">
            <p className="text-sm font-medium mb-2">Recommended Tools:</p>
            <div className="space-y-1">
              {alert.recommended_tools.map((tool, index) => (
                <button
                  key={index}
                  onClick={() => onToolLaunch(tool)}
                  className="flex items-center px-3 py-1 text-xs bg-white bg-opacity-50 hover:bg-opacity-75 rounded-full transition-all duration-200"
                >
                  <Tool className="w-3 h-3 mr-1" />
                  {tool}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Performance Status Dashboard
const PerformanceStatusDashboard = ({ status }) => {
  const getStatusColor = (level) => {
    switch (level) {
      case 'EXCELLENT':
        return 'text-green-600 bg-green-100';
      case 'GOOD':
        return 'text-blue-600 bg-blue-100';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Performance Score</p>
            <p className="text-2xl font-bold">{Math.round(status.overall_score)}/100</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.status_level)}`}>
            {status.status_level}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Issues</p>
            <p className="text-2xl font-bold">{status.active_issues}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-orange-500" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Critical Issues</p>
            <p className="text-2xl font-bold">{status.critical_issues}</p>
          </div>
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Last Analysis</p>
            <p className="text-sm font-medium">{status.last_analysis}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
      </div>
    </div>
  );
};

// Performance Metrics Display
const PerformanceMetrics = ({ metrics }) => {
  const getMetricStatus = (value, thresholds) => {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.acceptable) return 'acceptable';
    if (value >= thresholds.poor) return 'poor';
    return 'critical';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-blue-600 bg-blue-50';
      case 'acceptable':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Signal-to-Noise Ratio</span>
            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(getMetricStatus(metrics.signal_to_noise_ratio, {excellent: 100, good: 50, acceptable: 20, poor: 10, critical: 5}))}`}>
              {Math.round(metrics.signal_to_noise_ratio)}:1
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.signal_to_noise_ratio / 100) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Baseline Stability</span>
            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(getMetricStatus(metrics.baseline_stability_percent, {excellent: 95, good: 90, acceptable: 80, poor: 70, critical: 50}))}`}>
              {Math.round(metrics.baseline_stability_percent)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.baseline_stability_percent}%` }}
            ></div>
          </div>
        </div>

        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Peak Symmetry</span>
            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(getMetricStatus(metrics.peak_symmetry_factor, {excellent: 1.2, good: 1.5, acceptable: 2.0, poor: 3.0, critical: 5.0}))}`}>
              {metrics.peak_symmetry_factor.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                metrics.peak_symmetry_factor <= 2.0 ? 'bg-green-600' : 
                metrics.peak_symmetry_factor <= 3.0 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${Math.max(20, 100 - (metrics.peak_symmetry_factor - 1) * 20)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Resolution</span>
            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(getMetricStatus(metrics.resolution_average, {excellent: 2.0, good: 1.5, acceptable: 1.2, poor: 1.0, critical: 0.8}))}`}>
              {metrics.resolution_average.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (metrics.resolution_average / 2.0) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Analysis Time</span>
            <span className={`px-2 py-1 text-xs rounded ${
              metrics.analysis_time_min <= 30 ? 'text-green-600 bg-green-50' :
              metrics.analysis_time_min <= 45 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
            }`}>
              {Math.round(metrics.analysis_time_min)} min
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                metrics.analysis_time_min <= 30 ? 'bg-green-600' : 
                metrics.analysis_time_min <= 45 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${Math.max(20, 100 - ((metrics.analysis_time_min - 15) / 45) * 80)}%` }}
            ></div>
          </div>
        </div>

        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Detector Response</span>
            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(getMetricStatus(metrics.detector_response_factor, {excellent: 1.0, good: 0.8, acceptable: 0.6, poor: 0.4, critical: 0.2}))}`}>
              {metrics.detector_response_factor.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.detector_response_factor * 100}%` }}
            ></div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Troubleshooting Tools Panel
const TroubleshootingToolsPanel = ({ tools, onToolSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Recommended Troubleshooting Tools</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, index) => (
          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-sm">{tool.tool_name}</h4>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Score: {Math.round(tool.priority_score)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
            
            {tool.best_for && tool.best_for.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium mb-1">Best for:</p>
                <div className="flex flex-wrap gap-1">
                  {tool.best_for.slice(0, 2).map((use, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={() => onToolSelect(tool)}
              className="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
            >
              <Tool className="w-4 h-4 mr-2" />
              Launch Tool
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Performance Trends Component
const PerformanceTrends = ({ trends }) => {
  if (!trends || trends.status !== 'analysis_available') {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
        <p className="text-gray-600">
          {trends?.message || 'Collecting performance data for trend analysis...'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(trends.trending_metrics).map(([metric, data]) => (
          <div key={metric} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium capitalize">
                {metric.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center">
                {data.direction === 'improving' ? (
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                )}
                <span className={`text-xs font-medium ${
                  data.direction === 'improving' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(data.change_percent).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <div>Current: {data.current_value.toFixed(2)}</div>
              <div>Previous: {data.previous_value.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4">
        Analysis based on {trends.data_points} data points over {trends.analysis_period_hours} hours
      </p>
    </div>
  );
};

// Main Performance Monitor Component
export const PerformanceMonitor = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for demonstration (replace with actual API calls)
  useEffect(() => {
    const mockPerformanceData = {
      performance_analysis: {
        overall_score: 65.2,
        status: "WARNING",
        metrics: {
          signal_to_noise_ratio: 15.0,
          baseline_stability_percent: 70.0,
          peak_symmetry_factor: 3.5,
          resolution_average: 0.9,
          sensitivity_pg_ul: 10.0,
          analysis_time_min: 65.0,
          detector_response_factor: 0.4,
          column_efficiency_plates: 30000,
          carrier_flow_stability: 85.0,
          temperature_stability: 3.0
        },
        timestamp: new Date().toLocaleString()
      },
      alerts: [
        {
          alert_id: "ALERT_001",
          timestamp: new Date().toLocaleString(),
          severity: "Critical - Immediate Action Required",
          issue_type: "Poor Sensitivity",
          confidence: 0.95,
          message: "Detector sensitivity has dropped significantly",
          recommended_tools: ["Agilent SCD Simulator", "Detector Simulator"],
          immediate_actions: [
            "🚨 Check SCD burner temperature and gas flows",
            "Verify PMT voltage settings",
            "Inspect detector for contamination"
          ]
        },
        {
          alert_id: "ALERT_002", 
          timestamp: new Date().toLocaleString(),
          severity: "High - Schedule Maintenance Soon",
          issue_type: "Long Analysis Time",
          confidence: 0.88,
          message: "Analysis time exceeds optimal range",
          recommended_tools: ["Backflush Calculator", "Oven Ramp Visualizer"],
          immediate_actions: [
            "Calculate optimal backflush timing",
            "Review temperature program efficiency"
          ]
        }
      ],
      suggested_tools: [
        {
          tool_name: "Agilent SCD Simulator",
          priority_score: 8.5,
          description: "Complete SCD performance simulation and diagnostic system",
          best_for: ["SCD sensitivity issues", "Sulfur detection problems"],
          endpoint: "/api/tools/scd/simulate"
        },
        {
          tool_name: "Backflush Calculator",
          priority_score: 7.2,
          description: "Optimizes backflush timing for column protection and cycle time reduction",
          best_for: ["Long analysis times", "Matrix contamination"],
          endpoint: "/api/tools/backflush/calculate"
        }
      ],
      immediate_actions: [
        "🚨 Check SCD burner temperature and gas flows",
        "Verify PMT voltage settings", 
        "Calculate optimal backflush timing",
        "Review temperature program efficiency"
      ],
      performance_trends: {
        status: "analysis_available",
        trending_metrics: {
          signal_to_noise_ratio: {
            change_percent: -15.3,
            direction: "declining",
            current_value: 15.0,
            previous_value: 17.7
          },
          baseline_stability_percent: {
            change_percent: -8.2,
            direction: "declining", 
            current_value: 70.0,
            previous_value: 76.3
          }
        },
        data_points: 24,
        analysis_period_hours: 24
      }
    };

    setTimeout(() => {
      setPerformanceData(mockPerformanceData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleToolLaunch = (toolName) => {
    console.log(`Launching troubleshooting tool: ${toolName}`);
    // Here you would integrate with the actual tool APIs
    alert(`Launching ${toolName}...`);
  };

  const handleToolSelect = (tool) => {
    console.log(`Selected tool:`, tool);
    // Here you would navigate to or launch the specific tool
    handleToolLaunch(tool.tool_name);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Analyzing GC Performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">Error loading performance data: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">GC Performance Monitor</h2>
        <p className="text-gray-600">
          Real-time performance analysis with intelligent troubleshooting recommendations
        </p>
      </div>

      {/* Performance Status Dashboard */}
      <PerformanceStatusDashboard status={{
        overall_score: performanceData.performance_analysis.overall_score,
        status_level: performanceData.performance_analysis.status,
        active_issues: performanceData.alerts.length,
        critical_issues: performanceData.alerts.filter(a => a.severity.includes('Critical')).length,
        last_analysis: performanceData.performance_analysis.timestamp
      }} />

      {/* Performance Alerts */}
      {performanceData.alerts && performanceData.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Alerts</h3>
          {performanceData.alerts.map((alert, index) => (
            <PerformanceAlert 
              key={index} 
              alert={alert} 
              onToolLaunch={handleToolLaunch}
            />
          ))}
        </div>
      )}

      {/* Performance Metrics */}
      <PerformanceMetrics metrics={performanceData.performance_analysis.metrics} />

      {/* Performance Trends */}
      <PerformanceTrends trends={performanceData.performance_trends} />

      {/* Troubleshooting Tools */}
      <TroubleshootingToolsPanel 
        tools={performanceData.suggested_tools}
        onToolSelect={handleToolSelect}
      />

      {/* Immediate Actions */}
      {performanceData.immediate_actions && performanceData.immediate_actions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Immediate Actions Required</h3>
          <div className="space-y-2">
            {performanceData.immediate_actions.map((action, index) => (
              <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;