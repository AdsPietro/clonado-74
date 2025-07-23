import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { useInformors } from '../../hooks/useInformors';
import { InformorsForm } from './InformorsForm';
import { LoadingSpinner, LoadingButton, LoadingOverlay } from '../UI/LoadingSpinner';
import { HighlightCard, AnimatedListItem } from '../UI/HighlightCard';
import { formatCurrency } from '../../utils/calculations';
import { Informor } from '../../types/informor';
import { useActivation } from '../../contexts/ActivationContext';
import { useConfirmationModal } from '../UI/ConfirmationModal';
import { useEnhancedToast } from '../UI/EnhancedToast';
import { testConnection } from '../../lib/supabaseClient';

export const InformorsManager: React.FC = () => {
  const { isDemoMode } = useActivation();
  const [supabaseAvailable, setSupabaseAvailable] = useState(false);
  
  // Verificar disponibilidade do Supabase
  useEffect(() => {
    const checkSupabase = async () => {
      const isAvailable = await testConnection();
      setSupabaseAvailable(isAvailable);
    };
    checkSupabase();
  }, []);
  
  const {
    informors,
    carregando,
    carregandoBusca,
    carregandoSalvar,
    carregandoExcluir,
    carregandoAtualizar,
    salvarInformor,
    excluirInformor,
    atualizarInformor,
    recarregarDados,
    erro
  } = useInformors(supabaseAvailable);

  const [showForm, setShowForm] = useState(false);
  const [editingInformor, setEditingInformor] = useState<Informor | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);

  const { showConfirmation, ConfirmationModalComponent } = useConfirmationModal();
  const toast = useEnhancedToast();

  // Configurações do modo DEMO
  const DEMO_LIMITS = {
    maxInformors: 10
  };

  const isAtDemoLimit = isDemoMode && informors.length >= DEMO_LIMITS.maxInformors;

  // Limpar destaque após um tempo
  useEffect(() => {
    if (highlightedId) {
      const timer = setTimeout(() => {
        setHighlightedId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedId]);

  // Limpar animação de novo item
  useEffect(() => {
    if (newItemId) {
      const timer = setTimeout(() => {
        setNewItemId(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [newItemId]);

  const handleSalvar = async (dados: Omit<Informor, 'id'>) => {
    if (isAtDemoLimit) {
      toast.demoLimit('informors', DEMO_LIMITS.maxInformors);
      return; // Não permite adicionar se estiver no limite do demo
    }
    
    const newInformor = await salvarInformor(dados);
    if (newInformor) {
      setShowForm(false);
      setEditingInformor(null);
      
      // Destacar o novo item usando o ID retornado
      setHighlightedId(newInformor.id);
      setNewItemId(newInformor.id);
      
      // Limpar destaque após 3 segundos
      setTimeout(() => setHighlightedId(null), 3000);
      setTimeout(() => setNewItemId(null), 1000);
    }
  };

  const handleAtualizar = async (dados: Omit<Informor, 'id'>) => {
    if (!editingInformor) return;
    
    const updatedInformor = await atualizarInformor(editingInformor.id, dados);
    if (updatedInformor) {
      setShowForm(false);
      setEditingInformor(null);
      setHighlightedId(updatedInformor.id);
      setTimeout(() => setHighlightedId(null), 3000);
    }
  };

  const handleExcluir = async (id: string) => {
    const informor = informors.find(i => i.id === id);
    showConfirmation({
      title: 'Excluir Informor',
      message: `Tem certeza que deseja excluir "${informor?.nome}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      type: 'danger',
      onConfirm: async () => {
        const success = await excluirInformor(id);
        if (success) {
          toast.deleted('Informor');
        }
      }
    });
  };

  const handleEditar = (informor: Informor) => {
    setEditingInformor(informor);
    setShowForm(true);
  };

  const getStatusColor = (vencimento: string) => {
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    const diffDias = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffDias < 0) return 'text-red-600 bg-red-50';
    if (diffDias <= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (vencimento: string) => {
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    const diffDias = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

    if (diffDias < 0) return `Vencido há ${Math.abs(diffDias)} dia(s)`;
    if (diffDias === 0) return 'Vence hoje';
    if (diffDias <= 7) return `Vence em ${diffDias} dia(s)`;
    return `Vence em ${diffDias} dia(s)`;
  };

  if (erro) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Informors</h2>
          <LoadingButton
            loading={carregandoBusca}
            onClick={recarregarDados}
            variant="secondary"
          >
            Tentar Novamente
          </LoadingButton>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-medium">Erro ao carregar dados</h3>
            <p className="text-red-600 text-sm mt-1">
              {erro instanceof Error ? erro.message : 'Erro desconhecido'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Informors</h2>
          {isDemoMode ? (
            <p className="text-sm text-orange-600 mt-1">
              Modo DEMO: {informors.length}/{DEMO_LIMITS.maxInformors} informors utilizados
            </p>
          ) : (
            <p className="text-gray-600 mt-1">
              {carregandoBusca ? (
                <span className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Carregando informors...</span>
                </span>
              ) : (
                `${informors.length} informor${informors.length !== 1 ? 's' : ''} cadastrado${informors.length !== 1 ? 's' : ''}`
              )}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <LoadingButton
            loading={carregandoBusca}
            onClick={recarregarDados}
            variant="secondary"
          >
            Recarregar
          </LoadingButton>
          <LoadingButton
            loading={false}
            onClick={() => setShowForm(true)}
            disabled={isAtDemoLimit}
            variant={isAtDemoLimit ? 'secondary' : 'primary'}
            title={isAtDemoLimit ? 'Limite do modo DEMO atingido' : 'Adicionar novo informor'}
          >
            <Plus className="w-4 h-4" />
            Novo Informor
          </LoadingButton>
          {isAtDemoLimit && (
            <p className="text-xs text-red-600 text-right max-w-xs">
              Limite de {DEMO_LIMITS.maxInformors} informors atingido no modo DEMO. 
              Ative o sistema para cadastros ilimitados.
            </p>
          )}
        </div>
      </div>

      {/* Aviso do modo DEMO */}
      {isDemoMode && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <h3 className="text-orange-800 font-medium">Modo DEMO Ativo</h3>
          </div>
          <p className="text-orange-700 text-sm mt-1">
            Você pode cadastrar até {DEMO_LIMITS.maxInformors} informors. 
            Para acesso ilimitado, ative o sistema na aba "Ativação".
          </p>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <LoadingOverlay loading={carregandoSalvar || carregandoAtualizar}>
            <InformorsForm
              informor={editingInformor}
              onSubmit={editingInformor ? handleAtualizar : handleSalvar}
              onCancel={() => {
                setShowForm(false);
                setEditingInformor(null);
              }}
              loading={carregandoSalvar || carregandoAtualizar}
            />
          </LoadingOverlay>
        </div>
      )}

      {/* Lista de Informors */}
      <LoadingOverlay loading={carregandoBusca} message="Carregando informors...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {informors.map((informor) => (
            <AnimatedListItem
              key={informor.id}
              isNew={newItemId === informor.id}
            >
              <HighlightCard
                isHighlighted={highlightedId === informor.id}
                className="p-6 h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {informor.nome}
                  </h3>
                  <div className="flex space-x-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEditar(informor)}
                      disabled={carregando}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <LoadingButton
                      loading={carregandoExcluir}
                      onClick={() => handleExcluir(informor.id)}
                      variant="danger"
                      className="p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </LoadingButton>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="font-medium text-green-600">
                      {formatCurrency(informor.valor)}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">
                      {new Date(informor.vencimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(informor.vencimento)}`}>
                    {getStatusText(informor.vencimento)}
                  </div>
                </div>
              </HighlightCard>
            </AnimatedListItem>
          ))}
        </div>
      </LoadingOverlay>

      {/* Estado vazio */}
      {!carregandoBusca && informors.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">Nenhum informor cadastrado</p>
          <p className="text-gray-400 mt-2">Comece adicionando seu primeiro informor</p>
          <LoadingButton
            loading={false}
            onClick={() => setShowForm(true)}
            variant="primary"
            className="mt-4"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Informor
          </LoadingButton>
        </div>
      )}
      
      {ConfirmationModalComponent}
    </div>
  );
};