import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Document } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { documentService, mappers } from '../services/supabaseService';
import { useSyncManager } from './useSyncManager';

// Chaves para o cache do React Query
const QUERY_KEYS = {
  documents: ['documents'] as const,
};

export function useDocuments(supabaseAvailable: boolean = false) {
  const queryClient = useQueryClient();
  const { addPendingChange } = useSyncManager();
  
  // Fallback para localStorage quando Supabase não está disponível
  const [localDocuments, setLocalDocuments] = useLocalStorage<Document[]>('documents', []);

  // Query para buscar todos os documentos
  const {
    data: documents = [],
    isLoading: carregando,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.documents,
    queryFn: async (): Promise<Document[]> => {
      if (!supabaseAvailable) {
        // Retornar dados do localStorage se Supabase não estiver disponível
        return localDocuments;
      }
      try {
        const data = await documentService.getAll();
        return data.map(mappers.documentFromSupabase);
      } catch (error) {
        console.warn('Supabase indisponível, usando localStorage:', error);
        return localDocuments;
      }
    },
    enabled: true, // Sempre executar a query
    retry: false, // Não tentar novamente se falhar
  });

  // Mutation para criar novo documento
  const createMutation = useMutation({
    mutationFn: async (documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const newDocument: Document = {
          ...documentData,
          id: Date.now().toString(),
          lastUpdated: new Date()
        };
        setLocalDocuments(prev => [newDocument, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'documents',
          data: newDocument
        });
        
        return newDocument;
      }
      try {
        const data = await documentService.create(documentData);
        return mappers.documentFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const newDocument: Document = {
          ...documentData,
          id: Date.now().toString(),
          lastUpdated: new Date()
        };
        setLocalDocuments(prev => [newDocument, ...prev]);
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'create',
          entity: 'documents',
          data: newDocument
        });
        
        return newDocument;
      }
    },
    onSuccess: (newDocument) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.documents, (old: Document[] = []) => [
        newDocument,
        ...old
      ]);
      
      toast.success(`Documento "${newDocument.type}" criado com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao criar documento:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para atualizar documento
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Document> }) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const updatedDocument = { 
          ...documents.find(d => d.id === id), 
          ...updates, 
          lastUpdated: new Date() 
        } as Document;
        setLocalDocuments(prev => prev.map(d => d.id === id ? updatedDocument : d));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'documents',
          data: updatedDocument
        });
        
        return updatedDocument;
      }
      try {
        const data = await documentService.update(id, updates);
        return mappers.documentFromSupabase(data);
      } catch (error) {
        // Fallback para localStorage
        const updatedDocument = { 
          ...documents.find(d => d.id === id), 
          ...updates, 
          lastUpdated: new Date() 
        } as Document;
        setLocalDocuments(prev => prev.map(d => d.id === id ? updatedDocument : d));
        
        // Adicionar à fila de sincronização
        addPendingChange({
          type: 'update',
          entity: 'documents',
          data: updatedDocument
        });
        
        return updatedDocument;
      }
    },
    onSuccess: (updatedDocument) => {
      // Atualiza o cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.documents, (old: Document[] = []) =>
        old.map(document => 
          document.id === updatedDocument.id ? updatedDocument : document
        )
      );
      
      toast.success(`Documento "${updatedDocument.type}" atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao atualizar documento:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Mutation para excluir documento
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!supabaseAvailable) {
        // Usar localStorage se Supabase não estiver disponível
        const documentToDelete = documents.find(d => d.id === id);
        setLocalDocuments(prev => prev.filter(d => d.id !== id));
        
        // Adicionar à fila de sincronização
        if (documentToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'documents',
            data: { id: documentToDelete.id }
          });
        }
        
        return id;
      }
      try {
        await documentService.delete(id);
      } catch (error) {
        // Fallback para localStorage
        const documentToDelete = documents.find(d => d.id === id);
        setLocalDocuments(prev => prev.filter(d => d.id !== id));
        
        // Adicionar à fila de sincronização
        if (documentToDelete) {
          addPendingChange({
            type: 'delete',
            entity: 'documents',
            data: { id: documentToDelete.id }
          });
        }
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove do cache local imediatamente
      queryClient.setQueryData(QUERY_KEYS.documents, (old: Document[] = []) =>
        old.filter(document => document.id !== deletedId)
      );
      
      const deletedDocument = documents.find(d => d.id === deletedId);
      toast.success(`Documento "${deletedDocument?.type || 'desconhecido'}" excluído com sucesso!`);
    },
    onError: (error: Error) => {
      console.warn('Erro ao excluir documento:', error);
      // Não mostrar erro se estiver usando localStorage como fallback
    }
  });

  // Função para criar novo documento
  const addDocument = async (documentData: Omit<Document, 'id' | 'lastUpdated'>): Promise<Document | null> => {
    try {
      const newDocument = await createMutation.mutateAsync(documentData);
      return newDocument;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para atualizar documento
  const updateDocument = async (id: string, updates: Partial<Document>): Promise<Document | null> => {
    try {
      const updatedDocument = await updateMutation.mutateAsync({ id, updates });
      return updatedDocument;
    } catch (error) {
      // Erro já tratado na mutation
      return null;
    }
  };

  // Função para excluir documento
  const deleteDocument = async (id: string): Promise<boolean> => {
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
    documents: documents || [],
    
    // Estados de loading
    carregando: carregando || createMutation.isLoading || updateMutation.isLoading || deleteMutation.isLoading,
    carregandoBusca: carregando,
    carregandoSalvar: createMutation.isLoading,
    carregandoAtualizar: updateMutation.isLoading,
    carregandoExcluir: deleteMutation.isLoading,
    
    // Estados de erro
    erro: supabaseAvailable ? error : null, // Não mostrar erro se não estiver usando Supabase
    
    // Funções
    addDocument,
    updateDocument,
    deleteDocument,
    recarregarDados,
    setLocalDocuments,
    
    // Informações adicionais
    temDados: documents.length > 0,
    totalDocuments: documents.length,
    usingSupabase: supabaseAvailable
  };
}