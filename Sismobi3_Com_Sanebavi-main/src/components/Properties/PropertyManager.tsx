import React, { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, DollarSign, Building } from 'lucide-react';
import { Property } from '../../types';
import { PropertyForm } from './PropertyForm';
import { formatCurrencyWithVisibility } from '../../utils/calculations';
import { useActivation } from '../../contexts/ActivationContext';
import { LoadingButton, LoadingOverlay } from '../UI/LoadingSpinner';
import { HighlightCard, AnimatedListItem } from '../UI/HighlightCard';
import { useConfirmationModal } from '../UI/ConfirmationModal';
import { useEnhancedToast } from '../UI/EnhancedToast';

interface PropertyManagerProps {
  properties: Property[];
  loading?: boolean;
  error?: Error | null;
  showFinancialValues: boolean;
  onAddProperty: (property: Omit<Property, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateProperty: (id: string, property: Partial<Property>) => Promise<boolean>;
  onDeleteProperty: (id: string) => Promise<boolean>;
  onReload?: () => void;
}

export const PropertyManager: React.FC<PropertyManagerProps> = ({
  properties,
  loading: externalLoading = false,
  error: externalError = null,
  showFinancialValues,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
  onReload
}) => {
  const { isDemoMode } = useActivation();
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);

  const { showConfirmation, ConfirmationModalComponent } = useConfirmationModal();
  const toast = useEnhancedToast();

  // Configurações do modo DEMO
  const DEMO_LIMITS = {
    maxProperties: 5
  };

  const isAtDemoLimit = isDemoMode && properties.length >= DEMO_LIMITS.maxProperties;
  const canAddProperty = !isDemoMode || properties.length < DEMO_LIMITS.maxProperties;
  
  // Combinar estados de loading
  const loading = externalLoading || internalLoading;
  
  const handleAddProperty = async (propertyData: Omit<Property, 'id' | 'createdAt'>) => {
    if (isAtDemoLimit) {
      toast.demoLimit('propriedades', DEMO_LIMITS.maxProperties);
      return; // Não permite adicionar se estiver no limite do demo
    }
    setInternalLoading(true);
    
    try {
      const newProperty = await onAddProperty(propertyData);
      if (newProperty) {
        setShowForm(false);
        
        // Destacar o novo item usando o ID retornado
        setHighlightedId(newProperty.id);
        setNewItemId(newProperty.id);
        
        // Limpar destaque após 3 segundos
        setTimeout(() => setHighlightedId(null), 3000);
        setTimeout(() => setNewItemId(null), 1000);
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setShowForm(true);
  };

  const handleUpdateProperty = async (propertyData: Omit<Property, 'id' | 'createdAt'>) => {
    if (editingProperty) {
      setInternalLoading(true);
      
      try {
        const updatedProperty = await onUpdateProperty(editingProperty.id, propertyData);
        if (updatedProperty) {
          setEditingProperty(null);
          setShowForm(false);
          
          // Destacar o item editado
          setHighlightedId(updatedProperty.id);
          setTimeout(() => setHighlightedId(null), 3000);
        }
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const handleDeleteProperty = (property: Property) => {
    showConfirmation({
      title: 'Excluir Propriedade',
      message: `Tem certeza que deseja excluir "${property.name}"? Esta ação não pode ser desfeita e removerá todas as transações relacionadas.`,
      confirmText: 'Excluir',
      type: 'danger',
      onConfirm: async () => {
        const success = await onDeleteProperty(property.id);
        if (success) {
          toast.deleted('Propriedade');
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rented': return 'bg-green-100 text-green-800';
      case 'vacant': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rented': return 'Alugado';
      case 'vacant': return 'Vago';
      case 'maintenance': return 'Manutenção';
      default: return 'Indefinido';
    }
  };

  // Mostrar erro se houver
  if (externalError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Propriedades</h2>
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
            <h3 className="text-red-800 font-medium">Erro ao carregar propriedades</h3>
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
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Propriedades</h2>
          {isDemoMode ? (
            <p className="text-sm text-orange-600 mt-1">
              Modo DEMO: {properties.length}/{DEMO_LIMITS.maxProperties} propriedades utilizadas
            </p>
          ) : (
            <p className="text-gray-600 mt-1">
              {loading && properties.length === 0 ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  <span>Carregando propriedades...</span>
                </span>
              ) : (
                `${properties.length} propriedade${properties.length !== 1 ? 's' : ''} cadastrada${properties.length !== 1 ? 's' : ''}`
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
            title={isAtDemoLimit ? 'Limite do modo DEMO atingido' : 'Adicionar nova propriedade'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Propriedade
          </LoadingButton>
          {isAtDemoLimit && (
            <p className="text-xs text-red-600 text-right max-w-xs">
              Limite de {DEMO_LIMITS.maxProperties} propriedades atingido no modo DEMO. 
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
            Você pode cadastrar até {DEMO_LIMITS.maxProperties} propriedades. 
            Para acesso ilimitado, ative o sistema na aba "Ativação".
          </p>
        </div>
      )}

      {showForm && (
        <LoadingOverlay loading={loading} message={editingProperty ? "Atualizando propriedade..." : "Criando propriedade..."}>
          <PropertyForm
            property={editingProperty}
            onSubmit={editingProperty ? handleUpdateProperty : handleAddProperty}
            onCancel={() => {
              setShowForm(false);
              setEditingProperty(null);
            }}
          />
        </LoadingOverlay>
      )}

      {/* Lista de Propriedades */}
      <LoadingOverlay loading={loading && properties.length === 0} message="Carregando propriedades...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <AnimatedListItem
              key={property.id}
              isNew={newItemId === property.id}
            >
              <HighlightCard
                isHighlighted={highlightedId === property.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 h-full"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{property.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                      {getStatusText(property.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{property.address}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">{formatCurrencyWithVisibility(property.rentValue, showFinancialValues)}/mês</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <p>Tipo: {property.type === 'apartment' ? 'Apartamento' : property.type === 'house' ? 'Casa' : 'Comercial'}</p>
                    <p>Valor de Compra: {formatCurrencyWithVisibility(property.purchasePrice, showFinancialValues)}</p>
                    {property.tenant && (
                      <p>Inquilino: {property.tenant.name}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditProperty(property)}
                      disabled={loading}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProperty(property)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </HighlightCard>
            </AnimatedListItem>
          ))}
        </div>
      </LoadingOverlay>

      {!loading && properties.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma propriedade ainda</h3>
            <p className="text-gray-500 mb-6">
              Que tal começar cadastrando sua primeira propriedade? É rápido e fácil!
            </p>
            <LoadingButton
              loading={loading}
              onClick={() => setShowForm(true)}
              disabled={isAtDemoLimit}
              variant="primary"
              className="px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar Primeira Propriedade
            </LoadingButton>
          </div>
        </div>
      )}
      
      {ConfirmationModalComponent}
    </div>
  );
};