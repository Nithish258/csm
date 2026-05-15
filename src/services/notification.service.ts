import { dbService } from './db.service';
import { toast } from 'sonner';

export const notificationService = {
  async send(data: {
    userId: string;
    title: string;
    message: string;
    type: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'SYSTEM';
    tenantId: string;
  }) {
    try {
      // 1. Log to Firestore
      await dbService.add('notifications', {
        ...data,
        createdAt: new Date(),
        status: 'SENT'
      });

      // 2. Simulate external delivery
      console.log(`[Notification Engine] Delivering via ${data.type}: ${data.title} - ${data.message}`);
      
      // 3. UI Alert
      toast.info(`${data.type} Sent: ${data.title}`);
    } catch (error) {
      console.error('Notification Failure:', error);
    }
  }
};
