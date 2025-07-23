import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { testConnection } from '../lib/supabaseClient';
import { useEnhancedToast } from '../components/UI/EnhancedToast';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncErrors: string[];
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'properties' | 'tenants' | 'transactions' | 'informors' | 'documents' | 'energyBills';
  data: any;
  timestamp: Date;
}

export function useSyncManager() {
  const queryClient = useQueryClient();
  const toast = useEnhancedToast();
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    syncErrors: []
  });

  // Carregar mudanças pendentes do localStorage
  const loadPendingChanges = useCallback((): PendingChange[] => {
    try {
      const stored = localStorage.getItem('pending-sync-changes');
      if (stored) {
        const changes = JSON.parse(stored);
        return changes.map((change: any) => ({
          ...change,
          timestamp: new Date(change.timestamp)
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar mudanças pendentes:', error);
    }
    return [];
  }, []);

  // Salvar mudanças pendentes no localStorage
  const savePendingChanges = useCallback((changes: PendingChange[]) => {
    try {
      localStorage.setItem('pending-sync-changes', JSON.stringify(changes));
      setSyncStatus(prev => ({ ...prev, pendingChanges: changes.length }));
    } catch (error) {
      console.error('Erro ao salvar mudanças pendentes:', error);
    }
  }, []);

  // Adicionar mudança pendente
  const addPendingChange = useCallback((change: Omit<PendingChange, 'id' | 'timestamp'>) => {
    const pendingChanges = loadPendingChanges();
    const newChange: PendingChange = {
      ...change,
      id: `${change.entity}-${change.type}-${Date.now()}`,
      timestamp: new Date()
    };
    
    // Evitar duplicatas - remover mudanças antigas do mesmo item
    const filteredChanges = pendingChanges.filter(existing => 
      !(existing.entity === change.entity && 
        existing.data?.id === change.data?.id &&
        existing.type === change.type)
    );
    
    savePendingChanges([...filteredChanges, newChange]);
  }, [loadPendingChanges, savePendingChanges]);

  // Verificar conectividade com Supabase
  const checkSupabaseConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await testConnection();
    } catch (error) {
      console.warn('Supabase indisponível:', error);
      return false;
    }
  }, []);

  // Sincronizar uma mudança específica
  const syncChange = async (change: PendingChange): Promise<boolean> => {
    try {
      // Aqui você implementaria a lógica específica para cada entidade
      // Por exemplo, para propriedades:
      if (change.entity === 'properties') {
        const { propertyService } = await import('../services/supabaseService');
        
        switch (change.type) {
          case 'create':
            await propertyService.create(change.data);
            break;
          case 'update':
            await propertyService.update(change.data.id, change.data);
            break;
          case 'delete':
            await propertyService.delete(change.data.id);
            break;
        }
      }
      
      // Implementar lógica similar para tenants e transactions
      if (change.entity === 'tenants') {
        const { tenantService } = await import('../services/supabaseService');
        
        switch (change.type) {
          case 'create':
            await tenantService.create(change.data);
            break;
          case 'update':
            await tenantService.update(change.data.id, change.data);
            break;
          case 'delete':
            await tenantService.delete(change.data.id);
            break;
        }
      }
      
      if (change.entity === 'transactions') {
        const { transactionService } = await import('../services/supabaseService');
        
        switch (change.type) {
          case 'create':
            await transactionService.create(change.data);
            break;
          case 'update':
            await transactionService.update(change.data.id, change.data);
            break;
          case 'delete':
            await transactionService.delete(change.data.id);
            break;
        }
      }
      
      if (change.entity === 'informors') {
        const { informorService } = await import('../services/supabaseService');
        
        switch (change.type) {
          case 'create':
            await informorService.create(change.data);
            break;
          case 'update':
            await informorService.update(change.data.id, change.data);
            break;
          case 'delete':
            await informorService.delete(change.data.id);
            break;
        }
      }
      
      if (change.entity === 'documents') {
        const { documentService } = await import('../services/supabaseService');
        
        switch (change.type) {
          case 'create':
            await documentService.create(change.data);
            break;
          case 'update':
            await documentService.update(change.data.id, change.data);
            break;
          case 'delete':
            await documentService.delete(change.data.id);
            break;
        }
      }
      
      if (change.entity === 'energyBills') {
        const { energyBillService } = await import('../services/supabaseService');
        
        switch (change.type) {
          case 'create':
            await energyBillService.create(change.data);
            break;
          case 'update':
            await energyBillService.update(change.data.id, change.data);
            break;
          case 'delete':
            await energyBillService.delete(change.data.id);
            break;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao sincronizar mudança ${change.id}:`, error);
      return false;
    }
  };

  // Executar sincronização completa
  const performSync = useCallback(async (): Promise<void> => {
    const isSupabaseOnline = await checkSupabaseConnection();
    
    if (!isSupabaseOnline) {
      setSyncStatus(prev => ({ 
        ...prev, 
        isOnline: false,
        syncErrors: ['Supabase indisponível']
      }));
      return;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, syncErrors: [] }));
    
    const pendingChanges = loadPendingChanges();
    
    if (pendingChanges.length === 0) {
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        isOnline: true,
        lastSyncTime: new Date()
      }));
      return;
    }

    const errors: string[] = [];
    const successfulChanges: string[] = [];

    // Processar mudanças em ordem cronológica
    const sortedChanges = pendingChanges.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    for (const change of sortedChanges) {
      const success = await syncChange(change);
      
      if (success) {
        successfulChanges.push(change.id);
      } else {
        errors.push(`Falha ao sincronizar ${change.entity} ${change.type}`);
      }
    }

    // Remover mudanças sincronizadas com sucesso
    const remainingChanges = pendingChanges.filter(
      change => !successfulChanges.includes(change.id)
    );
    
    savePendingChanges(remainingChanges);

    // Invalidar queries para recarregar dados do Supabase
    if (successfulChanges.length > 0) {
      queryClient.invalidateQueries(['properties']);
      queryClient.invalidateQueries(['tenants']);
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['informors']);
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['energyBills']);
    }

    setSyncStatus(prev => ({
      ...prev,
      isSyncing: false,
      isOnline: true,
      lastSyncTime: new Date(),
      syncErrors: errors
    }));

    // Mostrar resultado da sincronização
    if (successfulChanges.length > 0 && errors.length === 0) {
      toast.success(`${successfulChanges.length} alteração(ões) sincronizada(s) com sucesso!`);
    } else if (successfulChanges.length > 0 && errors.length > 0) {
      toast.warning(`${successfulChanges.length} sincronizada(s), ${errors.length} com erro`);
    } else if (errors.length > 0) {
      toast.error(`Erro na sincronização: ${errors.length} falha(s)`);
    }
  }, [checkSupabaseConnection, loadPendingChanges, savePendingChanges, queryClient, toast]);

  // Detectar mudanças de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      // Aguardar um pouco antes de tentar sincronizar
      setTimeout(performSync, 2000);
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performSync]);

  // Verificar conectividade periodicamente
  useEffect(() => {
    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const isSupabaseOnline = await checkSupabaseConnection();
        setSyncStatus(prev => ({ ...prev, isOnline: isSupabaseOnline }));
        
        // Se voltou online e há mudanças pendentes, sincronizar
        if (isSupabaseOnline && loadPendingChanges().length > 0) {
          performSync();
        }
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }, [checkSupabaseConnection, loadPendingChanges, performSync]);

  // Carregar contagem inicial de mudanças pendentes
  useEffect(() => {
    const pendingChanges = loadPendingChanges();
    setSyncStatus(prev => ({ ...prev, pendingChanges: pendingChanges.length }));
  }, [loadPendingChanges]);

  return {
    syncStatus,
    addPendingChange,
    performSync,
    clearPendingChanges: () => savePendingChanges([])
  };
}