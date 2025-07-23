import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));
    
    expect(result.current[0]).toBe('initial-value');
  });

  it('should return stored value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));
    
    expect(result.current[0]).toBe('stored-value');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(result.current[0]).toBe('new-value');
    expect(localStorage.getItem('test-key')).toBe('"new-value"');
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    
    act(() => {
      result.current[1](prev => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
  });

  it('should handle complex objects', () => {
    const initialObject = { name: 'Test', value: 123 };
    const { result } = renderHook(() => useLocalStorage('test-object', initialObject));
    
    const newObject = { name: 'Updated', value: 456 };
    
    act(() => {
      result.current[1](newObject);
    });
    
    expect(result.current[0]).toEqual(newObject);
  });

  it('should handle Date objects correctly', () => {
    const testDate = new Date('2024-01-15');
    const objectWithDate = { 
      id: '1', 
      createdAt: testDate,
      startDate: testDate 
    };
    
    // Simular dados salvos no localStorage
    localStorage.setItem('test-dates', JSON.stringify(objectWithDate));
    
    const { result } = renderHook(() => useLocalStorage('test-dates', {}));
    
    expect(result.current[0].createdAt).toBeInstanceOf(Date);
    expect(result.current[0].startDate).toBeInstanceOf(Date);
  });
});