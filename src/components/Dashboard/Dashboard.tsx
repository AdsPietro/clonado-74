import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Home, Percent } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { InteractiveChart } from './InteractiveChart';
import { PropertyList } from './PropertyList';
import { AdvancedStats } from './AdvancedStats';
import { NotificationDemo } from '../Notifications/NotificationDemo';
import { FinancialSummary } from '../../types';
import { formatCurrencyWithVisibility } from '../../utils/calculations';

interface DashboardProps {
  summary: FinancialSummary;
  properties: any[];
  transactions: any[];
  showFinancialValues: boolean;
  onAddTenant?: (tenant: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  summary, 
  properties, 
  transactions, 
  showFinancialValues,
  onAddTenant 
}) => {
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header com animação */}
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Dashboard Financeiro
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visão completa do seu portfólio imobiliário
        </p>
      </motion.div>

      {/* Componente de demonstração de notificações */}
      {onAddTenant && (
        <motion.div variants={sectionVariants}>
          <NotificationDemo 
            tenants={[]} // Será preenchido via hook
            properties={properties}
            onAddTenant={onAddTenant}
          />
        </motion.div>
      )}
      
      {/* Cards principais com animação escalonada */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={sectionVariants}
      >
        <MetricCard
          title="Receita Mensal"
          value={formatCurrencyWithVisibility(summary.totalIncome, showFinancialValues)}
          icon={DollarSign}
          color="green"
          trend={{ value: 8.5, isPositive: true }}
        />
        <MetricCard
          title="Despesas Mensais"
          value={formatCurrencyWithVisibility(summary.totalExpenses, showFinancialValues)}
          icon={TrendingUp}
          color="red"
          trend={{ value: -2.3, isPositive: false }}
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrencyWithVisibility(summary.netIncome, showFinancialValues)}
          icon={DollarSign}
          color="blue"
          trend={{ value: 12.8, isPositive: true }}
        />
        <MetricCard
          title="Taxa de Ocupação"
          value={`${summary.occupancyRate.toFixed(1)}%`}
          icon={Percent}
          color="yellow"
        />
      </motion.div>

      {/* Seção de gráficos interativos */}
      <motion.div 
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        variants={sectionVariants}
      >
        {/* Gráfico principal - ocupa 2 colunas */}
        <div className="xl:col-span-2">
          <InteractiveChart 
            transactions={transactions} 
            showFinancialValues={showFinancialValues} 
          />
        </div>
        
        {/* Lista de propriedades */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Propriedades
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {properties.length} propriedades cadastradas
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50">
              <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <PropertyList properties={properties} showFinancialValues={showFinancialValues} />
        </motion.div>
      </motion.div>

      {/* Estatísticas avançadas */}
      <motion.div variants={sectionVariants}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Estatísticas Avançadas
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Indicadores de performance detalhados
          </p>
        </div>
        <AdvancedStats 
          summary={summary} 
          showFinancialValues={showFinancialValues} 
        />
      </motion.div>

      {/* Seção de insights com animação */}
      <motion.div 
        className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
        variants={sectionVariants}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-6">
          <motion.h3 
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            Insights do Mês
          </motion.h3>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            Análise automática dos seus dados
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Insight 1 */}
          <motion.div 
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              Performance Excelente
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Seu ROI está {summary.monthlyROI > 1 ? 'acima' : 'dentro'} da média de mercado
            </p>
          </motion.div>

          {/* Insight 2 */}
          <motion.div 
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Home className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              Taxa de Ocupação
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {summary.occupancyRate > 80 ? 'Ótima ocupação!' : 'Oportunidade de melhoria'} - {summary.occupancyRate.toFixed(1)}%
            </p>
          </motion.div>

          {/* Insight 3 */}
          <motion.div 
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            whileHover={{ y: -4 }}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              Fluxo de Caixa
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {summary.netIncome > 0 ? 'Fluxo positivo' : 'Atenção ao fluxo'} este mês
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};