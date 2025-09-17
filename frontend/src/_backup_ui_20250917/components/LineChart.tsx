import React, { useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

interface DataPoint {
  x: number;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  className?: string;
  animated?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 400,
  height = 200,
  className,
  animated = false
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = svgRef.current;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous content
    svg.innerHTML = '';

    // Create scales
    const xMin = Math.min(...data.map(d => d.x));
    const xMax = Math.max(...data.map(d => d.x));
    const yMin = Math.min(...data.map(d => d.y));
    const yMax = Math.max(...data.map(d => d.y));

    const xScale = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
    const yScale = (y: number) => margin.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

    // Create path
    const pathData = data.map((point, index) => {
      const x = xScale(point.x);
      const y = yScale(point.y);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Add grid lines
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'grid-lines');

    // X-axis grid lines
    for (let i = 0; i <= 5; i++) {
      const x = margin.left + (i / 5) * chartWidth;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x.toString());
      line.setAttribute('y1', margin.top.toString());
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', (margin.top + chartHeight).toString());
      line.setAttribute('stroke', '#e5e7eb');
      line.setAttribute('stroke-width', '1');
      gridGroup.appendChild(line);
    }

    // Y-axis grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i / 5) * chartHeight;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', margin.left.toString());
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', (margin.left + chartWidth).toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', '#e5e7eb');
      line.setAttribute('stroke-width', '1');
      gridGroup.appendChild(line);
    }

    svg.appendChild(gridGroup);

    // Add axes
    const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    axesGroup.setAttribute('class', 'axes');

    // X-axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left.toString());
    xAxis.setAttribute('y1', (margin.top + chartHeight).toString());
    xAxis.setAttribute('x2', (margin.left + chartWidth).toString());
    xAxis.setAttribute('y2', (margin.top + chartHeight).toString());
    xAxis.setAttribute('stroke', '#374151');
    xAxis.setAttribute('stroke-width', '2');
    axesGroup.appendChild(xAxis);

    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left.toString());
    yAxis.setAttribute('y1', margin.top.toString());
    yAxis.setAttribute('x2', margin.left.toString());
    yAxis.setAttribute('y2', (margin.top + chartHeight).toString());
    yAxis.setAttribute('stroke', '#374151');
    yAxis.setAttribute('stroke-width', '2');
    axesGroup.appendChild(yAxis);

    svg.appendChild(axesGroup);

    // Add line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#3b82f6');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');

    if (animated) {
      const pathLength = path.getTotalLength();
      path.setAttribute('stroke-dasharray', pathLength.toString());
      path.setAttribute('stroke-dashoffset', pathLength.toString());
      
      path.animate([
        { strokeDashoffset: pathLength },
        { strokeDashoffset: 0 }
      ], {
        duration: 2000,
        easing: 'ease-in-out',
        fill: 'forwards'
      });
    }

    svg.appendChild(path);

    // Add data points
    data.forEach((point, index) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', xScale(point.x).toString());
      circle.setAttribute('cy', yScale(point.y).toString());
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', '#3b82f6');
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2');

      if (animated) {
        circle.style.opacity = '0';
        setTimeout(() => {
          circle.animate([
            { opacity: 0, transform: 'scale(0)' },
            { opacity: 1, transform: 'scale(1)' }
          ], {
            duration: 300,
            delay: index * 100,
            fill: 'forwards'
          });
        }, index * 100);
      }

      svg.appendChild(circle);
    });

  }, [data, width, height, animated]);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border rounded-lg bg-white"
      />
    </div>
  );
};
