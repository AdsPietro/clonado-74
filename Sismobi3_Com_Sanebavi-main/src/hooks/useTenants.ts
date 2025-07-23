import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Tenant } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { tenantService, mappers } from '../services/supabaseService';
import { useSyncManager } from './useSyncManager';

// Chaves para o cache do React Query
const QUERY_KEYS = {
  tenants: ['tenants'] as const,
};

export function useTenants(supabaseAvailable: boolean = false) {
  const queryClient = useQueryClient();
  const { addPendingChange } = useSyncManager();
  
  // Fallback para localStorage quando Supabase não está disponível
  const [localTenants, setLocalTenants] = useLocalStorage<Tenant[]>('tenants', []);

  // Query para buscar todos os inquilinos
  const {
    data: tenants = [],
    isLoading: carregando,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.tenants,
    queryFn: async (): Promise<Tenant[]> => {
      if (!supabaseAvailable) {
        // Retornar dados do localStorage se Supabase não estiver disponível
        return localTenants;
      }
      try {
        const data = await tenantService.getAll();
        return data.map(mappers.tenantFromSupabase);
      } catch (error) {
        console.warn('Supabase indisponível, usando localStorage:', error);
        return localTenants;
      }
    },
    enabled: true, // Sempre executar a query
    retry: false, // Não tentar novamente se falhar
  });

  // Mutation para criar novo inquilino
  const createMutation = useMutation({
    mutationFn: async (tenantData: Omit<Tenant, 'id'>) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const newTenant: Tenant = {
          ...tenantData,
          id: Date.now().toString()
        };
        setLocalTenants(prev => [newTenant, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'tenants',
          data: newTenant
        });
        
        return newTenant;
      }
      try {
        const data = await tenantService.create(tenantData);
        return mappers.tenantFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const newTenant: Tenant = {
          ...tenantData,
          id: Date.now().toString()
        };
        setLocalTenants(prev => [newTenant, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'tenants',
          data: newTenant
        });
        
        return newTenant;
      }
    },
    onSuccess: (newTenant) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.tenants, (old: Tenant[] = []) => [
        newTenant,
        ...old
      ]);
      
      toast.success(`Inquilino "${newTenant.name}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao criar inquilino:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para atualizar inquilino
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tenant> }) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const updatedTenant = { ...tenants.find(t => t.id === id), ...updates } as Tenant;
        setLocalTenants(prev => prev.map(t => t.id === id ? updatedTenant : t));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'tenants',
          data: updatedTenant
        });
        
        return updatedTenant;
      }
      try {
        const data = await tenantService.update(id, updates);
        return mappers.tenantFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const updatedTenant = { ...tenants.find(t => t.id === id), ...updates } as Tenant;
        setLocalTenants(prev => prev.map(t => t.id === id ? updatedTenant : t));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'tenants',
          data: updatedTenant
        });
        
        return updatedTenant;
      }
    },
    onSuccess: (updatedTenant) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.tenants, (old: Tenant[] = []) =>
        old.map(tenant => 
          tenant.id === updatedTenant.id ? updatedTenant : tenant
        )
      );
      
      toast.success(`Inquilino "${updatedTenant.name}" atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao atualizar inquilino:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para excluir inquilino
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const tenantToDelete = tenants.find(t => t.id === id);
        setLocalTenants(prev => prev.filter(t => t.id !== id));
        
        // Adicionar à fila de sincronização
        if (tenantToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'tenants',
            data: { id: tenantToDelete.id }
          });
        }
        
        return id;
      }
      try {
        await tenantService.delete(id);
      } catch (error) {
        // Fallback para localStorage
        const tenantToDelete = tenants.find(t => t.id === id);
        setLocalTenants(prev => prev.filter(t => t.id !== id));
        
        // Adicionar à fila de sincronização
        if (tenantToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'tenants',
            data: { id: tenantToDelete.id }
          });
        }
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove do cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.tenants, (old: Tenant[] = []) =>
        old.filter(tenant => tenant.id !== deletedId)
      );
      
      // Invalidar cache de propriedades para atualizar o relacionamento
      queryClient.invalidateQueries(['properties']);
      
      const deletedTenant = tenants.find(t => t.id === deletedId);
      toast.success(`Inquilino "${deletedTenant?.name || 'desconhecido'}" excluído com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao excluir inquilino:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Função para criar novo inquilino
  const addTenant = async (tenantData: Omit<Tenant, 'id'>): Promise<Tenant | null> => {
    try {
      const newTenant = await createMutation.mutateAsync(tenantData);
      return newTenant;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para atualizar inquilino
  const updateTenant = async (id: string, updates: Partial<Tenant>): Promise<Tenant | null> => {
    try {
      const updatedTenant = await updateMutation.mutateAsync({ id, updates });
      return updatedTenant;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para excluir inquilino
  const deleteTenant = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      // Erro já tratado na mutation
      return false;
    }
  };

  // Função para recarregar dados manualmente
  const recarregarDados = () => {
    refetch();
  };

  return {
    // Dados
    tenants: tenants || [],
    
    // Estados de loading
    carregando: carregando || createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
    carregandoBusca: carregando,
    carregandoSalvar: createMutation.isLoading,
    carregandoAtualizar: updateMutation.isLoading,
    carregandoExcluir: deleteMutation.isLoading,
    
    // Estados de erro
    erro: supabaseAvailable ? error : null, // Não mostrar erro se não estiver usando Supabase
    
    // Funções
    addTenant,
    updateTenant,
    deleteTenant,
    recarregarDados,
    setLocalTenants,
    
    // Informações adicionais
    temDados: tenants.length > 0,
    totalTenants: tenants.length,
    usingSupabase: supabaseAvailable
  };
}