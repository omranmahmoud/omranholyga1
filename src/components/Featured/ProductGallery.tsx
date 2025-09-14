import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const images = [
  {
    url: "https://images.unsplash.com/photo-1475178626620-a4d074967452?ixlib=rb-4.0.3&auto=format&fit=crop&w=986&q=80",
    alt: "Elegant wool coat front view"
  },
  {
    url: "https://images.unsplash.com/photo-1544441893-675973e31985?ixlib=rb-4.0.3&auto=format&fit=crop&w=986&q=80",
    alt: "Elegant wool coat back view"
  },
  {
    url: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=986&q=80",
    alt: "Elegant wool coat detail view"
  },
  {
    url: "https://images.unsplash.com/photo-1467043198406-dc953a3defa0?ixlib=rb-4.0.3&auto=format&fit=crop&w=986&q=80",
    alt: "Elegant wool coat styled view"
  }
];

export function ProductGallery() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextImage = () => {
    setActiveIndex((current) => (current + 1) % images.length);
  };

  const previousImage = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
          <img
            src={images[activeIndex].url}
            alt={images[activeIndex].alt}
            className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        
        <button 
          onClick={previousImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center hover:bg-white"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        
        <button 
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center hover:bg-white"
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>

        <button className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center hover:bg-white">
          <ZoomIn className="w-5 h-5 text-gray-800" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <button
            key={image.url}
            onClick={() => setActiveIndex(index)}
            className={`relative aspect-square rounded-lg overflow-hidden ${
              index === activeIndex ? 'ring-2 ring-indigo-600' : 'hover:opacity-75'
            } transition-all duration-200`}
          >
            <img
              src={image.url}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}