import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { EnergyBill } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { energyBillService, mappers } from '../services/supabaseService';
import { useSyncManager } from './useSyncManager';

// Chaves para o cache do React Query
const QUERY_KEYS = {
  energyBills: ['energyBills'] as const,
};

export function useEnergyBills(supabaseAvailable: boolean = false) {
  const queryClient = useQueryClient();
  const { addPendingChange } = useSyncManager();
  
  // Fallback para localStorage quando Supabase não está disponível
  const [localEnergyBills, setLocalEnergyBills] = useLocalStorage<EnergyBill[]>('energyBills', []);

  // Query para buscar todas as contas de energia
  const {
    data: energyBills = [],
    isLoading: carregando,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.energyBills,
    queryFn: async (): Promise<EnergyBill[]> => {
      if (!supabaseAvailable) {
        // Retornar dados do localStorage se Supabase não estiver disponível
        return localEnergyBills;
      }
      try {
        const data = await energyBillService.getAll();
        return data.map(mappers.energyBillFromSupabase);
      } catch (error) {
        console.warn('Supabase indisponível, usando localStorage:', error);
        return localEnergyBills;
      }
    },
    enabled: true, // Sempre executar a query
    retry: false, // Não tentar novamente se falhar
  });

  // Mutation para criar nova conta de energia
  const createMutation = useMutation({
    mutationFn: async (billData: Omit<EnergyBill, 'id' | 'createdAt' | 'lastUpdated'>) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const newBill: EnergyBill = {
          ...billData,
          id: Date.now().toString(),
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        setLocalEnergyBills(prev => [newBill, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'energyBills',
          data: newBill
        });
        
        return newBill;
      }
      try {
        const data = await energyBillService.create(billData);
        return mappers.energyBillFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const newBill: EnergyBill = {
          ...billData,
          id: Date.now().toString(),
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        setLocalEnergyBills(prev => [newBill, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'energyBills',
          data: newBill
        });
        
        return newBill;
      }
    },
    onSuccess: (newBill) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.energyBills, (old: EnergyBill[] = []) => [
        newBill,
        ...old
      ]);
      
      toast.success(`Conta de energia "${newBill.groupName}" criada com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao criar conta de energia:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para atualizar conta de energia
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EnergyBill> }) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const updatedBill = { 
          ...energyBills.find(b => b.id === id), 
          ...updates, 
          lastUpdated: new Date() 
        } as EnergyBill;
        setLocalEnergyBills(prev => prev.map(b => b.id === id ? updatedBill : b));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'energyBills',
          data: updatedBill
        });
        
        return updatedBill;
      }
      try {
        const data = await energyBillService.update(id, updates);
        return mappers.energyBillFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const updatedBill = { 
          ...energyBills.find(b => b.id === id), 
          ...updates, 
          lastUpdated: new Date() 
        } as EnergyBill;
        setLocalEnergyBills(prev => prev.map(b => b.id === id ? updatedBill : b));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'energyBills',
          data: updatedBill
        });
        
        return updatedBill;
      }
    },
    onSuccess: (updatedBill) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.energyBills, (old: EnergyBill[] = []) =>
        old.map(bill => 
          bill.id === updatedBill.id ? updatedBill : bill
        )
      );
      
      toast.success(`Conta de energia "${updatedBill.groupName}" atualizada com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao atualizar conta de energia:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para excluir conta de energia
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const billToDelete = energyBills.find(b => b.id === id);
        setLocalEnergyBills(prev => prev.filter(b => b.id !== id));
        
        // Adicionar à fila de sincronização
        if (billToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'energyBills',
            data: { id: billToDelete.id }
          });
        }
        
        return id;
      }
      try {
        await energyBillService.delete(id);
      } catch (error) {
        // Fallback para localStorage
        const billToDelete = energyBills.find(b => b.id === id);
        setLocalEnergyBills(prev => prev.filter(b => b.id !== id));
        
        // Adicionar à fila de sincronização
        if (billToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'energyBills',
            data: { id: billToDelete.id }
          });
        }
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove do cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.energyBills, (old: EnergyBill[] = []) =>
        old.filter(bill => bill.id !== deletedId)
      );
      
      const deletedBill = energyBills.find(b => b.id === deletedId);
      toast.success(`Conta de energia "${deletedBill?.groupName || 'desconhecida'}" excluída com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao excluir conta de energia:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Função para criar nova conta de energia
  const addEnergyBill = async (billData: Omit<EnergyBill, 'id' | 'createdAt' | 'lastUpdated'>): Promise<EnergyBill | null> => {
    try {
      const newBill = await createMutation.mutateAsync(billData);
      return newBill;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para atualizar conta de energia
  const updateEnergyBill = async (id: string, updates: Partial<EnergyBill>): Promise<EnergyBill | null> => {
    try {
      const updatedBill = await updateMutation.mutateAsync({ id, updates });
      return updatedBill;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para excluir conta de energia
  const deleteEnergyBill = async (id: string): Promise<boolean> => {
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
    energyBills: energyBills || [],
    
    // Estados de loading
    carregando: carregando || createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
    carregandoBusca: carregando,
    carregandoSalvar: createMutation.isLoading,
    carregandoAtualizar: updateMutation.isLoading,
    carregandoExcluir: deleteMutation.isLoading,
    
    // Estados de erro
    erro: supabaseAvailable ? error : null, // Não mostrar erro se não estiver usando Supabase
    
    // Funções
    addEnergyBill,
    updateEnergyBill,
    deleteEnergyBill,
    recarregarDados,
    setLocalEnergyBills,
    
    // Informações adicionais
    temDados: energyBills.length > 0,
    totalEnergyBills: energyBills.length,
    usingSupabase: supabaseAvailable
  };
}