import React, { useState, useEffect } from 'react';
import { syncClient } from '../../offline/sync/syncClient';
import { mutationQueue } from '../../offline/sync/queue';
import { notificationManager } from '../../notifications/notify';
import { SyncStatus as SyncStatusType } from '../../offline/sync/types';

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>({
    isOnline: true,
    lastSyncAt: undefined,
    pendingChanges: 0,
    syncInProgress: false,
    lastError: undefined
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(syncClient.getSyncStatus());
    };

    // Update status immediately
    updateStatus();

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);

    // Listen for mutation queue events
    const handleQueueProcessed = (event: CustomEvent) => {
      updateStatus();
      const { summary } = event.detail;
      notificationManager.notifySyncComplete(summary.successful, summary.failed);
    };

    window.addEventListener('mutation-queue-processed', handleQueueProcessed as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mutation-queue-processed', handleQueueProcessed as EventListener);
    };
  }, []);

  const handleForceSync = async () => {
    try {
      await syncClient.forceSync();
      setSyncStatus(syncClient.getSyncStatus());
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const formatLastSync = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = () => {
    if (syncStatus.syncInProgress) return 'text-blue-600 bg-blue-100';
    if (syncStatus.pendingChanges > 0) return 'text-yellow-600 bg-yellow-100';
    if (syncStatus.lastError) return 'text-red-600 bg-red-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusIcon = () => {
    if (syncStatus.syncInProgress) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    
    if (syncStatus.pendingChanges > 0) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className={`${className}`}>
      <div 
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${getStatusColor()}`}
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
      >
        {getStatusIcon()}
        <span>
          {syncStatus.syncInProgress ? 'Syncing...' : 
           syncStatus.pendingChanges > 0 ? `${syncStatus.pendingChanges} pending` : 
           'Synced'}
        </span>
        {showDetails && (
          <svg className="w-4 h-4 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path fill="currentColor" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        )}
      </div>

      {showDetails && isExpanded && (
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Last sync:</span>
              <span className="font-medium">{formatLastSync(syncStatus.lastSyncAt)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Pending changes:</span>
              <span className="font-medium">{syncStatus.pendingChanges}</span>
            </div>
            
            {syncStatus.lastError && (
              <div className="text-red-600 text-xs">
                Error: {syncStatus.lastError}
              </div>
            )}
            
            <div className="pt-2">
              <button
                onClick={handleForceSync}
                disabled={syncStatus.syncInProgress}
                className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncStatus.syncInProgress ? 'Syncing...' : 'Force Sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
