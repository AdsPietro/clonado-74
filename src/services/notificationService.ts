import { RentOverdueNotification, NotificationTemplate, NotificationAttempt } from '../types/notifications';
import { toast } from 'react-toastify';

// Templates informais personalizados por dias de atraso
const NOTIFICATION_TEMPLATES: Record<number, NotificationTemplate> = {
  2: {
    system: 'Oi {tenantName}! 😊 Lembrando que o aluguel de R$ {rentAmount} do {propertyName} estava previsto para {paymentDate} e já temos 2 dias de atraso. Quando puder, dá uma olhadinha! 💙',
    email: {
      subject: '💙 Lembrete amigável - Aluguel do {propertyName}',
      body: `Oi {tenantName}! 😊

Tudo bem? Passando para lembrá-lo(a) do aluguel da propriedade {propertyName}.

📅 Data acordada: {paymentDate}
💰 Valor: R$ {rentAmount}
⏰ Dias em atraso: 2 dias

É só um lembrete amigável! Se já pagou, pode ignorar esta mensagem.

Qualquer dúvida, estamos à disposição! 

Um abraço! 🏠💙`
    },
    whatsapp: '😊 Oi {tenantName}! Lembrete do aluguel do {propertyName}: R$ {rentAmount} (2 dias de atraso). Data acordada: {paymentDate}. Se já pagou, pode ignorar! 💙'
  },
  3: {
    system: 'Oi {tenantName}! 😅 O aluguel de R$ {rentAmount} do {propertyName} está com 3 dias de atraso (venceu {paymentDate}). Pode dar uma verificada quando conseguir? 🏠',
    email: {
      subject: '🏠 Aluguel do {propertyName} - 3 dias de atraso',
      body: `Oi {tenantName}! 😅

Espero que esteja tudo bem! Passando para avisar sobre o aluguel da propriedade {propertyName}.

📅 Data acordada: {paymentDate}
💰 Valor: R$ {rentAmount}
⏰ Dias em atraso: 3 dias

Se houver alguma dificuldade, podemos conversar para encontrar uma solução! 

Aguardamos seu retorno 😊

Um abraço! 🏠`
    },
    whatsapp: '😅 Oi {tenantName}! Aluguel do {propertyName} com 3 dias de atraso: R$ {rentAmount}. Vencimento: {paymentDate}. Podemos conversar se precisar de ajuda! 🏠💙'
  },
  4: {
    system: 'Olá {tenantName}! ⚠️ O aluguel de R$ {rentAmount} do {propertyName} está com 4 dias de atraso. Precisamos regularizar essa situação. Entre em contato conosco! 📞',
    email: {
      subject: '⚠️ URGENTE - Aluguel do {propertyName} - 4 dias de atraso',
      body: `Olá {tenantName}!

Esperamos que esteja tudo bem! Precisamos conversar sobre o aluguel da propriedade {propertyName}.

📅 Data acordada: {paymentDate}
💰 Valor: R$ {rentAmount}
⏰ Dias em atraso: 4 dias

É importante regularizarmos essa situação o quanto antes. Se está passando por alguma dificuldade, vamos encontrar uma solução juntos!

Por favor, entre em contato conosco hoje mesmo.

Aguardamos seu retorno! 📞

Atenciosamente 🏠`
    },
    whatsapp: '⚠️ Oi {tenantName}! Aluguel do {propertyName} com 4 dias de atraso: R$ {rentAmount}. Precisamos conversar urgente! Entre em contato hoje mesmo 📞'
  },
  5: {
    system: 'ATENÇÃO {tenantName}! 🚨 Aluguel de R$ {rentAmount} do {propertyName} com 5 dias de atraso. Situação crítica! Entre em contato IMEDIATAMENTE! ☎️',
    email: {
      subject: '🚨 CRÍTICO - Aluguel {propertyName} - 5 dias de atraso',
      body: `{tenantName},

ATENÇÃO: A situação do aluguel da propriedade {propertyName} está crítica.

📅 Data acordada: {paymentDate}
💰 Valor: R$ {rentAmount}
⏰ Dias em atraso: 5 dias

Esta é nossa última tentativa de contato amigável. Precisamos de uma resposta HOJE.

Se não recebermos contato até o final do dia, seremos obrigados a tomar medidas legais cabíveis.

Por favor, entre em contato IMEDIATAMENTE!

Telefone: (XX) XXXX-XXXX
Email: contato@sismobi.com

Atenciosamente 🏠`
    },
    whatsapp: '🚨 {tenantName}! CRÍTICO: Aluguel {propertyName} com 5 dias de atraso - R$ {rentAmount}. ENTRE EM CONTATO HOJE ou medidas legais serão tomadas! ☎️'
  }
};

class NotificationService {
  
