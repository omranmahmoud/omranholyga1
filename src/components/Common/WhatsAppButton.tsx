import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  className?: string;
  showText?: boolean;
}

export function WhatsAppButton({ className = '', showText = true }: WhatsAppButtonProps) {
  const whatsappUrl = "https://api.whatsapp.com/message/OSZ6JMHY5SUEL1?autoload=1&app_absent=0";

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-24 right-8 z-40 flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 hover:-translate-y-1 ${className}`}
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      {showText && (
        <span className="font-medium hidden sm:block">Chat with us</span>
      )}
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20"></span>
    </a>
  );
}