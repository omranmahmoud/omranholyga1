import React, { useState } from 'react';
import { ReviewForm } from './ReviewForm';
import { ReviewSummary } from './ReviewSummary';
import { ReviewList } from './ReviewList';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../services/cloudinary';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Review {
  _id: string;
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
  verified: boolean;
}

interface ReviewsProps {
  productId: string;
  reviews: Review[];
  onReviewAdded: () => void;
}

export function Reviews({ productId, reviews, onReviewAdded }: ReviewsProps) {
  const { isAuthenticated } = useAuth();
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate review statistics
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const handleSubmitReview = async (data: { rating: number; comment: string; photos: File[] }) => {
    if (!isAuthenticated) {
      toast.error('Please log in to write a review');
      return;
    }

    setLoading(true);
    try {
      // Upload photos to Cloudinary
      const uploadedPhotos = await Promise.all(
        data.photos.map(photo => uploadToCloudinary(photo))
      );

      // Submit review
      await api.post(`/products/${productId}/reviews`, {
        rating: data.rating,
        comment: data.comment,
        photos: uploadedPhotos
      });

      setIsWritingReview(false);
      onReviewAdded();
      toast.success('Review submitted successfully');
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to mark reviews as helpful');
      return;
    }

    try {
      await api.post(`/products/${productId}/reviews/${reviewId}/helpful`);
      onReviewAdded();
      toast.success('Review marked as helpful');
    } catch (error) {
      toast.error('Failed to mark review as helpful');
    }
  };

  const handleReport = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('Please log in to report reviews');
      return;
    }

    try {
      await api.post(`/products/${productId}/reviews/${reviewId}/report`);
      toast.success('Review reported successfully');
    } catch (error) {
      toast.error('Failed to report review');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
        {!isWritingReview && (
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.error('Please log in to write a review');
                return;
              }
              setIsWritingReview(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      <ReviewSummary
        averageRating={averageRating}
        totalReviews={reviews.length}
        ratingDistribution={ratingDistribution as any}
      />

      {isWritingReview && (
        <div className="bg-gray-50 rounded-xl p-6">
          <ReviewForm onSubmit={handleSubmitReview} loading={loading} />
        </div>
      )}

      <ReviewList
        reviews={reviews}
        onHelpful={handleHelpful}
        onReport={handleReport}
      />
    </div>
  );
}