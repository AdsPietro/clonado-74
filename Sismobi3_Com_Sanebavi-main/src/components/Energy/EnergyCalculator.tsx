import React, { useState, useEffect } from 'react';
import { Plus, Calculator, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Import, Save, Eye, EyeOff, User } from 'lucide-react';
import { EnergyBill, SharedPropertyConsumption } from '../../types';
import { 
  calculateMonthlyConsumption, 
  distributeEnergyGroupBill, 
  validateConsumptionData,
  createSharedPropertyConsumption,
  importPreviousMonthData,
  generateConsumptionInsights,
  calculateConsumptionStats,
  DEFAULT_ENERGY_GROUPS
} from '../../utils/energyCalculations';
import { formatCurrencyWithVisibility, formatDate, createLocalDate, formatCurrency } from '../../utils/calculations';
import { useActivation } from '../../contexts/ActivationContext';
import { LoadingButton } from '../UI/LoadingSpinner';
import { HighlightCard, AnimatedListItem } from '../UI/HighlightCard';
import { useEnhancedToast } from '../UI/EnhancedToast';

interface EnergyCalculatorProps {
  energyBills: EnergyBill[];
  loading?: boolean;
  error?: Error | null;
  properties: any[]; // Lista de propriedades para vinculação
  showFinancialValues: boolean;
  onAddEnergyBill: (bill: Omit<EnergyBill, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<boolean>;
  onUpdateEnergyBill: (id: string, bill: Partial<EnergyBill>) => Promise<boolean>;
  onDeleteEnergyBill: (id: string) => Promise<boolean>;
  onReload?: () => void;
}

export const EnergyCalculator: React.FC<EnergyCalculatorProps> = ({
  energyBills,
  loading: externalLoading = false,
  error: externalError = null,
  properties,
  showFinancialValues,
  onAddEnergyBill,
  onUpdateEnergyBill,
  onDeleteEnergyBill,
 onReload
}) => {
  const { isDemoMode } = useActivation();
  const toast = useEnhancedToast();
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingBill, setEditingBill] = useState<EnergyBill | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>(DEFAULT_ENERGY_GROUPS[0].id);
  const [internalLoading, setInternalLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  
  // Configurações do modo DEMO
  const DEMO_LIMITS = {
    maxEnergyBills: 20
  };

  const isAtDemoLimit = isDemoMode && energyBills.length >= DEMO_LIMITS.maxEnergyBills;

  // Combinar estados de loading
  const loading = externalLoading || internalLoading;

  // Estados do formulário
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    observations: '',
    isPaid: false,
    totalGroupValue: 0,
    totalGroupConsumption: 0
  });

  // Estado das propriedades do grupo selecionado
  const [propertiesInGroup, setPropertiesInGroup] = useState<SharedPropertyConsumption[]>(() => {
    const selectedGroupData = DEFAULT_ENERGY_GROUPS.find(g => g.id === selectedGroup);
    if (!selectedGroupData) return [];
    
    return selectedGroupData.properties.map(propName => {
      const hasMeter = propName !== selectedGroupData.residualReceiver;
      const isResidualReceiver = propName === selectedGroupData.residualReceiver;
      
      return {
        id: `${selectedGroupData.id}-${propName}`,
        ...createSharedPropertyConsumption(propName, selectedGroupData.id, hasMeter, isResidualReceiver)
      };
    });
  });

  const [validation, setValidation] = useState<{
    isValid: boolean;
    message: string;
    difference: number;
  }>({ isValid: true, message: '', difference: 0 });

  // Atualizar propriedades quando o grupo selecionado mudar
  useEffect(() => {
    const selectedGroupData = DEFAULT_ENERGY_GROUPS.find(g => g.id === selectedGroup);
    if (!selectedGroupData) return;
    
    console.log('=== DEBUG: Atualizando propriedades do grupo ===');
    console.log('Grupo selecionado:', selectedGroupData);
    console.log('Todas as propriedades disponíveis:', properties);
    
    const newProperties = selectedGroupData.properties.map(propName => {
      // Buscar propriedade correspondente pelo nome
      const matchingProperty = properties.find(prop => prop.energyUnitName === propName);
      console.log(`Buscando propriedade para "${propName}":`, matchingProperty);
      
      const propertyId = matchingProperty?.id;
      const tenant = matchingProperty?.tenant;
      console.log(`Inquilino encontrado para "${propName}":`, tenant);
      
      const tenantId = tenant?.id;
      const tenantName = tenant?.name;
      console.log(`Nome do inquilino para "${propName}":`, tenantName);
      
      const hasMeter = propName !== selectedGroupData.residualReceiver;
      const isResidualReceiver = propName === selectedGroupData.residualReceiver;
      
      return {
        id: `${selectedGroupData.id}-${propName}`,
        ...createSharedPropertyConsumption(
          propName, 
          selectedGroupData.id, 
          hasMeter, 
          isResidualReceiver,
          propertyId,
          tenantId,
          tenantName
        )
      };
    });
    
    console.log('Propriedades finais do grupo:', newProperties);
    console.log('=== FIM DEBUG ===');
    
    setPropertiesInGroup(newProperties);
  }, [selectedGroup, properties]);

  // Recalcular consumo mensal quando leituras mudarem
  useEffect(() => {
    setPropertiesInGroup(prev => prev.map(prop => ({
      ...prop,
      monthlyConsumption: prop.hasMeter 
        ? calculateMonthlyConsumption(prop.currentReading, prop.previousReading)
        : 0
    })));
  }, []);

  // Recalcular distribuição quando dados mudarem
  useEffect(() => {
    if (formData.totalGroupValue > 0 && formData.totalGroupConsumption > 0) {
      const distributedProperties = distributeEnergyGroupBill(
        formData.totalGroupValue,
        formData.totalGroupConsumption,
        propertiesInGroup
      );
      setPropertiesInGroup(distributedProperties);
    }
    
    // Validar dados
    if (formData.totalGroupValue > 0 && formData.totalGroupConsumption > 0) {
      const validationResult = validateConsumptionData(
        propertiesInGroup, 
        formData.totalGroupConsumption
      );
      setValidation(validationResult);
    }
  }, [formData.totalGroupValue, formData.totalGroupConsumption, propertiesInGroup.map(p => p.monthlyConsumption).join(',')]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      const processedValue = name === 'totalGroupValue' || name === 'totalGroupConsumption' ? Number(value) : value;
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handlePropertyChange = (propertyId: string, field: keyof SharedPropertyConsumption, value: number) => {
    setPropertiesInGroup(prev => prev.map(prop => {
      if (prop.id === propertyId) {
        const updated = { ...prop, [field]: value };
        
        // Recalcular consumo mensal se mudou leitura atual ou anterior
        if (field === 'currentReading' || field === 'previousReading') {
          updated.monthlyConsumption = prop.hasMeter 
            ? calculateMonthlyConsumption(updated.currentReading, updated.previousReading)
            : 0;
        }
        
        return updated;
      }
      return prop;
    }));
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
    const groupBills = energyBills.filter(bill => bill.groupId === selectedGroup);
    const previousBill = groupBills.length > 0 ? groupBills[groupBills.length - 1] : null;
    
    if (previousBill) {
      const currentBill: EnergyBill = {
        id: '',
        date: createLocalDate(formData.date),
        observations: formData.observations,
        isPaid: formData.isPaid,
        createdAt: new Date(),
        lastUpdated: new Date(),
        groupId: selectedGroup,
        groupName: DEFAULT_ENERGY_GROUPS.find(g => g.id === selectedGroup)?.name || '',
        totalGroupValue: formData.totalGroupValue,
        totalGroupConsumption: formData.totalGroupConsumption,
        propertiesInGroup: propertiesInGroup
      };
      
      const updatedBill = importPreviousMonthData(currentBill, previousBill);
      setPropertiesInGroup(updatedBill.propertiesInGroup);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAtDemoLimit && !editingBill) {
      return; // Não permite adicionar se estiver no limite do demo
    }
    
    setInternalLoading(true);
    
    const selectedGroupData = DEFAULT_ENERGY_GROUPS.find(g => g.id === selectedGroup);
    if (!selectedGroupData) return;
    
    const billData: Omit<EnergyBill, 'id' | 'createdAt' | 'lastUpdated'> = {
      date: createLocalDate(formData.date),
      observations: formData.observations,
      isPaid: formData.isPaid,
      groupId: selectedGroup,
      groupName: selectedGroupData.name,
      totalGroupValue: formData.totalGroupValue,
      totalGroupConsumption: formData.totalGroupConsumption,
      propertiesInGroup: propertiesInGroup
    };

    try {
      let success = false;
      if (editingBill) {
        const updatedBill = await onUpdateEnergyBill(editingBill.id, billData);
        if (updatedBill) {
          // Destacar o item editado
          setHighlightedId(updatedBill.id);
          setTimeout(() => setHighlightedId(null), 3000);
          success = true;
        }
      } else {
        const newBill = await onAddEnergyBill(billData);
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
      totalGroupValue: 0,
      totalGroupConsumption: 0
    });
    
    const selectedGroupData = DEFAULT_ENERGY_GROUPS.find(g => g.id === selectedGroup);
    if (selectedGroupData) {
      const newProperties = selectedGroupData.properties.map(propName => {
        const hasMeter = propName !== selectedGroupData.residualReceiver;
        const isResidualReceiver = propName === selectedGroupData.residualReceiver;
        
        return {
          id: `${selectedGroupData.id}-${propName}`,
          ...createSharedPropertyConsumption(propName, selectedGroupData.id, hasMeter, isResidualReceiver)
        };
      });
      
      setPropertiesInGroup(newProperties);
    }
  };

  const handleEditBill = (bill: EnergyBill) => {
    setEditingBill(bill);
    setSelectedGroup(bill.groupId);
    setFormData({
      date: new Date(bill.date).toISOString().split('T')[0],
      observations: bill.observations,
      isPaid: bill.isPaid,
      totalGroupValue: bill.totalGroupValue,
      totalGroupConsumption: bill.totalGroupConsumption
    });
    
    setPropertiesInGroup(bill.propertiesInGroup);
    setShowForm(true);
  };

  // Filtrar contas do grupo selecionado para estatísticas
  const selectedGroupBills = energyBills.filter(bill => bill.groupId === selectedGroup);
  const stats = calculateConsumptionStats(energyBills, selectedGroup);
  const insights = selectedGroupBills.length > 0 
    ? generateConsumptionInsights(
        { 
          ...formData, 
          groupId: selectedGroup,
          groupName: DEFAULT_ENERGY_GROUPS.find(g => g.id === selectedGroup)?.name || '',
          totalGroupValue: formData.totalGroupValue,
          totalGroupConsumption: formData.totalGroupConsumption,
          propertiesInGroup,
          id: '', 
          createdAt: new Date(), 
          lastUpdated: new Date() 
        } as EnergyBill,
        energyBills,
        selectedGroup
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cálculo de Energia Compartilhada</h2>
          {isDemoMode ? (
            <p className="text-sm text-orange-600 mt-1">
              Modo DEMO: {energyBills.length}/{DEMO_LIMITS.maxEnergyBills} contas utilizadas
            </p>
          ) : (
            <p className="text-gray-600 mt-1">
              {energyBills.length} conta{energyBills.length !== 1 ? 's' : ''} registrada{energyBills.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="flex space-x-3">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEFAULT_ENERGY_GROUPS.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
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
                Limite de {DEMO_LIMITS.maxEnergyBills} contas atingido no modo DEMO.
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
            Você pode registrar até {DEMO_LIMITS.maxEnergyBills} contas de energia. 
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
                <p className="text-sm font-medium text-gray-600">Consumo Médio</p>
                <p className="text-xl font-bold text-blue-600">{stats.averageConsumption.toFixed(0)} kWh</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.averageValue)}</p>
              </div>
              <Calculator className="w-8 h-8 text-green-600" />
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Insights do Consumo - {DEFAULT_ENERGY_GROUPS.find(g => g.id === selectedGroup)?.name}
          </h3>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li key={index} className="text-yellow-700 text-sm">• {insight}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {editingBill ? 'Editar Conta de Energia' : 'Nova Conta de Energia'} - {DEFAULT_ENERGY_GROUPS.find(g => g.id === selectedGroup)?.name}
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
                    {DEFAULT_ENERGY_GROUPS.map(group => (
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consumo Total do Grupo (kWh)</label>
                  <input
                    type="number"
                    name="totalGroupConsumption"
                    value={formData.totalGroupConsumption}
                    onChange={handleFormChange}
                    required
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
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
                  <Import className="w-4 h-4 mr-1" />
                  Importar Mês Anterior
                </button>
              </div>
            </div>

            {/* Leituras dos Imóveis do Grupo */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-md font-medium text-gray-800 mb-4">Leituras dos Imóveis</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {propertiesInGroup.map(property => (
                  <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-gray-900">{property.name}</h6>
                      <div className="flex items-center space-x-2">
                        {property.tenantName && (
                          <div className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            <User className="w-3 h-3 mr-1" />
                            {property.tenantName}
                          </div>
                        )}
                        {property.hasMeter ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Com medidor
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Sem medidor (residual)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {property.hasMeter ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">kWh Anterior</label>
                          <input
                            type="number"
                            value={property.previousReading}
                            onChange={(e) => handlePropertyChange(property.id, 'previousReading', Number(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">kWh Atual</label>
                          <input
                            type="number"
                            value={property.currentReading}
                            onChange={(e) => handlePropertyChange(property.id, 'currentReading', Number(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Consumo</label>
                          <input
                            type="number"
                            value={property.monthlyConsumption}
                            readOnly
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">
                          Consumo: {property.proportionalConsumption.toFixed(2)} kWh (residual)
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Validação */}
            {formData.totalGroupValue > 0 && formData.totalGroupConsumption > 0 && (
              <div className={`mb-4 p-3 rounded-lg flex items-center ${
                validation.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {validation.isValid ? 
                  <CheckCircle className="w-5 h-5 mr-2" /> : 
                  <AlertTriangle className="w-5 h-5 mr-2" />
                }
                {validation.message}
              </div>
            )}

            {/* Resultados da Distribuição */}
            {formData.totalGroupValue > 0 && formData.totalGroupConsumption > 0 && (
              <div className="border-b border-gray-200 pb-6">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Distribuição Proporcional</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {propertiesInGroup.map(property => (
                    <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-gray-900">{property.name}</h6>
                        <div className="flex items-center space-x-1">
                          {property.tenantName && (
                            <div className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              <User className="w-3 h-3 mr-1" />
                              {property.tenantName}
                            </div>
                          )}
                          {property.isResidualReceiver && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Residual
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Consumo:</span>
                          <span className="font-medium">{property.proportionalConsumption.toFixed(2)} kWh</span>
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
                placeholder="Anotações sobre as contas ou consumo..."
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
                variant="primary"
                className="px-4 py-2 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
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
              Histórico de Contas - {DEFAULT_ENERGY_GROUPS.find(g => g.id === selectedGroup)?.name}
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
                    Consumo Total
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
                {selectedGroupBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(bill.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrencyWithVisibility(bill.totalGroupValue, showFinancialValues)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.totalGroupConsumption.toFixed(0)} kWh
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
                          const success = await onDeleteEnergyBill(bill.id);
                          if (success) {
                            toast.deleted('Conta de energia');
                          }
                        }}
                        variant="danger"
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Excluir
                      </LoadingButton>
                    </td>
                  </tr>
                ))}
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

      {/* Mostrar erro se houver */}
      {externalError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center space-x-3">
          <div className="w-6 h-6 text-red-600 flex-shrink-0">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Erro ao carregar contas de energia</h3>
            <p className="text-red-600 text-sm mt-1">
              {externalError instanceof Error ? externalError.message : 'Erro desconhecido'}
            </p>
          </div>
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
      )}
    </div>
  );
};