// src/services/loyalty.service.js - COMPLETE FIXED VERSION
import api from './api'

const loyaltyService = {
  // ============= USER ENDPOINTS =============
  
  /**
   * Get user's loyalty summary
   */
  getSummary() {
    return api.get('/loyalty/summary')
  },

  /**
   * Get user's transaction history
   */
  getTransactions(page = 1, limit = 20) {
    return api.get('/loyalty/transactions', {
      params: { page, limit }
    })
  },

  /**
   * Get available redemption options (active only)
   */
  getRedemptions() {
    return api.get('/loyalty/redemptions')
  },

  /**
   * Redeem points for discount
   */
  redeemPoints(redemptionId, orderValue) {
    return api.post('/loyalty/redeem', {
      redemptionId,
      orderValue
    })
  },

  /**
   * Calculate points for order amount
   */
  calculatePoints(amount) {
    return api.get('/loyalty/calculate-points', {
      params: { amount }
    })
  },

  // ============= ADMIN ENDPOINTS =============
  
  /**
   * Get loyalty analytics (Admin only)
   */
  getAnalytics() {
    return api.get('/loyalty/analytics')
  },

  /**
   * Get ALL redemption options including inactive (Admin only) 
   * ✅ FIX: This method was missing!
   */
  getAllRedemptions() {
    return api.get('/loyalty/admin/redemptions')
  },

  /**
   * Create new redemption option (Admin only)
   */
  createRedemption(redemptionData) {
    return api.post('/loyalty/admin/redemptions', redemptionData)
  },

  /**
   * Award bonus points to user (Admin only)
   */
  awardBonusPoints(userId, points, description) {
    return api.post('/loyalty/admin/award-bonus', {
      userId,
      points,
      description
    })
  },

  /**
   * Clean up expired points (Admin only)
   */
  cleanupExpiredPoints() {
    return api.post('/loyalty/admin/cleanup-expired')
  },

  /**
   * Award welcome bonus manually (Admin only)
   */
  awardWelcomeBonus(userId) {
    return api.post(`/loyalty/admin/welcome-bonus/${userId}`)
  },

  /**
   * Award review bonus manually (Admin only)
   */
  awardReviewBonus(userId, productId) {
    return api.post('/loyalty/admin/review-bonus', {
      userId,
      productId
    })
  }
}

export default loyaltyService