// Custom type declarations for Plotly.js to resolve TypeScript compatibility issues
declare module 'plotly.js' {
  export interface PlotlyData {
    type?: string;
    mode?: string;
    x?: any;
    y?: any;
    z?: any;
    [key: string]: any;
  }

  export interface PlotlyLayout {
    [key: string]: any;
  }

  export interface PlotlyConfig {
    [key: string]: any;
  }
}

declare module 'react-plotly.js' {
  import { Component } from 'react';
  import { PlotlyData, PlotlyLayout, PlotlyConfig } from 'plotly.js';

  interface PlotlyProps {
    data: PlotlyData[];
    layout?: PlotlyLayout;
    config?: PlotlyConfig;
    frames?: any[];
    onClick?: (event: any) => void;
    onHover?: (event: any) => void;
    onUnHover?: (event: any) => void;
    onSelected?: (event: any) => void;
    onDeselect?: (event: any) => void;
    onDoubleClick?: (event: any) => void;
    onAfterPlot?: (event: any) => void;
    onAutoSize?: (event: any) => void;
    onBeforePlot?: (event: any) => void;
    onButtonClicked?: (event: any) => void;
    onClickAnnotation?: (event: any) => void;
    onDeselect?: (event: any) => void;
    onDoubleClick?: (event: any) => void;
    onFramework?: (event: any) => void;
    onHover?: (event: any) => void;
    onLegendClick?: (event: any) => void;
    onLegendDoubleClick?: (event: any) => void;
    onRelayout?: (event: any) => void;
    onRestyle?: (event: any) => void;
    onSelected?: (event: any) => void;
    onSelecting?: (event: any) => void;
    onSliderChange?: (event: any) => void;
    onSliderEnd?: (event: any) => void;
    onSliderStart?: (event: any) => void;
    onTransitioning?: (event: any) => void;
    onTransitionInterrupted?: (event: any) => void;
    onUnHover?: (event: any) => void;
    onUpdateMenu?: (event: any) => void;
    onUpdateSlider?: (event: any) => void;
    style?: React.CSSProperties;
    className?: string;
    id?: string;
    revision?: number;
    useResizeHandler?: boolean;
    debug?: boolean;
    clearOnUpdate?: boolean;
    onInitialized?: (event: any) => void;
    onUpdate?: (event: any) => void;
    onPurge?: (event: any) => void;
    onRedraw?: (event: any) => void;
    onAfterExport?: (event: any) => void;
    onBeforeExport?: (event: any) => void;
    onAnimated?: (event: any) => void;
    onAnimatingFrame?: (event: any) => void;
    onAnimationInterrupted?: (event: any) => void;
    onLegendClick?: (event: any) => void;
    onLegendDoubleClick?: (event: any) => void;
    onSliderChange?: (event: any) => void;
    onSliderEnd?: (event: any) => void;
    onSliderStart?: (event: any) => void;
    onTransitioning?: (event: any) => void;
    onTransitionInterrupted?: (event: any) => void;
    onUpdateMenu?: (event: any) => void;
    onUpdateSlider?: (event: any) => void;
  }

  export default class Plot extends Component<PlotlyProps> {}
} 