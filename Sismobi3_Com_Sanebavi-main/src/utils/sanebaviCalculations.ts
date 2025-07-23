import { SharedWaterConsumption, WaterBill, WaterGroup } from '../types';

// Grupos predefinidos conforme especificação
export const DEFAULT_WATER_GROUPS: WaterGroup[] = [
  {
    id: 'group802',
    name: '802-only',
    properties: ['802-Ca 01', '802-Ca 02', '802-Ca 03', '802-Ca 04', '802-Ca 05', '802-Ca 06']
  },
  {
    id: 'group117',
    name: '117-only',
    properties: ['117-Ca 01', '117-Ca 02', '117-Ca 03']
  },
  {
    id: 'group119',
    name: '119-only',
    properties: ['119-Ca 01', '119-Ca 02']
  }
];

/**
 * Valida se todos os campos de número de pessoas estão preenchidos
 */
export const validatePeopleData = (
  properties: SharedWaterConsumption[]
): { isValid: boolean; message: string } => {
  const emptyProperties = properties.filter(prop => prop.numberOfPeople <= 0);
  
  if (emptyProperties.length > 0) {
    return {
      isValid: false,
      message: `Preencha o número de pessoas para: ${emptyProperties.map(p => p.name).join(', ')}`
    };
  }

  return {
    isValid: true,
    message: 'Todos os campos estão preenchidos corretamente'
  };
};

/**
 * Distribui a conta de água proporcionalmente baseada no número de pessoas
 */
export const distributeWaterBill = (
  groupTotalValue: number,
  properties: SharedWaterConsumption[]
): SharedWaterConsumption[] => {
  if (groupTotalValue === 0) {
    return properties.map(prop => ({
      ...prop,
      proportionalValue: 0
    }));
  }

  const totalPeople = properties.reduce((sum, prop) => sum + prop.numberOfPeople, 0);
  
  if (totalPeople === 0) {
    return properties.map(prop => ({
      ...prop,
      proportionalValue: 0
    }));
  }

  const valuePerPerson = groupTotalValue / totalPeople;

  return properties.map(prop => ({
    ...prop,
    proportionalValue: prop.numberOfPeople * valuePerPerson
  }));
};

/**
 * Cria uma nova propriedade de consumo compartilhado de água
 */
export const createSharedWaterConsumption = (
  name: string,
  groupId: string,
  propertyId?: string,
  tenantId?: string,
  tenantName?: string
): Omit<SharedWaterConsumption, 'id'> => {
  // Calcular data de vencimento padrão (15 dias após a data atual)
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 15);

  return {
    name,
    propertyId,
    tenantId,
    tenantName,
    numberOfPeople: 0,
    proportionalValue: 0,
    groupId,
    isPaid: false,
    dueDate: defaultDueDate
  };
};

/**
 * Importa dados do mês anterior
 */
export const importPreviousMonthData = (
  currentBill: WaterBill,
  previousBill: WaterBill | null
): WaterBill => {
  if (!previousBill || previousBill.groupId !== currentBill.groupId) {
    return currentBill;
  }

  const updatedProperties = currentBill.propertiesInGroup.map((prop: SharedWaterConsumption) => {
    const previousProp = previousBill.propertiesInGroup.find(p => p.name === prop.name);
    if (previousProp) {
      return {
        ...prop,
        numberOfPeople: previousProp.numberOfPeople
      };
    }
    return prop;
  });

  return {
    ...currentBill,
    propertiesInGroup: updatedProperties
  };
};

/**
 * Gera insights baseados no histórico
 */
