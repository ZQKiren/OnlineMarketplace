// src/services/review.service.js
import api from './api'

export default {
  getProductReviews(productId) {
    return api.get(`/reviews/product/${productId}`)
  },

  createReview(reviewData) {
    return api.post('/reviews', reviewData)
  },

  updateReview(id, reviewData) {
    return api.patch(`/reviews/${id}`, reviewData)
  },

  deleteReview(id) {
    return api.delete(`/reviews/${id}`)
  }
}