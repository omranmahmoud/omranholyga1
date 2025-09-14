import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../Logo';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

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

interface FooterLink {
  _id: string;
  name: string;
  url: string;
  section: 'shop' | 'support' | 'company';
  isActive: boolean;
}

export function Footer() {
  const { t } = useTranslation();
  const { settings: storeSettings } = useStore();
  // Footer-specific settings (description, newsletter, optional overrides). Contact & social prefer global store settings.
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const [settingsRes, linksRes] = await Promise.all([
          api.getWithRetry('/footer/settings'),
          api.getWithRetry('/footer/links')
        ]);
        setSettings(settingsRes.data);
        setLinks(linksRes.data);
      } catch (error) {
        console.error('Error fetching footer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = new FormData(form).get('email') as string;

    try {
  await api.postWithRetry('/newsletter/subscribe', { email });
      toast.success('Successfully subscribed to newsletter');
      form.reset();
    } catch (error) {
      toast.error('Failed to subscribe to newsletter');
    }
  };

  if (loading) {
    return <div className="h-96 bg-white" />; // Placeholder while loading
  }

  const groupedLinks = links.reduce((acc, link) => {
    if (link.isActive) {
      if (!acc[link.section]) {
        acc[link.section] = [];
      }
      acc[link.section].push(link);
    }
    return acc;
  }, {} as Record<string, FooterLink[]>);

  const footerStyle = storeSettings?.footerStyle || 'detailed';

  // Derive contact info prioritizing global store settings (so admin Settings -> Contact reflects instantly)
  const contactAddress = storeSettings?.address || settings?.address;
  const contactPhone = storeSettings?.phone || settings?.phone;
  const contactEmail = storeSettings?.email || settings?.email;

  // Merge social links (store settings may have more platforms)
  const socialLinks = {
    facebook: settings?.socialLinks?.facebook || storeSettings?.socialLinks?.facebook,
    twitter: settings?.socialLinks?.twitter || storeSettings?.socialLinks?.twitter,
    instagram: settings?.socialLinks?.instagram || storeSettings?.socialLinks?.instagram,
    youtube: settings?.socialLinks?.youtube || storeSettings?.socialLinks?.youtube,
  };

  return (
    <footer className="theme-background-bg border-t theme-font">
      {/* Newsletter Section (only when footer style is 'newsletter' or 'detailed') */}
      {footerStyle !== 'simple' && (
      <div className="py-12 sm:py-16 bg-gradient-to-b from-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-xl sm:text-2xl font-bold theme-text">
              {settings?.newsletter.title || t('footer.newsletter.title')}
            </h3>
            <p className="mt-3 text-base sm:text-lg theme-text opacity-80">
              {settings?.newsletter.subtitle || t('footer.newsletter.subtitle')}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row sm:max-w-md mx-auto gap-3">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  className="w-full px-5 py-3 placeholder-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border border-gray-300 rounded-full shadow-sm"
                  placeholder={settings?.newsletter.placeholder || t('footer.newsletter.placeholder')}
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {settings?.newsletter.buttonText || t('footer.newsletter.subscribe')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>) }

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Logo and Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="inline-block">
              <Logo className="h-12 w-auto text-gray-900" />
            </Link>
            <p className="text-gray-600 max-w-xs">
              {settings?.description || t('footer.description')}
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span>{contactAddress || t('footer.address')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span>{contactPhone || t('footer.phone')}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span>{contactEmail || t('footer.email')}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          {['shop', 'support', 'company'].map((section) => (
            <div key={section} className="space-y-4">
              <details className="group md:open">
                <summary className="flex items-center justify-between cursor-pointer md:cursor-default">
                  <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                    {t(`footer.${section}`)}
                  </h3>
                </summary>
                <ul className="mt-4 space-y-3 group-open:animate-fadeIn">
                  {groupedLinks[section]?.map((link) => (
                    <li key={link._id}>
                      <Link
                        to={link.url}
                        className="text-base text-gray-600 hover:text-gray-900"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
        {socialLinks.facebook && (
                <a
          href={socialLinks.facebook}
                  className="text-gray-400 hover:text-gray-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">Facebook</span>
                  <Facebook className="w-6 h-6" />
                </a>
              )}
        {socialLinks.twitter && (
                <a
          href={socialLinks.twitter}
                  className="text-gray-400 hover:text-gray-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">Twitter</span>
                  <Twitter className="w-6 h-6" />
                </a>
              )}
        {socialLinks.instagram && (
                <a
          href={socialLinks.instagram}
                  className="text-gray-400 hover:text-gray-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">Instagram</span>
                  <Instagram className="w-6 h-6" />
                </a>
              )}
        {socialLinks.youtube && (
                <a
          href={socialLinks.youtube}
                  className="text-gray-400 hover:text-gray-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">YouTube</span>
                  <Youtube className="w-6 h-6" />
                </a>
              )}
            </div>
            <p className="text-sm text-gray-500">
              © {year} Eva Curves. {t('footer.rights')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}