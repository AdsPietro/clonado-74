import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Minus, AlertTriangle, Eye, EyeOff, User, Download } from 'lucide-react';
import { WaterBill, SharedWaterConsumption } from '../../types';
import { 
  validatePeopleData, 
  distributeWaterBill, 
  createSharedWaterConsumption,
  importPreviousMonthData,
  generateWaterInsights,
  calculateWaterStats,
  exportWaterBillsToCSV,
  DEFAULT_WATER_GROUPS
} from '../../utils/sanebaviCalculations';
import { formatCurrencyWithVisibility, formatDate, createLocalDate } from '../../utils/calculations';
import { useActivation } from '../../contexts/ActivationContext';
import { LoadingButton } from '../UI/LoadingSpinner';
import { HighlightCard, AnimatedListItem } from '../UI/HighlightCard';

interface SanebaviManagerProps {
  waterBills: WaterBill[];
  loading?: boolean;
  error?: Error | null;
  properties: any[]; // Lista de propriedades para vinculação
  showFinancialValues: boolean;
  onAddWaterBill: (bill: Omit<WaterBill, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<boolean>;
  onUpdateWaterBill: (id: string, bill: Partial<WaterBill>) => Promise<boolean>;
  onDeleteWaterBill: (id: string) => Promise<boolean>;
  onReload?: () => void;
}

export const SanebaviManager: React.FC<SanebaviManagerProps> = ({
  waterBills,
  loading: externalLoading = false,
  error: externalError = null,
  properties,
  showFinancialValues,
  onAddWaterBill,
  onUpdateWaterBill,
  onDeleteWaterBill,
  onReload
}) => {
  const { isDemoMode } = useActivation();
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingBill, setEditingBill] = useState<WaterBill | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>(DEFAULT_WATER_GROUPS[0].id);
  const [internalLoading, setInternalLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  
  // Configurações do modo DEMO
  const DEMO_LIMITS = {
    maxWaterBills: 20
  };

  const isAtDemoLimit = isDemoMode && waterBills.length >= DEMO_LIMITS.maxWaterBills;
  
  // Combinar estados de loading
  const loading = externalLoading || internalLoading;

  // Estados do formulário
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    observations: '',
    isPaid: false,
    totalGroupValue: 0
  });

  // Estado das propriedades do grupo selecionado
  const [propertiesInGroup, setPropertiesInGroup] = useState<SharedWaterConsumption[]>(() => {
    const selectedGroupData = DEFAULT_WATER_GROUPS.find(g => g.id === selectedGroup);
    if (!selectedGroupData) return [];
    
    return selectedGroupData.properties.map(propName => {
      return {
        id: `${selectedGroupData.id}-${propName}`,
        ...createSharedWaterConsumption(propName, selectedGroupData.id)
      };
    });
  });

  const [validation, setValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: '' });

  // Atualizar propriedades quando o grupo selecionado mudar
  useEffect(() => {
    const selectedGroupData = DEFAULT_WATER_GROUPS.find(g => g.id === selectedGroup);
    if (!selectedGroupData) return;
    
    const newProperties = selectedGroupData.properties.map(propName => {
      // Buscar propriedade correspondente pelo nome
      const matchingProperty = properties.find(prop => prop.energyUnitName === propName);
      const propertyId = matchingProperty?.id;
      const tenant = matchingProperty?.tenant;
      const tenantId = tenant?.id;
      const tenantName = tenant?.name;
      
      return {
        id: `${selectedGroupData.id}-${propName}`,
        ...createSharedWaterConsumption(
          propName, 
          selectedGroupData.id,
          propertyId,
          tenantId,
          tenantName
        )
      };
    });
    
    setPropertiesInGroup(newProperties);
  }, [selectedGroup, properties]);

  // Recalcular distribuição quando dados mudarem
  useEffect(() => {
    if (formData.totalGroupValue > 0) {
      const distributedProperties = distributeWaterBill(
        formData.totalGroupValue,
        propertiesInGroup
      );
      setPropertiesInGroup(distributedProperties);
    }
    
    // Validar dados
    const validationResult = validatePeopleData(propertiesInGroup);
    setValidation(validationResult);
  }, [formData.totalGroupValue, propertiesInGroup.map(p => p.numberOfPeople).join(',')]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      const processedValue = name === 'totalGroupValue' ? Number(value) : value;
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handlePropertyChange = (propertyId: string, numberOfPeople: number) => {
    setPropertiesInGroup(prev => prev.map(prop => 
      prop.id === propertyId ? { ...prop, numberOfPeople } : prop
    ));
  };

  const handlePropertyPaymentChange = (propertyId: string, isPaid: boolean) => {
    setPropertiesInGroup(prev => prev.map(prop => 
      prop.id === propertyId ? { ...prop, isPaid } : prop
    ));
  };

  const handlePropertyDueDateChange = (propertyId: string, dueDate: string) => {
    setPropertiesInGroup(prev => prev.map(prop => 
      prop.id === propertyId ? { ...prop, dueDate: createLocalDate(dueDate) } : prop
    ));
  };

  const handleImportPreviousMonth = () => {
    const groupBills = waterBills.filter(bill => bill.groupId === selectedGroup);
    const previousBill = groupBills.length > 0 ? groupBills[groupBills.length - 1] : null;
    
    if (previousBill) {
      const currentBill: WaterBill = {
        id: '',
        date: createLocalDate(formData.date),
        observations: formData.observations,
        isPaid: formData.isPaid,
        createdAt: new Date(),
        lastUpdated: new Date(),
        groupId: selectedGroup,
        groupName: DEFAULT_WATER_GROUPS.find(g => g.id === selectedGroup)?.name || '',
        totalGroupValue: formData.totalGroupValue,
        propertiesInGroup: propertiesInGroup
      };
      
      const updatedBill = importPreviousMonthData(currentBill, previousBill);
      setPropertiesInGroup(updatedBill.propertiesInGroup);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAtDemoLimit && !editingBill) {
      toast.demoLimit('contas de água', DEMO_LIMITS.maxWaterBills);
      return; // Não permite adicionar se estiver no limite do demo
    }
    
    setInternalLoading(true);
    
    const selectedGroupData = DEFAULT_WATER_GROUPS.find(g => g.id === selectedGroup);
    if (!selectedGroupData) {
      setInternalLoading(false);
      return;
    }
    
    const billData: Omit<WaterBill, 'id' | 'createdAt' | 'lastUpdated'> = {
      date: createLocalDate(formData.date),
      observations: formData.observations,
      isPaid: formData.isPaid,
      groupId: selectedGroup,
      groupName: selectedGroupData.name,
      totalGroupValue: formData.totalGroupValue,
      propertiesInGroup: propertiesInGroup
    };

    try {
      let success = false;
      if (editingBill) {
        const updatedBill = await onUpdateWaterBill(editingBill.id, billData);
        if (updatedBill) {
          // Destacar o item editado
          setHighlightedId(updatedBill.id);
          setTimeout(() => setHighlightedId(null), 3000);
          success = true;
        }
      } else {
        const newBill = await onAddWaterBill(billData);
        if (newBill) {
          // Destacar o novo item usando o ID retornado
          setHighlightedId(newBill.id);
          setNewItemId(newBill.id);
          
          // Limpar destaque após 3 segundos
          setTimeout(() => setHighlightedId(null), 3000);
          setTimeout(() => setNewItemId(null), 1000);
          success = true;
        }
      }
      
      if (success) {
        // Reset form
        setShowForm(false);
        setEditingBill(null);
        resetForm();
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      observations: '',
      isPaid: false,
      totalGroupValue: 0
    });
    
    const selectedGroupData = DEFAULT_WATER_GROUPS.find(g => g.id === selectedGroup);
    if (selectedGroupData) {
      const newProperties = selectedGroupData.properties.map(propName => ({
        id: `${selectedGroupData.id}-${propName}`,
        ...createSharedWaterConsumption(propName, selectedGroupData.id)
      }));
      
      setPropertiesInGroup(newProperties);
    }
  };

  const handleEditBill = (bill: WaterBill) => {
    setEditingBill(bill);
    setSelectedGroup(bill.groupId);
    setFormData({
      date: new Date(bill.date).toISOString().split('T')[0],
      observations: bill.observations,
      isPaid: bill.isPaid,
      totalGroupValue: bill.totalGroupValue
    });
    
    setPropertiesInGroup(bill.propertiesInGroup);
    setShowForm(true);
  };

  const handleExportCSV = () => {
    if (isDemoMode) {
      alert('Exportação desabilitada no modo DEMO. Ative o sistema para acessar esta funcionalidade.');
      return;
    }
    exportWaterBillsToCSV(waterBills, selectedGroup);
  };

  // Filtrar contas do grupo selecionado para estatísticas
  const selectedGroupBills = waterBills.filter(bill => bill.groupId === selectedGroup);
  const stats = calculateWaterStats(waterBills, selectedGroup);
  const insights = selectedGroupBills.length > 0 
    ? generateWaterInsights(
        { 
          ...formData, 
          groupId: selectedGroup,
          groupName: DEFAULT_WATER_GROUPS.find(g => g.id === selectedGroup)?.name || '',
          totalGroupValue: formData.totalGroupValue,
          propertiesInGroup,
          id: '', 
          createdAt: new Date(), 
          lastUpdated: new Date() 
        } as WaterBill,
        waterBills,
        selectedGroup
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sanebavi - Contas de Água</h2>
          {isDemoMode ? (
            <p className="text-sm text-orange-600 mt-1">
              Modo DEMO: {waterBills.length}/{DEMO_LIMITS.maxWaterBills} contas utilizadas
            </p>
          ) : (
            <p className="text-gray-600 mt-1">
              {waterBills.length} conta{waterBills.length !== 1 ? 's' : ''} registrada{waterBills.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="flex space-x-3">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEFAULT_WATER_GROUPS.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportCSV}
            disabled={isDemoMode}
            className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={isDemoMode ? 'Exportação desabilitada no modo DEMO' : 'Exportar dados para CSV'}
          >
            <Download className="w-4 h-4 mr-2" />
            {isDemoMode ? 'Exportar (DEMO)' : 'Exportar CSV'}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showHistory ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showHistory ? 'Ocultar' : 'Ver'} Histórico
          </button>
          <div className="flex flex-col items-end space-y-2">
            <LoadingButton
              loading={loading}
              onClick={() => setShowForm(true)}
              disabled={isAtDemoLimit}
              variant={isAtDemoLimit ? 'secondary' : 'primary'}
              title={isAtDemoLimit ? 'Limite do modo DEMO atingido' : 'Adicionar nova conta'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </LoadingButton>
            {isAtDemoLimit && (
              <p className="text-xs text-red-600 text-right max-w-xs">
                Limite de {DEMO_LIMITS.maxWaterBills} contas atingido no modo DEMO.
              </p>
            )}
          </div>
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
            Você pode registrar até {DEMO_LIMITS.maxWaterBills} contas de água. 
            Para acesso ilimitado, ative o sistema na aba "Ativação".
          </p>
        </div>
      )}

      {/* Estatísticas do Grupo Selecionado */}
      {selectedGroupBills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrencyWithVisibility(stats.averageValue, showFinancialValues)}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pessoas Médio</p>
                <p className="text-xl font-bold text-green-600">{stats.averagePeople.toFixed(1)}</p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tendência</p>
                <p className={`text-xl font-bold ${
                  stats.trend === 'increasing' ? 'text-red-600' : 
                  stats.trend === 'decreasing' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {stats.trend === 'increasing' ? 'Subindo' : 
                   stats.trend === 'decreasing' ? 'Descendo' : 'Estável'}
                </p>
              </div>
              {stats.trend === 'increasing' ? 
                <TrendingUp className="w-8 h-8 text-red-600" /> :
                stats.trend === 'decreasing' ?
                <TrendingDown className="w-8 h-8 text-green-600" /> :
                <Minus className="w-8 h-8 text-gray-600" />
              }
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Variação Mensal</p>
                <p className={`text-xl font-bold ${stats.monthlyVariation >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.monthlyVariation >= 0 ? '+' : ''}{stats.monthlyVariation.toFixed(1)}%
                </p>
              </div>
              {stats.monthlyVariation >= 0 ? 
                <TrendingUp className="w-8 h-8 text-red-600" /> :
                <TrendingDown className="w-8 h-8 text-green-600" />
              }
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Insights - {DEFAULT_WATER_GROUPS.find(g => g.id === selectedGroup)?.name}
          </h3>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li key={index} className="text-blue-700 text-sm">• {insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {editingBill ? 'Editar Conta de Água' : 'Nova Conta de Água'} - {DEFAULT_WATER_GROUPS.find(g => g.id === selectedGroup)?.name}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Gerais */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-md font-medium text-gray-800 mb-4">Dados Gerais</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DEFAULT_WATER_GROUPS.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data da Conta</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total do Grupo (R$)</label>
                <input
                  type="number"
                  name="totalGroupValue"
                  value={formData.totalGroupValue}
                  onChange={handleFormChange}
                  required
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>

              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPaid"
                    name="isPaid"
                    checked={formData.isPaid}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-900">
                    Conta paga
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleImportPreviousMonth}
                  className="flex items-center px-3 py-1 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  Importar Mês Anterior
                </button>
              </div>
            </div>

            {/* Número de Pessoas por Unidade */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-md font-medium text-gray-800 mb-4">Número de Pessoas por Unidade</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {propertiesInGroup.map(property => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-gray-900">{property.name}</h6>
                      {property.tenantName && (
                        <div className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          <User className="w-3 h-3 mr-1" />
                          {property.tenantName}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Número de pessoas</label>
                      <input
                        type="number"
                        value={property.numberOfPeople}
                        onChange={(e) => handlePropertyChange(property.id, Number(e.target.value))}
                        min="0"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validação */}
            {formData.totalGroupValue > 0 && (
              <div className={`mb-4 p-3 rounded-lg flex items-center ${
                validation.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <AlertTriangle className="w-5 h-5 mr-2" />
                {validation.message}
              </div>
            )}

            {/* Resultados da Distribuição */}
            {formData.totalGroupValue > 0 && validation.isValid && (
              <div className="border-b border-gray-200 pb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Distribuição Proporcional</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {propertiesInGroup.map(property => (
                    <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-gray-900">{property.name}</h6>
                        {property.tenantName && (
                          <div className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            <User className="w-3 h-3 mr-1" />
                            {property.tenantName}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pessoas:</span>
                          <span className="font-medium">{property.numberOfPeople}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrencyWithVisibility(property.proportionalValue, showFinancialValues)}
                          </span>
                        </div>
                        
                        {/* Status de Pagamento */}
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">Status do Pagamento:</span>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`payment-${property.id}`}
                                checked={property.isPaid}
                                onChange={(e) => handlePropertyPaymentChange(property.id, e.target.checked)}
                                className="h-3 w-3 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`payment-${property.id}`} className="ml-1 text-xs text-gray-700">
                                Pago
                              </label>
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Vencimento:</label>
                            <input
                              type="date"
                              value={property.dueDate ? new Date(property.dueDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => handlePropertyDueDateChange(property.id, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              property.isPaid 
                                ? 'bg-green-100 text-green-800' 
                                : property.dueDate && new Date(property.dueDate) < new Date()
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {property.isPaid 
                                ? 'Pago' 
                                : property.dueDate && new Date(property.dueDate) < new Date()
                                  ? 'Vencido'
                                  : 'Pendente'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleFormChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Anotações sobre a conta ou observações relevantes..."
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingBill(null);
                  resetForm();
                }}
                disabled={loading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <LoadingButton
                loading={loading}
                disabled={!validation.isValid}
                variant="primary"
                className="px-4 py-2"
              >
                {editingBill ? 'Atualizar' : 'Salvar'}
              </LoadingButton>
            </div>
          </form>
        </div>
      )}

      {/* Histórico */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Histórico de Contas - {DEFAULT_WATER_GROUPS.find(g => g.id === selectedGroup)?.name}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pessoas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedGroupBills.map((bill) => {
                  const totalPeople = bill.propertiesInGroup.reduce((sum, prop) => sum + prop.numberOfPeople, 0);
                  return (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(bill.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrencyWithVisibility(bill.totalGroupValue, showFinancialValues)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {totalPeople} pessoas
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bill.isPaid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.isPaid ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditBill(bill)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        <LoadingButton
                          loading={loading}
                         onClick={async () => {
                           const success = await onDeleteWaterBill(bill.id);
                           if (success) {
                             toast.deleted('Conta de água');
                           }
                         }}
                          variant="danger"
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Excluir
                        </LoadingButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {selectedGroupBills.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma conta registrada para este grupo
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!loading && waterBills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhuma conta de água cadastrada</p>
          <p className="text-gray-400 mt-2">Comece adicionando sua primeira conta</p>
        </div>
      )}
    </div>
  );
};