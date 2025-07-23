import { describe, it, expect } from 'vitest';
import { 
  calculateMonthlyConsumption,
  validateConsumptionData,
  distributeEnergyGroupBill,
  createSharedPropertyConsumption,
  DEFAULT_ENERGY_GROUPS
} from '../energyCalculations';
import { SharedPropertyConsumption } from '../../types';

describe('energyCalculations', () => {
  describe('calculateMonthlyConsumption', () => {
    it('should calculate consumption correctly', () => {
      expect(calculateMonthlyConsumption(150, 100)).toBe(50);
      expect(calculateMonthlyConsumption(200, 180)).toBe(20);
    });

    it('should return 0 for negative consumption', () => {
      expect(calculateMonthlyConsumption(100, 150)).toBe(0);
    });

    it('should handle zero values', () => {
      expect(calculateMonthlyConsumption(0, 0)).toBe(0);
      expect(calculateMonthlyConsumption(100, 0)).toBe(100);
    });
  });

  describe('validateConsumptionData', () => {
    const mockProperties: SharedPropertyConsumption[] = [
      {
        id: '1',
        name: '802-Ca 01',
        currentReading: 150,
        previousReading: 100,
        monthlyConsumption: 50,
        hasMeter: true,
        proportionalValue: 0,
        proportionalConsumption: 0,
        groupId: 'group1',
        isResidualReceiver: false,
        isPaid: false
      },
      {
        id: '2',
        name: '802-Ca 02',
        currentReading: 0,
        previousReading: 0,
        monthlyConsumption: 30,
        hasMeter: false,
        proportionalValue: 0,
        proportionalConsumption: 0,
        groupId: 'group1',
        isResidualReceiver: true,
        isPaid: false
      }
    ];

    it('should validate consistent consumption data', () => {
      const result = validateConsumptionData(mockProperties, 80);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Consumos estão consistentes');
    });

    it('should detect inconsistent consumption data', () => {
      const result = validateConsumptionData(mockProperties, 120);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Diferença de');
    });
  });

  describe('distributeEnergyGroupBill', () => {
    it('should distribute bill proportionally', () => {
      const properties: SharedPropertyConsumption[] = [
        {
          id: '1',
          name: '802-Ca 01',
          currentReading: 0,
          previousReading: 0,
          monthlyConsumption: 100,
          hasMeter: true,
          proportionalValue: 0,
          proportionalConsumption: 0,
          groupId: 'group1',
          isResidualReceiver: false,
          isPaid: false
        },
        {
          id: '2',
          name: '802-Ca 02',
          currentReading: 0,
          previousReading: 0,
          monthlyConsumption: 0,
          hasMeter: false,
          proportionalValue: 0,
          proportionalConsumption: 0,
          groupId: 'group1',
          isResidualReceiver: true,
          isPaid: false
        }
      ];

      const result = distributeEnergyGroupBill(200, 150, properties);
      
      // Propriedade com medidor deve ter valor proporcional ao consumo
      expect(result[0].proportionalValue).toBeCloseTo(133.33, 1);
      expect(result[0].proportionalConsumption).toBe(100);
      
      // Propriedade sem medidor deve receber o residual
      expect(result[1].proportionalValue).toBeCloseTo(66.67, 1);
      expect(result[1].proportionalConsumption).toBe(50);
    });

    it('should handle zero values', () => {
      const properties: SharedPropertyConsumption[] = [
        createSharedPropertyConsumption('802-Ca 01', 'group1', true, false) as SharedPropertyConsumption
      ];

      const result = distributeEnergyGroupBill(0, 0, properties);
      expect(result[0].proportionalValue).toBe(0);
      expect(result[0].proportionalConsumption).toBe(0);
    });
  });

  describe('createSharedPropertyConsumption', () => {
    it('should create property with correct default values', () => {
      const property = createSharedPropertyConsumption('802-Ca 01', 'group1');
      
      expect(property.name).toBe('802-Ca 01');
      expect(property.groupId).toBe('group1');
      expect(property.hasMeter).toBe(true);
      expect(property.isResidualReceiver).toBe(false);
      expect(property.currentReading).toBe(0);
      expect(property.previousReading).toBe(0);
      expect(property.monthlyConsumption).toBe(0);
      expect(property.isPaid).toBe(false);
      expect(property.dueDate).toBeInstanceOf(Date);
    });

    it('should create residual receiver property', () => {
      const property = createSharedPropertyConsumption('802-Ca 02', 'group1', false, true);
      
      expect(property.hasMeter).toBe(false);
      expect(property.isResidualReceiver).toBe(true);
    });
  });

  describe('DEFAULT_ENERGY_GROUPS', () => {
    it('should have correct group structure', () => {
      expect(DEFAULT_ENERGY_GROUPS).toHaveLength(3);
      
      const group1 = DEFAULT_ENERGY_GROUPS[0];
      expect(group1.id).toBe('group1');
      expect(group1.name).toBe('Grupo 1 (802-SUP)');
      expect(group1.properties).toContain('802-Ca 01');
      expect(group1.residualReceiver).toBe('802-Ca 02');
    });
  });
});