import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Building, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Bell, 
  Settings,
  Zap,
  FileText,
  Droplets,
  Info,
  Shield
} from 'lucide-react';


const menuItems = [
  { id: '/', label: 'Dashboard', icon: Home },
  { id: '/properties', label: 'Propriedades', icon: Building },
  { id: '/tenants', label: 'Inquilinos', icon: Users },
  { id: '/transactions', label: 'Transações', icon: DollarSign },
  { id: '/reports', label: 'Relatórios', icon: TrendingUp },
  { id: '/alerts', label: 'Alertas', icon: Bell },
  { id: '/energy', label: 'Energia (CPFL)', icon: Zap },
  { id: '/sanebavi', label: 'Água (Sanebavi)', icon: Droplets },
  { id: '/documents', label: 'Documentos', icon: FileText },
  { id: '/informors', label: 'Informors', icon: Info },
  { id: '/activation', label: 'Ativação', icon: Shield },
  { id: '/settings', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname;

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-xl h-full flex flex-col border-r border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SI</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">SisMobi</h1>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Sistema Imobiliário</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Gestão completa de imóveis</p>
      </div>
      
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center px-6 py-3 mx-2 rounded-lg text-left transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                activeTab === item.id ? 'scale-110' : 'group-hover:scale-105'
              }`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Versão 1.0.0</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">© 2025 SisMobi</p>
        </div>
      </div>
    </div>
  );
};