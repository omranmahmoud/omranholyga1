import { useState, useEffect } from 'react';
import { Package, X } from 'lucide-react';
import { audioNotificationService } from '../../services/audioNotificationService';

interface BobNotificationProps {
  isVisible: boolean;
  orderData?: {
    orderNumber: string;
    customerName: string;
    amount: number;
  };
  onClose: () => void;
}

export function BobNotification({ isVisible, orderData, onClose }: BobNotificationProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setAnimate(true);
      
      // Play sound effect when notification appears
      audioNotificationService.playNewOrderSound();
      
      // Auto close after 8 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !orderData) return null;

  return (
    <>
      {/* Add custom animation styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bob {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .animate-bob {
            animation: bob 2s ease-in-out infinite;
          }
        `
      }} />
      
      <div className="fixed top-4 right-4 z-50">
        <div
          className={`
            bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-2xl
            transform transition-all duration-300 ease-in-out
            ${animate ? 'animate-bob scale-100 opacity-100' : 'scale-95 opacity-0'}
            max-w-sm w-full
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2 animate-pulse">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  🎉 New Order!
                </h4>
                <p className="text-green-100 text-sm">
                  Order #{orderData.orderNumber}
                </p>
                <p className="text-white font-medium">
                  {orderData.customerName}
                </p>
                <p className="text-green-100 text-sm font-semibold">
                  ${orderData.amount.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors p-1 hover:bg-white hover:bg-opacity-10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Bobbing indicator dots */}
          <div className="mt-3 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white bg-opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 w-full bg-white bg-opacity-20 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full animate-pulse"
              style={{ 
                width: '100%',
                animation: 'progress 8s linear forwards'
              }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
}