  // Simular envio de email
  async sendEmailNotification(
    notification: RentOverdueNotification
  ): Promise<NotificationAttempt> {
    const template = NOTIFICATION_TEMPLATES[notification.daysOverdue];
    
    try {
      // Simular chamada API de email
      await this.simulateAPICall('email', 1500);
      
      const emailContent = this.formatTemplate(template.email.body, notification);
      const emailSubject = this.formatTemplate(template.email.subject, notification);
      
      console.log('📧 EMAIL ENVIADO:', {
        to: notification.email,
        subject: emailSubject,
        body: emailContent
      });
      
      toast.success(`📧 Email enviado para ${notification.tenantName}`);
      
      return {
        id: Date.now().toString(),
        channel: { type: 'email', enabled: true },
        sentAt: new Date(),
        status: 'success',
        response: { messageId: `email_${Date.now()}` }
      };
    } catch (error) {
      toast.error(`❌ Falha ao enviar email para ${notification.tenantName}`);
      return {
        id: Date.now().toString(),
        channel: { type: 'email', enabled: true },
        sentAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Simular envio de WhatsApp
  async sendWhatsAppNotification(
    notification: RentOverdueNotification
  ): Promise<NotificationAttempt> {
    const template = NOTIFICATION_TEMPLATES[notification.daysOverdue];
    
    try {
      // Simular chamada API do WhatsApp
      await this.simulateAPICall('whatsapp', 2000);
      
      const message = this.formatTemplate(template.whatsapp, notification);
      
      console.log('📱 WHATSAPP ENVIADO:', {
        to: notification.phoneNumber,
        message: message
      });
      
      toast.success(`📱 WhatsApp enviado para ${notification.tenantName}`);
      
      return {
        id: Date.now().toString(),
        channel: { type: 'whatsapp', enabled: true },
        sentAt: new Date(),
        status: 'success',
        response: { messageId: `whatsapp_${Date.now()}` }
      };
    } catch (error) {
      toast.error(`❌ Falha ao enviar WhatsApp para ${notification.tenantName}`);
      return {
        id: Date.now().toString(),
        channel: { type: 'whatsapp', enabled: true },
        sentAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Enviar notificação no sistema
  sendSystemNotification(notification: RentOverdueNotification): NotificationAttempt {
    const template = NOTIFICATION_TEMPLATES[notification.daysOverdue];
    const message = this.formatTemplate(template.system, notification);
    
    // Mostrar toast no sistema
    const priority = notification.daysOverdue >= 4 ? 'error' : 
                    notification.daysOverdue >= 3 ? 'warning' : 'info';
    
    if (priority === 'error') {
      toast.error(message, { autoClose: 8000 });
    } else if (priority === 'warning') {
      toast.warning(message, { autoClose: 6000 });
    } else {
      toast.info(message, { autoClose: 5000 });
    }
    
    return {
      id: Date.now().toString(),
      channel: { type: 'system', enabled: true },
      sentAt: new Date(),
      status: 'success'
    };
  }

  // Enviar notificação em todos os canais habilitados
  async sendAllNotifications(notification: RentOverdueNotification): Promise<NotificationAttempt[]> {
    const attempts: NotificationAttempt[] = [];
    
    // Enviar no sistema sempre
    attempts.push(this.sendSystemNotification(notification));
    
    // Verificar canais habilitados
    for (const channel of notification.channels) {
      if (!channel.enabled) continue;
      
      try {
        switch (channel.type) {
          case 'email':
            attempts.push(await this.sendEmailNotification(notification));
            break;
          case 'whatsapp':
            attempts.push(await this.sendWhatsAppNotification(notification));
            break;
        }
      } catch (error) {
        console.error(`Erro ao enviar notificação via ${channel.type}:`, error);
      }
    }
    
    return attempts;
  }

  // Formatar template com dados do inquilino
  private formatTemplate(template: string, notification: RentOverdueNotification): string {
    return template
      .replace(/\{tenantName\}/g, notification.tenantName)
      .replace(/\{propertyName\}/g, notification.propertyName)
      .replace(/\{rentAmount\}/g, notification.rentAmount.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }))
      .replace(/\{paymentDate\}/g, notification.agreedPaymentDate.toLocaleDateString('pt-BR'))
      .replace(/\{daysOverdue\}/g, notification.daysOverdue.toString());
  }

  // Simular chamada de API
  private async simulateAPICall(service: string, delay: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simular falha ocasional (10% de chance)
    if (Math.random() < 0.1) {
      throw new Error(`Falha na comunicação com ${service}`);
    }
  }

  // Obter template para visualização
  getTemplate(daysOverdue: number): NotificationTemplate | null {
    return NOTIFICATION_TEMPLATES[daysOverdue] || null;
  }
}

export const notificationService = new NotificationService();