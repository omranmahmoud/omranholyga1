import { useState, useEffect, useCallback } from 'react';
import { realTimeService, RealTimeEvent } from '../services/realTimeService';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  activeUsers: number;
  growth: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  customerInfo: {
    firstName: string;
    lastName: string;
  };
  items: Array<{
    product: {
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
}

interface RealTimeDashboardData {
  stats: DashboardStats;
  recentOrders: Order[];
  notifications: Notification[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

interface Notification {
  id: string;
  type: 'order' | 'sales' | 'inventory' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export function useRealTimeDashboard() {
  const [dashboardData, setDashboardData] = useState<RealTimeDashboardData>({
    stats: {
      totalSales: 0,
      totalOrders: 0,
      activeUsers: 0,
      growth: 0
    },
    recentOrders: [],
    notifications: [],
    connectionStatus: 'disconnected'
  });

  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Handle real-time events
  const handleRealTimeEvent = useCallback((event: RealTimeEvent) => {
    switch (event.type) {
      case 'new_order':
        setDashboardData(prev => {
          const newOrder = event.data.order;
          const updatedOrders = [newOrder, ...prev.recentOrders.slice(0, 4)];
          
          // Update stats
          const updatedStats = {
            ...prev.stats,
            totalOrders: prev.stats.totalOrders + 1,
            totalSales: prev.stats.totalSales + newOrder.totalAmount,
            growth: prev.stats.growth // Preserve the growth value
          };

          // Add notification
          const notification: Notification = {
            id: `order-${newOrder._id}`,
            type: 'order',
            title: 'New Order Received',
            message: `Order #${newOrder.orderNumber} from ${newOrder.customerInfo.firstName} ${newOrder.customerInfo.lastName}`,
            timestamp: new Date(),
            read: false,
            priority: 'medium'
          };

          return {
            ...prev,
            stats: updatedStats,
            recentOrders: updatedOrders,
            notifications: [notification, ...prev.notifications.slice(0, 19)] // Keep last 20
          };
        });
        break;

      case 'order_updated':
        setDashboardData(prev => {
          const updatedOrder = event.data.order;
          const updatedOrders = prev.recentOrders.map(order =>
            order._id === updatedOrder._id ? updatedOrder : order
          );

          // Add notification for status changes
          const notification: Notification = {
            id: `order-update-${updatedOrder._id}-${Date.now()}`,
            type: 'order',
            title: 'Order Status Updated',
            message: `Order #${updatedOrder.orderNumber} is now ${updatedOrder.status}`,
            timestamp: new Date(),
            read: false,
            priority: 'low'
          };

          return {
            ...prev,
            recentOrders: updatedOrders,
            notifications: [notification, ...prev.notifications.slice(0, 19)]
          };
        });
        break;

      case 'sales_update':
        setDashboardData(prev => ({
          ...prev,
          stats: {
            ...event.data.data,
            growth: typeof event.data.data.growth === 'number' ? event.data.data.growth : prev.stats.growth
          }
        }));
        break;

      case 'inventory_alert':
        setDashboardData(prev => {
          const notification: Notification = {
            id: `inventory-${Date.now()}`,
            type: 'inventory',
            title: 'Inventory Alert',
            message: event.data.message,
            timestamp: new Date(),
            read: false,
            priority: event.data.severity === 'critical' ? 'high' : 'medium'
          };

          return {
            ...prev,
            notifications: [notification, ...prev.notifications.slice(0, 19)]
          };
        });
        break;

      default:
        console.log('Unhandled real-time event:', event.type);
    }
  }, []);

  // Handle connection status changes
  const handleStatusChange = useCallback((event: RealTimeEvent) => {
    setDashboardData(prev => ({
      ...prev,
      connectionStatus: event.data.status
    }));
  }, []);

  useEffect(() => {
    if (!isRealTimeEnabled) return;

    // Subscribe to real-time events
    const unsubscribeEvents = realTimeService.subscribe('all', handleRealTimeEvent);
    const unsubscribeStatus = realTimeService.subscribe('status_change', handleStatusChange);

    // Get initial connection status
    setDashboardData(prev => ({
      ...prev,
      connectionStatus: realTimeService.getConnectionStatus()
    }));

    return () => {
      unsubscribeEvents();
      unsubscribeStatus();
    };
  }, [isRealTimeEnabled, handleRealTimeEvent, handleStatusChange]);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setDashboardData(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    }));
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(() => {
    setDashboardData(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification => ({
        ...notification,
        read: true
      }))
    }));
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setDashboardData(prev => ({
      ...prev,
      notifications: []
    }));
  }, []);

  // Toggle real-time updates
  const toggleRealTime = useCallback(() => {
    setIsRealTimeEnabled(prev => !prev);
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    realTimeService.reconnect();
  }, []);

  // Update dashboard data manually (for initial load)
  const updateDashboardData = useCallback((data: Partial<RealTimeDashboardData>) => {
    setDashboardData(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  // Get unread notifications count
  const unreadNotificationsCount = dashboardData.notifications.filter(n => !n.read).length;

  return {
    dashboardData,
    isRealTimeEnabled,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    toggleRealTime,
    reconnect,
    updateDashboardData
  };
}

export type { RealTimeDashboardData, Notification };
