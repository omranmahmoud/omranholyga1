import React from 'react';
import { Star } from 'lucide-react';

interface Review {
  rating: number;
}

interface ReviewStatsProps {
  reviews: Review[];
}

export function ReviewStats({ reviews }: ReviewStatsProps) {
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 rounded-xl p-6">
      <div className="text-center md:text-left">
        <div className="text-5xl font-bold text-gray-900 mb-2">
          {averageRating.toFixed(1)}
        </div>
        <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(averageRating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-500">Based on {reviews.length} reviews</p>
      </div>

      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium text-gray-700">{rating}</span>
              <Star className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full"
                style={{ 
                  width: `${(ratingDistribution[rating] || 0) / reviews.length * 100}%` 
                }}
              />
            </div>
            <div className="w-12 text-right">
              <span className="text-sm text-gray-500">
                {Math.round((ratingDistribution[rating] || 0) / reviews.length * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}