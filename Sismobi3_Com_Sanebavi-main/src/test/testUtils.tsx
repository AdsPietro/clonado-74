import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ActivationProvider } from '../contexts/ActivationContext';

// Criar um QueryClient para testes
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Wrapper personalizado que inclui todos os providers necessários
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ActivationProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ActivationProvider>
    </QueryClientProvider>
  );
};

// Função de render customizada
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-exportar tudo do testing-library
export * from '@testing-library/react';

// Sobrescrever o render com nossa versão customizada
export { customRender as render };

// Utilitários de teste adicionais
export const createMockProperty = (overrides = {}) => ({
  id: '1',
  name: 'Apartamento Teste',
  address: 'Rua Teste, 123',
  type: 'apartment' as const,
  purchasePrice: 200000,
  rentValue: 1500,
  status: 'rented' as const,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockTenant = (overrides = {}) => ({
  id: '1',
  propertyId: '1',
  name: 'João Silva',
  email: 'joao@email.com',
  cpf: '123.456.789-00',
  phone: '(11) 99999-9999',
  startDate: new Date('2024-01-01'),
  monthlyRent: 1500,
  deposit: 1500,
  status: 'active' as const,
  ...overrides,
});

export const createMockTransaction = (overrides = {}) => ({
  id: '1',
  propertyId: '1',
  type: 'income' as const,
  category: 'Aluguel',
  amount: 1500,
  description: 'Aluguel Janeiro',
  date: new Date(),
  ...overrides,
});