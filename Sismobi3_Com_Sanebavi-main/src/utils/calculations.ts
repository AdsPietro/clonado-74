import { Property, Transaction, FinancialSummary } from '../types';

export const calculateFinancialSummary = (
  properties: Property[],
  transactions: Transaction[]
): FinancialSummary => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    return t.date.getMonth() === currentMonth && 
           t.date.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalIncome - totalExpenses;
  const totalProperties = properties.length;
  const rentedProperties = properties.filter(p => p.status === 'rented').length;
  const occupancyRate = totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0;

  const totalInvestment = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
  const monthlyROI = totalInvestment > 0 ? (netIncome / totalInvestment) * 100 : 0;

  return {
    totalIncome,
    totalExpenses,
    netIncome,
    occupancyRate,
    totalProperties,
    rentedProperties,
    monthlyROI
  };
};

export const formatCurrency = (amount: number): string => {
  return formatCurrencyWithVisibility(amount, true);
};

export const formatCurrencyWithVisibility = (amount: number, showValues: boolean = true): string => {
  if (!showValues) {
    return '••••';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const createLocalDate = (dateString: string): Date => {
  // Para strings no formato YYYY-MM-DD, criar data local
  if (dateString.includes('-') && dateString.length === 10) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
};

export const isDateInCurrentMonth = (date: Date): boolean => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};