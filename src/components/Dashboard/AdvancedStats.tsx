import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Calendar, Percent, DollarSign, Home } from 'lucide-react';
import { FinancialSummary } from '../../types';
import { formatCurrencyWithVisibility } from '../../utils/calculations';

interface AdvancedStatsProps {
  summary: FinancialSummary;
  showFinancialValues: boolean;
}

export const AdvancedStats: React.FC<AdvancedStatsProps> = ({ 
  summary, 
  showFinancialValues 
}) => {
  const stats = [
    {
      title: 'ROI Mensal',
      value: `${summary.monthlyROI.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'green',
      gradient: 'from-green-400 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      description: 'Retorno sobre investimento'
    },
    {
      title: 'Propriedades Ocupadas',
      value: `${summary.rentedProperties}/${summary.totalProperties}`,
      icon: Home,
      color: 'blue',
      gradient: 'from-blue-400 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      description: 'Taxa de ocupação atual'
    },
    {
      title: 'Receita Média',
      value: formatCurrencyWithVisibility(
        summary.rentedProperties > 0 ? summary.totalIncome / summary.rentedProperties : 0, 
        showFinancialValues
      ),
      icon: DollarSign,
      color: 'yellow',
      gradient: 'from-yellow-400 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100',
      description: 'Por propriedade/mês'
    }
  ];

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 30, scale: 0.9 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    hover: {
      y: -8,
      scale: 1.03,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    initial: { rotate: 0 },
    hover: { 
      rotate: 360,
      transition: {
        duration: 0.6,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <motion.div
            key={stat.title}
            className="group relative overflow-hidden"
            variants={cardVariants}
            whileHover="hover"
          >
            {/* Background with glassmorphism */}
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl"></div>
            
            {/* Animated gradient border */}
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="absolute inset-[1px] bg-white/90 dark:bg-gray-800/90 rounded-2xl"></div>
            
            {/* Content */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-500 group-hover:shadow-2xl">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {stat.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </div>
                
                <motion.div
                  className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgGradient} border border-white/50 shadow-lg`}
                  variants={iconVariants}
                >
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </motion.div>
              </div>
              
              {/* Value */}
              <div className="mb-4">
                <motion.p 
                  className="text-3xl font-bold text-gray-900 dark:text-gray-100"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                >
                  {stat.value}
                </motion.p>
              </div>
              
              {/* Progress bar (visual indicator) */}
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: stat.title === 'ROI Mensal' 
                        ? `${Math.min(Math.max(summary.monthlyROI * 10, 5), 100)}%`
                        : stat.title === 'Propriedades Ocupadas'
                        ? `${summary.occupancyRate}%`
                        : '75%'
                    }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-transparent via-transparent to-white/10 dark:to-gray-700/10 rounded-2xl"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-transparent via-transparent to-white/5 dark:to-gray-700/5 rounded-2xl"></div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};