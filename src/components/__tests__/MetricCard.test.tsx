import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DollarSign } from 'lucide-react';
import { MetricCard } from '../Dashboard/MetricCard';

describe('MetricCard', () => {
  it('should render metric card with basic props', () => {
    render(
      <MetricCard
        title="Receita Mensal"
        value="R$ 5.000,00"
        icon={DollarSign}
        color="green"
      />
    );

    expect(screen.getByText('Receita Mensal')).toBeInTheDocument();
    expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument();
  });

  it('should render trend information when provided', () => {
    render(
      <MetricCard
        title="Receita Mensal"
        value="R$ 5.000,00"
        icon={DollarSign}
        color="green"
        trend={{ value: 8.5, isPositive: true }}
      />
    );

    expect(screen.getByText('↗ +8.5%')).toBeInTheDocument();
    expect(screen.getByText('vs. mês anterior')).toBeInTheDocument();
  });

  it('should render negative trend correctly', () => {
    render(
      <MetricCard
        title="Despesas Mensais"
        value="R$ 2.000,00"
        icon={DollarSign}
        color="red"
        trend={{ value: -2.3, isPositive: false }}
      />
    );

    expect(screen.getByText('↘ -2.3%')).toBeInTheDocument();
  });

  it('should apply correct color classes', () => {
    const { container } = render(
      <MetricCard
        title="Test"
        value="R$ 1.000,00"
        icon={DollarSign}
        color="blue"
      />
    );

    const iconContainer = container.querySelector('.from-blue-50');
    expect(iconContainer).toBeInTheDocument();
  });
});