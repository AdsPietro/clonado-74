import { describe, it, expect } from 'vitest';
import { 
  calculateFinancialSummary, 
  formatCurrency, 
  formatCurrencyWithVisibility,
  formatDate,
  createLocalDate,
  isDateInCurrentMonth
} from '../calculations';
import { Property, Transaction } from '../../types';

describe('calculations', () => {
  describe('calculateFinancialSummary', () => {
    const mockProperties: Property[] = [
      {
        id: '1',
        name: 'Apartamento 1',
        address: 'Rua A, 123',
        type: 'apartment',
        purchasePrice: 200000,
        rentValue: 1500,
        status: 'rented',
        createdAt: new Date('2024-01-01')
      },
      {
        id: '2',
        name: 'Casa 1',
        address: 'Rua B, 456',
        type: 'house',
        purchasePrice: 300000,
        rentValue: 2000,
        status: 'vacant',
        createdAt: new Date('2024-01-01')
      }
    ];

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        propertyId: '1',
        type: 'income',
        category: 'Aluguel',
        amount: 1500,
        description: 'Aluguel Janeiro',
        date: new Date()
      },
      {
        id: '2',
        propertyId: '1',
        type: 'expense',
        category: 'Manutenção',
        amount: 200,
        description: 'Reparo torneira',
        date: new Date()
      }
    ];

    it('should calculate financial summary correctly', () => {
      const summary = calculateFinancialSummary(mockProperties, mockTransactions);
      
      expect(summary.totalIncome).toBe(1500);
      expect(summary.totalExpenses).toBe(200);
      expect(summary.netIncome).toBe(1300);
      expect(summary.totalProperties).toBe(2);
      expect(summary.rentedProperties).toBe(1);
      expect(summary.occupancyRate).toBe(50);
    });

    it('should handle empty arrays', () => {
      const summary = calculateFinancialSummary([], []);
      
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.netIncome).toBe(0);
      expect(summary.totalProperties).toBe(0);
      expect(summary.rentedProperties).toBe(0);
      expect(summary.occupancyRate).toBe(0);
      expect(summary.monthlyROI).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in Brazilian format', () => {
      expect(formatCurrency(1500.50)).toBe('R$ 1.500,50');
      expect(formatCurrency(0)).toBe('R$ 0,00');
      expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00');
    });
  });

  describe('formatCurrencyWithVisibility', () => {
    it('should show currency when visibility is true', () => {
      expect(formatCurrencyWithVisibility(1500.50, true)).toBe('R$ 1.500,50');
    });

    it('should hide currency when visibility is false', () => {
      expect(formatCurrencyWithVisibility(1500.50, false)).toBe('••••');
    });
  });

  describe('formatDate', () => {
    it('should format date in Brazilian format', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('15/01/2024');
    });
  });

  describe('createLocalDate', () => {
    it('should create local date from YYYY-MM-DD string', () => {
      const date = createLocalDate('2024-01-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // Janeiro é 0
      expect(date.getDate()).toBe(15);
    });

    it('should handle other date formats', () => {
      const date = createLocalDate('2024-01-15T10:30:00Z');
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('isDateInCurrentMonth', () => {
    it('should return true for current month dates', () => {
      const now = new Date();
      const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 15);
      expect(isDateInCurrentMonth(currentMonthDate)).toBe(true);
    });

    it('should return false for different month dates', () => {
      const now = new Date();
      const differentMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
      expect(isDateInCurrentMonth(differentMonthDate)).toBe(false);
    });
  });
});