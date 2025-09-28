import React, { useState, useEffect } from 'react';
import { Menu, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
  isMobile: boolean;
}

type ApiStatus = 'connected' | 'disconnected' | 'loading';

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  isMobile
}) => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkApiHealth = async () => {
      try {
        // Try multiple health endpoints
        const endpoints = ['/api/health', '/health', '/docs'];
        let connected = false;

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
              connected = true;
              break;
            }
          } catch (error) {
            // Continue to next endpoint
            continue;
          }
        }

        setApiStatus(connected ? 'connected' : 'disconnected');
      } catch (error) {
        setApiStatus('disconnected');
      }
    };

    // Initial check
    checkApiHealth();

    // Check every 30 seconds
    interval = setInterval(checkApiHealth, 30000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'connected':
        return <Wifi size={16} className="text-success" />;
      case 'disconnected':
        return <WifiOff size={16} className="text-danger" />;
      case 'loading':
        return <Loader2 size={16} className="text-brand-600 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'loading':
        return 'Checking...';
    }
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'connected':
        return 'status-chip connected';
      case 'disconnected':
        return 'status-chip disconnected';
      case 'loading':
        return 'status-chip loading';
    }
  };

  return (
    <header className="topbar">
      {/* Left Side */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Brand */}
        <div className="blue-gradient-banner px-4 py-2 rounded-lg">
          <h1 className="text-lg font-bold tracking-tight">
            Field GC Toolkit
          </h1>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* API Status */}
        <div className={getStatusColor()} title="Backend API Status">
          {getStatusIcon()}
          <span className="hidden sm:inline">
            API {getStatusText()}
          </span>
        </div>

        {/* Version Badge */}
        <div className="hidden md:flex items-center px-3 py-1 bg-surface-2 rounded-lg text-xs text-muted">
          v2.0 Blue Lab
        </div>
      </div>
    </header>
  );
};