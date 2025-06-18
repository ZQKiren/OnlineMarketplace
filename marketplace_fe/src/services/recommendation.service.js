// src/services/recommendation.service.js
import api from './api'

export default {
  // ✅ Track product view
  async trackProductView(productId) {
    try {
      const response = await api.post('/recommendations/track-view', {
        productId
      })
      return response
    } catch (error) {
      console.error('❌ Error tracking product view:', error)
      // Don't throw error for tracking
    }
  },

  // ✅ Get personalized recommendations
  async getPersonalizedRecommendations(limit = 10) {
    try {
      const response = await api.get('/recommendations/personalized', {
        params: { limit }
      })
      return response
    } catch (error) {
      console.error('❌ Error getting personalized recommendations:', error)
      throw error
    }
  },

  // ✅ Get similar products
  async getSimilarProducts(productId, limit = 6) {
    try {
      const response = await api.get(`/recommendations/similar/${productId}`, {
        params: { limit }
      })
      return response
    } catch (error) {
      console.error('❌ Error getting similar products:', error)
      throw error
    }
  },

  // ✅ Get popular products
  async getPopularProducts(limit = 10) {
    try {
      const response = await api.get('/recommendations/popular', {
        params: { limit }
      })
      return response
    } catch (error) {
      console.error('❌ Error getting popular products:', error)
      throw error
    }
  },

  // ✅ Get trending products
  async getTrendingProducts(limit = 8) {
    try {
      const response = await api.get('/recommendations/trending', {
        params: { limit }
      })
      return response
    } catch (error) {
      console.error('❌ Error getting trending products:', error)
      throw error
    }
  },

  // ✅ Get user preferences
  async getUserPreferences() {
    try {
      const response = await api.get('/recommendations/preferences')
      return response
    } catch (error) {
      console.error('❌ Error getting user preferences:', error)
      throw error
    }
  },

  // ✅ Update user preference
  async updateUserPreference(categoryId, score) {
    try {
      const response = await api.put('/recommendations/preferences', {
        categoryId,
        score
      })
      return response
    } catch (error) {
      console.error('❌ Error updating user preference:', error)
      throw error
    }
  }
}
