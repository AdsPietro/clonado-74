import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ActivationProvider, useActivation } from '../ActivationContext';

// Componente de teste para usar o contexto
const TestComponent = () => {
  const { isActivated, isDemoMode, activateSystem, deactivateSystem } = useActivation();
  
  return (
    <div>
      <div data-testid="activation-status">
        {isActivated ? 'Ativado' : 'Demo'}
      </div>
      <div data-testid="demo-mode">
        {isDemoMode ? 'Modo Demo' : 'Modo Completo'}
      </div>
      <button 
        onClick={() => activateSystem('MINHA-CHAVE-SECRETA-DO-BOLT')}
        data-testid="activate-button"
      >
        Ativar
      </button>
      <button 
        onClick={deactivateSystem}
        data-testid="deactivate-button"
      >
        Desativar
      </button>
    </div>
  );
};

describe('ActivationContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should start in demo mode by default', async () => {
    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('activation-status')).toHaveTextContent('Demo');
      expect(screen.getByTestId('demo-mode')).toHaveTextContent('Modo Demo');
    });
  });

  it('should activate system with correct key', async () => {
    const user = userEvent.setup();
    
    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    const activateButton = screen.getByTestId('activate-button');
    await user.click(activateButton);

    await waitFor(() => {
      expect(screen.getByTestId('activation-status')).toHaveTextContent('Ativado');
      expect(screen.getByTestId('demo-mode')).toHaveTextContent('Modo Completo');
    }, { timeout: 3000 });
  });

  it('should deactivate system', async () => {
    const user = userEvent.setup();
    
    // Primeiro ativar
    localStorage.setItem('sismobi-activation-key', 'VALID-KEY-FROM-SERVER');
    
    render(
      <ActivationProvider>
        <TestComponent />
      </ActivationProvider>
    );

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId('activation-status')).toHaveTextContent('Ativado');
    });

    // Desativar
    const deactivateButton = screen.getByTestId('deactivate-button');
    await user.click(deactivateButton);

    expect(screen.getByTestId('activation-status')).toHaveTextContent('Demo');
    expect(localStorage.getItem('sismobi-activation-key')).toBeNull();
  });

  it('should throw error when used outside provider', () => {
    // Capturar erro do console
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useActivation must be used within an ActivationProvider');
    
    consoleSpy.mockRestore();
  });
});