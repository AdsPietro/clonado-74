import { Alert, Property, Tenant, Transaction, WaterBill } from '../types';

export const generateAutomaticAlerts = (
  properties: Property[],
  tenants: Tenant[],
  transactions: Transaction[],
  energyBills?: any[], // Adicionar parâmetro opcional para contas de energia
  waterBills?: WaterBill[] // Adicionar parâmetro opcional para contas de água
): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();

  // Alertas de aluguel em atraso
  properties.forEach(property => {
    if (property.status === 'rented' && property.tenant) {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const hasRentPayment = transactions.some(t => 
        t.propertyId === property.id &&
        t.type === 'income' &&
        t.category === 'Aluguel' &&
        t.date.getMonth() === currentMonth &&
        t.date.getFullYear() === currentYear
      );

      if (!hasRentPayment && now.getDate() > 10) {
        alerts.push({
          id: `rent_due_${property.id}`,
          type: 'rent_due',
          propertyId: property.id,
          tenantId: property.tenant.id,
          tenantName: property.tenant.name,
          message: `Aluguel de ${property.name} em atraso`,
          date: now,
          priority: 'high',
          resolved: false
        });
      }
    }
  });

  // Alertas de contas de energia pendentes
  if (energyBills) {
    energyBills.forEach(bill => {
      // Verificar se o bill existe e tem propertiesInGroup válido
      if (bill && bill.propertiesInGroup && Array.isArray(bill.propertiesInGroup)) {
        bill.propertiesInGroup.forEach((property: any) => {
          // Verificar se a conta proporcional está pendente e vencida
          if (!property.isPaid && property.dueDate && new Date(property.dueDate) < now) {
            const linkedProperty = properties.find(p => p.id === property.propertyId);
            const tenant = tenants.find(t => t.id === property.tenantId);
            
            alerts.push({
              id: `energy_bill_pending_${property.id}_${bill.id}`,
              type: 'energy_bill_pending',
              propertyId: property.propertyId || '',
              tenantId: property.tenantId,
              tenantName: property.tenantName || tenant?.name,
              message: `Conta de energia de ${property.name} vencida - ${property.tenantName || 'Inquilino não identificado'}`,
              date: now,
              priority: 'high',
              resolved: false
            });
          }
        });
      }
    });
  }
  
  // Alertas de contas de água pendentes
  if (waterBills) {
    waterBills.forEach(bill => {
      // Verificar se o bill existe e tem propertiesInGroup válido
      if (bill && bill.propertiesInGroup && Array.isArray(bill.propertiesInGroup)) {
        bill.propertiesInGroup.forEach((property: any) => {
          // Verificar se a conta proporcional está pendente e vencida
          if (!property.isPaid && property.dueDate && new Date(property.dueDate) < now) {
            const linkedProperty = properties.find(p => p.id === property.propertyId);
            const tenant = tenants.find(t => t.id === property.tenantId);
            
            alerts.push({
              id: `water_bill_pending_${property.id}_${bill.id}`,
              type: 'water_bill_pending',
              propertyId: property.propertyId || '',
              tenantId: property.tenantId,
              tenantName: property.tenantName || tenant?.name,
              message: `Conta de água de ${property.name} vencida - ${property.tenantName || 'Inquilino não identificado'}`,
              date: now,
              priority: 'high',
              resolved: false
            });
          }
        });
      }
    });
  }
  
  // Alertas de manutenção
  properties.forEach(property => {
    if (property.status === 'maintenance') {
      alerts.push({
        id: `maintenance_${property.id}`,
        type: 'maintenance',
        propertyId: property.id,
        message: `${property.name} necessita de manutenção`,
        date: now,
        priority: 'medium',
        resolved: false
      });
    }
  });

  // Alertas de impostos (assumindo que são pagos anualmente)
  properties.forEach(property => {
    const hasAnnualTaxPayment = transactions.some(t => 
      t.propertyId === property.id &&
      t.type === 'expense' &&
      t.category === 'Impostos' &&
      new Date(t.date).getFullYear() === now.getFullYear()
    );

    if (!hasAnnualTaxPayment && now.getMonth() >= 2) { // Março em diante
      alerts.push({
        id: `tax_due_${property.id}`,
        type: 'tax_due',
        propertyId: property.id,
        message: `Impostos de ${property.name} podem estar em atraso`,
        date: now,
        priority: 'medium',
        resolved: false
      });
    }
  });

  return alerts;
};

export const processRecurringTransactions = (transactions: Transaction[]): Transaction[] => {
  const now = new Date();
  const recurringTransactions: Transaction[] = [];

  transactions.forEach(transaction => {
    if (transaction.recurring) {
      const { frequency, nextDate } = transaction.recurring;
      
      if (nextDate <= now) {
        // Criar nova transação recorrente
        let newDate = nextDate;
        
        switch (frequency) {
          case 'monthly':
            newDate.setMonth(newDate.getMonth() + 1);
            break;
          case 'quarterly':
            newDate.setMonth(newDate.getMonth() + 3);
            break;
          case 'yearly':
            newDate.setFullYear(newDate.getFullYear() + 1);
            break;
        }

        recurringTransactions.push({
          ...transaction,
          id: `${transaction.id}_recurring_${now.getTime()}`,
          date: now,
          recurring: {
            frequency,
            nextDate: newDate
          }
        });
      }
    }
  });

  return recurringTransactions;
};