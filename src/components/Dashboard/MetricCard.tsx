import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

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
    green: {
      gradient: 'from-green-400 via-green-500 to-green-600',
      bg: 'from-green-50/90 to-green-100/90',
      text: 'text-green-600',
      shadow: 'shadow-green-500/20',
      glow: 'group-hover:shadow-green-500/30'
    },
    red: {
      gradient: 'from-red-400 via-red-500 to-red-600',
      bg: 'from-red-50/90 to-red-100/90',
      text: 'text-red-600',
      shadow: 'shadow-red-500/20',
      glow: 'group-hover:shadow-red-500/30'
    },
    blue: {
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      bg: 'from-blue-50/90 to-blue-100/90',
      text: 'text-blue-600',
      shadow: 'shadow-blue-500/20',
      glow: 'group-hover:shadow-blue-500/30'
    },
    yellow: {
      gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
      bg: 'from-yellow-50/90 to-yellow-100/90',
      text: 'text-yellow-600',
      shadow: 'shadow-yellow-500/20',
      glow: 'group-hover:shadow-yellow-500/30'
    }
  };

  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const iconVariants = {
    initial: { rotate: 0, scale: 1 },
    hover: { 
      rotate: 10, 
      scale: 1.1,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const valueVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      className="group relative"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      {/* Background with glassmorphism effect */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl"></div>
      
      {/* Gradient border */}
      <div className={`absolute inset-0 bg-gradient-to-r ${colorClasses[color].gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      <div className="absolute inset-[1px] bg-white/90 dark:bg-gray-800/90 rounded-2xl"></div>
      
      {/* Content */}
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl ${colorClasses[color].shadow} ${colorClasses[color].glow} p-6 border border-gray-100/50 dark:border-gray-700/50 transition-all duration-300`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <motion.p 
              className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2 } }}
            >
              {title}
            </motion.p>
            
            <motion.p 
              className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-3"
              variants={valueVariants}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
            >
              {value}
            </motion.p>
            
            {trend && (
              <motion.div 
                className="flex items-center mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
              >
                <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
                  trend.isPositive 
                    ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200' 
                    : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200'
                }`}>
                  {trend.isPositive ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </div>
                <span className="ml-3 text-gray-500 dark:text-gray-400 text-sm font-medium">
                  vs. mês anterior
                </span>
              </motion.div>
            )}
          </div>
          
          <motion.div 
            className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color].bg} border border-white/50 shadow-lg backdrop-blur-sm`}
            variants={iconVariants}
          >
            <Icon className={`w-8 h-8 ${colorClasses[color].text}`} />
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-transparent via-transparent to-gray-50/30 dark:to-gray-700/30 rounded-2xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-transparent via-transparent to-gray-50/20 dark:to-gray-700/20 rounded-2xl"></div>
      </div>
    </motion.div>
  );
};