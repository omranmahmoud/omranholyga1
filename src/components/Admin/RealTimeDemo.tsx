import { useState, useEffect } from 'react';
import { Activity, Users, Package, DollarSign, Volume2, VolumeX, Settings, AlertTriangle, Package2, Bell } from 'lucide-react';
import { voiceNotificationService } from '../../services/voiceNotificationService';
import { audioNotificationService } from '../../services/audioNotificationService';
import { realTimeService } from '../../services/realTimeService';
import { inventoryAlertService, type InventoryAlert } from '../../services/inventoryAlertService';
import { BobNotification } from './BobNotification';

export function RealTimeDemo() {
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [rate, setRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Bob notification state
  const [bobEnabled, setBobEnabled] = useState(true);
  const [showBobNotification, setShowBobNotification] = useState(false);
  const [bobOrderData, setBobOrderData] = useState<{
    orderNumber: string;
    customerName: string;
    amount: number;
  } | null>(null);
  
  // Audio notification state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0.7);

  // Inventory alerts state
  const [inventoryAlertsEnabled, setInventoryAlertsEnabled] = useState(() => inventoryAlertService.isEnabled());
  const [recentInventoryAlerts, setRecentInventoryAlerts] = useState<InventoryAlert[]>([]);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = voiceNotificationService.getAvailableVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !selectedVoice) {
        setSelectedVoice(voices[0].name);
      }
    };

    loadVoices();
    // Voices might load asynchronously
    setTimeout(loadVoices, 100);

    // Set up bob notification callback
    const handleBobNotification = (orderData: { orderNumber: string; customerName: string; amount: number }) => {
      if (bobEnabled) {
        setBobOrderData(orderData);
        setShowBobNotification(true);
      }
    };

    realTimeService.setBobNotificationCallback(handleBobNotification);

    // Set up inventory alert listener
    const unsubscribeInventoryAlerts = inventoryAlertService.addListener((alerts) => {
      setRecentInventoryAlerts(alerts.slice(0, 5)); // Keep last 5 alerts
    });

    // Initialize with existing alerts
    setRecentInventoryAlerts(inventoryAlertService.getAlerts().slice(0, 5));

    // Cleanup
    return () => {
      realTimeService.setBobNotificationCallback(null);
      unsubscribeInventoryAlerts();
    };
  }, [selectedVoice, bobEnabled]);

  // Initialize audio settings
  useEffect(() => {
    audioNotificationService.setEnabled(audioEnabled);
    audioNotificationService.setVolume(audioVolume);
  }, [audioEnabled, audioVolume]);

  const toggleVoiceNotifications = () => {
    if (voiceEnabled) {
      voiceNotificationService.disable();
      setVoiceEnabled(false);
    } else {
      voiceNotificationService.enable();
      setVoiceEnabled(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    voiceNotificationService.setVolume(newVolume);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    voiceNotificationService.setRate(newRate);
  };

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) {
      voiceNotificationService.setVoice(voice);
    }
  };

  const testVoiceNotification = () => {
    voiceNotificationService.test();
  };

  const toggleBobNotifications = () => {
    setBobEnabled(!bobEnabled);
  };

  const testBobNotification = () => {
    const testOrder = {
      orderNumber: 'TEST123',
      customerName: 'John Doe',
      amount: 49.99
    };
    setBobOrderData(testOrder);
    setShowBobNotification(true);
  };

  const toggleAudioNotifications = () => {
    setAudioEnabled(!audioEnabled);
  };

  const handleAudioVolumeChange = (newVolume: number) => {
    setAudioVolume(newVolume);
  };

  const testAudioNotification = () => {
    audioNotificationService.test();
  };

  const toggleInventoryAlerts = () => {
    const newEnabled = !inventoryAlertsEnabled;
    setInventoryAlertsEnabled(newEnabled);
    inventoryAlertService.setEnabled(newEnabled);
  };

  const testInventoryAlert = () => {
    inventoryAlertService.testAlert('high');
  };
  return (
    <>
      {/* Bob Notification Component */}
      <BobNotification
        isVisible={showBobNotification}
        orderData={bobOrderData || undefined}
        onClose={() => setShowBobNotification(false)}
      />
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Real-Time Order Monitoring
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Live monitoring for customer orders and sales data
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700">System Active</span>
        </div>

        {/* Voice Notification Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoiceNotifications}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              voiceEnabled 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {voiceEnabled ? 'Voice On' : 'Voice Off'}
          </button>
          
          {voiceEnabled && (
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
          
          {/* Bob Notification Toggle */}
          <button
            onClick={toggleBobNotifications}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              bobEnabled 
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Package className="w-4 h-4" />
            {bobEnabled ? 'Bob On' : 'Bob Off'}
          </button>

          {/* Inventory Alerts Toggle */}
          <button
            onClick={toggleInventoryAlerts}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              inventoryAlertsEnabled 
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            {inventoryAlertsEnabled ? 'Alerts On' : 'Alerts Off'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Voice Settings Panel */}
        {voiceEnabled && showVoiceSettings && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Audio & Voice Settings
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voice Settings */}
              <div className="space-y-4">
                <h5 className="font-medium text-blue-700 border-b border-blue-300 pb-2">Voice Announcements</h5>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Volume Control */}
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Volume: {Math.round(volume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Speed Control */}
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Speed: {rate}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={rate}
                      onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Voice Selection */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Voice
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Audio Settings */}
              <div className="space-y-4">
                <h5 className="font-medium text-purple-700 border-b border-purple-300 pb-2">Bob Notification Sounds</h5>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-700">Enable Audio</span>
                  <button
                    onClick={toggleAudioNotifications}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      audioEnabled ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        audioEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Audio Volume: {Math.round(audioVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={audioVolume}
                    onChange={(e) => handleAudioVolumeChange(parseFloat(e.target.value))}
                    disabled={!audioEnabled}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={testVoiceNotification}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Test Voice
              </button>
              <button
                onClick={testAudioNotification}
                disabled={!audioEnabled}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Audio
              </button>
              <button
                onClick={testBobNotification}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Test Bob + Audio
              </button>
              <button
                onClick={testInventoryAlert}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                Test Inventory Alert
              </button>
            </div>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Real-Time System Active</span>
          </div>
          <p className="text-green-700 text-sm mt-2">
            You will receive live notifications when customers place real orders through your checkout system.
            Enable voice announcements and bob notifications with sound effects for complete audio-visual alerts!
          </p>
        </div>

        {/* Recent Inventory Alerts Section */}
        {recentInventoryAlerts.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-orange-800 font-medium">Recent Inventory Alerts</span>
              </div>
              <button
                onClick={() => inventoryAlertService.clearAllAlerts()}
                className="text-orange-600 hover:text-orange-800 text-sm"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {recentInventoryAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-md border-l-4 ${
                    alert.severity === 'high' 
                      ? 'bg-red-50 border-red-400' 
                      : alert.severity === 'medium'
                      ? 'bg-orange-50 border-orange-400'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-sm font-medium ${
                        alert.severity === 'high' 
                          ? 'text-red-800' 
                          : alert.severity === 'medium'
                          ? 'text-orange-800'
                          : 'text-yellow-800'
                      }`}>
                        {alert.message}
                      </p>
                      {alert.currentStock !== undefined && (
                        <p className={`text-xs mt-1 ${
                          alert.severity === 'high' 
                            ? 'text-red-600' 
                            : alert.severity === 'medium'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        }`}>
                          Current Stock: {alert.currentStock} units
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.severity === 'high' 
                        ? 'bg-red-100 text-red-600' 
                        : alert.severity === 'medium'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">New Orders</span>
            </div>
            <p className="text-blue-700 text-sm">
              Get instant notifications when customers complete checkout
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800 font-medium">Order Updates</span>
            </div>
            <p className="text-purple-700 text-sm">
              Live updates when order status changes (processing, shipped, etc.)
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">Sales Metrics</span>
            </div>
            <p className="text-yellow-700 text-sm">
              Dashboard stats update automatically with new sales
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800 font-medium">Inventory Alerts</span>
            </div>
            <p className="text-orange-700 text-sm">
              Real-time alerts for low stock and out-of-stock items
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">How Customers Place Real Orders:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-gray-600 text-sm font-medium">Customer Journey:</p>
              <div className="text-gray-600 text-sm space-y-1 pl-4">
                <p>1. Browse products on your website</p>
                <p>2. Add items to shopping cart</p>
                <p>3. Proceed to checkout</p>
                <p>4. Fill shipping information</p>
                <p>5. Select payment method (Card/COD)</p>
                <p>6. Complete order → You get notified!</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600 text-sm font-medium">What You'll See:</p>
              <div className="text-gray-600 text-sm space-y-1 pl-4">
                <p>• Toast notification with customer name</p>
                <p>• Voice announcement (if enabled)</p>
                <p>• Bob notification animation with sound (if enabled)</p>
                <p>• Musical notification sound effects</p>
                <p>• Order number and total amount</p>
                <p>• Real-time dashboard updates</p>
                <p>• Updated sales metrics</p>
                <p>• Order appears in orders list</p>
                <p>• Inventory alerts when stock is low</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Real-Time Notifications:</strong> The system uses WebSocket connection 
            for instant notifications including new orders, order updates, sales metrics, and inventory alerts. 
            Optional voice announcements are available for all notification types. 
            Connection status is shown in the top navigation bar.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
