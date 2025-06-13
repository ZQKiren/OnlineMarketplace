// src/stores/reviews.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import reviewService from '@/services/review.service'

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref([])
  const reviewStats = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchProductReviews(productId) {
    loading.value = true
    error.value = null
    
    try {
      const response = await reviewService.getProductReviews(productId)
      reviews.value = response.data.reviews
      reviewStats.value = response.data.stats
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createReview(reviewData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await reviewService.createReview(reviewData)
      reviews.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateReview(reviewId, reviewData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await reviewService.updateReview(reviewId, reviewData)
      const index = reviews.value.findIndex(r => r.id === reviewId)
      if (index !== -1) {
        reviews.value[index] = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteReview(reviewId) {
    loading.value = true
    error.value = null
    
    try {
      await reviewService.deleteReview(reviewId)
      reviews.value = reviews.value.filter(r => r.id !== reviewId)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    reviews,
    reviewStats,
    loading,
    error,
    fetchProductReviews,
    createReview,
    updateReview,
    deleteReview
  }
})