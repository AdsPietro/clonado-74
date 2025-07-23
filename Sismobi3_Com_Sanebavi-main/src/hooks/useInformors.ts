import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Informor } from '../types/informor'
import { informorSchema } from '../schemas/informorSchema'
import { useLocalStorage } from './useLocalStorage';
import { informorService, mappers } from '../services/supabaseService';
import { useSyncManager } from './useSyncManager';
import { testConnection } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';

// Chaves para o cache do React Query
const QUERY_KEYS = {
  informors: ['informors'] as const,
};

export function useInformors(supabaseAvailable?: boolean) {
  const queryClient = useQueryClient();
  const { addPendingChange } = useSyncManager();
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(supabaseAvailable ?? false);
  
  // Fallback para localStorage quando Supabase não está disponível
  const [localInformors, setLocalInformors] = useLocalStorage<Informor[]>('informors-data', []);

  // Verificar disponibilidade do Supabase se não foi fornecida
  useEffect(() => {
    if (supabaseAvailable === undefined) {
      const checkSupabase = async () => {
        const isAvailable = await testConnection();
        setIsSupabaseAvailable(isAvailable);
      };
      checkSupabase();
    } else {
      setIsSupabaseAvailable(supabaseAvailable);
    }
  }, [supabaseAvailable]);

  // Query para buscar todos os informors
  const {
    data: informors = [],
    isLoading: carregando,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.informors,
    queryFn: async (): Promise<Informor[]> => {
      if (!isSupabaseAvailable) {
        // Retornar dados do localStorage se Supabase não estiver disponível
        return localInformors;
      }
      try {
        const data = await informorService.getAll();
        return data.map(mappers.informorFromSupabase);
      } catch (error) {
        console.warn('Supabase indisponível, usando localStorage:', error);
        return localInformors;
      }
    },
    enabled: true, // Sempre executar a query
    retry: false, // Não tentar novamente se falhar
  });

  // Mutation para criar novo informor
  const salvarMutation = useMutation({
    mutationFn: async (informorData: Omit<Informor, 'id'>) => {
      if (!isSupabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const newInformor: Informor = {
          ...informorData,
          id: Date.now().toString()
        };
        setLocalInformors(prev => [...prev, newInformor]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'informors',
          data: newInformor
        });
        
        return newInformor;
      }
      try {
        const data = await informorService.create(informorData);
        return mappers.informorFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const newInformor: Informor = {
          ...informorData,
          id: Date.now().toString()
        };
        setLocalInformors(prev => [...prev, newInformor]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'informors',
          data: newInformor
        });
        
        return newInformor;
      }
    },
    onSuccess: (novoInformor) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.informors, (old: Informor[] = []) => [
        novoInformor,
        ...old
      ]);
      
      toast.success(`Informor "${novoInformor.nome}" criado com sucesso!`);
    },
    onError: (error: any) => {
      console.warn('Erro ao criar informor:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para excluir informor
  const excluirMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const informorToDelete = informors.find(i => i.id === id);
        setLocalInformors(prev => prev.filter(i => i.id !== id));
        
        // Adicionar à fila de sincronização
        if (informorToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'informors',
            data: { id: informorToDelete.id }
          });
        }
        
        return id;
      }
      try {
        await informorService.delete(id);
      } catch (error) {
        // Fallback para localStorage
        const informorToDelete = informors.find(i => i.id === id);
        setLocalInformors(prev => prev.filter(i => i.id !== id));
        
        // Adicionar à fila de sincronização
        if (informorToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'informors',
            data: { id: informorToDelete.id }
          });
        }
      }
      return id;
    },
    onSuccess: (idExcluido) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.informors, (old: Informor[] = []) =>
        old.filter(informor => informor.id !== idExcluido)
      );
      
      const informorExcluido = informors.find(i => i.id === idExcluido);
      toast.success(`Informor "${informorExcluido?.nome || 'desconhecido'}" excluído com sucesso!`);
    },
    onError: (error: any) => {
      console.warn('Erro ao excluir informor:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para atualizar informor
  const atualizarMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Informor> }) => {
      if (!isSupabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const updatedInformor = { ...informors.find(i => i.id === id), ...updates } as Informor;
        setLocalInformors(prev => prev.map(i => i.id === id ? updatedInformor : i));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'informors',
          data: updatedInformor
        });
        
        return updatedInformor;
      }
      try {
        const data = await informorService.update(id, updates);
        return mappers.informorFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const updatedInformor = { ...informors.find(i => i.id === id), ...updates } as Informor;
        setLocalInformors(prev => prev.map(i => i.id === id ? updatedInformor : i));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'informors',
          data: updatedInformor
        });
        
        return updatedInformor;
      }
    },
    onSuccess: (informorAtualizado) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.informors, (old: Informor[] = []) =>
        old.map(informor => 
          informor.id === informorAtualizado.id ? informorAtualizado : informor
        )
      );
      
      toast.success(`Informor "${informorAtualizado.nome}" atualizado com sucesso!`);
    },
    onError: (error: any) => {
      console.warn('Erro ao atualizar informor:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Função para criar novo informor com validação
  const salvarInformor = async (novo: Omit<Informor, 'id'>): Promise<Informor | null> => {
    try {
      // Validar os dados antes de enviar
      const resultado = informorSchema.safeParse({ ...novo, id: 'temp' });
      
      if (!resultado.success) {
        console.error('Erro de validação:', resultado.error.format());
        toast.error('Dados inválidos! Verifique os campos preenchidos.');
        return null;
      }

      // Executar a mutation
      const newInformor = await salvarMutation.mutateAsync(novo);
      return newInformor;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para excluir informor
  const excluirInformor = async (id: string): Promise<boolean> => {
    try {
      await excluirMutation.mutateAsync(id);
      return true;
    } catch (error) {
      // Erro já tratado na mutation
      return false;
    }
  };

  // Função para atualizar informor
  const atualizarInformor = async (id: string, dados: Partial<Omit<Informor, 'id'>>): Promise<Informor | null> => {
    try {
      const updatedInformor = await atualizarMutation.mutateAsync({ id, updates: dados });
      return updatedInformor;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para recarregar dados manualmente
  const recarregarDados = () => {
    refetch();
  };

  return {
    // Dados
    informors: informors || [],
    
    // Estados de loading
    carregando: carregando || salvarMutation.isLoading || excluirMutation.isLoading || atualizarMutation.isLoading,
    carregandoBusca: carregando,
    carregandoSalvar: salvarMutation.isLoading,
    carregandoExcluir: excluirMutation.isLoading,
    carregandoAtualizar: atualizarMutation.isLoading,
    
    // Estados de erro
    erro: isSupabaseAvailable ? error : null, // Não mostrar erro se não estiver usando Supabase
    
    // Funções
    salvarInformor,
    excluirInformor,
    atualizarInformor,
    recarregarDados,
    setLocalInformors,
    
    // Informações adicionais
    temDados: informors.length > 0,
  }
}