export const generateWaterInsights = (
  currentBill: WaterBill,
  previousBills: WaterBill[],
  groupId: string
): string[] => {
  const insights: string[] = [];

  // Filtrar apenas contas do mesmo grupo
  const groupBills = previousBills.filter(bill => bill.groupId === groupId);
  
  if (groupBills.length === 0) return insights;

  const lastBill = groupBills[groupBills.length - 1];
  
  // Calcular totais consolidados
  const currentTotalValue = currentBill.totalGroupValue;
  const lastTotalValue = lastBill.totalGroupValue;
  
  const valueIncrease = currentTotalValue - lastTotalValue;
  const percentageIncrease = lastTotalValue > 0 ? (valueIncrease / lastTotalValue) * 100 : 0;

  if (percentageIncrease > 20) {
    insights.push(`Valor da conta ${percentageIncrease.toFixed(1)}% maior que o mês anterior. Possível aumento na tarifa ou maior consumo.`);
  } else if (percentageIncrease < -20) {
    insights.push(`Valor da conta ${Math.abs(percentageIncrease).toFixed(1)}% menor que o mês anterior. Possível redução no consumo ou correção na tarifa.`);
  }

  // Verificar mudanças no número de pessoas
  const currentTotalPeople = currentBill.propertiesInGroup.reduce((sum, prop) => sum + prop.numberOfPeople, 0);
  const lastTotalPeople = lastBill.propertiesInGroup.reduce((sum, prop) => sum + prop.numberOfPeople, 0);
  
  if (currentTotalPeople !== lastTotalPeople) {
    const difference = currentTotalPeople - lastTotalPeople;
    insights.push(`Total de pessoas ${difference > 0 ? 'aumentou' : 'diminuiu'} em ${Math.abs(difference)} pessoa${Math.abs(difference) !== 1 ? 's' : ''}.`);
  }

  // Verificar propriedades com mudanças significativas no número de pessoas
  currentBill.propertiesInGroup.forEach(prop => {
    const previousProp = lastBill.propertiesInGroup.find(p => p.name === prop.name);
    if (previousProp && previousProp.numberOfPeople !== prop.numberOfPeople) {
      const difference = prop.numberOfPeople - previousProp.numberOfPeople;
      insights.push(`${prop.name}: ${difference > 0 ? 'Aumento' : 'Redução'} de ${Math.abs(difference)} pessoa${Math.abs(difference) !== 1 ? 's' : ''}.`);
    }
  });

  return insights;
};

/**
 * Calcula estatísticas do histórico para um grupo específico
 */
export const calculateWaterStats = (bills: WaterBill[], groupId: string) => {
  // Filtrar apenas contas do grupo específico
  const groupBills = bills.filter(bill => bill.groupId === groupId);
  
  if (groupBills.length === 0) {
    return {
      averageValue: 0,
      averagePeople: 0,
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      monthlyVariation: 0
    };
  }

  const totalValue = groupBills.reduce((sum, bill) => sum + bill.totalGroupValue, 0);
  const averageValue = totalValue / groupBills.length;

  const totalPeople = groupBills.reduce((sum, bill) => 
    sum + bill.propertiesInGroup.reduce((propSum, prop) => propSum + prop.numberOfPeople, 0), 0
  );
  const averagePeople = totalPeople / groupBills.length;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let monthlyVariation = 0;

  if (groupBills.length >= 2) {
    const recent = groupBills.slice(-3); // Últimos 3 meses
    const older = groupBills.slice(-6, -3); // 3 meses anteriores

    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, bill) => sum + bill.totalGroupValue, 0) / recent.length;
      const olderAvg = older.reduce((sum, bill) => sum + bill.totalGroupValue, 0) / older.length;
      
      monthlyVariation = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      
      if (monthlyVariation > 5) trend = 'increasing';
      else if (monthlyVariation < -5) trend = 'decreasing';
    }
  }

  return {
    averageValue,
    averagePeople,
    trend,
    monthlyVariation
  };
};

/**
 * Exporta dados para CSV
 */
export const exportWaterBillsToCSV = (bills: WaterBill[], groupId?: string): void => {
  const filteredBills = groupId ? bills.filter(bill => bill.groupId === groupId) : bills;
  
  if (filteredBills.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  const csvData = [];
  
  // Cabeçalho
  csvData.push([
    'Data',
    'Grupo',
    'Valor Total',
    'Propriedade',
    'Pessoas',
    'Valor Proporcional',
    'Status Pagamento',
    'Data Vencimento',
    'Observações'
  ]);

  // Dados
  filteredBills.forEach(bill => {
    bill.propertiesInGroup.forEach(prop => {
      csvData.push([
        bill.date.toLocaleDateString('pt-BR'),
        bill.groupName,
        bill.totalGroupValue.toFixed(2),
        prop.name,
        prop.numberOfPeople.toString(),
        prop.proportionalValue.toFixed(2),
        prop.isPaid ? 'Pago' : 'Pendente',
        prop.dueDate ? prop.dueDate.toLocaleDateString('pt-BR') : '',
        bill.observations
      ]);
    });
  });

  // Converter para CSV
  const csvContent = csvData.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `sanebavi-${groupId || 'todos'}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};