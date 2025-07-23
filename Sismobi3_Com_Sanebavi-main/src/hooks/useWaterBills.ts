import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { WaterBill } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { waterBillService, mappers } from '../services/supabaseService';
import { useSyncManager } from './useSyncManager';

// Chaves para o cache do React Query
const QUERY_KEYS = {
  waterBills: ['waterBills'] as const,
};

export function useWaterBills(supabaseAvailable: boolean = false) {
  const queryClient = useQueryClient();
  const { addPendingChange } = useSyncManager();
  
  // Fallback para localStorage quando Supabase não está disponível
  const [localWaterBills, setLocalWaterBills] = useLocalStorage<WaterBill[]>('waterBills', []);

  // Query para buscar todas as contas de água
  const {
    data: waterBills = [],
    isLoading: carregando,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.waterBills,
    queryFn: async (): Promise<WaterBill[]> => {
      if (!supabaseAvailable) {
        // Retornar dados do localStorage se Supabase não estiver disponível
        return localWaterBills;
      }
      try {
        const data = await waterBillService.getAll();
        return data.map(mappers.waterBillFromSupabase);
      } catch (error) {
        console.warn('Supabase indisponível, usando localStorage:', error);
        return localWaterBills;
      }
    },
    enabled: true, // Sempre executar a query
    retry: false, // Não tentar novamente se falhar
  });

  // Mutation para criar nova conta de água
  const createMutation = useMutation({
    mutationFn: async (billData: Omit<WaterBill, 'id' | 'createdAt' | 'lastUpdated'>) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const newBill: WaterBill = {
          ...billData,
          id: Date.now().toString(),
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        setLocalWaterBills(prev => [newBill, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'waterBills',
          data: newBill
        });
        
        return newBill;
      }
      try {
        const data = await waterBillService.create(billData);
        return mappers.waterBillFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const newBill: WaterBill = {
          ...billData,
          id: Date.now().toString(),
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        setLocalWaterBills(prev => [newBill, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'waterBills',
          data: newBill
        });
        
        return newBill;
      }
    },
    onSuccess: (newBill) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.waterBills, (old: WaterBill[] = []) => [
        newBill,
        ...old
      ]);
      
      toast.success(`Conta de água "${newBill.groupName}" criada com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao criar conta de água:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para atualizar conta de água
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WaterBill> }) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const updatedBill = { 
          ...waterBills.find(b => b.id === id), 
          ...updates, 
          lastUpdated: new Date() 
        } as WaterBill;
        setLocalWaterBills(prev => prev.map(b => b.id === id ? updatedBill : b));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'waterBills',
          data: updatedBill
        });
        
        return updatedBill;
      }
      try {
        const data = await waterBillService.update(id, updates);
        return mappers.waterBillFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const updatedBill = { 
          ...waterBills.find(b => b.id === id), 
          ...updates, 
          lastUpdated: new Date() 
        } as WaterBill;
        setLocalWaterBills(prev => prev.map(b => b.id === id ? updatedBill : b));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'waterBills',
          data: updatedBill
        });
        
        return updatedBill;
      }
    },
    onSuccess: (updatedBill) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.waterBills, (old: WaterBill[] = []) =>
        old.map(bill => 
          bill.id === updatedBill.id ? updatedBill : bill
        )
      );
      
      toast.success(`Conta de água "${updatedBill.groupName}" atualizada com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao atualizar conta de água:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para excluir conta de água
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const billToDelete = waterBills.find(b => b.id === id);
        setLocalWaterBills(prev => prev.filter(b => b.id !== id));
        
        // Adicionar à fila de sincronização
        if (billToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'waterBills',
            data: { id: billToDelete.id }
          });
        }
        
        return id;
      }
      try {
        await waterBillService.delete(id);
      } catch (error) {
        // Fallback para localStorage
        const billToDelete = waterBills.find(b => b.id === id);
        setLocalWaterBills(prev => prev.filter(b => b.id !== id));
        
        // Adicionar à fila de sincronização
        if (billToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'waterBills',
            data: { id: billToDelete.id }
          });
        }
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove do cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.waterBills, (old: WaterBill[] = []) =>
        old.filter(bill => bill.id !== deletedId)
      );
      
      const deletedBill = waterBills.find(b => b.id === deletedId);
      toast.success(`Conta de água "${deletedBill?.groupName || 'desconhecida'}" excluída com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao excluir conta de água:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Função para criar nova conta de água
  const addWaterBill = async (billData: Omit<WaterBill, 'id' | 'createdAt' | 'lastUpdated'>): Promise<WaterBill | null> => {
    try {
      const newBill = await createMutation.mutateAsync(billData);
      return newBill;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para atualizar conta de água
  const updateWaterBill = async (id: string, updates: Partial<WaterBill>): Promise<WaterBill | null> => {
    try {
      const updatedBill = await updateMutation.mutateAsync({ id, updates });
      return updatedBill;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para excluir conta de água
  const deleteWaterBill = async (id: string): Promise<boolean> => {
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
    waterBills: waterBills || [],
    
    // Estados de loading
    carregando: carregando || createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
    carregandoBusca: carregando,
    carregandoSalvar: createMutation.isLoading,
    carregandoAtualizar: updateMutation.isLoading,
    carregandoExcluir: deleteMutation.isLoading,
    
    // Estados de erro
    erro: supabaseAvailable ? error : null, // Não mostrar erro se não estiver usando Supabase
    
    // Funções
    addWaterBill,
    updateWaterBill,
    deleteWaterBill,
    recarregarDados,
    setLocalWaterBills,
    
    // Informações adicionais
    temDados: waterBills.length > 0,
    totalWaterBills: waterBills.length,
    usingSupabase: supabaseAvailable
  };
}