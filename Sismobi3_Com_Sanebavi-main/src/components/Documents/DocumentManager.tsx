import React, { useState } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar, User, Home, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { Document, Property, Tenant } from '../../types';
import { DocumentForm } from './DocumentForm';
import { formatDate } from '../../utils/calculations';
import { useActivation } from '../../contexts/ActivationContext';
import { LoadingButton, LoadingOverlay } from '../UI/LoadingSpinner';
import { HighlightCard, AnimatedListItem } from '../UI/HighlightCard';
import { useConfirmationModal } from '../UI/ConfirmationModal';
import { useEnhancedToast } from '../UI/EnhancedToast';

interface DocumentManagerProps {
  documents: Document[];
  loading?: boolean;
  error?: Error | null;
  properties: Property[];
  tenants: Tenant[];
  onAddDocument: (document: Omit<Document, 'id' | 'lastUpdated'>) => Promise<boolean>;
  onUpdateDocument: (id: string, document: Partial<Document>) => Promise<boolean>;
  onDeleteDocument: (id: string) => Promise<boolean>;
  onReload?: () => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  loading: externalLoading = false,
  error: externalError = null,
  properties,
  tenants,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onReload
}) => {
  const { isDemoMode } = useActivation();
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'expired' | 'pending'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [internalLoading, setInternalLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);

  const { showConfirmation, ConfirmationModalComponent } = useConfirmationModal();
  const toast = useEnhancedToast();

  // Configurações do modo DEMO
  const DEMO_LIMITS = {
    maxDocuments: 15
  };

  const isAtDemoLimit = isDemoMode && documents.length >= DEMO_LIMITS.maxDocuments;
  
  // Combinar estados de loading
  const loading = externalLoading || internalLoading;

  const handleAddDocument = async (documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
    if (isAtDemoLimit) {
      toast.demoLimit('documentos', DEMO_LIMITS.maxDocuments);
      return; // Não permite adicionar se estiver no limite do demo
    }
    setInternalLoading(true);
    
    try {
      const newDocument = await onAddDocument(documentData);
      if (newDocument) {
        setShowForm(false);
        
        // Destacar o novo item usando o ID retornado
        setHighlightedId(newDocument.id);
        setNewItemId(newDocument.id);
        
        // Limpar destaque após 3 segundos
        setTimeout(() => setHighlightedId(null), 3000);
        setTimeout(() => setNewItemId(null), 1000);
      }
    } finally {
      setInternalLoading(false);
    }
  };

  // Mostrar erro se houver
  if (externalError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Documentos</h2>
          {onReload && (
            <LoadingButton
              loading={loading}
              onClick={onReload}
              variant="secondary"
            >
              Tentar Novamente
            </LoadingButton>
          )}
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center space-x-3">
          <div className="w-6 h-6 text-red-600 flex-shrink-0">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Erro ao carregar documentos</h3>
            <p className="text-red-600 text-sm mt-1">
              {externalError instanceof Error ? externalError.message : 'Erro desconhecido'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setShowForm(true);
  };

  const handleUpdateDocument = async (documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
    if (editingDocument) {
      setInternalLoading(true);
      
      try {
        const updatedDocument = await onUpdateDocument(editingDocument.id, documentData);
        if (updatedDocument) {
          setEditingDocument(null);
          setShowForm(false);
          
          // Destacar o item editado
          setHighlightedId(updatedDocument.id);
          setTimeout(() => setHighlightedId(null), 3000);
        }
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const handleDeleteDocument = (document: Document) => {
    showConfirmation({
      title: 'Excluir Documento',
      message: `Tem certeza que deseja excluir o documento "${document.type}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      type: 'danger',
      onConfirm: async () => {
        const success = await onDeleteDocument(document.id);
        if (success) {
          toast.deleted('Documento');
        }
      }
    });
  };

  const handleAddDocument_old = (documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
    if (isAtDemoLimit) {
      return; // Não permite adicionar se estiver no limite do demo
    }
    setInternalLoading(true);
    
    // Simular operação assíncrona
    setTimeout(() => {
      const newDocument = {
        ...documentData,
        id: Date.now().toString(),
        lastUpdated: new Date()
      };
      
      onAddDocument(documentData);
      setShowForm(false);
      setInternalLoading(false);
      
      // Destacar o novo item
      setHighlightedId(newDocument.id);
      setNewItemId(newDocument.id);
      
      // Limpar destaque após 3 segundos
      setTimeout(() => setHighlightedId(null), 3000);
      setTimeout(() => setNewItemId(null), 1000);
    }, 800);
  };

  const handleUpdateDocument_old = (documentData: Omit<Document, 'id' | 'lastUpdated'>) => {
    if (editingDocument) {
      setInternalLoading(true);
      
      // Simular operação assíncrona
      setTimeout(() => {
        onUpdateDocument(editingDocument.id, documentData);
        setEditingDocument(null);
        setShowForm(false);
        setInternalLoading(false);
        
        // Destacar o item editado
        setHighlightedId(editingDocument.id);
        setTimeout(() => setHighlightedId(null), 3000);
      }, 600);
    }
  };

  const filteredDocuments = documents.filter(document => {
    const statusMatch = filter === 'all' || 
      (filter === 'valid' && document.status === 'Válido') ||
      (filter === 'expired' && document.status === 'Expirado') ||
      (filter === 'pending' && document.status === 'Pendente');
    
    const typeMatch = typeFilter === 'all' || document.type === typeFilter;
    
    return statusMatch && typeMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Válido': return 'bg-green-100 text-green-800';
      case 'Expirado': return 'bg-red-100 text-red-800';
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Revisão': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Válido': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Expirado': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'Pendente': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Revisão': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const documentTypes = [...new Set(documents.map(d => d.type))];

  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Documentos</h2>
          {isDemoMode ? (
            <p className="text-sm text-orange-600 mt-1">
              Modo DEMO: {documents.length}/{DEMO_LIMITS.maxDocuments} documentos utilizados
            </p>
          ) : (
            <p className="text-gray-600 mt-1">
              {loading && documents.length === 0 ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  <span>Carregando documentos...</span>
                </span>
              ) : (
                `${documents.length} documento{documents.length !== 1 ? 's' : ''} cadastrado{documents.length !== 1 ? 's' : ''}`
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end space-y-2">
          {onReload && (
            <LoadingButton
              loading={loading}
              onClick={onReload}
              variant="secondary"
            >
              Recarregar
            </LoadingButton>
          )}
          <LoadingButton
            loading={loading}
            onClick={() => setShowForm(true)}
            disabled={isAtDemoLimit}
            variant={isAtDemoLimit ? 'secondary' : 'primary'}
            title={isAtDemoLimit ? 'Limite do modo DEMO atingido' : 'Adicionar novo documento'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Documento
          </LoadingButton>
          {isAtDemoLimit && (
            <p className="text-xs text-red-600 text-right max-w-xs">
              Limite de {DEMO_LIMITS.maxDocuments} documentos atingido no modo DEMO. 
              Ative o sistema para cadastros ilimitados.
            </p>
          )}
        </div>
      </div>

      {/* Aviso do modo DEMO */}
      {isDemoMode && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <h3 className="text-orange-800 font-medium">Modo DEMO Ativo</h3>
          </div>
          <p className="text-orange-700 text-sm mt-1">
            Você pode cadastrar até {DEMO_LIMITS.maxDocuments} documentos. 
            Para acesso ilimitado, ative o sistema na aba "Ativação".
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'valid' | 'expired' | 'pending')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="valid">Válidos</option>
            <option value="expired">Expirados</option>
            <option value="pending">Pendentes</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            {documentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <LoadingOverlay loading={loading} message={editingDocument ? "Atualizando documento..." : "Criando documento..."}>
          <DocumentForm
            document={editingDocument}
            properties={properties}
            tenants={tenants}
            onSubmit={editingDocument ? handleUpdateDocument : handleAddDocument}
            onCancel={() => {
              setShowForm(false);
              setEditingDocument(null);
            }}
          />
        </LoadingOverlay>
      )}

      {/* Lista de Documentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDocuments.map((document) => {
          const property = properties.find(p => p.id === document.propertyId);
          const tenant = tenants.find(t => t.id === document.tenantId);
          
          return (
            <AnimatedListItem
              key={document.id}
              isNew={newItemId === document.id}
            >
              <HighlightCard
                isHighlighted={highlightedId === document.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{document.type}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusIcon(document.status)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                          {document.status}
                        </span>
                        {document.contractSigned && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Assinado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditDocument(document)}
                      disabled={loading}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document)}
                      disabled={loading}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Emissão: {formatDate(document.issueDate)}</span>
                    </div>
                    
                    {document.hasValidity && document.validityDate && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Validade: {formatDate(document.validityDate)}</span>
                      </div>
                    )}
                    
                    {!document.hasValidity && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Sem validade</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Home className="w-4 h-4 mr-2" />
                      <span>Propriedade: {property?.name || 'Não encontrada'}</span>
                    </div>
                    
                    {tenant && (
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>Inquilino: {tenant.name}</span>
                      </div>
                    )}
                  </div>

                  {document.fileName && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Arquivo:</span> {document.fileName}
                    </div>
                  )}

                  {document.observations && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Observações:</span>
                      <p className="mt-1 text-gray-700">{document.observations}</p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    Última atualização: {formatDate(document.lastUpdated)}
                  </div>
                </div>
              </HighlightCard>
            </AnimatedListItem>
          );
        })}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {filter === 'all' && typeFilter === 'all' 
              ? 'Nenhum documento cadastrado' 
              : 'Nenhum documento encontrado com os filtros aplicados'
            }
          </p>
          <p className="text-gray-400 mt-2">
            {filter === 'all' && typeFilter === 'all'
              ? 'Comece adicionando seu primeiro documento'
              : 'Tente ajustar os filtros ou adicionar novos documentos'
            }
          </p>
        </div>
      )}
    </div>
    
      {ConfirmationModalComponent}
    </>
  );
};