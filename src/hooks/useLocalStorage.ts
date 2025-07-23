import { useState, useEffect } from 'react';

// Helper function to convert date strings back to Date objects
function reviveDates(key: string, value: any): any {
  // Define which keys should be converted to dates
  const dateFields = ['createdAt', 'startDate', 'agreedPaymentDate', 'date', 'nextDate', 'issueDate', 'validityDate', 'lastUpdated'];
  
  if (typeof value === 'string' && dateFields.includes(key)) {
    const date = new Date(value);
    // Check if it's a valid date
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return value;
}

// Helper function to recursively process objects and arrays
function processStoredData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => processStoredData(item));
  }
  
  if (typeof data === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(data)) {
      processed[key] = reviveDates(key, processStoredData(value));
    }
    return processed;
  }
  
  return data;
}

// Helper function to sync tenant data with properties in localStorage
function syncTenantWithProperties(properties: any[], tenants: any[]): any[] {
  return properties.map(property => {
    // Find the tenant for this property
    const tenant = tenants.find(t => t.propertyId === property.id && t.status === 'active');
    
    return {
      ...property,
      tenant: tenant || undefined
    };
  });
}
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        let processed = processStoredData(parsed);
        
        // Special handling for properties to sync with tenants
        if (key === 'properties') {
          try {
            const tenantsItem = window.localStorage.getItem('tenants');
            if (tenantsItem) {
              const tenants = processStoredData(JSON.parse(tenantsItem));
              processed = syncTenantWithProperties(processed, tenants);
            }
          } catch (error) {
            console.warn('Erro ao sincronizar inquilinos com propriedades:', error);
          }
        }
        
        return processed;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
       
       // Special handling: when tenants are updated, also update properties to sync the relationship
       if (key === 'tenants') {
         try {
           const propertiesItem = window.localStorage.getItem('properties');
           if (propertiesItem) {
             const properties = processStoredData(JSON.parse(propertiesItem));
             const syncedProperties = syncTenantWithProperties(properties, valueToStore as any);
             window.localStorage.setItem('properties', JSON.stringify(syncedProperties));
           }
         } catch (error) {
           console.warn('Erro ao sincronizar propriedades com inquilinos:', error);
         }
       }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}