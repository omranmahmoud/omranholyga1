import { Settings } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useRealTimeDashboard } from '../../../hooks/useRealTimeDashboard';
import { RealTimeNotifications } from '../RealTimeNotifications';
import { RealTimeStatus } from '../RealTimeStatus';

export function AdminHeader() {
  const { user } = useAuth();
  const {
    dashboardData,
    isRealTimeEnabled,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    toggleRealTime,
    reconnect
  } = useRealTimeDashboard();

  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          
          {/* Real-time Status */}
          <RealTimeStatus
            connectionStatus={dashboardData.connectionStatus}
            isRealTimeEnabled={isRealTimeEnabled}
            onToggleRealTime={toggleRealTime}
            onReconnect={reconnect}
          />
        </div>
        
        <div className="flex items-center gap-4">
          {/* Real-time Notifications */}
          <RealTimeNotifications
            notifications={dashboardData.notifications}
            unreadCount={unreadNotificationsCount}
            connectionStatus={dashboardData.connectionStatus}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllNotificationsAsRead}
            onClearAll={clearNotifications}
            onReconnect={reconnect}
          />

          {/* Settings */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-4 border-l">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-600">
                {user?.name?.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}