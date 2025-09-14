import React, { useState } from 'react';
import { Star, ThumbsUp, Flag, Image as ImageIcon, X } from 'lucide-react';
import { UserIcon } from '../Common/UserIcon';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  _id: string;
  user: {
    name: string;
    image?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
  verified: boolean;
  photos?: string[];
}

interface ReviewListProps {
  reviews: Review[];
  onHelpful: (reviewId: string) => void;
  onReport: (reviewId: string) => void;
}

export function ReviewList({ reviews, onHelpful, onReport }: ReviewListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-8">
        {reviews.map((review) => (
          <div key={review._id} className="space-y-4">
            {/* Review Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <UserIcon 
                  name={review.user.name} 
                  image={review.user.image}
                  size="md"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                    {review.verified && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Review Content */}
            <p className="text-gray-600">{review.comment}</p>

            {/* Review Photos */}
            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-4">
                {review.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(photo)}
                    className="relative w-24 h-24 rounded-lg overflow-hidden group"
                  >
                    <img
                      src={photo}
                      alt={`Review photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

            {/* Review Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => onHelpful(review._id)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Helpful ({review.helpful})</span>
              </button>
              <button
                onClick={() => onReport(review._id)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <Flag className="w-4 h-4" />
                <span>Report</span>
              </button>
            </div>
          </div>
        ))}
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
    </>
  );
}