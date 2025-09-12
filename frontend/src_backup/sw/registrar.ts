export class ServiceWorkerRegistrar {
  private static instance: ServiceWorkerRegistrar;
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  private constructor() {}

  static getInstance(): ServiceWorkerRegistrar {
    if (!ServiceWorkerRegistrar.instance) {
      ServiceWorkerRegistrar.instance = new ServiceWorkerRegistrar();
    }
    return ServiceWorkerRegistrar.instance;
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        window.location.reload();
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.log('Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa1FQj8e9H3lzJOFwY5Ldf1LvfuH8i+A0BD3RKVHaVRqgL0ZIZca6/xQdR6FA='
        )
      });

      console.log('Push subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      console.log('Service Worker not registered');
      return;
    }

    try {
      await this.registration.showNotification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  async applyUpdate(): Promise<void> {
    if (!this.registration || !this.updateAvailable) {
      return;
    }

    try {
      await this.registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    } catch (error) {
      console.error('Failed to apply update:', error);
    }
  }

  private notifyUpdateAvailable(): void {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Export singleton instance
export const swRegistrar = ServiceWorkerRegistrar.getInstance();
