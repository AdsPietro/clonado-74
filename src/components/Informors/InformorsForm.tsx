import React, { useState, useEffect } from 'react';
import { LoadingButton } from '../UI/LoadingSpinner';
import { Informor } from '../../types/informor';

interface InformorsFormProps {
  informor?: Informor | null;
  onSubmit: (dados: Omit<Informor, 'id'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const InformorsForm: React.FC<InformorsFormProps> = ({
  informor,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    vencimento: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (informor) {
      setFormData({
        nome: informor.nome,
        valor: informor.valor.toString(),
        vencimento: informor.vencimento
      });
    }
  }, [informor]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.valor || Number(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.vencimento) {
      newErrors.vencimento = 'Data de vencimento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit({
      nome: formData.nome.trim(),
      valor: Number(formData.valor),
      vencimento: formData.vencimento
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {informor ? 'Editar Informor' : 'Novo Informor'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            disabled={loading}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
              errors.nome ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: Aluguel, Condomínio, etc."
          />
          {errors.nome && (
            <p className="text-red-600 text-sm mt-1">{errors.nome}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor (R$)
          </label>
          <input
            type="number"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            disabled={loading}
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
              errors.valor ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="0,00"
          />
          {errors.valor && (
            <p className="text-red-600 text-sm mt-1">{errors.valor}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Vencimento
          </label>
          <input
            type="date"
            name="vencimento"
            value={formData.vencimento}
            onChange={handleChange}
            disabled={loading}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed ${
              errors.vencimento ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          />
          {errors.vencimento && (
            <p className="text-red-600 text-sm mt-1">{errors.vencimento}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <LoadingButton
            loading={loading}
            variant="primary"
            className="px-6"
          >
            {informor ? 'Atualizar' : 'Salvar'}
          </LoadingButton>
        </div>
      </form>
    </div>
  );
};