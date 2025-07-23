import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, PieChart, BarChart3 } from 'lucide-react';
import { Property, Transaction, FinancialSummary } from '../../types';
import { formatCurrencyWithVisibility, formatDate } from '../../utils/calculations';
import { useActivation } from '../../contexts/ActivationContext';

interface ReportManagerProps {
  properties: Property[];
  transactions: Transaction[];
  summary: FinancialSummary;
  showFinancialValues: boolean;
}

export const ReportManager: React.FC<ReportManagerProps> = ({
  properties,
  transactions,
  summary,
  showFinancialValues
}) => {
  const { isDemoMode } = useActivation();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  const generateReport = () => {
    if (isDemoMode) {
      alert('Exportação de relatórios desabilitada no modo DEMO. Ative o sistema para acessar esta funcionalidade.');
      return;
    }

    const reportData = {
      period: selectedPeriod,
      property: selectedProperty,
      summary,
      transactions: transactions.filter(t => {
        const propertyMatch = selectedProperty === 'all' || t.propertyId === selectedProperty;
        const dateMatch = isInSelectedPeriod(t.date);
        return propertyMatch && dateMatch;
      }),
      properties: selectedProperty === 'all' ? properties : properties.filter(p => p.id === selectedProperty)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const isInSelectedPeriod = (date: Date) => {
    const now = new Date();
    const transactionDate = new Date(date);
    
    switch (selectedPeriod) {
      case 'month':
        return transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const transactionQuarter = Math.floor(transactionDate.getMonth() / 3);
        return transactionQuarter === currentQuarter && 
               transactionDate.getFullYear() === now.getFullYear();
      case 'year':
        return transactionDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const propertyMatch = selectedProperty === 'all' || t.propertyId === selectedProperty;
    const dateMatch = isInSelectedPeriod(t.date);
    return propertyMatch && dateMatch;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalIncome - totalExpenses;

  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const incomesByCategory = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h2>
          {isDemoMode && (
            <p className="text-sm text-orange-600 mt-1">
              Modo DEMO: Exportação de relatórios desabilitada
            </p>
          )}
        </div>
        <button
          onClick={generateReport}
          disabled={isDemoMode}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
            isDemoMode
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          title={isDemoMode ? 'Exportação desabilitada no modo DEMO' : 'Exportar relatório'}
        >
          <Download className="w-4 h-4 mr-2" />
          {isDemoMode ? 'Exportar (DEMO)' : 'Exportar Relatório'}
        </button>
      </div>

      {/* Aviso do modo DEMO */}
      {isDemoMode && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <h3 className="text-orange-800 font-medium">Modo DEMO Ativo</h3>
          </div>
          <p className="text-orange-700 text-sm mt-1">
            A exportação de relatórios está desabilitada no modo DEMO. 
            Ative o sistema na aba "Ativação" para acessar esta funcionalidade.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">Este mês</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este ano</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Propriedade</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as propriedades</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receitas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrencyWithVisibility(totalIncome, showFinancialValues)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Despesas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrencyWithVisibility(totalExpenses, showFinancialValues)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lucro Líquido</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyWithVisibility(netIncome, showFinancialValues)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <PieChart className={`w-6 h-6 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Detalhamento por Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receitas por Categoria</h3>
          <div className="space-y-3">
            {Object.entries(incomesByCategory).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-700">{category}</span>
                <span className="font-medium text-green-600">{formatCurrencyWithVisibility(amount, showFinancialValues)}</span>
              </div>
            ))}
            {Object.keys(incomesByCategory).length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma receita no período</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Despesas por Categoria</h3>
          <div className="space-y-3">
            {Object.entries(expensesByCategory).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-700">{category}</span>
                <span className="font-medium text-red-600">{formatCurrencyWithVisibility(amount, showFinancialValues)}</span>
              </div>
            ))}
            {Object.keys(expensesByCategory).length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma despesa no período</p>
            )}
          </div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transações do Período</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.slice(0, 10).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrencyWithVisibility(transaction.amount, showFinancialValues)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length > 10 && (
          <div className="p-4 text-center text-sm text-gray-500">
            Exibindo 10 de {filteredTransactions.length} transações
          </div>
        )}
      </div>
    </div>
  );
};