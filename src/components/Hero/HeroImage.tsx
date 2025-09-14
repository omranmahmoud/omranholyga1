import React from 'react';
import { Sparkles } from 'lucide-react';

interface HeroImageProps {
  image: string;
  video?: string;
}

export function HeroImage({ image, video }: HeroImageProps) {
  return (
    <div className="relative mt-12 lg:mt-0">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl transform lg:translate-x-10">
        {video ? (
          <video
            className="w-full h-full object-cover object-center"
            src={video}
            controls
            autoPlay
            loop
            muted
            playsInline
            poster={image}
          />
        ) : (
          <img
            className="w-full h-full object-cover object-center scale-105 hover:scale-110 transition-transform duration-700"
            src={image}
            alt="Fashion model showcasing latest collection"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Floating Elements */}
        <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-gray-900">New Season</span>
        </div>
      </div>
      {/* Decorative Elements */}
      <div className="absolute -bottom-4 -left-4 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute -top-4 -right-4 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50" />
    </div>
  );
}
