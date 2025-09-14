import { useState, useEffect } from 'react';
import { Activity, Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

// Helper function to format relative time
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

interface InventoryActivity {
  id: string;
  type: 'stock_update' | 'low_stock_alert' | 'out_of_stock' | 'restock' | 'order_processed';
  productName: string;
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
  quantity?: number;
  oldQuantity?: number;
  newQuantity?: number;
}

interface RealTimeActivityFeedProps {
  isRealTime: boolean;
  className?: string;
}

export function RealTimeActivityFeed({ isRealTime, className = '' }: RealTimeActivityFeedProps) {
  const [activities, setActivities] = useState<InventoryActivity[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Real-time activity from WebSocket service
  useEffect(() => {
    if (!isRealTime) return;

    // Note: This component now only shows real inventory activities
    // Mock data generation has been removed
    // Real activities would be added through WebSocket events when available
    
    // Future implementation would listen for:
    // - Real inventory updates from the backend
    // - Order processing events
    // - Stock level changes
    // - Restock operations
    
  }, [isRealTime]);

  const getActivityIcon = (type: InventoryActivity['type']) => {
    switch (type) {
      case 'stock_update':
        return <Package className="w-4 h-4" />;
      case 'low_stock_alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'out_of_stock':
        return <AlertTriangle className="w-4 h-4" />;
      case 'restock':
        return <TrendingUp className="w-4 h-4" />;
      case 'order_processed':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColors = (severity: InventoryActivity['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (!isRealTime || activities.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div 
          className="p-4 border-b border-gray-200 cursor-pointer"
          onClick={() => setIsVisible(!isVisible)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Live Activity Feed</h3>
                <p className="text-sm text-gray-500">Real-time inventory updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activities.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full animate-pulse">
                  {activities.length} recent
                </span>
              )}
              <button className="text-gray-400 hover:text-gray-600">
                {isVisible ? '▼' : '▶'}
              </button>
            </div>
          </div>
        </div>

        {isVisible && (
          <div className="max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-4 border-l-4 ${getSeverityColors(activity.severity)} hover:bg-gray-50 transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded ${getSeverityColors(activity.severity)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">
                            {activity.productName}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
