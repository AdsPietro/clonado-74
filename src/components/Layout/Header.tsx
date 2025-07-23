import React from 'react';
import { Calendar, Download, Upload, Eye, EyeOff } from 'lucide-react';
import { useActivation } from '../../contexts/ActivationContext';
import { SyncIndicator } from './SyncIndicator';
import { NotificationPanel } from '../Notifications/NotificationPanel';

interface HeaderProps {
  showFinancialValues: boolean;
  onToggleFinancialValues: () => void;
  onToggleTheme: () => void;
  onExport: () => void;
  onImport: () => void;
  tenants?: any[];
  properties?: any[];
}

export const Header: React.FC<HeaderProps> = ({ 
  showFinancialValues, 
  onToggleFinancialValues, 
  onToggleTheme,
  onExport, 
  onImport,
  tenants = [],
  properties = []
}) => {
  const { isDemoMode } = useActivation();

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
            <Calendar className="w-5 h-5 mr-2" />
            <span className="capitalize text-sm font-medium">{currentDate}</span>
          </div>
          <SyncIndicator />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Painel de Notificações */}
          <NotificationPanel tenants={tenants} properties={properties} />
          
          <button
            onClick={onToggleTheme}
            className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Alternar tema"
          >
            <span className="text-lg mr-2">🌗</span>
            <span className="hidden md:inline">Tema</span>
          </button>
          <button
            onClick={onToggleFinancialValues}
            className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title={showFinancialValues ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'}
          >
            {showFinancialValues ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Ocultar Valores</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Mostrar Valores</span>
              </>
            )}
          </button>
          <button
            onClick={onImport}
            className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Importar dados de backup"
          >
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Importar</span>
          </button>
          <div className="relative">
            <button
            onClick={onExport}
            disabled={isDemoMode}
            className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
              isDemoMode
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
                : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
            title={isDemoMode ? 'Exportação desabilitada no modo DEMO' : 'Exportar dados'}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">{isDemoMode ? 'Exportar (DEMO)' : 'Exportar'}</span>
            <span className="md:hidden">💾</span>
          </button>
          </div>
        </div>
      </div>
    </header>
  );
};