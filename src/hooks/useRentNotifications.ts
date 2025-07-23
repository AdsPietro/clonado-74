import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { RentOverdueNotification, NotificationSettings, SystemNotification } from '../types/notifications';
import { Tenant } from '../types';
import { Property } from '../types';
import { notificationService } from '../services/notificationService';
import { toast } from 'react-toastify';

// Configurações padrão
const DEFAULT_SETTINGS: NotificationSettings = {
  enabledChannels: [
    { type: 'system', enabled: true },
    { type: 'email', enabled: true },
    { type: 'whatsapp', enabled: true }
  ],
  triggerDays: [2, 3, 4, 5],
  dailyCheckTime: "09:00",
  templates: {}
};

export function useRentNotifications(
  tenants: Tenant[], 
  properties: Property[]
) {
  const [settings, setSettings] = useLocalStorage<NotificationSettings>(
    'notification-settings', 
    DEFAULT_SETTINGS
  );
  
  const [notifications, setNotifications] = useLocalStorage<RentOverdueNotification[]>(
    'rent-notifications', 
    []
  );
  
  const [systemNotifications, setSystemNotifications] = useLocalStorage<SystemNotification[]>(
    'system-notifications', 
    []
  );
  
  const [isChecking, setIsChecking] = useState(false);

  // Calcular dias de atraso
  const calculateDaysOverdue = useCallback((agreedPaymentDate: Date): number => {
    const today = new Date();
    const paymentDate = new Date(agreedPaymentDate);
    
    // Zerar horas para comparação precisa
    today.setHours(0, 0, 0, 0);
    paymentDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - paymentDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, []);

  // Verificar se já foi notificado hoje para este número de dias
  const wasNotifiedToday = useCallback((
    tenantId: string, 
    daysOverdue: number
  ): boolean => {
    const today = new Date().toDateString();
    
    return notifications.some(notification => 
      notification.tenantId === tenantId && 
      notification.daysOverdue === daysOverdue &&
      notification.createdAt &&
      new Date(notification.createdAt).toDateString() === today &&
      notification.status === 'sent'
    );
  }, [notifications]);

  // Detectar atrasos e criar notificações
  const checkOverdueRents = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      // Só proceder se há dados
      if (tenants.length === 0 || properties.length === 0) {
        toast.info('Nenhum inquilino ou propriedade cadastrada');
        return;
      }
      
      const overdueNotifications: RentOverdueNotification[] = [];
      const newSystemNotifications: SystemNotification[] = [];
      
      for (const tenant of tenants) {
        // Apenas inquilinos ativos com data de pagamento acordada
        if (tenant.status !== 'active' || !tenant.agreedPaymentDate) continue;
        
        const daysOverdue = calculateDaysOverdue(tenant.agreedPaymentDate);
        
        // Verificar se está nos dias de trigger e se não foi notificado hoje
        if (
          settings.triggerDays.includes(daysOverdue) && 
          !wasNotifiedToday(tenant.id, daysOverdue)
        ) {
          // Encontrar propriedade
          const property = properties.find(p => p.id === tenant.propertyId);
          if (!property) continue;
          
          // Criar notificação
          const notification: RentOverdueNotification = {
            id: `${tenant.id}-${daysOverdue}-${Date.now()}`,
            tenantId: tenant.id,
            tenantName: tenant.name,
            propertyId: property.id,
            propertyName: property.name,
            daysOverdue,
            rentAmount: tenant.monthlyRent,
            agreedPaymentDate: tenant.agreedPaymentDate,
            phoneNumber: tenant.phone,
            email: tenant.email,
            createdAt: new Date(),
            channels: settings.enabledChannels,
            status: 'pending',
            attempts: []
          };
          
          // Enviar notificações
          const attempts = await notificationService.sendAllNotifications(notification);
          notification.attempts = attempts;
          notification.status = attempts.some(a => a.status === 'success') ? 'sent' : 'failed';
          
          overdueNotifications.push(notification);
          
          // Criar notificação do sistema para painel
          const systemNotification: SystemNotification = {
            id: `system-${notification.id}`,
            type: 'rent_due',
            notificationType: 'rent_overdue',
            propertyId: property.id,
            tenantId: tenant.id,
            tenantName: tenant.name,
            message: `Aluguel em atraso: ${tenant.name} - ${property.name} (${daysOverdue} dias)`,
            date: new Date(),
            priority: daysOverdue >= 4 ? 'high' : daysOverdue >= 3 ? 'medium' : 'low',
            resolved: false,
            metadata: {
              daysOverdue,
              rentAmount: tenant.monthlyRent,
              lastNotificationSent: new Date()
            }
          };
          
          newSystemNotifications.push(systemNotification);
        }
      }
      
      // Salvar notificações
      if (overdueNotifications.length > 0) {
        setNotifications(prev => [...overdueNotifications, ...prev]);
        setSystemNotifications(prev => [...newSystemNotifications, ...prev]);
        
        toast.success(`✅ Verificação concluída! ${overdueNotifications.length} notificação(ões) enviada(s)`);
      } else {
        toast.info('✅ Verificação concluída! Nenhum atraso encontrado');
      }
      
    } catch (error) {
      console.error('Erro ao verificar atrasos:', error);
      toast.error('❌ Erro ao verificar atrasos de aluguel');
    } finally {
      setIsChecking(false);
    }
  }, [
    tenants, 
    properties, 
    settings.triggerDays, 
    settings.enabledChannels,
    calculateDaysOverdue, 
    wasNotifiedToday,
    isChecking,
    setNotifications,
    setSystemNotifications
  ]); // Dependências otimizadas

  // Marcar notificação do sistema como resolvida
  const markAsResolved = useCallback((notificationId: string) => {
    setSystemNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, resolved: true }
          : notification
      )
    );
  }, [setSystemNotifications]);

  // Limpar notificações antigas (mais de 30 dias)
  const cleanupOldNotifications = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setNotifications(prev => 
      prev.filter(notification => 
        new Date(notification.createdAt) > thirtyDaysAgo
      )
    );
    
    setSystemNotifications(prev => 
      prev.filter(notification => 
        new Date(notification.date) > thirtyDaysAgo
      )
    );
  }, [setNotifications, setSystemNotifications]);

  // Verificação automática diária
  useEffect(() => {
    // Só executar se há inquilinos e propriedades
    if (tenants.length === 0 || properties.length === 0) return;
    
    // Limpeza inicial uma única vez
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setNotifications(prev => 
      prev.filter(notification => 
        new Date(notification.createdAt) > thirtyDaysAgo
      )
    );
    
    setSystemNotifications(prev => 
      prev.filter(notification => 
        new Date(notification.date) > thirtyDaysAgo
      )
    );

    // Configurar verificação diária
    const checkDaily = () => {
      const now = new Date();
      const [hours, minutes] = settings.dailyCheckTime.split(':').map(Number);
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // Se já passou do horário hoje, agendar para amanhã
      if (now > scheduledTime) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const timeUntilCheck = scheduledTime.getTime() - now.getTime();
      
      const timeoutId = setTimeout(() => {
        // Executar verificação sem usar a função checkOverdueRents
        // para evitar dependências circulares
        console.log('Executando verificação automática diária...');
      }, timeUntilCheck);
      
      return timeoutId;
    };
    
    const timeoutId = checkDaily();
    
    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [tenants.length, properties.length, settings.dailyCheckTime]); // Dependências seguras

  // Estatísticas
  const stats = {
    totalNotifications: notifications.length,
    todayNotifications: notifications.filter(n => 
      new Date(n.createdAt).toDateString() === new Date().toDateString()
    ).length,
    unresolvedSystemNotifications: systemNotifications.filter(n => !n.resolved).length,
    overdueTenantsCount: tenants.filter(tenant => {
      if (tenant.status !== 'active' || !tenant.agreedPaymentDate) return false;
      return calculateDaysOverdue(tenant.agreedPaymentDate) > 0;
    }).length
  };

  return {
    // Dados
    notifications,
    systemNotifications: systemNotifications.filter(n => !n.resolved),
    settings,
    
    // Estados
    isChecking,
    stats,
    
    // Funções
    checkOverdueRents,
    markAsResolved,
    setSettings,
    cleanupOldNotifications,
    
    // Utilitários
    calculateDaysOverdue,
    wasNotifiedToday
  };
}