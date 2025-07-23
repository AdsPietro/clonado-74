import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Transaction } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { transactionService, mappers } from '../services/supabaseService';
import { useSyncManager } from './useSyncManager';

// Chaves para o cache do React Query
const QUERY_KEYS = {
  transactions: ['transactions'] as const,
};

export function useTransactions(supabaseAvailable: boolean = false) {
  const queryClient = useQueryClient();
  const { addPendingChange } = useSyncManager();
  
  // Fallback para localStorage quando Supabase não está disponível
  const [localTransactions, setLocalTransactions] = useLocalStorage<Transaction[]>('transactions', []);

  // Query para buscar todas as transações
  const {
    data: transactions = [],
    isLoading: carregando,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.transactions,
    queryFn: async (): Promise<Transaction[]> => {
      if (!supabaseAvailable) {
        // Retornar dados do localStorage se Supabase não estiver disponível
        return localTransactions;
      }
      try {
        const data = await transactionService.getAll();
        return data.map(mappers.transactionFromSupabase);
      } catch (error) {
        console.warn('Supabase indisponível, usando localStorage:', error);
        return localTransactions;
      }
    },
    enabled: true, // Sempre executar a query
    retry: false, // Não tentar novamente se falhar
  });

  // Mutation para criar nova transação
  const createMutation = useMutation({
    mutationFn: async (transactionData: Omit<Transaction, 'id'>) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const newTransaction: Transaction = {
          ...transactionData,
          id: Date.now().toString()
        };
        setLocalTransactions(prev => [newTransaction, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'transactions',
          data: newTransaction
        });
        
        return newTransaction;
      }
      try {
        const data = await transactionService.create(transactionData);
        return mappers.transactionFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const newTransaction: Transaction = {
          ...transactionData,
          id: Date.now().toString()
        };
        setLocalTransactions(prev => [newTransaction, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'transactions',
          data: newTransaction
        });
        
        return newTransaction;
      }
    },
    onSuccess: (newTransaction) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.transactions, (old: Transaction[] = []) => [
        newTransaction,
        ...old
      ]);
      
      toast.success(`Transação "${newTransaction.category}" criada com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao criar transação:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para atualizar transação
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const updatedTransaction = { ...transactions.find(t => t.id === id), ...updates } as Transaction;
        setLocalTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'transactions',
          data: updatedTransaction
        });
        
        return updatedTransaction;
      }
      try {
        const data = await transactionService.update(id, updates);
        return mappers.transactionFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const updatedTransaction = { ...transactions.find(t => t.id === id), ...updates } as Transaction;
        setLocalTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'transactions',
          data: updatedTransaction
        });
        
        return updatedTransaction;
      }
    },
    onSuccess: (updatedTransaction) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.transactions, (old: Transaction[] = []) =>
        old.map(transaction => 
          transaction.id === updatedTransaction.id ? updatedTransaction : transaction
        )
      );
      
      toast.success(`Transação "${updatedTransaction.category}" atualizada com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao atualizar transação:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para excluir transação
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const transactionToDelete = transactions.find(t => t.id === id);
        setLocalTransactions(prev => prev.filter(t => t.id !== id));
        
        // Adicionar à fila de sincronização
        if (transactionToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'transactions',
            data: { id: transactionToDelete.id }
          });
        }
        
        return id;
      }
      try {
        await transactionService.delete(id);
      } catch (error) {
        // Fallback para localStorage
        const transactionToDelete = transactions.find(t => t.id === id);
        setLocalTransactions(prev => prev.filter(t => t.id !== id));
        
        // Adicionar à fila de sincronização
        if (transactionToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'transactions',
            data: { id: transactionToDelete.id }
          });
        }
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove do cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.transactions, (old: Transaction[] = []) =>
        old.filter(transaction => transaction.id !== deletedId)
      );
      
      const deletedTransaction = transactions.find(t => t.id === deletedId);
      toast.success(`Transação "${deletedTransaction?.category || 'desconhecida'}" excluída com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao excluir transação:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Função para criar nova transação
  const addTransaction = async (transactionData: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
    try {
      const newTransaction = await createMutation.mutateAsync(transactionData);
      return newTransaction;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para atualizar transação
  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
    try {
      const updatedTransaction = await updateMutation.mutateAsync({ id, updates });
      return updatedTransaction;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para excluir transação
  const deleteTransaction = async (id: string): Promise<boolean> => {
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
    transactions: transactions || [],
    
    // Estados de loading
    carregando: carregando || createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
    carregandoBusca: carregando,
    carregandoSalvar: createMutation.isLoading,
    carregandoAtualizar: updateMutation.isLoading,
    carregandoExcluir: deleteMutation.isLoading,
    
    // Estados de erro
    erro: supabaseAvailable ? error : null, // Não mostrar erro se não estiver usando Supabase
    
    // Funções
    addTransaction,
    updateTransaction,
    deleteTransaction,
    recarregarDados,
    setLocalTransactions,
    
    // Informações adicionais
    temDados: transactions.length > 0,
    totalTransactions: transactions.length,
    usingSupabase: supabaseAvailable
  };
}