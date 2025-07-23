import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ActivationProvider, useActivation } from './contexts/ActivationContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { SyncIndicator } from './components/Layout/SyncIndicator';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PropertyManager } from './components/Properties/PropertyManager';
import { TenantManager } from './components/Tenants/TenantManager';
import { TransactionManager } from './components/Transactions/TransactionManager';
import { DocumentManager } from './components/Documents/DocumentManager';
import { ReportManager } from './components/Reports/ReportManager';
import { EnergyCalculator } from './components/Energy/EnergyCalculator';
import { SanebaviManager } from './components/Sanebavi/SanebaviManager';
import { InformorsManager } from './components/Informors/InformorsManager';
import { ActivationForm } from './components/Activation/ActivationForm';
import { useProperties } from './hooks/useProperties';
import { useTenants } from './hooks/useTenants';
import { useTransactions } from './hooks/useTransactions';
import { useDocuments } from './hooks/useDocuments';
import { useEnergyBills } from './hooks/useEnergyBills';
import { useWaterBills } from './hooks/useWaterBills';
import { useConfirmationModal } from './components/UI/ConfirmationModal';
import { useEnhancedToast } from './components/UI/EnhancedToast';
import { useSyncManager } from './hooks/useSyncManager';
import { useLocalStorage } from './hooks/useLocalStorage';
import { testConnection } from './lib/supabaseClient';
import { calculateFinancialSummary } from './utils/calculations';
import { importBackup } from './utils/backup';
import { Property, Tenant, Transaction, Document, EnergyBill, WaterBill } from './types';
import { Informor } from './types/informor';
import { useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function AppContent() {
  const { isActivated } = useActivation();
  const [showFinancialValues, setShowFinancialValues] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [supabaseAvailable, setSupabaseAvailable] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  
  const { showConfirmation, ConfirmationModalComponent } = useConfirmationModal();
  const toast = useEnhancedToast();
  const { performSync } = useSyncManager();

  // Local storage hooks for managing offline data
  const [, setLocalProperties] = useLocalStorage<Property[]>('properties', []);
  const [, setLocalTenants] = useLocalStorage<Tenant[]>('tenants', []);
  const [, setLocalTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [, setLocalDocuments] = useLocalStorage<Document[]>('documents', []);
  const [, setLocalEnergyBills] = useLocalStorage<EnergyBill[]>('energyBills', []);
  const [, setLocalWaterBills] = useLocalStorage<WaterBill[]>('waterBills', []);
  const [, setLocalInformors] = useLocalStorage<Informor[]>('informors', []);

  // Verificar disponibilidade do Supabase
  React.useEffect(() => {
    const checkSupabase = async () => {
      const isAvailable = await testConnection();
      setSupabaseAvailable(isAvailable);
    };
    checkSupabase();
  }, []);
  
  const { 
    properties, 
    loading: propertiesLoading, 
    error: propertiesError,
    addProperty,
    updateProperty,
    deleteProperty,
    recarregarDados: reloadProperties
  } = useProperties(supabaseAvailable);
  
  const { 
    tenants, 
    loading: tenantsLoading, 
    error: tenantsError,
    addTenant,
    updateTenant,
    deleteTenant,
    recarregarDados: reloadTenants
  } = useTenants(supabaseAvailable);
  
  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    recarregarDados: reloadTransactions
  } = useTransactions(supabaseAvailable);
  
  const { 
    documents, 
    loading: documentsLoading, 
    error: documentsError,
    addDocument,
    updateDocument,
    deleteDocument,
    recarregarDados: reloadDocuments
  } = useDocuments(supabaseAvailable);
  
  const { 
    energyBills, 
    loading: energyBillsLoading, 
    error: energyBillsError,
    addEnergyBill,
    updateEnergyBill,
    deleteEnergyBill,
    recarregarDados: reloadEnergyBills
  } = useEnergyBills(supabaseAvailable);
  
  const { 
    data: waterBills = [], 
    loading: waterBillsLoading, 
    error: waterBillsError,
    addWaterBill,
    updateWaterBill,
    deleteWaterBill,
    recarregarDados: reloadWaterBills
  } = useWaterBills(supabaseAvailable);
  
  const financialSummary = calculateFinancialSummary(properties, transactions);

  const handleToggleFinancialValues = () => {
    setShowFinancialValues(prev => !prev);
  };

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    const { downloadBackup } = require('./utils/backup');
    downloadBackup();
    toast.success('Backup exportado com sucesso!');
  };

  const handleImport = () => {
    if (!isActivated) {
      toast.warning('Funcionalidade disponível apenas na versão completa');
      return;
    }
    
    showConfirmation(
      'Confirmar Importação',
      'Esta ação irá sobrescrever todos os dados atuais. Deseja continuar?',
      () => {
        setImportLoading(true);
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            setImportLoading(false);
            return;
          }
          
          try {
            const importedData = await importBackup(file);
            
            // Aplicar dados importados ao localStorage
            if (importedData.properties) setLocalProperties(importedData.properties);
            if (importedData.tenants) setLocalTenants(importedData.tenants);
            if (importedData.transactions) setLocalTransactions(importedData.transactions);
            if (importedData.documents) setLocalDocuments(importedData.documents);
            if (importedData.energyBills) setLocalEnergyBills(importedData.energyBills);
            if (importedData.waterBills) setLocalWaterBills(importedData.waterBills);
            if (importedData.informors) setLocalInformors(importedData.informors);
            
            // Forçar sincronização com Supabase
            if (supabaseAvailable) {
              performSync();
            }
            
            const totalItems = (importedData.properties?.length || 0) +
                              (importedData.tenants?.length || 0) +
                              (importedData.transactions?.length || 0) +
                              (importedData.documents?.length || 0) +
                              (importedData.energyBills?.length || 0) +
                              (importedData.waterBills?.length || 0) +
                              (importedData.informors?.length || 0);
            
            toast.success(`Backup importado com sucesso! ${totalItems} itens restaurados.`);
          } catch (error) {
            console.error('Erro ao importar backup:', error);
            toast.error('Erro ao importar backup. Verifique se o arquivo é válido.');
          } finally {
            setImportLoading(false);
          }
        };
        input.click();
      }
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          showFinancialValues={showFinancialValues}
          onToggleFinancialValues={handleToggleFinancialValues}
          onToggleTheme={handleToggleTheme}
          onExport={handleExport}
          onImport={handleImport}
          tenants={tenants}
          properties={properties}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <Routes>
              <Route path="/" element={
                <Dashboard 
                  summary={financialSummary} 
                  properties={properties}
                  transactions={transactions}
                  showFinancialValues={showFinancialValues}
                  onAddTenant={addTenant}
                />
              } />
              <Route path="/properties" element={
                <PropertyManager 
                  properties={properties}
                  loading={propertiesLoading}
                  error={propertiesError}
                  showFinancialValues={showFinancialValues}
                  onAddProperty={addProperty}
                  onUpdateProperty={updateProperty}
                  onDeleteProperty={deleteProperty}
                  onReload={reloadProperties}
                />
              } />
              <Route path="/tenants" element={
                <TenantManager 
                  tenants={tenants}
                  loading={tenantsLoading}
                  error={tenantsError}
                  properties={properties}
                  showFinancialValues={showFinancialValues}
                  onAddTenant={addTenant}
                  onUpdateTenant={updateTenant}
                  onDeleteTenant={deleteTenant}
                  onReload={reloadTenants}
                />
              } />
              <Route path="/transactions" element={
                <TransactionManager 
                  transactions={transactions}
                  loading={transactionsLoading}
                  error={transactionsError}
                  properties={properties}
                  showFinancialValues={showFinancialValues}
                  onAddTransaction={addTransaction}
                  onUpdateTransaction={updateTransaction}
                  onDeleteTransaction={deleteTransaction}
                  onReload={reloadTransactions}
                />
              } />
              <Route path="/documents" element={
                <DocumentManager 
                  documents={documents}
                  loading={documentsLoading}
                  error={documentsError}
                  properties={properties}
                  tenants={tenants}
                  onAddDocument={addDocument}
                  onUpdateDocument={updateDocument}
                  onDeleteDocument={deleteDocument}
                  onReload={reloadDocuments}
                />
              } />
              <Route path="/reports" element={
                <ReportManager 
                  properties={properties}
                  transactions={transactions}
                  summary={financialSummary}
                  showFinancialValues={showFinancialValues}
                />
              } />
              <Route path="/energy" element={
                <EnergyCalculator 
                  energyBills={energyBills}
                  loading={energyBillsLoading}
                  error={energyBillsError}
                  properties={properties}
                  showFinancialValues={showFinancialValues}
                  onAddEnergyBill={addEnergyBill}
                  onUpdateEnergyBill={updateEnergyBill}
                  onDeleteEnergyBill={deleteEnergyBill}
                  onReload={reloadEnergyBills}
                />
              } />
              <Route path="/sanebavi" element={
                <SanebaviManager 
                  waterBills={waterBills}
                  loading={waterBillsLoading}
                  error={waterBillsError}
                  properties={properties}
                  showFinancialValues={showFinancialValues}
                  onAddWaterBill={addWaterBill}
                  onUpdateWaterBill={updateWaterBill}
                  onDeleteWaterBill={deleteWaterBill}
                  onReload={reloadWaterBills}
                />
              } />
              <Route path="/informors" element={<InformorsManager />} />
              <Route path="/activation" element={<ActivationForm />} />
            </Routes>
          </div>
        </main>
        
        {/* Loading overlay para importação */}
        {importLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              <span className="text-gray-700 font-medium">Importando backup...</span>
            </div>
          </div>
        )}
        
        {ConfirmationModalComponent}
      </div>
    </div>
  );
}
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActivationProvider>
        <Router>
          <AppContent />
          <ToastContainer 
            position="bottom-right" 
            autoClose={5000} 
            hideProgressBar={false} 
            newestOnTop={false} 
            closeOnClick 
            rtl={false} 
            pauseOnFocusLoss 
            draggable 
            pauseOnHover 
          />
        </Router>
      </ActivationProvider>
    </QueryClientProvider>
  );
}

export default App;