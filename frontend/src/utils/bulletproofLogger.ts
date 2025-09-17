/**
 * Bulletproof Enterprise Logging System for React Components
 * Professional logging infrastructure with performance monitoring
 */

import React from 'react';

interface LogLevel {
  DEBUG: 0;
  INFO: 1; 
  WARN: 2;
  ERROR: 3;
}

interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  component: string;
  message: string;
  data?: any;
  stack?: string;
}

interface PerformanceMetrics {
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  errorCount: number;
  lastError?: string;
  cacheHits: number;
  cacheMisses: number;
}

class BulletproofLogger {
  private logLevel: keyof LogLevel = 'INFO';
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private metrics: Map<string, PerformanceMetrics> = new Map();

  constructor(level: keyof LogLevel = 'INFO') {
    this.logLevel = level;
    this.setupErrorCapture();
  }

  private setupErrorCapture(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Global Error', event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', event.reason, {
          stack: event.reason?.stack
        });
      });
    }
  }

  private shouldLog(level: keyof LogLevel): boolean {
    const levels: LogLevel = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  private createLogEntry(
    level: keyof LogLevel,
    component: string, 
    message: string,
    data?: any,
    stack?: string
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      stack
    };

    // Add to logs array
    this.logs.push(entry);
    
    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console in development
    if (import.meta.env.MODE === 'development') {
      const consoleMethod = level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error';
      console[consoleMethod](`[${component}] ${message}`, data || '');
    }

    return entry;
  }

  debug(component: string, message: string, data?: any): void {
    if (this.shouldLog('DEBUG')) {
      this.createLogEntry('DEBUG', component, message, data);
    }
  }

  info(component: string, message: string, data?: any): void {
    if (this.shouldLog('INFO')) {
      this.createLogEntry('INFO', component, message, data);
    }
  }

  warn(component: string, message: string, data?: any): void {
    if (this.shouldLog('WARN')) {
      this.createLogEntry('WARN', component, message, data);
    }
  }

  error(component: string, message: string, data?: any): void {
    const stack = new Error().stack;
    this.createLogEntry('ERROR', component, message, data, stack);
    
    // Update error metrics
    const componentName = component.split('.')[0];
    const metrics = this.getMetrics(componentName);
    metrics.errorCount++;
    metrics.lastError = message;
  }

  // Performance monitoring methods
  startPerformanceTimer(component: string): string {
    const timerId = `${component}_${Date.now()}_${Math.random()}`;
    (window as any)[`__perf_${timerId}`] = performance.now();
    return timerId;
  }

  endPerformanceTimer(component: string, timerId: string, operation: string = 'render'): void {
    const startTime = (window as any)[`__perf_${timerId}`];
    if (startTime) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const metrics = this.getMetrics(component);
      metrics.renderCount++;
      metrics.totalRenderTime += duration;
      metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;
      
      this.debug(component, `${operation} completed in ${duration.toFixed(2)}ms`);
      
      // Cleanup
      delete (window as any)[`__perf_${timerId}`];
    }
  }

  trackCacheHit(component: string): void {
    const metrics = this.getMetrics(component);
    metrics.cacheHits++;
  }

  trackCacheMiss(component: string): void {
    const metrics = this.getMetrics(component);
    metrics.cacheMisses++;
  }

  getMetrics(component: string): PerformanceMetrics {
    if (!this.metrics.has(component)) {
      this.metrics.set(component, {
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        errorCount: 0,
        cacheHits: 0,
        cacheMisses: 0
      });
    }
    return this.metrics.get(component)!;
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  getLogs(level?: keyof LogLevel): LogEntry[] {
    if (!level) return [...this.logs];
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      metrics: Object.fromEntries(this.metrics),
      exportTime: new Date().toISOString()
    }, null, 2);
  }

  // Health check
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    errorRate: number;
    averageRenderTime: number;
    totalErrors: number;
  } {
    let totalErrors = 0;
    let totalRenders = 0;
    let totalRenderTime = 0;

    this.metrics.forEach((metrics) => {
      totalErrors += metrics.errorCount;
      totalRenders += metrics.renderCount;
      totalRenderTime += metrics.totalRenderTime;
    });

    const errorRate = totalRenders > 0 ? totalErrors / totalRenders : 0;
    const averageRenderTime = totalRenders > 0 ? totalRenderTime / totalRenders : 0;

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (errorRate > 0.1 || averageRenderTime > 100) {
      status = 'critical';
    } else if (errorRate > 0.05 || averageRenderTime > 50) {
      status = 'degraded';
    }

    return {
      status,
      errorRate,
      averageRenderTime,
      totalErrors
    };
  }
}

// Global logger instance
export const bulletproofLogger = new BulletproofLogger(
  import.meta.env.MODE === 'development' ? 'DEBUG' : 'INFO'
);

// React Hook for component logging
export const useBulletproofLogger = (componentName: string) => {
  const logger = bulletproofLogger;

  return {
    debug: (message: string, data?: any) => logger.debug(componentName, message, data),
    info: (message: string, data?: any) => logger.info(componentName, message, data),
    warn: (message: string, data?: any) => logger.warn(componentName, message, data),
    error: (message: string, data?: any) => logger.error(componentName, message, data),
    startTimer: () => logger.startPerformanceTimer(componentName),
    endTimer: (timerId: string, operation?: string) => 
      logger.endPerformanceTimer(componentName, timerId, operation),
    trackCacheHit: () => logger.trackCacheHit(componentName),
    trackCacheMiss: () => logger.trackCacheMiss(componentName),
    getMetrics: () => logger.getMetrics(componentName)
  };
};

// Higher-Order Component for automatic performance monitoring
export const withBulletproofLogging = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const BulletproofComponent: React.FC<P> = (props) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'UnknownComponent';
    const logger = useBulletproofLogger(name);
    const [timerId, setTimerId] = React.useState<string | null>(null);

    React.useEffect(() => {
      const id = logger.startTimer();
      setTimerId(id);
      logger.info('Component mounted');

      return () => {
        if (id) {
          logger.endTimer(id, 'mount');
        }
        logger.info('Component unmounted');
      };
    }, [logger]);

    React.useEffect(() => {
      if (timerId) {
        logger.endTimer(timerId, 'render');
        const newId = logger.startTimer();
        setTimerId(newId);
      }
    }, [timerId, logger]);

    try {
      return React.createElement(WrappedComponent, props);
    } catch (error) {
      logger.error('Component render error', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  };

  BulletproofComponent.displayName = `withBulletproofLogging(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return BulletproofComponent;
};

export default bulletproofLogger;