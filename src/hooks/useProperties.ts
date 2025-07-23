import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Property } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { propertyService, mappers } from '../services/supabaseService';
import { useSyncManager } from './useSyncManager';

// Chaves para o cache do React Query
const QUERY_KEYS = {
  properties: ['properties'] as const,
};

export function useProperties(supabaseAvailable: boolean = false) {
  const queryClient = useQueryClient();
  const { addPendingChange } = useSyncManager();
  
  // Fallback para localStorage quando Supabase não está disponível
  const [localProperties, setLocalProperties] = useLocalStorage<Property[]>('properties', []);

  // Query para buscar todas as propriedades
  const {
    data: properties = [],
    isLoading: carregando,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.properties,
    queryFn: async (): Promise<Property[]> => {
      if (!supabaseAvailable) {
        // Retornar dados do localStorage se Supabase não estiver disponível
        return localProperties;
      }
      try {
        const data = await propertyService.getAll();
        return data.map(mappers.propertyFromSupabase);
      } catch (error) {
        console.warn('Supabase indisponível, usando localStorage:', error);
        return localProperties;
      }
    },
    enabled: true, // Sempre executar a query
    retry: false, // Não tentar novamente se falhar
  });

  // Mutation para criar nova propriedade
  const createMutation = useMutation({
    mutationFn: async (propertyData: Omit<Property, 'id' | 'createdAt'>) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const newProperty: Property = {
          ...propertyData,
          id: Date.now().toString(),
          createdAt: new Date()
        };
        setLocalProperties(prev => [newProperty, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'properties',
          data: newProperty
        });
        
        return newProperty;
      }
      try {
        const data = await propertyService.create(propertyData);
        return mappers.propertyFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const newProperty: Property = {
          ...propertyData,
          id: Date.now().toString(),
          createdAt: new Date()
        };
        setLocalProperties(prev => [newProperty, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'properties',
          data: newProperty
        });
        
        return newProperty;
      }
    },
    onSuccess: (newProperty) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.properties, (old: Property[] = []) => [
        newProperty,
        ...old
      ]);
      
      // Opcional: revalida os dados do servidor
      // queryClient.invalidateQueries(QUERY_KEYS.properties);
      
      toast.success(`Propriedade "${newProperty.name}" criada com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao criar propriedade:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para atualizar propriedade
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Property> }) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const updatedProperty = { ...properties.find(p => p.id === id), ...updates } as Property;
        setLocalProperties(prev => prev.map(p => p.id === id ? updatedProperty : p));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'properties',
          data: updatedProperty
        });
        
        return updatedProperty;
      }
      try {
        const data = await propertyService.update(id, updates);
        return mappers.propertyFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const updatedProperty = { ...properties.find(p => p.id === id), ...updates } as Property;
        setLocalProperties(prev => prev.map(p => p.id === id ? updatedProperty : p));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'properties',
          data: updatedProperty
        });
        
        return updatedProperty;
      }
    },
    onSuccess: (updatedProperty) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.properties, (old: Property[] = []) =>
        old.map(property => 
          property.id === updatedProperty.id ? updatedProperty : property
        )
      );
      
      toast.success(`Propriedade "${updatedProperty.name}" atualizada com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao atualizar propriedade:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para excluir propriedade
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const propertyToDelete = properties.find(p => p.id === id);
        setLocalProperties(prev => prev.filter(p => p.id !== id));
        
        // Adicionar à fila de sincronização
        if (propertyToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'properties',
            data: { id: propertyToDelete.id }
          });
        }
        
        return id;
      }
      try {
        await propertyService.delete(id);
      } catch (error) {
        // Fallback para localStorage
        const propertyToDelete = properties.find(p => p.id === id);
        setLocalProperties(prev => prev.filter(p => p.id !== id));
        
        // Adicionar à fila de sincronização
        if (propertyToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'properties',
            data: { id: propertyToDelete.id }
          });
        }
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove do cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.properties, (old: Property[] = []) =>
        old.filter(property => property.id !== deletedId)
      );
      
      const deletedProperty = properties.find(p => p.id === deletedId);
      toast.success(`Propriedade "${deletedProperty?.name || 'desconhecida'}" excluída com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao excluir propriedade:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Função para criar nova propriedade
  const addProperty = async (propertyData: Omit<Property, 'id' | 'createdAt'>): Promise<Property | null> => {
    try {
      const newProperty = await createMutation.mutateAsync(propertyData);
      return newProperty;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para atualizar propriedade
  const updateProperty = async (id: string, updates: Partial<Property>): Promise<Property | null> => {
    try {
      // Se estamos atualizando o status da propriedade para 'rented' ou 'vacant',
      // precisamos recarregar os dados para obter as informações atualizadas do inquilino
      const shouldReloadAfterUpdate = updates.status && (updates.status === 'rented' || updates.status === 'vacant');
      
      const updatedProperty = await updateMutation.mutateAsync({ id, updates });
      
      // Recarregar dados se necessário para sincronizar com mudanças de inquilino
      if (shouldReloadAfterUpdate && supabaseAvailable) {
        setTimeout(() => {
          refetch();
        }, 500);
      }
      
      return updatedProperty;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para excluir propriedade
  const deleteProperty = async (id: string): Promise<boolean> => {
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
    properties: properties || [],
    
    // Estados de loading
    carregando: carregando || createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
    carregandoBusca: carregando,
    carregandoSalvar: createMutation.isLoading,
    carregandoAtualizar: updateMutation.isLoading,
    carregandoExcluir: deleteMutation.isLoading,
    
    // Estados de erro
    erro: supabaseAvailable ? error : null, // Não mostrar erro se não estiver usando Supabase
    
    // Funções
    addProperty,
    updateProperty,
    deleteProperty,
    recarregarDados,
    setLocalProperties,
    
    // Informações adicionais
    temDados: properties.length > 0,
    totalProperties: properties.length,
    usingSupabase: supabaseAvailable
  };
}