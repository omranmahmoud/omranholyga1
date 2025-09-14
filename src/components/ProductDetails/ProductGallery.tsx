import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  video?: string;
}

export function ProductGallery({ images, productName, video }: ProductGalleryProps) {
  // Combine video (if present) as the first slot in a unified media array
  const media = [
    ...(video ? [{ type: 'video' as const, url: video }] : []),
    ...images.map(img => ({ type: 'image' as const, url: img }))
  ];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const next = () => {
    setSelectedIndex((prev) => (prev + 1) % media.length);
  };

  const prev = () => {
    setSelectedIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
        {media[selectedIndex].type === 'video' ? (
          <video
            src={media[selectedIndex].url}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        ) : (
          <img
            src={media[selectedIndex].url}
            alt={`${productName} - View ${selectedIndex + 1}`}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Navigation Arrows */}
    {media.length > 1 && (
          <>
            <button
      onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <button
      onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>
          </>
        )}

        {/* Zoom Button */}
        {media[selectedIndex].type === 'image' && (
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <ZoomIn className="w-5 h-5 text-gray-900" />
          </button>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {media.length > 1 && (
        <div className="grid grid-cols-5 gap-4">
          {media.map((m, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square rounded-lg overflow-hidden ${index === selectedIndex ? 'ring-2 ring-indigo-600' : ''}`}
            >
              {m.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-black text-white text-xs">Video</div>
              ) : (
                <img
                  src={m.url}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Zoomed Image Modal */}
      {isZoomed && media[selectedIndex].type === 'image' && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={media[selectedIndex].url}
            alt={`${productName} - View ${selectedIndex + 1}`}
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}