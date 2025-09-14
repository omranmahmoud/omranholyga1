
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from './Badge';

interface HeroTitleProps {
  title: string;
  subtitle: string;
}

export function HeroTitle({ title, subtitle }: HeroTitleProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Badge />
      
      <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gray-900">
        <span className="block">{title}</span>
        <span className="inline-block bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {t('hero.collection')}
        </span>
      </h1>

      <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
        {subtitle}
      </p>
    </div>
  );
}
