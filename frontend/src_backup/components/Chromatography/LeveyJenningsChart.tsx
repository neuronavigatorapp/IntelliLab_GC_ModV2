import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ComposedChart
} from 'recharts';
import { format } from 'date-fns';
import { 
  QCTimeSeriesPoint, 
  QCTarget, 
  QCRuleHit, 
  WESTGARD_RULES,
  QC_CHART_COLORS,
  QC_STATUS_COLORS
} from '../../types/qc';

interface LeveyJenningsChartProps {
  analyte: string;
  points: QCTimeSeriesPoint[];
  target: QCTarget;
  ruleHits: QCRuleHit[];
  height?: number;
  showBands?: boolean;
  showRuleHits?: boolean;
}

interface ChartDataPoint extends QCTimeSeriesPoint {
  dateStr: string;
  zscore: number;
  ruleHit?: QCRuleHit;
  status: 'PASS' | 'WARN' | 'FAIL';
}

const LeveyJenningsChart: React.FC<LeveyJenningsChartProps> = ({
  analyte,
  points,
  target,
  ruleHits,
  height = 400,
  showBands = true,
  showRuleHits = true
}) => {
  
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = points.map(point => {
      const zscore = (point.value - point.mean) / point.sd;
      const pointRuleHit = ruleHits.find(hit => 
        hit.analyte === point.analyte && 
        new Date(hit.timestamp).getTime() === new Date(point.timestamp).getTime()
      );
      
      let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
      if (pointRuleHit) {
        const rule = WESTGARD_RULES.find(r => r.id === pointRuleHit.rule);
        status = rule?.severity === 'CRITICAL' ? 'FAIL' : 'WARN';
      }
      
      return {
        ...point,
        dateStr: format(new Date(point.timestamp), 'MM/dd HH:mm'),
        zscore,
        ruleHit: pointRuleHit,
        status
      };
    });
    
    return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [points, ruleHits, analyte]);

  const formatTooltip = (value: any, name: string, props: any) => {
    const point = props.payload;
    if (!point) return [value, name];
    
    const tooltipContent = [
      `Value: ${point.value.toFixed(3)} ${target.unit}`,
      `Z-Score: ${point.zscore.toFixed(2)}σ`,
      `Status: ${point.status}`,
      `Time: ${format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm:ss')}`
    ];
    
    if (point.ruleHit) {
      const rule = WESTGARD_RULES.find(r => r.id === point.ruleHit.rule);
      tooltipContent.push(`Rule: ${rule?.name} - ${rule?.description}`);
    }
    
    return [tooltipContent.join('\n'), ''];
  };

  const getPointColor = (point: ChartDataPoint) => {
    if (point.status === 'FAIL') return QC_STATUS_COLORS.FAIL;
    if (point.status === 'WARN') return QC_STATUS_COLORS.WARN;
    return QC_STATUS_COLORS.PASS;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;
    
    const color = getPointColor(payload);
    const size = payload.ruleHit ? 8 : 4;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={size}
        fill={color}
        stroke={color}
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="levey-jennings-chart">
      <div className="chart-header mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {analyte} - Levey-Jennings Chart
        </h3>
        <div className="text-sm text-gray-600">
          Target: {target.mean.toFixed(3)} ± {target.sd.toFixed(3)} {target.unit}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          
          <XAxis 
            dataKey="dateStr"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: `${target.unit}`, angle: -90, position: 'insideLeft' }}
          />
          
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const point = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                    <p className="font-semibold">{label}</p>
                    <p>Value: {point.value.toFixed(3)} {target.unit}</p>
                    <p>Z-Score: {point.zscore.toFixed(2)}σ</p>
                    <p className={`font-semibold ${
                      point.status === 'FAIL' ? 'text-red-600' :
                      point.status === 'WARN' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      Status: {point.status}
                    </p>
                    {point.ruleHit && (
                      <>
                        <hr className="my-2" />
                        <p className="text-red-600 font-semibold">
                          Rule: {point.ruleHit.rule}
                        </p>
                        <p className="text-sm text-gray-600">
                          {WESTGARD_RULES.find(r => r.id === point.ruleHit.rule)?.description}
                        </p>
                      </>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          
          <Legend />
          
          {/* Control limits and bands */}
          {showBands && (
            <>
              {/* Mean line */}
              <ReferenceLine 
                y={target.mean} 
                stroke={QC_CHART_COLORS.mean}
                strokeWidth={2}
                strokeDasharray="8 8"
                label={{ value: "Mean", position: "left" }}
              />
              
              {/* 1σ lines */}
              <ReferenceLine 
                y={target.mean + target.sd} 
                stroke={QC_CHART_COLORS.plus1sigma}
                strokeWidth={1}
                strokeDasharray="4 4"
                label={{ value: "+1σ", position: "left" }}
              />
              <ReferenceLine 
                y={target.mean - target.sd} 
                stroke={QC_CHART_COLORS.minus1sigma}
                strokeWidth={1}
                strokeDasharray="4 4"
                label={{ value: "-1σ", position: "left" }}
              />
              
              {/* 2σ lines */}
              <ReferenceLine 
                y={target.mean + 2 * target.sd} 
                stroke={QC_CHART_COLORS.plus2sigma}
                strokeWidth={1}
                strokeDasharray="2 2"
                label={{ value: "+2σ", position: "left" }}
              />
              <ReferenceLine 
                y={target.mean - 2 * target.sd} 
                stroke={QC_CHART_COLORS.minus2sigma}
                strokeWidth={1}
                strokeDasharray="2 2"
                label={{ value: "-2σ", position: "left" }}
              />
              
              {/* 3σ lines */}
              <ReferenceLine 
                y={target.mean + 3 * target.sd} 
                stroke={QC_CHART_COLORS.plus3sigma}
                strokeWidth={2}
                label={{ value: "+3σ", position: "left" }}
              />
              <ReferenceLine 
                y={target.mean - 3 * target.sd} 
                stroke={QC_CHART_COLORS.minus3sigma}
                strokeWidth={2}
                label={{ value: "-3σ", position: "left" }}
              />
            </>
          )}
          
          {/* Data line and points */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={QC_CHART_COLORS.data}
            strokeWidth={2}
            dot={<CustomDot />}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Legend for rule hits */}
      {showRuleHits && ruleHits.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Rule Violations</h4>
          <div className="flex flex-wrap gap-2">
            {WESTGARD_RULES.map(rule => {
              const hitCount = ruleHits.filter(hit => hit.rule === rule.id).length;
              if (hitCount === 0) return null;
              
              return (
                <span
                  key={rule.id}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: rule.color + '20', 
                    color: rule.color,
                    border: `1px solid ${rule.color}50`
                  }}
                >
                  {rule.name}: {hitCount}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeveyJenningsChart;
