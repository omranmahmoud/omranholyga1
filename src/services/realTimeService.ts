import { toast } from 'react-hot-toast';
import { voiceNotificationService } from './voiceNotificationService';
import { inventoryAlertService } from './inventoryAlertService';

interface RealTimeEvent {
  type: string;
  data: any;
  timestamp: string;
}

interface OrderNotification {
  type: 'new_order' | 'order_updated' | 'order_cancelled';
  order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    customerInfo: {
      firstName: string;
      lastName: string;
    };
    items: Array<{
      product: { name: string };
      quantity: number;
    }>;
  };
}

interface SalesUpdate {
  type: 'sales_update';
  data: {
    totalSales: number;
    totalOrders: number;
    activeUsers: number;
    growth: number;
    recentOrders: any[];
  };
}

type EventCallback = (event: RealTimeEvent) => void;
type BobNotificationCallback = (orderData: { orderNumber: string; customerName: string; amount: number }) => void;

class RealTimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private bobNotificationCallback: BobNotificationCallback | null = null;
  private isConnecting = false;
  private connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.connectionStatus = 'connecting';
    this.notifyStatusChange();

    try {
      // Derive WebSocket URL dynamically so port mismatches (.env PORT=5000) don't break dev
      const wsUrl = (() => {
        const env: any = (import.meta as any)?.env || {};
        // Explicit override first
        if (env.VITE_WS_URL) {
          return env.VITE_WS_URL.replace(/\/$/, '') + '/ws';
        }
        // Derive from API URL if present
        if (env.VITE_API_URL) {
          try {
            const api = new URL(env.VITE_API_URL);
            const proto = api.protocol === 'https:' ? 'wss:' : 'ws:';
            return `${proto}//${api.hostname}${api.port ? ':' + api.port : ''}/ws`;
          } catch (_) { /* fall through */ }
        }
        // Fallbacks: use window location (helpful when backend proxied) else localhost:5000 (our dev default)
        if (typeof window !== 'undefined') {
          const isSecure = window.location.protocol === 'https:';
            // If same host is serving both, omit explicit port unless provided
          const defaultPort = '5000';
          const host = window.location.hostname;
          // If we're on the same port as Vite (likely 5173) we still need API port; use defaultPort
          return `${isSecure ? 'wss' : 'ws'}://${host}:${defaultPort}/ws`;
        }
        return 'ws://localhost:5000/ws';
      })();

      this.ws = new WebSocket(wsUrl);
      console.log('[RealTimeService] Connecting to', wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connectionStatus = 'connected';
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyStatusChange();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: RealTimeEvent = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionStatus = 'disconnected';
        this.isConnecting = false;
        this.notifyStatusChange();
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatus = 'error';
        this.isConnecting = false;
        this.notifyStatusChange();
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionStatus = 'error';
      this.isConnecting = false;
      this.notifyStatusChange();
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Failed to connect to real-time updates', { duration: 4000 });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  private handleMessage(event: RealTimeEvent) {
    console.log('Received real-time event:', event);

    // Handle specific event types
    switch (event.type) {
      case 'new_order':
        this.handleNewOrder(event.data as OrderNotification);
        break;
      case 'order_updated':
        this.handleOrderUpdate(event.data as OrderNotification);
        break;
      case 'sales_update':
        this.handleSalesUpdate(event.data as SalesUpdate);
        break;
      case 'inventory_alert':
        this.handleInventoryAlert(event.data);
        break;
      case 'system_notification':
        if (event.data?.type === 'flash_sale_update') {
          this.handleFlashSaleUpdate(event.data);
        }
        break;
      default:
        console.log('Unknown event type:', event.type);
    }

    // Notify all listeners for this event type
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(callback => callback(event));

    // Notify all listeners for 'all' events
    const allListeners = this.eventListeners.get('all') || [];
    allListeners.forEach(callback => callback(event));
  }

  private handleNewOrder(notification: OrderNotification) {
    const { order } = notification;
    
    // Bob notification
    if (this.bobNotificationCallback) {
      this.bobNotificationCallback({
        orderNumber: order.orderNumber,
        customerName: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
        amount: order.totalAmount
      });
    }
    
    // Voice notification
    voiceNotificationService.announceNewOrder(
      order.orderNumber, 
      `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
      order.totalAmount
    );
    
    // Toast notification
    toast.success(
      `New order #${order.orderNumber} from ${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
      {
        duration: 4000,
        style: {
          background: '#10B981',
          color: 'white',
        },
      }
    );
  }

  private handleOrderUpdate(notification: OrderNotification) {
    const { order } = notification;
    
    // Voice notification
    voiceNotificationService.announceOrderUpdate(order.orderNumber, order.status);
    
    // Toast notification
    toast(
      `Order #${order.orderNumber} status updated to ${order.status}`,
      {
        duration: 3000,
        icon: 'ℹ️',
      }
    );
  }

  private handleSalesUpdate(update: SalesUpdate) {
    // This will be handled by dashboard listeners
    console.log('Sales update received:', update.data);
  }

  private handleInventoryAlert(alert: any) {
    // Use the dedicated inventory alert service for better handling
    inventoryAlertService.processAlert(alert);
    
    // Keep the original toast for backward compatibility
    toast(
      `Inventory Alert: ${alert.message}`,
      {
        duration: 5000,
        icon: '⚠️',
        style: {
          background: '#F59E0B',
          color: 'white',
        },
      }
    );
  }

  private handleFlashSaleUpdate(payload: any) {
    console.log('[RealTime] Flash sale update', payload);
    toast(`Flash sale update: ${payload.sales?.length || 0} sale(s) changed`, { duration: 2500 });
  }

  private notifyStatusChange() {
    const statusListeners = this.eventListeners.get('status_change') || [];
    statusListeners.forEach(callback => 
      callback({ 
        type: 'status_change', 
        data: { status: this.connectionStatus }, 
        timestamp: new Date().toISOString() 
      })
    );
  }

  // Public methods
  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  public unsubscribe(eventType: string, callback: EventCallback) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public getConnectionStatus() {
    return this.connectionStatus;
  }

  public reconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.reconnectAttempts = 0;
    this.connect();
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatus = 'disconnected';
    this.notifyStatusChange();
  }

  // Send message to server (if needed)
  public send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }

  // Bob notification methods
  public setBobNotificationCallback(callback: BobNotificationCallback | null) {
    this.bobNotificationCallback = callback;
  }
}

export const realTimeService = new RealTimeService();
export type { RealTimeEvent, OrderNotification, SalesUpdate };
