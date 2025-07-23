import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { render, createMockProperty } from '../../test/testUtils';
import { PropertyForm } from '../Properties/PropertyForm';

describe('PropertyForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields correctly', () => {
    render(
      <PropertyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valor de compra/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valor do aluguel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('should show "Nova Propriedade" title when creating', () => {
    render(
      <PropertyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Nova Propriedade')).toBeInTheDocument();
  });

  it('should show "Editar Propriedade" title when editing', () => {
    const mockProperty = createMockProperty();
    
    render(
      <PropertyForm
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Editar Propriedade')).toBeInTheDocument();
  });

  it('should populate form fields when editing existing property', () => {
    const mockProperty = createMockProperty({
      name: 'Apartamento Centro',
      address: 'Rua Central, 456',
      type: 'apartment',
      purchasePrice: 250000,
      rentValue: 1800,
      status: 'rented'
    });

    render(
      <PropertyForm
        property={mockProperty}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Apartamento Centro')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rua Central, 456')).toBeInTheDocument();
    expect(screen.getByDisplayValue('250000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1800')).toBeInTheDocument();
  });

  it('should call onSubmit with correct data when form is submitted', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Preencher campos obrigatórios
    await user.type(screen.getByLabelText(/nome/i), 'Nova Propriedade');
    await user.type(screen.getByLabelText(/endereço/i), 'Rua Nova, 789');
    await user.type(screen.getByLabelText(/valor de compra/i), '300000');
    await user.type(screen.getByLabelText(/valor do aluguel/i), '2000');

    // Submeter formulário
    await user.click(screen.getByRole('button', { name: /criar/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Nova Propriedade',
        address: 'Rua Nova, 789',
        type: 'apartment',
        purchasePrice: 300000,
        rentValue: 2000,
        status: 'vacant'
      });
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Tentar submeter sem preencher campos obrigatórios
    await user.click(screen.getByRole('button', { name: /criar/i }));

    // O formulário não deve ser submetido
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle different property types', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Selecionar tipo "Casa"
    await user.selectOptions(screen.getByLabelText(/tipo/i), 'house');
    
    expect(screen.getByDisplayValue('house')).toBeInTheDocument();
  });

  it('should handle energy unit name field', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const energyUnitField = screen.getByLabelText(/identificador da unidade de energia/i);
    await user.type(energyUnitField, '802-Ca 01');
    
    expect(screen.getByDisplayValue('802-Ca 01')).toBeInTheDocument();
  });
});