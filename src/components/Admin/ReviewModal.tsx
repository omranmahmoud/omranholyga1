import React, { useState } from 'react';
import { X, Star, Flag, ThumbsUp } from 'lucide-react';
import { UserIcon } from '../Common/UserIcon';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  _id: string;
  product: {
    name: string;
    images: string[];
  };
  user: {
    name: string;
    email: string;
    image?: string;
  };
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
  helpful: number;
  reported: boolean;
  verified: boolean;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
}

export function ReviewModal({ isOpen, onClose, review }: ReviewModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Review Details
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Product Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={review.product.images[0]}
                alt={review.product.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h4 className="font-medium text-gray-900">{review.product.name}</h4>
                <p className="text-sm text-gray-500">
                  Reviewed {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-4">
              <UserIcon name={review.user.name} image={review.user.image} size="lg" />
              <div>
                <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                <p className="text-sm text-gray-500">{review.user.email}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 ml-4">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <ThumbsUp className="w-4 h-4" />
                  {review.helpful} helpful
                </span>
                {review.reported && (
                  <span className="flex items-center gap-1 text-sm text-red-500">
                    <Flag className="w-4 h-4" />
                    Reported
                  </span>
                )}
              </div>
            </div>

            {/* Review Content */}
            <p className="text-gray-600">{review.comment}</p>

            {/* Review Photos */}
            {review.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {review.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(photo)}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <img
                      src={photo}
                      alt={`Review photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Review photo"
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}