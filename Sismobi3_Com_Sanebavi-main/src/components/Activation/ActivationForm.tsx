import React, { useState } from 'react';
import { Shield, Key, AlertTriangle, CheckCircle, Mail, Phone, Loader, Download } from 'lucide-react';
import { useActivation } from '../../contexts/ActivationContext';
import { LoadingButton } from '../UI/LoadingSpinner';

export const ActivationForm: React.FC = () => {
  const { 
    isActivated, 
    isDemoMode, 
    isLoading, 
    developerContactInfo, 
    activateSystem,
    deactivateSystem 
  } = useActivation();
  
  const [activationKey, setActivationKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleActivate = async () => {
    if (!activationKey.trim()) {
      return;
    }
    
    const success = await activateSystem(activationKey.trim());
    if (success) {
      setActivationKey(''); // Limpa o campo após sucesso
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleActivate();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-center space-x-3">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Verificando status de ativação...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-xl shadow-lg p-8 border-2 ${
        isActivated 
          ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
          : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300'
      }`}>
        <div className="flex items-center space-x-4 mb-6">
          {isActivated ? (
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h3 className={`text-2xl font-bold ${
              isActivated ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {isActivated ? '🎉 Sistema Ativado!' : '⚡ Modo DEMO Ativo'}
            </h3>
            <p className={`text-lg ${
              isActivated ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {isActivated 
                ? 'Todos os recursos premium estão liberados!' 
                : 'Experimente gratuitamente com algumas limitações'
              }
            </p>
          </div>
        </div>

        {isDemoMode && (
          <div className="bg-white border-2 border-yellow-200 rounded-xl p-6">
            <h4 className="font-semibold text-yellow-800 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              O que você pode fazer no modo DEMO:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Até 5 propriedades</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Até 10 inquilinos</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Gestão completa de transações</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Exportação de relatórios</span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Backup automático</span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Suporte prioritário</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium">
                💡 Ative o sistema para remover todas as limitações e ter acesso completo!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Benefícios da Ativação */}
      {!isActivated && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 border-2 border-blue-200">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">
            🚀 Desbloqueie Todo o Potencial do SisMobi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">∞</span>
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Sem Limites</h4>
              <p className="text-blue-700 text-sm">Propriedades, inquilinos e transações ilimitadas</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Relatórios Completos</h4>
              <p className="text-blue-700 text-sm">Exporte dados e gere relatórios detalhados</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Suporte Premium</h4>
              <p className="text-blue-700 text-sm">Atendimento prioritário e atualizações exclusivas</p>
            </div>
          </div>
        </div>
      )}

      {/* Activation Form */}
      {!isActivated && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Ativar Sistema</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave de Ativação
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={activationKey}
                  onChange={(e) => setActivationKey(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="Digite sua chave de ativação"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Para teste, use: <code className="bg-gray-100 px-1 rounded">MINHA-CHAVE-SECRETA-DO-BOLT</code>
              </p>
            </div>

            <LoadingButton
              loading={isLoading}
              onClick={handleActivate}
              disabled={!activationKey.trim()}
              variant="primary"
              className="w-full py-3"
            >
              <Key className="w-4 h-4" />
              Ativar Sistema
            </LoadingButton>
          </div>
        </div>
      )}

      {/* Developer Contact */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-3">Contato do Desenvolvedor</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{developerContactInfo.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{developerContactInfo.phone}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Entre em contato para obter sua chave de ativação ou suporte técnico.
        </p>
      </div>

      {/* Debug Controls (apenas para desenvolvimento) */}
      {isActivated && process.env.NODE_ENV === 'development' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Controles de Desenvolvimento</h4>
          <button
            onClick={deactivateSystem}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Desativar Sistema (Teste)
          </button>
        </div>
      )}
    </div>
  );
};
