import React, { useState, useEffect } from 'react';
import { Document, Property, Tenant } from '../../types';
import { createLocalDate } from '../../utils/calculations';

interface DocumentFormProps {
  document?: Document | null;
  properties: Property[];
  tenants: Tenant[];
  onSubmit: (document: Omit<Document, 'id' | 'lastUpdated'>) => void;
  onCancel: () => void;
}

const documentTypes = [
  'Contrato de locação',
  'Comprovante de pagamento',
  'RG',
  'CPF',
  'Laudo técnico',
  'Outros'
] as const;

const documentStatuses = [
  'Válido',
  'Expirado',
  'Pendente',
  'Revisão'
] as const;

export const DocumentForm: React.FC<DocumentFormProps> = ({
  document,
  properties,
  tenants,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    type: 'Contrato de locação' as const,
    issueDate: new Date().toISOString().split('T')[0],
    hasValidity: false,
    validityDate: '',
    fileName: '',
    observations: '',
    propertyId: '',
    tenantId: '',
    status: 'Válido' as const,
    contractSigned: false
  });

  useEffect(() => {
    if (document) {
      setFormData({
        type: document.type,
        issueDate: new Date(document.issueDate).toISOString().split('T')[0],
        hasValidity: document.hasValidity,
        validityDate: document.validityDate ? new Date(document.validityDate).toISOString().split('T')[0] : '',
        fileName: document.fileName || '',
        observations: document.observations,
        propertyId: document.propertyId,
        tenantId: document.tenantId || '',
        status: document.status,
        contractSigned: document.contractSigned
      });
    }
  }, [document]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const documentData: Omit<Document, 'id' | 'lastUpdated'> = {
      type: formData.type,
      issueDate: createLocalDate(formData.issueDate),
      hasValidity: formData.hasValidity,
      validityDate: formData.hasValidity && formData.validityDate ? createLocalDate(formData.validityDate) : undefined,
      fileName: formData.fileName || undefined,
      fileUrl: formData.fileName ? `documents/${formData.fileName}` : undefined,
      observations: formData.observations,
      propertyId: formData.propertyId,
      tenantId: formData.tenantId || undefined,
      status: formData.status,
      contractSigned: formData.contractSigned
    };

    onSubmit(documentData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0];
      setFormData(prev => ({
        ...prev,
        fileName: file ? file.name : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Filtrar propriedades e inquilinos ativos
  const activeProperties = (properties || []).filter(p => p.status === 'rented' || p.tenant);
  const activeTenants = (tenants || []).filter(t => t.status === 'active');
  
  // Filtrar inquilinos da propriedade selecionada
  const propertyTenants = formData.propertyId 
    ? (activeTenants || []).filter(t => t.propertyId === formData.propertyId)
    : activeTenants;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {document ? 'Editar Documento' : 'Novo Documento'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grupo 1: Informações Básicas do Documento */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-medium text-gray-800 mb-4">Informações do Documento</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {documentTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status do documento</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {documentStatuses.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de emissão</label>
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasValidity"
                    name="hasValidity"
                    checked={formData.hasValidity}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasValidity" className="ml-2 block text-sm text-gray-900">
                    Documento possui validade
                  </label>
                </div>
                {formData.hasValidity && (
                  <input
                    type="date"
                    name="validityDate"
                    value={formData.validityDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grupo 2: Arquivo e Observações */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-medium text-gray-800 mb-4">Arquivo e Observações</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
              <input
                type="file"
                name="file"
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Formatos aceitos: PDF, JPG, PNG, DOCX
              </p>
              {formData.fileName && (
                <p className="text-sm text-green-600 mt-1">
                  Arquivo selecionado: {formData.fileName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Anotações ou detalhes relevantes sobre o documento"
              />
            </div>
          </div>
        </div>

        {/* Grupo 3: Vínculos */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-md font-medium text-gray-800 mb-4">Vínculos</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {activeProperties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inquilino relacionado</label>
              <select
                name="tenantId"
                value={formData.tenantId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um inquilino (opcional)</option>
                {propertyTenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grupo 4: Status do Contrato */}
        <div className="pb-2">
          <h4 className="text-md font-medium text-gray-800 mb-4">Status do Contrato</h4>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="contractSigned"
              name="contractSigned"
              checked={formData.contractSigned}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="contractSigned" className="ml-2 block text-sm text-gray-900">
              Contrato assinado formalmente
            </label>
          </div>
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
            {document ? 'Atualizar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
};