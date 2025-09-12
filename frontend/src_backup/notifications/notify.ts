import { swRegistrar } from '../sw/registrar';

export interface NotificationOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class NotificationManager {
  private static instance: NotificationManager;
  private toastContainer: HTMLDivElement | null = null;
  private notifications: Map<string, HTMLDivElement> = new Map();

  private constructor() {
    this.createToastContainer();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async showToast(options: NotificationOptions): Promise<string> {
    const id = this.generateId();
    const toast = this.createToastElement(id, options);
    
    this.toastContainer?.appendChild(toast);
    this.notifications.set(id, toast);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(id);
    }, options.duration || 5000);

    return id;
  }

  async showPushNotification(title: string, options?: NotificationOptions): Promise<void> {
    try {
      // Request permission if needed
      const hasPermission = await swRegistrar.requestNotificationPermission();
      if (!hasPermission) {
        console.log('Push notification permission denied');
        return;
      }

      // Show push notification
      await swRegistrar.sendNotification(title, {
        body: options?.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'intellilab-notification',
        data: {
          action: options?.action?.label,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Failed to show push notification:', error);
      // Fallback to toast
      await this.showToast({
        title,
        message: options?.message || '',
        type: options?.type || 'info'
      });
    }
  }

  removeToast(id: string): void {
    const toast = this.notifications.get(id);
    if (toast) {
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
        this.notifications.delete(id);
      }, 300);
    }
  }

  clearAllToasts(): void {
    this.notifications.forEach((toast) => {
      toast.remove();
    });
    this.notifications.clear();
  }

  private createToastContainer(): void {
    if (this.toastContainer) return;

    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;

    document.body.appendChild(this.toastContainer);
  }

  private createToastElement(id: string, options: NotificationOptions): HTMLDivElement {
    const toast = document.createElement('div');
    toast.id = `toast-${id}`;
    toast.className = `toast toast-${options.type || 'info'}`;
    toast.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-left: 4px solid ${this.getTypeColor(options.type)};
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 400px;
      word-wrap: break-word;
    `;

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px; color: #1f2937;">${options.title}</div>
          <div style="color: #6b7280; font-size: 14px;">${options.message}</div>
        </div>
        <button onclick="document.getElementById('toast-${id}').remove()" 
                style="background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 18px; padding: 0;">
          ×
        </button>
      </div>
      ${options.action ? `
        <div style="margin-top: 12px;">
          <button onclick="window.notificationAction_${id}()" 
                  style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
            ${options.action.label}
          </button>
        </div>
      ` : ''}
    `;

    toast.appendChild(content);

    // Add action handler to window if action provided
    if (options.action) {
      (window as any)[`notificationAction_${id}`] = options.action.onClick;
    }

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    return toast;
  }

  private getTypeColor(type?: string): string {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info':
      default: return '#3b82f6';
    }
  }

  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // System notifications
  async notifyQCAdded(instrumentName: string, analyte: string): Promise<void> {
    await this.showPushNotification('QC Record Added', {
      message: `QC measurement for ${analyte} on ${instrumentName} has been recorded.`,
      type: 'success'
    } as any);
  }

  async notifyInventoryLow(itemName: string, currentStock: number): Promise<void> {
    await this.showPushNotification('Low Inventory Alert', {
      message: `${itemName} is running low (${currentStock} remaining).`,
      type: 'warning'
    } as any);
  }

  async notifyMaintenanceDue(instrumentName: string, daysUntilDue: number): Promise<void> {
    await this.showPushNotification('Maintenance Due', {
      message: `${instrumentName} maintenance is due in ${daysUntilDue} days.`,
      type: 'warning'
    } as any);
  }

  async notifySyncComplete(successful: number, failed: number): Promise<void> {
    const message = failed > 0 
      ? `Sync completed with ${successful} successful and ${failed} failed operations.`
      : `Sync completed successfully with ${successful} operations.`;

    await this.showToast({
      title: 'Sync Complete',
      message,
      type: failed > 0 ? 'warning' : 'success',
      duration: 3000
    });
  }

  async notifyOfflineMode(): Promise<void> {
    await this.showToast({
      title: 'Offline Mode',
      message: 'You are currently offline. Changes will be synced when connection is restored.',
      type: 'info',
      duration: 4000
    });
  }
}

// Global instance
export const notificationManager = NotificationManager.getInstance();
