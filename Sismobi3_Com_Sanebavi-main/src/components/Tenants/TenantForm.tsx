import React, { useState, useEffect } from 'react';
import { Tenant, Property } from '../../types';
import { createLocalDate } from '../../utils/calculations';

// Função para aplicar máscara de CPF
const formatCPF = (value: string): string => {
  // Remove tudo que não é dígito
  const cleanValue = value.replace(/\D/g, '');
  
  // Aplica a máscara
  if (cleanValue.length <= 3) {
    return cleanValue;
  } else if (cleanValue.length <= 6) {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  } else if (cleanValue.length <= 9) {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  } else {
    return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
  }
};

interface TenantFormProps {
  tenant?: Tenant | null;
  properties: Property[];
  onSubmit: (tenant: Omit<Tenant, 'id'>) => void;
  onCancel: () => void;
}

export const TenantForm: React.FC<TenantFormProps> = ({ tenant, properties, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    propertyId: '',
    name: '',
    email: '',
    cpf: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    agreedPaymentDate: '',
    monthlyRent: 0,
    deposit: 0,
    paymentMethod: 'À vista' as const,
    installments: '2x' as const,
    formalizedContract: false,
    status: 'active' as const
  });

  const [depositPaidInstallments, setDepositPaidInstallments] = useState<boolean[]>([false]);

  useEffect(() => {
    if (tenant) {
      setFormData({
        propertyId: tenant.propertyId,
        name: tenant.name,
        email: tenant.email,
        cpf: tenant.cpf || '',
        phone: tenant.phone,
        startDate: new Date(tenant.startDate).toISOString().split('T')[0],
        agreedPaymentDate: tenant.agreedPaymentDate ? new Date(tenant.agreedPaymentDate).toISOString().split('T')[0] : '',
        monthlyRent: tenant.monthlyRent,
        deposit: tenant.deposit,
        paymentMethod: tenant.paymentMethod || 'À vista',
        installments: tenant.installments || '2x',
        formalizedContract: tenant.formalizedContract || false,
        status: tenant.status
      });
      
      // Configurar checkboxes do calção baseado nos dados existentes
      if (tenant.depositPaidInstallments) {
        setDepositPaidInstallments(tenant.depositPaidInstallments);
      } else {
        // Inicializar baseado no método de pagamento
        const installmentCount = tenant.paymentMethod === 'À vista' ? 1 : 
                               tenant.installments === '3x' ? 3 : 2;
        setDepositPaidInstallments(new Array(installmentCount).fill(false));
      }
    }
  }, [tenant]);

  // Atualizar checkboxes quando o método de pagamento mudar
  useEffect(() => {
    const installmentCount = formData.paymentMethod === 'À vista' ? 1 : 
                           formData.installments === '3x' ? 3 : 2;
    setDepositPaidInstallments(new Array(installmentCount).fill(false));
  }, [formData.paymentMethod, formData.installments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tenantData: Omit<Tenant, 'id'> = {
      propertyId: formData.propertyId,
      name: formData.name,
      email: formData.email,
      cpf: formData.cpf,
      phone: formData.phone,
      startDate: createLocalDate(formData.startDate),
      agreedPaymentDate: formData.agreedPaymentDate ? createLocalDate(formData.agreedPaymentDate) : undefined,
      monthlyRent: formData.monthlyRent,
      deposit: formData.deposit,
      paymentMethod: formData.paymentMethod,
      formalizedContract: formData.formalizedContract,
      depositPaidInstallments: depositPaidInstallments,
      status: formData.status
    };

    // Incluir installments apenas se paymentMethod for 'A prazo'
    if (formData.paymentMethod === 'A prazo') {
      tenantData.installments = formData.installments;
    }

    onSubmit(tenantData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'cpf') {
      // Aplicar máscara de CPF
      const formattedCPF = formatCPF(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedCPF
      }));
    } else {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyRent' || name === 'deposit' ? Number(value) : value
    }));
    }
  };

  const handleDepositInstallmentChange = (index: number, checked: boolean) => {
    setDepositPaidInstallments(prev => {
      const newInstallments = [...prev];
      newInstallments[index] = checked;
      return newInstallments;
    });
  };

  const getInstallmentLabel = (index: number, total: number) => {
    if (total === 1) return 'Parcela única paga';
    return `Parcela ${index + 1} paga`;
  };

  // Filtrar propriedades disponíveis
  const availableProperties = properties.filter(property => {
    // Incluir propriedades vagas
    if (property.status === 'vacant') return true;
    
    // Incluir propriedades alugadas sem inquilino vinculado
    if (property.status === 'rented' && !property.tenant) return true;
    
    // Incluir a propriedade atualmente vinculada ao inquilino sendo editado
    if (tenant && property.id === tenant.propertyId) return true;
    
    return false;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {tenant ? 'Editar Inquilino' : 'Novo Inquilino'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Propriedade vinculada</label>
          <select
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione uma propriedade</option>
            {availableProperties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo do inquilino"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              required
              maxLength={14}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
            />
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de início</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data acordada para pagamento mensal</label>
            <input
              type="date"
              name="agreedPaymentDate"
              value={formData.agreedPaymentDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aluguel mensal (R$)</label>
            <input
              type="number"
              name="monthlyRent"
              value={formData.monthlyRent}
              onChange={handleChange}
              required
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calção (R$)</label>
            <input
              type="number"
              name="deposit"
              value={formData.deposit}
              onChange={handleChange}
              required
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="À vista">À vista</option>
              <option value="A prazo">A prazo</option>
            </select>
          </div>

          {formData.paymentMethod === 'A prazo' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de parcelas</label>
              <select
                name="installments"
                value={formData.installments}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2x">2x</option>
                <option value="3x">3x</option>
              </select>
            </div>
          )}
        </div>

        {/* Validação do pagamento do Calção */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Status do pagamento do calção</label>
          <div className="space-y-2">
            {depositPaidInstallments.map((isPaid, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  id={`deposit-installment-${index}`}
                  checked={isPaid}
                  onChange={(e) => handleDepositInstallmentChange(index, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`deposit-installment-${index}`} className="ml-2 block text-sm text-gray-900">
                  {getInstallmentLabel(index, depositPaidInstallments.length)}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="formalizedContract"
            name="formalizedContract"
            checked={formData.formalizedContract}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="formalizedContract" className="ml-2 block text-sm text-gray-900">
            Contrato formalizado
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {tenant ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
};