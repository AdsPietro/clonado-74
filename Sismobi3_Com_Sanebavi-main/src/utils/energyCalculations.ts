import { SharedPropertyConsumption, EnergyBill, EnergyGroup } from '../types';

// Grupos predefinidos conforme especificação
export const DEFAULT_ENERGY_GROUPS: EnergyGroup[] = [
  {
    id: 'group1',
    name: 'Grupo 1 (802-SUP)',
    properties: ['802-Ca 01', '802-Ca 02', '802-Ca 06'],
    residualReceiver: '802-Ca 02'
  },
  {
    id: 'group2',
    name: 'Grupo 2 (802-INF)',
    properties: ['802-Ca 03', '802-Ca 04', '802-Ca 05'],
    residualReceiver: '802-Ca 05'
  },
  {
    id: 'group3',
    name: 'Grupo 3 (117-ONE)',
    properties: ['117-Ca 01', '117-Ca 03'],
    residualReceiver: '117-Ca 01'
  }
];

/**
 * Calcula o consumo mensal baseado nas leituras atual e anterior
 */
export const calculateMonthlyConsumption = (
  currentReading: number,
  previousReading: number
): number => {
  return Math.max(0, currentReading - previousReading);
};

/**
 * Valida se a soma dos consumos individuais está consistente
 */
export const validateConsumptionData = (
  properties: SharedPropertyConsumption[],
  totalConsumption: number
): { isValid: boolean; message: string; difference: number } => {
  const sumOfIndividualConsumptions = properties.reduce(
    (sum, prop) => sum + prop.monthlyConsumption,
    0
  );

  const difference = Math.abs(totalConsumption - sumOfIndividualConsumptions);
  const tolerance = totalConsumption * 0.05; // 5% de tolerância

  if (difference <= tolerance) {
    return {
      isValid: true,
      message: 'Consumos estão consistentes',
      difference
    };
  }

  return {
    isValid: false,
    message: `Diferença de ${difference.toFixed(2)} kWh entre total e soma individual`,
    difference
  };
};

/**
 * Distribui a conta de energia proporcionalmente entre os imóveis
 */
export const distributeEnergyGroupBill = (
  groupTotalValue: number,
  groupTotalConsumption: number,
  properties: SharedPropertyConsumption[]
): SharedPropertyConsumption[] => {
  if (groupTotalConsumption === 0 || groupTotalValue === 0) {
    return properties.map(prop => ({
      ...prop,
      proportionalValue: 0,
      proportionalConsumption: 0
    }));
  }

  const valuePerKwh = groupTotalValue / groupTotalConsumption;
  const updatedProperties = [...properties];

  // Encontrar o grupo correspondente
  const group = DEFAULT_ENERGY_GROUPS.find(g => 
    properties.some(prop => g.properties.includes(prop.name))
  );

  if (!group) return updatedProperties;

  const propertiesWithMeter = properties.filter(prop => prop.hasMeter);
  const residualProperty = properties.find(prop => prop.name === group.residualReceiver);

  if (!residualProperty) return updatedProperties;

  // Calcular consumo dos imóveis com medidor
  const meterConsumption = propertiesWithMeter.reduce(
    (sum, prop) => sum + prop.monthlyConsumption,
    0
  );

  // Consumo residual para o imóvel sem medidor
  const residualConsumption = groupTotalConsumption - meterConsumption;

  // Distribuir valores proporcionalmente
  properties.forEach(prop => {
    const propIndex = updatedProperties.findIndex(p => p.id === prop.id);
    
    if (prop.hasMeter) {
      // Imóvel com medidor: valor proporcional ao consumo
      const proportionalValue = prop.monthlyConsumption * valuePerKwh;
      updatedProperties[propIndex] = {
        ...updatedProperties[propIndex],
        proportionalValue,
        proportionalConsumption: prop.monthlyConsumption
      };
    } else if (prop.name === group.residualReceiver) {
      // Imóvel sem medidor: recebe o residual
      const residualValue = residualConsumption * valuePerKwh;
      updatedProperties[propIndex] = {
        ...updatedProperties[propIndex],
        proportionalValue: residualValue,
        proportionalConsumption: residualConsumption
      };
    }
  });

  return updatedProperties;
};

/**
 * Cria uma nova propriedade de consumo compartilhado
 */
