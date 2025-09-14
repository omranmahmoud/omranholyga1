import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Upload } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  images?: string[];
}

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductImageModal({ isOpen, onClose, product }: ProductImageModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen || !product) return null;

  const images = product.images || [];

  const handlePrevious = () => {
    setCurrentImageIndex((current) => (current - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentImageIndex((current) => (current + 1) % images.length);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop here
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="product-image-modal" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {product.name} - Photos
            </h2>

            <div className="space-y-8">
              {/* Main Image Display */}
              {images.length > 0 ? (
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${product.name} - Photo ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-900" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-900" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-xl bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">No images available</p>
                </div>
              )}

              {/* Thumbnail Navigation */}
              {images.length > 1 && (
                <div className="grid grid-cols-6 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden ${
                        index === currentImageIndex ? 'ring-2 ring-indigo-600' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-col items-center">
                  <Upload className="w-10 h-10 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop images here, or
                  </p>
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    Browse files
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports JPG, PNG and GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}