import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Phone, Mail, Calendar, Users } from 'lucide-react';
import { Tenant } from '../../types';
import { TenantForm } from './TenantForm';
import { formatDate, formatCurrencyWithVisibility } from '../../utils/calculations';
import { useActivation } from '../../contexts/ActivationContext';
import { LoadingButton, LoadingOverlay } from '../UI/LoadingSpinner';
import { HighlightCard, AnimatedListItem } from '../UI/HighlightCard';
import { useConfirmationModal } from '../UI/ConfirmationModal';
import { useEnhancedToast } from '../UI/EnhancedToast';

interface TenantManagerProps {
  tenants: Tenant[];
  loading?: boolean;
  error?: Error | null;
  properties: any[];
  showFinancialValues: boolean;
  onAddTenant: (tenant: Omit<Tenant, 'id'>) => Promise<boolean>;
  onUpdateTenant: (id: string, tenant: Partial<Tenant>) => Promise<boolean>;
  onDeleteTenant: (id: string) => Promise<boolean>;
  onReload?: () => void;
}

export const TenantManager: React.FC<TenantManagerProps> = ({
  tenants,
  loading: externalLoading = false,
  error: externalError = null,
  properties,
  showFinancialValues,
  onAddTenant,
  onUpdateTenant,
  onDeleteTenant,
  onReload
}) => {
  const { isDemoMode } = useActivation();
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);

  const { showConfirmation, ConfirmationModalComponent } = useConfirmationModal();
  const toast = useEnhancedToast();

  // Configurações do modo DEMO
  const DEMO_LIMITS = {
    maxTenants: 10
  };

  const isAtDemoLimit = isDemoMode && tenants.length >= DEMO_LIMITS.maxTenants;
  const canAddTenant = !isDemoMode || tenants.length < DEMO_LIMITS.maxTenants;
  
  // Combinar estados de loading
  const loading = externalLoading || internalLoading;
  
  const handleAddTenant = async (tenantData: Omit<Tenant, 'id'>) => {
    if (isAtDemoLimit) {
      toast.demoLimit('inquilinos', DEMO_LIMITS.maxTenants);
      return; // Não permite adicionar se estiver no limite do demo
    }
    setInternalLoading(true);
    
    try {
      const newTenant = await onAddTenant(tenantData);
      if (newTenant) {
        setShowForm(false);
        
        // Destacar o novo item usando o ID retornado
        setHighlightedId(newTenant.id);
        setNewItemId(newTenant.id);
        
        // Limpar destaque após 3 segundos
        setTimeout(() => setHighlightedId(null), 3000);
        setTimeout(() => setNewItemId(null), 1000);
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowForm(true);
  };

  const handleUpdateTenant = async (tenantData: Omit<Tenant, 'id'>) => {
    if (editingTenant) {
      setInternalLoading(true);
      
      try {
        const updatedTenant = await onUpdateTenant(editingTenant.id, tenantData);
        if (updatedTenant) {
          setEditingTenant(null);
          setShowForm(false);
          
          // Destacar o item editado
          setHighlightedId(updatedTenant.id);
          setTimeout(() => setHighlightedId(null), 3000);
        }
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const handleDeleteTenant = (tenant: Tenant) => {
    showConfirmation({
      title: 'Excluir Inquilino',
      message: `Tem certeza que deseja excluir "${tenant.name}"? Esta ação removerá o vínculo com a propriedade e não pode ser desfeita.`,
      confirmText: 'Excluir',
      type: 'danger',
      onConfirm: async () => {
        const success = await onDeleteTenant(tenant.id);
        if (success) {
          toast.deleted('Inquilino');
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      default: return 'Indefinido';
    }
  };

  // Mostrar erro se houver
  if (externalError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Inquilinos</h2>
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
            <h3 className="text-red-800 font-medium">Erro ao carregar inquilinos</h3>
            <p className="text-red-600 text-sm mt-1">
              {externalError instanceof Error ? externalError.message : 'Erro desconhecido'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Inquilinos</h2>
          {isDemoMode ? (
            <p className="text-sm text-orange-600 mt-1">
              Modo DEMO: {tenants.length}/{DEMO_LIMITS.maxTenants} inquilinos utilizados
            </p>
          ) : (
            <p className="text-gray-600 mt-1">
              {loading && tenants.length === 0 ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  <span>Carregando inquilinos...</span>
                </span>
              ) : (
                `${tenants.length} inquilino${tenants.length !== 1 ? 's' : ''} cadastrado${tenants.length !== 1 ? 's' : ''}`
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
            title={isAtDemoLimit ? 'Limite do modo DEMO atingido' : 'Adicionar novo inquilino'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Inquilino
          </LoadingButton>
          {isAtDemoLimit && (
            <p className="text-xs text-red-600 text-right max-w-xs">
              Limite de {DEMO_LIMITS.maxTenants} inquilinos atingido no modo DEMO. 
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
            Você pode cadastrar até {DEMO_LIMITS.maxTenants} inquilinos. 
            Para acesso ilimitado, ative o sistema na aba "Ativação".
          </p>
        </div>
      )}

      {showForm && (
        <LoadingOverlay loading={loading} message={editingTenant ? "Atualizando inquilino..." : "Criando inquilino..."}>
          <TenantForm
            tenant={editingTenant}
            properties={properties}
            onSubmit={editingTenant ? handleUpdateTenant : handleAddTenant}
            onCancel={() => {
              setShowForm(false);
              setEditingTenant(null);
            }}
          />
        </LoadingOverlay>
      )}

      {/* Lista de Inquilinos */}
      <LoadingOverlay loading={loading && tenants.length === 0} message="Carregando inquilinos...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => {
            const linkedProperty = properties.find(p => p.id === tenant.propertyId);
            return (
              <AnimatedListItem
                key={tenant.id}
                isNew={newItemId === tenant.id}
              >
                <HighlightCard
                  isHighlighted={highlightedId === tenant.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 h-full"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{tenant.name}</h3>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tenant.status)}`}>
                            {getStatusText(tenant.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="text-sm">{tenant.email}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-2" />
                        <span className="text-sm">{tenant.phone}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">Início: {formatDate(tenant.startDate)}</span>
                      </div>
                      {tenant.agreedPaymentDate && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="text-sm">Pagamento: {formatDate(tenant.agreedPaymentDate)}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <p>Propriedade: {linkedProperty?.name || 'Não vinculada'}</p>
                      {tenant.cpf && <p>CPF: {tenant.cpf}</p>}
                      <p>Aluguel: {formatCurrencyWithVisibility(tenant.monthlyRent, showFinancialValues)}</p>
                      <p>Calção: {formatCurrencyWithVisibility(tenant.deposit, showFinancialValues)}</p>
                      {tenant.paymentMethod && (
                        <p>Pagamento: {tenant.paymentMethod}{tenant.installments && tenant.paymentMethod === 'A prazo' ? ` (${tenant.installments})` : ''}</p>
                      )}
                      {tenant.depositPaidInstallments && (
                        <p>Calção pago: {tenant.depositPaidInstallments.filter(Boolean).length}/{tenant.depositPaidInstallments.length} parcelas</p>
                      )}
                      {tenant.formalizedContract !== undefined && (
                        <p>Contrato: {tenant.formalizedContract ? 'Formalizado' : 'Não formalizado'}</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditTenant(tenant)}
                        disabled={loading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(tenant)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </HighlightCard>
              </AnimatedListItem>
            );
          })}
        </div>
      </LoadingOverlay>

      {!loading && tenants.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum inquilino cadastrado</h3>
            <p className="text-gray-500 mb-6">
              Adicione inquilinos para começar a gerenciar seus contratos e pagamentos de forma organizada.
            </p>
            <LoadingButton
              loading={loading}
              onClick={() => setShowForm(true)}
              disabled={isAtDemoLimit}
              variant="primary"
              className="px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar Primeiro Inquilino
            </LoadingButton>
          </div>
        </div>
      )}
      
      {ConfirmationModalComponent}
    </div>
  );
};