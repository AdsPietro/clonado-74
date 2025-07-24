import React from 'react';
import { motion } from 'framer-motion';
import { Home, MapPin, DollarSign, User, AlertCircle } from 'lucide-react';
import { Property } from '../../types';
import { formatCurrencyWithVisibility } from '../../utils/calculations';

interface PropertyListProps {
  properties: Property[];
  showFinancialValues: boolean;
}

export const PropertyList: React.FC<PropertyListProps> = ({ properties, showFinancialValues }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'rented': 
        return {
          color: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200',
          icon: User,
          text: 'Alugado',
          dotColor: 'bg-green-500'
        };
      case 'vacant': 
        return {
          color: 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200',
          icon: Home,
          text: 'Vago',
          dotColor: 'bg-yellow-500'
        };
      case 'maintenance': 
        return {
          color: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200',
          icon: AlertCircle,
          text: 'Manutenção',
          dotColor: 'bg-red-500'
        };
      default: 
        return {
          color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200',
          icon: Home,
          text: 'Indefinido',
          dotColor: 'bg-gray-500'
        };
    }
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, x: -20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.02,
      x: 4,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div 
      className="space-y-3"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {properties.slice(0, 5).map((property, index) => {
        const statusConfig = getStatusConfig(property.status);
        const StatusIcon = statusConfig.icon;
        
        return (
          <motion.div 
            key={property.id}
            className="group relative overflow-hidden"
            variants={itemVariants}
            whileHover="hover"
            layout
          >
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-700/80 dark:to-gray-800/80 rounded-xl"></div>
            
            {/* Main content */}
            <div className="relative flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300">
              
              {/* Left side - Property info */}
              <div className="flex items-center space-x-4 flex-1">
                {/* Property icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl flex items-center justify-center border border-blue-200/50 dark:border-blue-700/50">
                    <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                
                {/* Property details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    {property.name}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{property.address}</span>
                  </div>
                </div>
              </div>
              
              {/* Right side - Status and value */}
              <div className="flex items-center space-x-4">
                {/* Rent value */}
                <div className="text-right">
                  <div className="flex items-center text-gray-900 dark:text-gray-100 font-bold text-lg">
                    <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                    {formatCurrencyWithVisibility(property.rentValue, showFinancialValues)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">por mês</p>
                </div>
                
                {/* Status badge */}
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border font-bold text-sm ${statusConfig.color} shadow-sm`}>
                  <div className="flex items-center space-x-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}></div>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <span>{statusConfig.text}</span>
                </div>
              </div>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl"></div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </motion.div>
        );
      })}
      
      {properties.length > 5 && (
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 to-gray-800 rounded-full border border-gray-200 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              E mais {properties.length - 5} propriedades...
            </span>
            <motion.div
              className="ml-2 w-2 h-2 bg-blue-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}
      
      {properties.length === 0 && (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Nenhuma propriedade cadastrada
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};