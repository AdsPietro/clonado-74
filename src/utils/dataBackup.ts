import { Property, Tenant, Transaction, Alert, Document, EnergyBill, WaterBill } from '../types';

export interface BackupData {
  properties: Property[];
  tenants: Tenant[];
  transactions: Transaction[];
  alerts: Alert[];
  documents: Document[];
  energyBills: EnergyBill[];
  waterBills: WaterBill[];
  timestamp: Date;
  version: string;
}

export const createBackup = (
  properties: Property[],
  tenants: Tenant[],
  transactions: Transaction[],
  alerts: Alert[],
  documents: Document[],
  energyBills: EnergyBill[],
  waterBills: WaterBill[]
): BackupData => {
  return {
    properties,
    tenants,
    transactions,
    alerts,
    documents,
    energyBills,
    waterBills,
    timestamp: new Date(),
    version: '1.0.0'
  };
};

export const exportBackup = (backupData: BackupData): void => {
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-imobiliario-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importBackup = (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        
        // Validar estrutura do backup
        if (!data.properties || !data.tenants || !data.transactions || !data.alerts) {
          throw new Error('Estrutura do backup inválida');
        }
        
        // Garantir que documents existe (para compatibilidade com backups antigos)
        if (!data.documents) {
          data.documents = [];
        }
        
        // Garantir que energyBills existe (para compatibilidade com backups antigos)
        if (!data.energyBills) {
          data.energyBills = [];
        }
        
        // Garantir que waterBills existe (para compatibilidade com backups antigos)
        if (!data.waterBills) {
          data.waterBills = [];
        }
        
        // Converter strings de data de volta para objetos Date
        data.properties = data.properties.map(p => ({
          ...p,
          createdAt: new Date(p.createdAt),
          tenant: p.tenant ? {
            ...p.tenant,
            startDate: new Date(p.tenant.startDate),
            agreedPaymentDate: p.tenant.agreedPaymentDate ? new Date(p.tenant.agreedPaymentDate) : undefined
          } : undefined
        }));
        
        data.tenants = data.tenants.map(t => ({
          ...t,
          startDate: new Date(t.startDate),
          agreedPaymentDate: t.agreedPaymentDate ? new Date(t.agreedPaymentDate) : undefined
        }));
        
        data.transactions = data.transactions.map(t => ({
          ...t,
          date: new Date(t.date),
          recurring: t.recurring ? {
            ...t.recurring,
            nextDate: new Date(t.recurring.nextDate)
          } : undefined
        }));
        
        data.alerts = data.alerts.map(a => ({
          ...a,
          date: new Date(a.date)
        }));
        
        data.documents = data.documents.map(d => ({
          ...d,
          issueDate: new Date(d.issueDate),
          validityDate: d.validityDate ? new Date(d.validityDate) : undefined,
          lastUpdated: new Date(d.lastUpdated)
        }));
        
        data.energyBills = data.energyBills.map(bill => ({
          ...bill,
          date: new Date(bill.date),
          createdAt: new Date(bill.createdAt),
          lastUpdated: new Date(bill.lastUpdated),
          propertiesInGroup: bill.propertiesInGroup ? bill.propertiesInGroup.map(prop => ({
            ...prop
          })) : []
        }));
        
        data.waterBills = data.waterBills.map(bill => ({
          ...bill,
          date: new Date(bill.date),
          createdAt: new Date(bill.createdAt),
          lastUpdated: new Date(bill.lastUpdated),
          propertiesInGroup: bill.propertiesInGroup ? bill.propertiesInGroup.map(prop => ({
            ...prop,
            dueDate: prop.dueDate ? new Date(prop.dueDate) : undefined
          })) : []
        }));
        
        data.timestamp = new Date(data.timestamp);
        
        resolve(data);
      } catch (error) {
        reject(new Error('Erro ao importar backup: ' + error));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

export const validateBackup = (data: BackupData): boolean => {
  try {
    // Validações básicas
    if (!Array.isArray(data.properties) || 
        !Array.isArray(data.tenants) || 
        !Array.isArray(data.transactions) || 
        !Array.isArray(data.alerts)) {
      return false;
    }
    
    // documents e energyBills são opcionais para compatibilidade com backups antigos
    if (data.documents && !Array.isArray(data.documents)) {
      return false;
    }
    
    if (data.energyBills && !Array.isArray(data.energyBills)) {
      return false;
    }
    
    if (data.waterBills && !Array.isArray(data.waterBills)) {
      return false;
    }
    
    // Validar estrutura de propriedades
    for (const property of data.properties) {
      if (!property.id || !property.name || !property.address) {
        return false;
      }
    }
    
    // Validar estrutura de inquilinos
    for (const tenant of data.tenants) {
      if (!tenant.id || !tenant.name || !tenant.email) {
        return false;
      }
    }
    
    // Validar estrutura de transações
    for (const transaction of data.transactions) {
      if (!transaction.id || !transaction.propertyId || !transaction.type) {
        return false;
      }
    }
    
    // Validar estrutura de documentos (se existir)
    if (data.documents) {
      for (const document of data.documents) {
        if (!document.id || !document.type || !document.propertyId) {
          return false;
        }
      }
    }
    
    return true;
  } catch {
    return false;
  }
};