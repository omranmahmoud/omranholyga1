import React from 'react';
import { Link } from 'react-router-dom';
import { Brush, ExternalLink } from 'lucide-react';
import { GeneralSettings } from './GeneralSettings';
import { AnalyticsSettings } from './AnalyticsSettings';
import { DesignSettings } from './DesignSettings';
import { PayPalSettings } from './PayPalSettings';
import { GoogleAuthSettings } from './GoogleAuthSettings';
import { FacebookAuthSettings } from './FacebookAuthSettings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../UI/Tabs';

export function StoreSettings() {
  const [activeTab, setActiveTab] = React.useState('general');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your store's configuration and preferences
          </p>
        </div>
        
        {/* Design Studio Link */}
        <Link
          to="/admin/design"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
        >
          <Brush className="w-5 h-5" />
          Design Studio
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="design">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-center py-8">
              <Brush className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Enhanced Design Studio Available
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Access our advanced design tools including theme designer, visual page builder, 
                and comprehensive customization options.
              </p>
              <Link
                to="/admin/design"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Brush className="w-5 h-5" />
                Open Design Studio
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <DesignSettings />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsSettings />
        </TabsContent>
        <TabsContent value="payments">
          <PayPalSettings />
        </TabsContent>
        <TabsContent value="auth">
          <div className="space-y-8">
            <GoogleAuthSettings />
            <FacebookAuthSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}