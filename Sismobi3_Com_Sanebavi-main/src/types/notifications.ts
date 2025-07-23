export interface RentOverdueNotification {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  daysOverdue: number;
  rentAmount: number;
  agreedPaymentDate: Date;
  phoneNumber: string;
  email: string;
  createdAt: Date;
  channels: NotificationChannel[];
  status: 'pending' | 'sent' | 'failed';
  attempts: NotificationAttempt[];
}

export interface NotificationAttempt {
  id: string;
  channel: NotificationChannel;
  sentAt: Date;
  status: 'success' | 'failed';
  error?: string;
  response?: any;
}

export interface NotificationChannel {
  type: 'system' | 'email' | 'whatsapp';
  enabled: boolean;
}

export interface NotificationTemplate {
  system: string;
  email: {
    subject: string;
    body: string;
  };
  whatsapp: string;
}

export interface NotificationSettings {
  enabledChannels: NotificationChannel[];
  triggerDays: number[]; // [2, 3, 4, 5]
  dailyCheckTime: string; // "09:00"
  templates: Record<number, NotificationTemplate>; // Template por dias de atraso
}

export interface SystemNotification extends Alert {
  notificationType: 'rent_overdue';
  metadata: {
    daysOverdue: number;
    rentAmount: number;
    lastNotificationSent?: Date;
  };
}