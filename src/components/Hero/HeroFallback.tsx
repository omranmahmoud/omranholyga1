
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Background } from './Background';
import { Badge } from './Badge';

export function HeroFallback() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="relative">
        <Background />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-32">
          <div className="text-center">
            <Badge />
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mt-8">
              {t('hero.welcome')}
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
