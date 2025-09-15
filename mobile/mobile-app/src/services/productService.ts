import api from './api';

export async function fetchProducts() {
  const response = await api.get('/api/products');
  return response.data;
}

export async function fetchProductById(productId: string) {
  const response = await api.get(`/api/products/${productId}`);
  return response.data;
}

export async function fetchProductsByCategory(categoryId: string) {
  const response = await api.get('/api/products', { params: { category: categoryId } });
  return response.data;
}

// Generic filtered fetch for products (e.g., featured, minRating, categories)
export async function fetchProductsFiltered(params?: Record<string, any>) {
  const response = await api.get('/api/products', { params });
  return response.data;
}

// Reviews
export async function fetchProductReviews(productId: string) {
  const res = await api.get(`/api/products/${productId}`); // product already includes reviews
  return res.data.reviews || [];
}

export async function addProductReview(productId: string, data: { rating: number; comment: string; photos?: string[]; fit?: number; quality?: number }) {
  const res = await api.post(`/api/products/${productId}/reviews`, data);
  return res.data;
}

export async function markReviewHelpful(productId: string, reviewId: string) {
  const res = await api.post(`/api/products/${productId}/reviews/${reviewId}/helpful`);
  return res.data;
}

export async function reportReview(productId: string, reviewId: string, reason?: string) {
  const res = await api.post(`/api/products/${productId}/reviews/${reviewId}/report`, { reason });
  return res.data;
}

export async function deleteReview(productId: string, reviewId: string) {
  const res = await api.delete(`/api/products/${productId}/reviews/${reviewId}`);
  return res.data;
}

export async function fetchReviewEligibility(productId: string) {
  const res = await api.get(`/api/products/${productId}/reviews/eligibility`);
  return res.data as { purchased: boolean; alreadyReviewed: boolean; canReview: boolean };
}
