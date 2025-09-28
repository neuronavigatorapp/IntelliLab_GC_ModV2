import React from 'react';
import Plot from 'react-plotly.js';

export interface PlotlyChartProps {
  data: any[];
  layout: any;
  config?: any;
  style?: React.CSSProperties;
  className?: string;
  onHover?: (data: any) => void;
  onClick?: (data: any) => void;
}

/**
 * Reusable Plotly.js chart wrapper component
 * Used for both Detection Limit Calculator and Chromatogram Simulator
 * Location: src/components/charts/PlotlyChart.tsx
 */
export const PlotlyChart: React.FC<PlotlyChartProps> = ({
  data,
  layout,
  config = {
    displayModeBar: false,
    responsive: true,
    toImageButtonOptions: {
      format: 'png',
      filename: 'chart',
      height: 600,
      width: 800,
      scale: 2
    }
  },
  style = { width: '100%', height: '100%' },
  className = '',
  onHover,
  onClick
}) => {
  const defaultLayout = {
    font: { 
      family: 'Inter, sans-serif',
      size: 12 
    },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 60, r: 40, t: 40, b: 60 },
    showlegend: true,
    legend: { 
      orientation: 'h',
      y: -0.15,
      x: 0.5,
      xanchor: 'center'
    },
    xaxis: {
      showgrid: true,
      gridcolor: '#e5e7eb',
      gridwidth: 1,
      zeroline: false
    },
    yaxis: {
      showgrid: true,
      gridcolor: '#e5e7eb', 
      gridwidth: 1,
      zeroline: false
    },
    ...layout
  };

  return (
    <div className={`plotly-chart-container ${className}`} style={style}>
      <Plot
        data={data}
        layout={defaultLayout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        onHover={onHover}
        onClick={onClick}
        useResizeHandler={true}
      />
    </div>
  );
};

export default PlotlyChart;