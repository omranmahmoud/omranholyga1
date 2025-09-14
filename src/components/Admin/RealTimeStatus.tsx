import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

interface RealTimeStatusProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  isRealTimeEnabled: boolean;
  onToggleRealTime: () => void;
  onReconnect: () => void;
  className?: string;
}

export function RealTimeStatus({
  connectionStatus,
  isRealTimeEnabled,
  onToggleRealTime,
  onReconnect,
  className = ''
}: RealTimeStatusProps) {
  const getStatusConfig = () => {
    if (!isRealTimeEnabled) {
      return {
        icon: WifiOff,
        color: 'text-gray-400',
        bgColor: 'bg-gray-100',
        text: 'Real-time disabled',
        showReconnect: false
      };
    }

    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          text: 'Real-time active',
          showReconnect: false
        };
      case 'connecting':
        return {
          icon: Wifi,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          text: 'Connecting...',
          showReconnect: false
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: 'Disconnected',
          showReconnect: true
        };
      case 'error':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: 'Connection error',
          showReconnect: true
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Indicator */}
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}>
        <IconComponent 
          className={`w-4 h-4 ${config.color} ${
            connectionStatus === 'connecting' ? 'animate-pulse' : ''
          }`} 
        />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Reconnect Button */}
        {config.showReconnect && (
          <button
            onClick={onReconnect}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="Reconnect"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Toggle Real-time */}
        <button
          onClick={onToggleRealTime}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            isRealTimeEnabled
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={isRealTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
        >
          {isRealTimeEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}
