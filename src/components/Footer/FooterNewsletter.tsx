import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface FooterNewsletterProps {
  settings: {
    newsletter: {
      title: string;
      subtitle: string;
      placeholder: string;
      buttonText: string;
    };
  };
}

export function FooterNewsletter({ settings }: FooterNewsletterProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      toast.success('Successfully subscribed to newsletter!');
      setEmail('');
    } catch (error) {
      toast.error('Failed to subscribe to newsletter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-gradient-to-b from-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            {settings?.newsletter.title || t('footer.newsletter.title')}
          </h3>
          <p className="mt-3 text-base sm:text-lg text-gray-600">
            {settings?.newsletter.subtitle || t('footer.newsletter.subtitle')}
          </p>
          <form onSubmit={handleSubmit} className="mt-6 sm:mt-8">
            <div className="flex flex-col sm:flex-row sm:max-w-md mx-auto gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={settings?.newsletter.placeholder || t('footer.newsletter.placeholder')}
                className="w-full px-5 py-3 placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border border-gray-300 rounded-full shadow-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Subscribing...' : settings?.newsletter.buttonText || t('footer.newsletter.subscribe')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}