export const createSharedPropertyConsumption = (
  name: string,
  groupId: string,
  hasMeter: boolean = true,
  isResidualReceiver: boolean = false,
  propertyId?: string,
  tenantId?: string,
  tenantName?: string
): Omit<SharedPropertyConsumption, 'id'> => {
  // Calcular data de vencimento padrão (15 dias após a data atual)
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 15);

  return {
    name,
    propertyId,
    tenantId,
    tenantName,
    currentReading: 0,
    previousReading: 0,
    monthlyConsumption: 0,
    hasMeter,
    proportionalValue: 0,
    proportionalConsumption: 0,
    groupId,
    isResidualReceiver,
    isPaid: false,
    dueDate: defaultDueDate
  };
};

/**
 * Importa dados do mês anterior
 */
export const importPreviousMonthData = (
  currentBill: EnergyBill,
  previousBill: EnergyBill | null
): EnergyBill => {
  if (!previousBill || previousBill.groupId !== currentBill.groupId) {
    return currentBill;
  }

  const updatedProperties = currentBill.propertiesInGroup.map((prop: SharedPropertyConsumption) => {
    const previousProp = previousBill.propertiesInGroup.find(p => p.name === prop.name);
    if (previousProp) {
      return {
        ...prop,
        previousReading: previousProp.currentReading,
        monthlyConsumption: calculateMonthlyConsumption(
          prop.currentReading,
          previousProp.currentReading
        )
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
 * Gera sugestões inteligentes baseadas no histórico
 */
export const generateConsumptionInsights = (
  currentBill: EnergyBill,
  previousBills: EnergyBill[],
  groupId: string
): string[] => {
  const insights: string[] = [];

  // Filtrar apenas contas do mesmo grupo
  const groupBills = previousBills.filter(bill => bill.groupId === groupId);
  
  if (groupBills.length === 0) return insights;

  const lastBill = groupBills[groupBills.length - 1];
  
  // Calcular totais consolidados
  const currentTotalConsumption = currentBill.totalGroupConsumption;
  const lastTotalConsumption = lastBill.totalGroupConsumption;
  
  const consumptionIncrease = currentTotalConsumption - lastTotalConsumption;
  const percentageIncrease = lastTotalConsumption > 0 ? (consumptionIncrease / lastTotalConsumption) * 100 : 0;

  if (percentageIncrease > 20) {
    insights.push(`Consumo ${percentageIncrease.toFixed(1)}% maior que o mês anterior. Possível uso intensivo de ar-condicionado ou novos equipamentos.`);
  } else if (percentageIncrease < -20) {
    insights.push(`Consumo ${Math.abs(percentageIncrease).toFixed(1)}% menor que o mês anterior. Possível ausência dos moradores ou economia de energia.`);
  }

  // Verificar propriedades com consumo muito alto por grupo
  currentBill.propertiesInGroup.forEach(prop => {
    const previousProp = lastBill.propertiesInGroup.find(p => p.name === prop.name);
    if (previousProp && previousProp.monthlyConsumption > 0) {
      const propIncrease = ((prop.monthlyConsumption - previousProp.monthlyConsumption) / previousProp.monthlyConsumption) * 100;
      if (propIncrease > 50) {
        insights.push(`${prop.name}: Consumo ${propIncrease.toFixed(1)}% maior. Verificar possíveis problemas ou novos equipamentos.`);
      }
    }
  });

  return insights;
};

/**
 * Calcula estatísticas do histórico de consumo para um grupo específico
 */
export const calculateConsumptionStats = (bills: EnergyBill[], groupId: string) => {
  // Filtrar apenas contas do grupo específico
  const groupBills = bills.filter(bill => bill.groupId === groupId);
  
  if (groupBills.length === 0) {
    return {
      averageConsumption: 0,
      averageValue: 0,
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      monthlyVariation: 0
    };
  }

  const totalConsumption = groupBills.reduce((sum, bill) => sum + bill.totalGroupConsumption, 0);
  const totalValue = groupBills.reduce((sum, bill) => sum + bill.totalGroupValue, 0);
  const averageConsumption = totalConsumption / groupBills.length;
  const averageValue = totalValue / groupBills.length;

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let monthlyVariation = 0;

  if (groupBills.length >= 2) {
    const recent = groupBills.slice(-3); // Últimos 3 meses
    const older = groupBills.slice(-6, -3); // 3 meses anteriores

    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, bill) => sum + bill.totalGroupConsumption, 0) / recent.length;
      const olderAvg = older.reduce((sum, bill) => sum + bill.totalGroupConsumption, 0) / older.length;
      
      monthlyVariation = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      if (monthlyVariation > 5) trend = 'increasing';
      else if (monthlyVariation < -5) trend = 'decreasing';
    }
  }

  return {
    averageConsumption,
    averageValue,
    trend,
    monthlyVariation
  };
};