import React from 'react';
import { Property } from '../../types';
import { formatCurrencyWithVisibility } from '../../utils/calculations';

interface PropertyListProps {
  properties: Property[];
  showFinancialValues: boolean;
}

export const PropertyList: React.FC<PropertyListProps> = ({ properties, showFinancialValues }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rented': return 'bg-green-100 text-green-800';
      case 'vacant': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rented': return 'Alugado';
      case 'vacant': return 'Vago';
      case 'maintenance': return 'Manutenção';
      default: return 'Indefinido';
    }
  };

  return (
    <div className="space-y-3">
      {properties.slice(0, 5).map((property) => (
        <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{property.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{property.address}</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrencyWithVisibility(property.rentValue, showFinancialValues)}</p>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
              {getStatusText(property.status)}
            </span>
          </div>
        </div>
      ))}
      
      {properties.length > 5 && (
        <p className="text-sm text-gray-500 text-center">
          E mais {properties.length - 5} propriedades...
        </p>
      )}
    </div>
  );
};