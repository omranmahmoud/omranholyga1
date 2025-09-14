import { toast } from 'react-hot-toast';
import { voiceNotificationService } from './voiceNotificationService';
import { audioNotificationService } from './audioNotificationService';

interface InventoryAlert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  productId?: string;
  productName?: string;
  currentStock?: number;
  lowStockThreshold?: number;
  timestamp: Date;
  acknowledged?: boolean;
}

class InventoryAlertService {
  private enabled: boolean = true;
  private voiceEnabled: boolean = true;
  private audioEnabled: boolean = true;
  private alerts: Map<string, InventoryAlert> = new Map();
  private listeners: Array<(alerts: InventoryAlert[]) => void> = [];

  constructor() {
    // Check localStorage for saved preferences
    const savedEnabled = localStorage.getItem('inventoryAlertsEnabled');
    const savedVoiceEnabled = localStorage.getItem('inventoryVoiceEnabled');
    const savedAudioEnabled = localStorage.getItem('inventoryAudioEnabled');

    if (savedEnabled !== null) this.enabled = JSON.parse(savedEnabled);
    if (savedVoiceEnabled !== null) this.voiceEnabled = JSON.parse(savedVoiceEnabled);
    if (savedAudioEnabled !== null) this.audioEnabled = JSON.parse(savedAudioEnabled);
  }

  // Configuration methods
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('inventoryAlertsEnabled', JSON.stringify(enabled));
  }

  setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    localStorage.setItem('inventoryVoiceEnabled', JSON.stringify(enabled));
  }

  setAudioEnabled(enabled: boolean) {
    this.audioEnabled = enabled;
    localStorage.setItem('inventoryAudioEnabled', JSON.stringify(enabled));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  isAudioEnabled(): boolean {
    return this.audioEnabled;
  }

  // Add listener for alert updates
  addListener(callback: (alerts: InventoryAlert[]) => void): () => void {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    const alertsArray = Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    this.listeners.forEach(callback => callback(alertsArray));
  }

  // Process incoming alert from real-time service
  processAlert(alertData: {
    message: string;
    severity?: string;
    productId?: string;
    currentStock?: number;
  }) {
    if (!this.enabled) return;

    const severity = this.mapSeverity(alertData.severity);
    const alert: InventoryAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: alertData.message,
      severity,
      productId: alertData.productId,
      currentStock: alertData.currentStock,
      timestamp: new Date(),
      acknowledged: false
    };

    // Extract product name from message if not provided
    if (!alert.productName && alert.message) {
      const match = alert.message.match(/:\s*(.+?)\s+(running low|out of stock|restock needed)/i);
      if (match) {
        alert.productName = match[1];
      }
    }

    // Store alert
    this.alerts.set(alert.id, alert);

    // Trigger notifications
    this.triggerNotifications(alert);

    // Notify listeners
    this.notifyListeners();

    // Auto-remove after 10 minutes for low severity alerts
    if (severity === 'low') {
      setTimeout(() => {
        this.removeAlert(alert.id);
      }, 10 * 60 * 1000);
    }
  }

  private mapSeverity(severity?: string): InventoryAlert['severity'] {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  private triggerNotifications(alert: InventoryAlert) {
    // Toast notification
    this.showToastNotification(alert);

    // Voice notification
    if (this.voiceEnabled && voiceNotificationService.isEnabled()) {
      this.announceAlert(alert);
    }

    // Audio notification
    if (this.audioEnabled) {
      this.playAlertSound(alert);
    }
  }

  private showToastNotification(alert: InventoryAlert) {
    const toastOptions = {
      duration: this.getToastDuration(alert.severity),
      icon: this.getAlertIcon(alert.severity),
      style: this.getToastStyle(alert.severity),
    };

    toast(alert.message, toastOptions);
  }

  private announceAlert(alert: InventoryAlert) {
    let announcement = alert.message;
    
    // Enhance announcement with stock details
    if (alert.currentStock !== undefined) {
      if (alert.currentStock === 0) {
        announcement += ` Product is out of stock.`;
      } else {
        announcement += ` Only ${alert.currentStock} units remaining.`;
      }
    }

    voiceNotificationService.announceInventoryAlert(announcement);
  }

  private playAlertSound(alert: InventoryAlert) {
    // Use the test method for now since it's the primary audio method available
    // We can customize this later with specific inventory alert sounds
    switch (alert.severity) {
      case 'high':
      case 'critical':
        // Play multiple quick sounds for urgency
        audioNotificationService.test();
        setTimeout(() => audioNotificationService.test(), 200);
        break;
      case 'medium':
        audioNotificationService.test();
        break;
      case 'low':
        // Softer notification for low priority
        audioNotificationService.test();
        break;
    }
  }

  private getToastDuration(severity: InventoryAlert['severity']): number {
    switch (severity) {
      case 'critical':
      case 'high':
        return 8000; // 8 seconds
      case 'medium':
        return 5000; // 5 seconds
      case 'low':
        return 3000; // 3 seconds
      default:
        return 5000;
    }
  }

  private getAlertIcon(severity: InventoryAlert['severity']): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📦';
      case 'low':
        return 'ℹ️';
      default:
        return '📦';
    }
  }

  private getToastStyle(severity: InventoryAlert['severity']) {
    switch (severity) {
      case 'critical':
        return {
          background: '#DC2626',
          color: 'white',
          border: '2px solid #B91C1C',
        };
      case 'high':
        return {
          background: '#EA580C',
          color: 'white',
          border: '2px solid #C2410C',
        };
      case 'medium':
        return {
          background: '#F59E0B',
          color: 'white',
          border: '2px solid #D97706',
        };
      case 'low':
        return {
          background: '#3B82F6',
          color: 'white',
          border: '2px solid #2563EB',
        };
      default:
        return {
          background: '#F59E0B',
          color: 'white',
        };
    }
  }

  // Alert management methods
  acknowledgeAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.alerts.set(alertId, alert);
      this.notifyListeners();
    }
  }

  removeAlert(alertId: string) {
    if (this.alerts.delete(alertId)) {
      this.notifyListeners();
    }
  }

  clearAllAlerts() {
    this.alerts.clear();
    this.notifyListeners();
  }

  getAlerts(): InventoryAlert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getUnacknowledgedAlerts(): InventoryAlert[] {
    return this.getAlerts().filter(alert => !alert.acknowledged);
  }

  getAlertCount(): number {
    return this.alerts.size;
  }

  getUnacknowledgedCount(): number {
    return this.getUnacknowledgedAlerts().length;
  }

  // Test methods
  testAlert(severity: InventoryAlert['severity'] = 'medium') {
    const testMessages = {
      critical: "CRITICAL: Main warehouse is out of stock for Women's T-Shirt",
      high: "High Priority: Women's T-Shirt running very low (2 remaining)",
      medium: "Medium Alert: Women's T-Shirt stock is getting low (8 remaining)",
      low: "Low Alert: Consider restocking Men's Jeans soon (15 remaining)"
    };

    this.processAlert({
      message: testMessages[severity],
      severity,
      productId: 'TEST-' + Date.now(),
      currentStock: severity === 'critical' ? 0 : severity === 'high' ? 2 : severity === 'medium' ? 8 : 15
    });
  }
}

export const inventoryAlertService = new InventoryAlertService();
export type { InventoryAlert };
