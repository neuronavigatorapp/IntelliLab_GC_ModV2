declare module 'react-plotly.js' {
  import { Component } from 'react';
  
  interface PlotParams {
    data: any[];
    layout?: any;
    config?: any;
    style?: React.CSSProperties;
    className?: string;
    onHover?: (data: any) => void;
    onClick?: (data: any) => void;
    onInitialized?: (figure: any, graphDiv: HTMLDivElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLDivElement) => void;
    onRedraw?: () => void;
    onRelayout?: (eventData: any) => void;
    onRestyle?: (eventData: any) => void;
    useResizeHandler?: boolean;
    debug?: boolean;
    divId?: string;
  }
  
  export default class Plot extends Component<PlotParams> {}
}