import React from 'react';
import { motion } from 'framer-motion';

interface ScientificChartProps {
  title: string;
  data: Array<{ x: number; y: number; label?: string }>;
  xLabel?: string;
  yLabel?: string;
  width?: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showPeaks?: boolean;
}

export const ScientificChart: React.FC<ScientificChartProps> = ({
  title,
  data,
  xLabel = "Time (min)",
  yLabel = "Intensity",
  width = 600,
  height = 300,
  color = "#3b82f6",
  showGrid = true,
  showPeaks = false
}) => {
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate scales
  const xMin = Math.min(...data.map(d => d.x));
  const xMax = Math.max(...data.map(d => d.x));
  const yMin = Math.min(...data.map(d => d.y));
  const yMax = Math.max(...data.map(d => d.y));

  const xScale = (x: number) => ((x - xMin) / (xMax - xMin)) * chartWidth;
  const yScale = (y: number) => chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

  // Generate path for line chart
  const pathData = data.map((point, index) => {
    const x = xScale(point.x);
    const y = yScale(point.y);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate grid lines
  const gridLines = [];
  if (showGrid) {
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (chartWidth / 10) * i;
      gridLines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={chartHeight}
          stroke="#e5e7eb"
          strokeWidth="0.5"
          opacity="0.5"
        />
      );
    }
    // Horizontal grid lines
    for (let i = 0; i <= 8; i++) {
      const y = (chartHeight / 8) * i;
      gridLines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="0.5"
          opacity="0.5"
        />
      );
    }
  }

  return (
    <div className="scientific-data-container p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="enterprise-h4">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="enterprise-mono">Live</span>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-lg"  style={{ backgroundColor: '#fcfcfc' }}>
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid */}
            {gridLines}

            {/* Area under curve */}
            <motion.path
              d={`${pathData} L ${xScale(xMax)} ${chartHeight} L ${xScale(xMin)} ${chartHeight} Z`}
              fill={`url(#gradient-${title})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />

            {/* Main line */}
            <motion.path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="3"
              className="chromatogram-peak"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />

            {/* Data points */}
            {data.filter((_, i) => i % 5 === 0).map((point, index) => (
              <motion.circle
                key={index}
                cx={xScale(point.x)}
                cy={yScale(point.y)}
                r="4"
                className="data-point-premium enterprise-tooltip"
                fill={color}
                data-tooltip={`${point.x.toFixed(2)}min, ${point.y.toFixed(0)}mV`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              />
            ))}

            {/* Peak markers */}
            {showPeaks && data.filter((_, i, arr) => 
              i > 0 && i < arr.length - 1 && 
              data[i].y > data[i-1].y && data[i].y > data[i+1].y
            ).map((peak, index) => (
              <g key={`peak-${index}`}>
                <line
                  x1={xScale(peak.x)}
                  y1={yScale(peak.y)}
                  x2={xScale(peak.x)}
                  y2={yScale(peak.y) - 20}
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={xScale(peak.x)}
                  y={yScale(peak.y) - 25}
                  textAnchor="middle"
                  className="enterprise-caption"
                  fill="#ef4444"
                >
                  {peak.x.toFixed(1)}
                </text>
              </g>
            ))}

            {/* X-axis */}
            <line
              x1={0}
              y1={chartHeight}
              x2={chartWidth}
              y2={chartHeight}
              stroke="#374151"
              strokeWidth="1"
            />

            {/* Y-axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={chartHeight}
              stroke="#374151"
              strokeWidth="1"
            />

            {/* X-axis labels */}
            {Array.from({ length: 6 }, (_, i) => {
              const value = xMin + (xMax - xMin) * (i / 5);
              const x = (chartWidth / 5) * i;
              return (
                <text
                  key={`x-${i}`}
                  x={x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="enterprise-caption"
                  fill="#6b7280"
                >
                  {value.toFixed(1)}
                </text>
              );
            })}

            {/* Y-axis labels */}
            {Array.from({ length: 6 }, (_, i) => {
              const value = yMin + (yMax - yMin) * ((5 - i) / 5);
              const y = (chartHeight / 5) * i;
              return (
                <text
                  key={`y-${i}`}
                  x={-10}
                  y={y + 4}
                  textAnchor="end"
                  className="enterprise-caption"
                  fill="#6b7280"
                >
                  {value.toFixed(0)}
                </text>
              );
            })}
          </g>

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="enterprise-body-sm font-medium"
            fill="#374151"
          >
            {xLabel}
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            className="enterprise-body-sm font-medium"
            fill="#374151"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            {yLabel}
          </text>
        </svg>
      </div>
    </div>
  );
};

// Real-time data display component
interface RealTimeDataProps {
  title: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'normal' | 'warning' | 'critical';
  precision?: number;
}

export const RealTimeDataDisplay: React.FC<RealTimeDataProps> = ({
  title,
  value,
  unit,
  trend = 'stable',
  status = 'normal',
  precision = 2
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'warning': return 'status-warning';
      case 'critical': return 'status-error';
      default: return 'status-online';
    }
  };

  return (
    <div className="enterprise-glass-card p-6 animate-enterprise-scale-in hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="enterprise-data-label">{title}</div>
        <div className={`status-light ${getStatusIndicator()}`} />
      </div>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline">
          <span className={`metric-value-large text-2xl ${getStatusColor()}`}>
            {value.toFixed(precision)}
          </span>
          <span className="metric-unit ml-2">{unit}</span>
        </div>
        <div className={`text-xl ${getStatusColor()} transition-all duration-300`}>
          {getTrendIcon()}
        </div>
      </div>
    </div>
  );
};

// Scientific progress indicator
interface ScientificProgressProps {
  label: string;
  current: number;
  total: number;
  unit?: string;
  color?: string;
}

export const ScientificProgress: React.FC<ScientificProgressProps> = ({
  label,
  current,
  total,
  unit = "",
  color = "#3b82f6"
}) => {
  const percentage = (current / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="enterprise-data-label font-medium">{label}</span>
        <span className="enterprise-body-sm">
          <span className="enterprise-mono font-semibold">{current.toFixed(1)}</span>
          {unit && <span className="text-gray-500 ml-1">{unit}</span>}
          <span className="text-gray-400 mx-2">of</span>
          <span className="enterprise-mono font-semibold">{total.toFixed(1)}</span>
          {unit && <span className="text-gray-500 ml-1">{unit}</span>}
        </span>
      </div>
      <div className="relative">
        <div className="enterprise-progress h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="enterprise-progress-bar h-full animate-enterprise-fade-in transition-all duration-500 rounded-full"
            style={{ 
              background: `linear-gradient(90deg, ${color}, ${color}dd)`,
              width: `${percentage}%`,
              boxShadow: `0 0 8px ${color}40`
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 rounded-full" />
      </div>
      <div className="flex justify-between items-center">
        <div className={`status-light`} style={{ backgroundColor: color }} />
        <span className="enterprise-caption font-semibold" style={{ color }}>
          {percentage.toFixed(1)}% Complete
        </span>
      </div>
    </div>
  );
};