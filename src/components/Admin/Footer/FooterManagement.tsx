import React, { useState, useEffect } from 'react';
import { FooterSections } from './FooterSections';
import { FooterSocialLinks } from './FooterSocialLinks';
import { FooterContactInfo } from './FooterContactInfo';
import { FooterNewsletterSettings } from './FooterNewsletterSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../UI/Tabs';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

interface FooterSettings {
  description: string;
  address: string;
  phone: string;
  email: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  newsletter: {
    title: string;
    subtitle: string;
    placeholder: string;
    buttonText: string;
  };
}

export function FooterManagement() {
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sections');

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    try {
      const response = await api.get('/footer/settings');
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to fetch footer settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (data: Partial<FooterSettings>) => {
    try {
      await api.put('/footer/settings', data);
      await fetchFooterSettings();
      toast.success('Footer settings updated successfully');
    } catch (error) {
      toast.error('Failed to update footer settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Footer Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customize your website's footer content and appearance.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sections">Footer Sections</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <FooterSections />
        </TabsContent>

        <TabsContent value="contact">
          <FooterContactInfo
            settings={settings}
            onUpdate={handleUpdateSettings}
          />
        </TabsContent>

        <TabsContent value="social">
          <FooterSocialLinks
            settings={settings}
            onUpdate={handleUpdateSettings}
          />
        </TabsContent>

        <TabsContent value="newsletter">
          <FooterNewsletterSettings
            settings={settings}
            onUpdate={handleUpdateSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
