import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useSyncManager } from '../../hooks/useSyncManager';
import { LoadingButton } from '../UI/LoadingSpinner';

export const SyncIndicator: React.FC = () => {
  const { syncStatus, performSync } = useSyncManager();

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }
    
    if (syncStatus.isSyncing) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    
    if (syncStatus.syncErrors.length > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    
    if (syncStatus.pendingChanges > 0) {
      return <Clock className="w-4 h-4 text-orange-500" />;
    }
    
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    
    if (syncStatus.isSyncing) {
      return 'Sincronizando...';
    }
    
    if (syncStatus.syncErrors.length > 0) {
      return `${syncStatus.syncErrors.length} erro(s)`;
    }
    
    if (syncStatus.pendingChanges > 0) {
      return `${syncStatus.pendingChanges} pendente(s)`;
    }
    
    return 'Sincronizado';
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'text-red-600 bg-red-50';
    if (syncStatus.isSyncing) return 'text-blue-600 bg-blue-50';
    if (syncStatus.syncErrors.length > 0) return 'text-yellow-600 bg-yellow-50';
    if (syncStatus.pendingChanges > 0) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
      
      {(syncStatus.pendingChanges > 0 || syncStatus.syncErrors.length > 0) && syncStatus.isOnline && (
        <LoadingButton
          loading={syncStatus.isSyncing}
          onClick={performSync}
          variant="secondary"
          className="px-2 py-1 text-xs"
          title="Sincronizar alterações pendentes"
        >
          <RefreshCw className="w-3 h-3" />
        </LoadingButton>
      )}
      
      {syncStatus.lastSyncTime && (
        <span className="text-xs text-gray-500" title={`Última sincronização: ${syncStatus.lastSyncTime.toLocaleString()}`}>
          {syncStatus.lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};