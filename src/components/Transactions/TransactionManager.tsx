import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar, DollarSign, Tag, Filter } from 'lucide-react';
import { Transaction } from '../../types';
import { TransactionForm } from './TransactionForm';
import { formatCurrencyWithVisibility, formatDate } from '../../utils/calculations';
import { useActivation } from '../../contexts/ActivationContext';
import { LoadingButton, LoadingOverlay } from '../UI/LoadingSpinner';
import { useConfirmationModal } from '../UI/ConfirmationModal';
import { useEnhancedToast } from '../UI/EnhancedToast';

interface TransactionManagerProps {
  transactions: Transaction[];
  loading?: boolean;
  error?: Error | null;
  properties: any[];
  showFinancialValues: boolean;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
  onUpdateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<boolean>;
  onDeleteTransaction: (id: string) => Promise<boolean>;
  onReload?: () => void;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({
  transactions,
  loading: externalLoading = false,
  error: externalError = null,
  properties,
  showFinancialValues,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onReload
}) => {
  const { isDemoMode } = useActivation();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [internalLoading, setInternalLoading] = useState(false);

  const { showConfirmation, ConfirmationModalComponent } = useConfirmationModal();
  const toast = useEnhancedToast();

  // Configurações do modo DEMO
  const DEMO_LIMITS = {
    maxTransactions: 50
  };

  const isAtDemoLimit = isDemoMode && transactions.length >= DEMO_LIMITS.maxTransactions;
  
  // Combinar estados de loading
  const loading = externalLoading || internalLoading;

  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (isAtDemoLimit) {
      toast.demoLimit('transações', DEMO_LIMITS.maxTransactions);
      return; // Não permite adicionar se estiver no limite do demo
    }
    setInternalLoading(true);
    
    try {
      const newTransaction = await onAddTransaction(transactionData);
      if (newTransaction) {
        setShowForm(false);
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleUpdateTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      setInternalLoading(true);
      
      try {
        const updatedTransaction = await onUpdateTransaction(editingTransaction.id, transactionData);
        if (updatedTransaction) {
          setEditingTransaction(null);
          setShowForm(false);
        }
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    showConfirmation({
      title: 'Excluir Transação',
      message: `Tem certeza que deseja excluir a transação "${transaction.category} - ${transaction.description}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      type: 'danger',
      onConfirm: async () => {
        const success = await onDeleteTransaction(transaction.id);
        if (success) {
          toast.deleted('Transação');
        }
      }
    });
  };

  // Mostrar erro se houver
  if (externalError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Transações</h2>
          {onReload && (
            <LoadingButton
              loading={loading}
              onClick={onReload}
              variant="secondary"
            >
              Tentar Novamente
            </LoadingButton>
          )}
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center space-x-3">
          <div className="w-6 h-6 text-red-600 flex-shrink-0">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Erro ao carregar transações</h3>
            <p className="text-red-600 text-sm mt-1">
              {externalError instanceof Error ? externalError.message : 'Erro desconhecido'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(transaction => {
    const typeMatch = filter === 'all' || transaction.type === filter;
    const categoryMatch = categoryFilter === 'all' || transaction.category === categoryFilter;
    return typeMatch && categoryMatch;
  });

  const categories = [...new Set(transactions.map(t => t.category))];

  const getTransactionColor = (type: string) => {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionIcon = (type: string) => {
    return type === 'income' ? '+' : '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Transações</h2>
          {isDemoMode ? (
            <p className="text-sm text-orange-600 mt-1">
              Modo DEMO: {transactions.length}/{DEMO_LIMITS.maxTransactions} transações utilizadas
            </p>
          ) : (
            <p className="text-gray-600 mt-1">
              {loading && transactions.length === 0 ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  <span>Carregando transações...</span>
                </span>
              ) : (
                `${transactions.length} transação${transactions.length !== 1 ? 'ões' : ''} cadastrada${transactions.length !== 1 ? 's' : ''}`
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end space-y-2">
          {onReload && (
            <LoadingButton
              loading={loading}
              onClick={onReload}
              variant="secondary"
            >
              Recarregar
            </LoadingButton>
          )}
          <LoadingButton
            loading={loading}
            onClick={() => setShowForm(true)}
            disabled={isAtDemoLimit}
            variant={isAtDemoLimit ? 'secondary' : 'primary'}
            title={isAtDemoLimit ? 'Limite do modo DEMO atingido' : 'Adicionar nova transação'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </LoadingButton>
          {isAtDemoLimit && (
            <p className="text-xs text-red-600 text-right max-w-xs">
              Limite de {DEMO_LIMITS.maxTransactions} transações atingido no modo DEMO. 
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
            Você pode cadastrar até {DEMO_LIMITS.maxTransactions} transações. 
            Para acesso ilimitado, ative o sistema na aba "Ativação".
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'income' | 'expense')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <LoadingOverlay loading={loading} message={editingTransaction ? "Atualizando transação..." : "Criando transação..."}>
          <TransactionForm
            transaction={editingTransaction}
            properties={properties}
            onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
            onCancel={() => {
              setShowForm(false);
              setEditingTransaction(null);
            }}
          />
        </LoadingOverlay>
      )}

      {/* Lista de Transações */}
      <LoadingOverlay loading={loading} message="Processando transação...">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Propriedade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.map((transaction) => {
                const property = properties.find(p => p.id === transaction.propertyId);
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(transaction.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{property?.name || 'Propriedade não encontrada'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Tag className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{transaction.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{transaction.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                          {getTransactionIcon(transaction.type)}{formatCurrencyWithVisibility(transaction.amount, showFinancialValues)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditTransaction(transaction)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      </LoadingOverlay>

      {!loading && filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-10 h-10 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {transactions.length === 0 ? 'Nenhuma transação registrada' : 'Nenhuma transação encontrada'}
            </h3>
            <p className="text-gray-500 mb-6">
              {transactions.length === 0 
                ? 'Registre receitas e despesas para ter controle total das suas finanças imobiliárias.'
                : 'Tente ajustar os filtros ou adicionar novas transações para ver os dados aqui.'
              }
            </p>
            <LoadingButton
              loading={loading}
              onClick={() => setShowForm(true)}
              disabled={isAtDemoLimit}
              variant="primary"
              className="px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              {transactions.length === 0 ? 'Registrar Primeira Transação' : 'Nova Transação'}
            </LoadingButton>
          </div>
        </div>
      )}
      
      {ConfirmationModalComponent}
    </div>
  );
};