import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { useGlobalData } from '../../store/globalDataStore';
import { QCChartData, QCSummary } from '../../store/globalDataStore';

interface QCChartsProps {
  analyte?: string;
  instrumentId?: number;
  days?: number;
}

const QCCharts: React.FC<QCChartsProps> = ({ 
  analyte = 'Benzene', 
  instrumentId, 
  days = 30 
}) => {
  const { fetchQCChartData, fetchQCSummary } = useGlobalData();
  const [chartData, setChartData] = useState<QCChartData | null>(null);
  const [summary, setSummary] = useState<QCSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [chartResult, summaryResult] = await Promise.all([
          fetchQCChartData(analyte, instrumentId, days),
          fetchQCSummary(analyte, instrumentId)
        ]);
        
        setChartData(chartResult);
        setSummary(summaryResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load QC data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [analyte, instrumentId, days, fetchQCChartData, fetchQCSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading QC data</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData || !summary) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No QC data available</h3>
            <div className="mt-2 text-sm text-yellow-700">
              No QC data found for {analyte}. Please add some QC records to see the control chart.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare plot data
  const traces = [
    // Main QC values
    {
      x: chartData.dates,
      y: chartData.values,
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'QC Values',
      line: { color: '#3B82F6' },
      marker: { size: 6 }
    },
    // UCL line
    {
      x: chartData.dates,
      y: chartData.ucl_line,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'UCL',
      line: { color: '#EF4444', dash: 'dash' },
      showlegend: true
    },
    // LCL line
    {
      x: chartData.dates,
      y: chartData.lcl_line,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'LCL',
      line: { color: '#EF4444', dash: 'dash' },
      showlegend: true
    },
    // Warning high line
    {
      x: chartData.dates,
      y: chartData.warn_high_line,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Warning High',
      line: { color: '#F59E0B', dash: 'dot' },
      showlegend: true
    },
    // Warning low line
    {
      x: chartData.dates,
      y: chartData.warn_low_line,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Warning Low',
      line: { color: '#F59E0B', dash: 'dot' },
      showlegend: true
    },
    // Mean line
    {
      x: chartData.dates,
      y: chartData.mean_line,
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Mean',
      line: { color: '#10B981', dash: 'solid' },
      showlegend: true
    }
  ];

  // Add out-of-control points
  if (chartData.out_of_control_points.length > 0) {
    const outOfControlX = chartData.out_of_control_points.map(i => chartData.dates[i]);
    const outOfControlY = chartData.out_of_control_points.map(i => chartData.values[i]);
    
    traces.push({
      x: outOfControlX,
      y: outOfControlY,
      type: 'scatter' as const,
      mode: 'markers' as any, // TODO: Fix TypeScript mode prop type issue
      name: 'Out of Control',
      marker: { 
        color: '#EF4444', 
        size: 10, 
        symbol: 'x' as const,
        line: { color: 'white', width: 2 }
      } as any,
      showlegend: true
    } as any);
  }

  // Add warning points
  if (chartData.warning_points.length > 0) {
    const warningX = chartData.warning_points.map(i => chartData.dates[i]);
    const warningY = chartData.warning_points.map(i => chartData.values[i]);
    
    traces.push({
      x: warningX,
      y: warningY,
      type: 'scatter' as const,
      mode: 'markers' as any, // TODO: Fix TypeScript mode prop type issue
      name: 'Warning',
      marker: { 
        color: '#F59E0B', 
        size: 8, 
        symbol: 'triangle-up' as const
      } as any,
      showlegend: true
    } as any);
  }

  const layout = {
    title: `${analyte} QC Control Chart`,
    xaxis: {
      title: 'Date',
      type: 'date' as const
    },
    yaxis: {
      title: 'Value',
      gridcolor: '#E5E7EB'
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    font: {
      family: 'Inter, system-ui, sans-serif'
    },
    margin: {
      l: 60,
      r: 30,
      t: 60,
      b: 60
    },
    showlegend: true,
    legend: {
      x: 0,
      y: 1,
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      bordercolor: '#E5E7EB',
      borderwidth: 1
    }
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Mean</div>
          <div className="text-2xl font-bold text-gray-900">{summary.mean.toFixed(3)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Std Dev</div>
          <div className="text-2xl font-bold text-gray-900">{summary.stdev.toFixed(3)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Records</div>
          <div className="text-2xl font-bold text-gray-900">{summary.record_count}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Status</div>
          <div className={`text-2xl font-bold ${
            summary.status === 'stable' ? 'text-green-600' :
            summary.status === 'trending' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {summary.status.charAt(0).toUpperCase() + summary.status.slice(1)}
          </div>
        </div>
      </div>

      {/* Control Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <Plot
            data={traces}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '500px' }}
            useResizeHandler={true}
          />
        </div>
      </div>

      {/* Control Limits Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Control Limits</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Upper Control Limit</div>
              <div className="text-lg font-semibold text-red-600">{summary.ucl.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Lower Control Limit</div>
              <div className="text-lg font-semibold text-red-600">{summary.lcl.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Warning High</div>
              <div className="text-lg font-semibold text-yellow-600">{summary.warn_high.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Warning Low</div>
              <div className="text-lg font-semibold text-yellow-600">{summary.warn_low.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCCharts;
