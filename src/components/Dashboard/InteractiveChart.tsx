import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Transaction } from '../../types';
import { formatCurrencyWithVisibility } from '../../utils/calculations';

interface InteractiveChartProps {
  transactions: Transaction[];
  showFinancialValues: boolean;
}

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B'];

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ 
  transactions, 
  showFinancialValues 
}) => {
  const [activeChart, setActiveChart] = useState<'area' | 'bar' | 'pie'>('area');

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      fullMonth: date.toLocaleDateString('pt-BR', { month: 'long' }),
      fullDate: date
    };
  }).reverse();

  const chartData = last6Months.map(({ month, fullMonth, fullDate }) => {
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === fullDate.getMonth() && 
             transactionDate.getFullYear() === fullDate.getFullYear();
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const net = income - expenses;

    return { 
      month, 
      fullMonth,
      income, 
      expenses, 
      net,
      profit: net > 0 ? net : 0,
      loss: net < 0 ? Math.abs(net) : 0
    };
  });

  // Dados para gráfico de pizza
  const totalIncome = chartData.reduce((sum, data) => sum + data.income, 0);
  const totalExpenses = chartData.reduce((sum, data) => sum + data.expenses, 0);
  const pieData = [
    { name: 'Receitas', value: totalIncome, color: '#10B981' },
    { name: 'Despesas', value: totalExpenses, color: '#EF4444' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {chartData.find(d => d.month === label)?.fullMonth}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrencyWithVisibility(entry.value, showFinancialValues)}
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div 
          className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {data.name}: {formatCurrencyWithVisibility(data.value, showFinancialValues)}
          </p>
        </motion.div>
      );
    }
    return null;
  };

  const chartVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const buttonVariants = {
    inactive: { scale: 1, backgroundColor: 'transparent' },
    active: { scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' },
    hover: { scale: 1.02 }
  };

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Análise Financeira
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visão interativa dos últimos 6 meses
          </p>
        </div>
        
        {/* Chart Type Buttons */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mt-4 sm:mt-0">
          {[
            { type: 'area' as const, label: 'Área', icon: '📈' },
            { type: 'bar' as const, label: 'Barras', icon: '📊' },
            { type: 'pie' as const, label: 'Pizza', icon: '🥧' }
          ].map(({ type, label, icon }) => (
            <motion.button
              key={type}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeChart === type
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              variants={buttonVariants}
              animate={activeChart === type ? 'active' : 'inactive'}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveChart(type)}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <motion.div 
        className="h-80"
        variants={chartVariants}
        key={activeChart}
        initial="initial"
        animate="animate"
      >
        {activeChart === 'area' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => showFinancialValues ? `R$ ${(value / 1000).toFixed(0)}k` : '••••'}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#10B981"
                fill="url(#incomeGradient)"
                strokeWidth={2}
                name="Receitas"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="#EF4444"
                fill="url(#expenseGradient)"
                strokeWidth={2}
                name="Despesas"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => showFinancialValues ? `R$ ${(value / 1000).toFixed(0)}k` : '••••'}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="income" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
                name="Receitas"
              />
              <Bar 
                dataKey="expenses" 
                fill="#EF4444" 
                radius={[4, 4, 0, 0]}
                name="Despesas"
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color, fontWeight: 'bold' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Legend for Area and Bar charts */}
      {activeChart !== 'pie' && (
        <div className="flex justify-center space-x-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Receitas</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};