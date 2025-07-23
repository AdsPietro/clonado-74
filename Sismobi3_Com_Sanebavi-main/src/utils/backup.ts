import { Property, Tenant, Transaction, Document, EnergyBill, WaterBill } from '../types';
import { Informor } from '../types/informor';

// Interface para dados de backup
export interface BackupData {
  properties?: Property[];
  tenants?: Tenant[];
  transactions?: Transaction[];
  documents?: Document[];
  energyBills?: EnergyBill[];
  waterBills?: WaterBill[];
  informors?: Informor[];
  version: string;
  timestamp: string;
}

// Função para exportar dados para backup
export const exportBackup = (): BackupData => {
  const properties = JSON.parse(localStorage.getItem('properties') || '[]');
  const tenants = JSON.parse(localStorage.getItem('tenants') || '[]');
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  const documents = JSON.parse(localStorage.getItem('documents') || '[]');
  const energyBills = JSON.parse(localStorage.getItem('energyBills') || '[]');
  const waterBills = JSON.parse(localStorage.getItem('waterBills') || '[]');
  const informors = JSON.parse(localStorage.getItem('informors') || '[]');

  return {
    properties,
    tenants,
    transactions,
    documents,
    energyBills,
    waterBills,
    informors,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };
};

// Função para importar dados de um arquivo de backup
export const importBackup = async (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content) as BackupData;
        
        // Validar estrutura básica do backup
        if (!backupData.version || !backupData.timestamp) {
          throw new Error('Formato de backup inválido');
        }
        
        resolve(backupData);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo de backup: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsText(file);
  });
};

// Função para baixar backup como arquivo JSON
export const downloadBackup = () => {
  const backupData = exportBackup();
  const dataStr = JSON.stringify(backupData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `sismobi-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};