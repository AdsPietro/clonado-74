import React, { useState } from 'react';
import { Bell, BellRing, X, Mail, MessageCircle, Monitor, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { SystemNotification, RentOverdueNotification } from '../../types/notifications';
import { useRentNotifications } from '../../hooks/useRentNotifications';

interface NotificationPanelProps {
  tenants: any[];
  properties: any[];
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  tenants,
  properties
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'unresolved' | 'history' | 'settings'>('unresolved');
  
  const {
    systemNotifications,
    notifications,
    settings,
    stats,
    isChecking,
    checkOverdueRents,
    markAsResolved,
    setSettings
  } = useRentNotifications(tenants, properties);

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <Bell className="w-4 h-4" />;
    }
  };

  const getChannelIcon = (channel: 'system' | 'email' | 'whatsapp') => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'system': return <Monitor className="w-4 h-4" />;
    }
  };

  const handleToggleChannel = (channelType: 'system' | 'email' | 'whatsapp') => {
    setSettings(prev => ({
      ...prev,
      enabledChannels: prev.enabledChannels.map(channel =>
        channel.type === channelType
          ? { ...channel, enabled: !channel.enabled }
          : channel
      )
    }));
  };

  return (
    <>
      {/* Botão de notificações */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Notificações"
        >
          {stats.unresolvedSystemNotifications > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          
          {stats.unresolvedSystemNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {stats.unresolvedSystemNotifications > 9 ? '9+' : stats.unresolvedSystemNotifications}
            </span>
          )}
        </button>
      </div>

      {/* Painel de notificações */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="bg-black bg-opacity-50 fixed inset-0" onClick={() => setIsOpen(false)} />
          
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden relative z-10">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BellRing className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
                    <p className="text-sm text-gray-600">
                      {stats.unresolvedSystemNotifications} não resolvidas • {stats.overdueTenantsCount} inquilinos em atraso
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mt-4 bg-white bg-opacity-50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('unresolved')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'unresolved'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Não resolvidas ({stats.unresolvedSystemNotifications})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'history'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Histórico
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Configurações
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {activeTab === 'unresolved' && (
                <div className="space-y-3">
                  {systemNotifications.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-900">Tudo em dia! 🎉</h4>
                      <p className="text-gray-600">Nenhuma notificação não resolvida</p>
                    </div>
                  ) : (
                    systemNotifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`border rounded-lg p-4 ${getPriorityColor(notification.priority)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="mt-0.5">
                              {getPriorityIcon(notification.priority)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {notification.tenantName}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>
                                  {notification.metadata.daysOverdue} dias de atraso
                                </span>
                                <span>
                                  R$ {notification.metadata.rentAmount.toLocaleString('pt-BR', { 
                                    minimumFractionDigits: 2 
                                  })}
                                </span>
                                <span>
                                  {new Date(notification.date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => markAsResolved(notification.id)}
                            className="ml-3 p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Marcar como resolvido"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-900">Nenhum histórico</h4>
                      <p className="text-gray-600">As notificações enviadas aparecerão aqui</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map(notification => (
                      <div key={notification.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            {notification.tenantName} - {notification.propertyName}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            notification.status === 'sent' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {notification.status === 'sent' ? 'Enviado' : 'Falha'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {notification.daysOverdue} dias de atraso • R$ {notification.rentAmount.toLocaleString('pt-BR', { 
                            minimumFractionDigits: 2 
                          })}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Enviado via:</span>
                          {notification.attempts.map((attempt, index) => (
                            <div
                              key={index}
                              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                                attempt.status === 'success'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {getChannelIcon(attempt.channel.type as 'system' | 'email' | 'whatsapp')}
                              <span className="capitalize">{attempt.channel.type}</span>
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Canais de notificação */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Canais de Notificação</h4>
                    <div className="space-y-3">
                      {settings.enabledChannels.map(channel => (
                        <div key={channel.type} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getChannelIcon(channel.type as 'system' | 'email' | 'whatsapp')}
                            <div>
                              <p className="font-medium text-gray-900 capitalize">
                                {channel.type}
                              </p>
                              <p className="text-sm text-gray-600">
                                {channel.type === 'system' && 'Notificações no aplicativo'}
                                {channel.type === 'email' && 'Enviar por email'}
                                {channel.type === 'whatsapp' && 'Enviar por WhatsApp'}
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={channel.enabled}
                              onChange={() => handleToggleChannel(channel.type as 'system' | 'email' | 'whatsapp')}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dias de trigger */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Dias para Notificar</h4>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5, 6, 7].map(day => (
                        <button
                          key={day}
                          onClick={() => {
                            setSettings(prev => ({
                              ...prev,
                              triggerDays: settings.triggerDays.includes(day)
                                ? prev.triggerDays.filter(d => d !== day)
                                : [...prev.triggerDays, day].sort((a, b) => a - b)
                            }));
                          }}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            settings.triggerDays.includes(day)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Notificar após estes dias de atraso
                    </p>
                  </div>

                  {/* Estatísticas */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Estatísticas</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalNotifications}</div>
                        <div className="text-sm text-gray-600">Total de notificações</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats.todayNotifications}</div>
                        <div className="text-sm text-gray-600">Hoje</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.overdueTenantsCount}</div>
                        <div className="text-sm text-gray-600">Em atraso</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{tenants.filter(t => t.status === 'active').length - stats.overdueTenantsCount}</div>
                        <div className="text-sm text-gray-600">Em dia</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Última verificação: {new Date().toLocaleString('pt-BR')}
                </div>
                <button
                  onClick={checkOverdueRents}
                  disabled={isChecking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isChecking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      <span>Verificar Agora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};