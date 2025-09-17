import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Thermometer, 
  Gauge,
  Cpu,
  HardDrive,
  Zap,
  Signal
} from 'lucide-react';

// Professional system status indicator
interface SystemStatusProps {
  isOnline: boolean;
  lastUpdated: Date;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  temperature?: number;
  pressure?: number;
  flowRate?: number;
}

export const EnterpriseSystemStatus: React.FC<SystemStatusProps> = ({
  isOnline,
  lastUpdated,
  systemHealth = 'good',
  temperature,
  pressure,
  flowRate
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getHealthStatus = () => {
    switch (systemHealth) {
      case 'excellent':
        return {
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: CheckCircle,
          label: 'Excellent'
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: AlertTriangle,
          label: 'Warning'
        };
      case 'critical':
        return {
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: XCircle,
          label: 'Critical'
        };
      default:
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: CheckCircle,
          label: 'Good'
        };
    }
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;
  const timeSinceUpdate = Math.floor((currentTime.getTime() - lastUpdated.getTime()) / 1000);

  return (
    <div className="enterprise-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="enterprise-h4">System Status</h3>
        <div className={`enterprise-status ${isOnline ? 'enterprise-status-online' : 'enterprise-status-offline'}`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* System Health */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${healthStatus.bg} ${healthStatus.border}`}>
        <HealthIcon className={`w-5 h-5 ${healthStatus.color}`} />
        <div>
          <div className={`font-medium ${healthStatus.color}`}>{healthStatus.label}</div>
          <div className="enterprise-caption">
            Last updated {timeSinceUpdate}s ago
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      {(temperature || pressure || flowRate) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {temperature !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
              <Thermometer className="w-4 h-4 text-red-600" />
              <div>
                <div className="enterprise-data-value text-sm">{temperature}°C</div>
                <div className="enterprise-caption">Temperature</div>
              </div>
            </div>
          )}
          
          {pressure !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
              <Gauge className="w-4 h-4 text-blue-600" />
              <div>
                <div className="enterprise-data-value text-sm">{pressure} psi</div>
                <div className="enterprise-caption">Pressure</div>
              </div>
            </div>
          )}
          
          {flowRate !== undefined && (
            <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <Activity className="w-4 h-4 text-green-600" />
              <div>
                <div className="enterprise-data-value text-sm">{flowRate} mL/min</div>
                <div className="enterprise-caption">Flow Rate</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Professional tooltip component
interface EnterpriseTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export const EnterpriseTooltip: React.FC<EnterpriseTooltipProps> = ({
  content,
  position = 'top',
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${getPositionClasses()}`}>
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap animate-enterprise-fade-in">
            {content}
            <div 
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
                position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2' :
                position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' :
                position === 'left' ? 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2' :
                'right-full top-1/2 translate-x-1/2 -translate-y-1/2'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Advanced loading indicator
interface EnterpriseLoadingProps {
  type?: 'spinner' | 'dots' | 'progress' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
}

export const EnterpriseLoading: React.FC<EnterpriseLoadingProps> = ({
  type = 'spinner',
  size = 'md',
  color = '#3b82f6',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizeClasses[size]} rounded-full animate-pulse`}
                style={{ 
                  backgroundColor: color,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        );
      
      case 'progress':
        return (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full animate-pulse"
              style={{ backgroundColor: color, width: '60%' }}
            />
          </div>
        );
      
      case 'pulse':
        return (
          <div 
            className={`${sizeClasses[size]} rounded-full animate-pulse`}
            style={{ backgroundColor: color }}
          />
        );
      
      default:
        return (
          <div className="enterprise-spinner" style={{ borderTopColor: color }} />
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {renderLoader()}
      {text && (
        <div className="enterprise-body-sm text-gray-600 animate-pulse">
          {text}
        </div>
      )}
    </div>
  );
};

// System metrics dashboard
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
  status?: 'normal' | 'warning' | 'critical';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  color,
  trend,
  status = 'normal'
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className={`enterprise-card p-4 ${getStatusStyles()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="enterprise-data-label">{title}</div>
            <div className="flex items-baseline gap-1">
              <span className="enterprise-data-value" style={{ color }}>
                {typeof value === 'number' ? value.toFixed(1) : value}
              </span>
              {unit && <span className="enterprise-data-unit">{unit}</span>}
            </div>
          </div>
        </div>
        
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            <Signal className="w-3 h-3" />
            <span className="text-xs font-medium">
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// System resources monitor
export const SystemResourceMonitor: React.FC = () => {
  const [resources, setResources] = useState({
    cpu: 45.2,
    memory: 62.8,
    disk: 78.3,
    network: 23.7
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setResources(prev => ({
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        disk: Math.max(0, Math.min(100, prev.disk + (Math.random() - 0.5) * 2)),
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 15))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="CPU Usage"
        value={resources.cpu}
        unit="%"
        icon={Cpu}
        color="#3b82f6"
        trend={Math.random() > 0.5 ? 2.3 : -1.1}
        status={resources.cpu > 80 ? 'critical' : resources.cpu > 60 ? 'warning' : 'normal'}
      />
      <MetricCard
        title="Memory"
        value={resources.memory}
        unit="%"
        icon={HardDrive}
        color="#10b981"
        trend={Math.random() > 0.5 ? 1.8 : -0.7}
        status={resources.memory > 85 ? 'critical' : resources.memory > 70 ? 'warning' : 'normal'}
      />
      <MetricCard
        title="Disk Usage"
        value={resources.disk}
        unit="%"
        icon={HardDrive}
        color="#f59e0b"
        trend={0.3}
        status={resources.disk > 90 ? 'critical' : resources.disk > 75 ? 'warning' : 'normal'}
      />
      <MetricCard
        title="Network"
        value={resources.network}
        unit="Mbps"
        icon={Zap}
        color="#8b5cf6"
        trend={Math.random() > 0.5 ? 5.2 : -2.4}
      />
    </div>
  );
};