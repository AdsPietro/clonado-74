import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'green' | 'red' | 'blue' | 'yellow';
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color 
}) => {
  const colorClasses = {
    green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200',
    red: 'bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-200',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600 border-yellow-200'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center mt-3 text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                trend.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="ml-2 text-gray-500 text-xs">vs. mês anterior</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl border-2 ${colorClasses[color]} shadow-sm`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};