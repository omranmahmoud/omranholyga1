import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeroTitle } from './HeroTitle';
import { HeroActions } from './HeroActions';
import { HeroImage } from './HeroImage';
import { TrustBadges } from './TrustBadges';
import { AdLine } from './AdLine';
import { MarqueeText } from './MarqueeText';
import type { Hero } from '../../types/store';

interface HeroContentProps {
  hero: Hero;
}

export function HeroContent({ hero }: HeroContentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleShopCollection = () => {
    navigate('/products');
  };

  const handleExploreLookbook = () => {
    navigate('/lookbook');
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-32 pb-32">
      <MarqueeText />
      
      <div className="lg:grid lg:grid-cols-2 gap-16 items-center mt-12">
        {/* Left Column - Content */}
        <div className="relative z-10 space-y-8 text-center lg:text-left">
          <HeroTitle 
            title={hero.title} 
            subtitle={hero.subtitle} 
          />

          <HeroActions 
            primaryText={hero.primaryButtonText}
            secondaryText={hero.secondaryButtonText}
            onPrimaryClick={handleShopCollection}
            onSecondaryClick={handleExploreLookbook}
          />
          
          <div className="hidden lg:block">
            <TrustBadges />
          </div>
        </div>

  {/* Right Column - Media (Video or Image) */}
  <HeroImage image={hero.image} video={hero.video} />
        
        <div className="mt-12 lg:hidden">
          <TrustBadges />
        </div>
      </div>

      <AdLine />
    </div>
  );
}
