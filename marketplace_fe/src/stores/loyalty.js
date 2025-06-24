// src/stores/loyalty.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import loyaltyService from '@/services/loyalty.service'

export const useLoyaltyStore = defineStore('loyalty', () => {
  // State
  const summary = ref(null)
  const transactions = ref([])
  const redemptions = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Pagination for transactions
  const transactionsPagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Computed
  const currentBalance = computed(() => summary.value?.currentBalance || 0)
  const totalEarned = computed(() => summary.value?.totalEarned || 0)
  const totalRedeemed = computed(() => summary.value?.totalRedeemed || 0)
  const pointsExpiringSoon = computed(() => summary.value?.pointsExpiringSoon || 0)
  const earnRate = computed(() => summary.value?.earnRate || 0.01)
  const nextMilestone = computed(() => summary.value?.nextMilestone)
  
  const availableRedemptions = computed(() => 
    redemptions.value.filter(r => r.isActive && r.pointsCost <= currentBalance.value)
  )

  // Actions
  async function fetchSummary() {
    loading.value = true
    error.value = null
    
    try {
      const response = await loyaltyService.getSummary()
      summary.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching loyalty summary:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactions(page = 1, limit = 20) {
    loading.value = true
    error.value = null
    
    try {
      const response = await loyaltyService.getTransactions(page, limit)
      transactions.value = response.data.data
      transactionsPagination.value = response.data.meta
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching loyalty transactions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchRedemptions() {
    loading.value = true
    error.value = null
    
    try {
      const response = await loyaltyService.getRedemptions()
      redemptions.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching redemptions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function redeemPoints(redemptionId, orderValue) {
    loading.value = true
    error.value = null
    
    try {
      const response = await loyaltyService.redeemPoints(redemptionId, orderValue)
      
      // Refresh summary after redemption
      await fetchSummary()
      
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function calculatePoints(orderAmount) {
    try {
      const response = await loyaltyService.calculatePoints(orderAmount)
      return response.data
    } catch (err) {
      console.error('Error calculating points:', err)
      return { orderAmount, pointsToEarn: 0 }
    }
  }

  // Helper functions
  function getTransactionIcon(type) {
    const icons = {
      'EARN': 'trending_up',
      'REDEEM': 'redeem',
      'BONUS': 'star',
      'PENALTY': 'trending_down',
      'EXPIRED': 'schedule'
    }
    return icons[type] || 'help'
  }

  function getTransactionColor(type) {
    const colors = {
      'EARN': 'green',
      'REDEEM': 'blue',
      'BONUS': 'orange',
      'PENALTY': 'red',
      'EXPIRED': 'grey'
    }
    return colors[type] || 'grey'
  }

  function formatTransactionDescription(transaction) {
    if (transaction.description) {
      return transaction.description
    }
    
    // Fallback descriptions
    const descriptions = {
      'EARN': 'Points earned from purchase',
      'REDEEM': 'Points redeemed for discount',
      'BONUS': 'Bonus points awarded',
      'PENALTY': 'Points penalty',
      'EXPIRED': 'Points expired'
    }
    
    return descriptions[transaction.type] || 'Loyalty transaction'
  }

  function canUseRedemption(redemption, orderValue = 0) {
    if (!redemption.isActive) return false
    if (redemption.pointsCost > currentBalance.value) return false
    if (redemption.minOrderValue && orderValue < redemption.minOrderValue) return false
    
    const now = new Date()
    if (redemption.validFrom && new Date(redemption.validFrom) > now) return false
    if (redemption.validUntil && new Date(redemption.validUntil) < now) return false
    if (redemption.maxUses && redemption.usageCount >= redemption.maxUses) return false
    
    return true
  }

  function getDiscountText(redemption) {
    if (redemption.discountType === 'PERCENTAGE') {
      return `${redemption.discountValue}% off`
    } else if (redemption.discountType === 'FIXED_AMOUNT') {
      return `$${redemption.discountValue} off`
    } else if (redemption.discountType === 'FREE_SHIPPING') {
      return 'Free shipping'
    }
    return 'Discount'
  }

  function getMilestoneProgress() {
    if (!nextMilestone.value) return null
    
    return {
      current: currentBalance.value,
      target: nextMilestone.value.points,
      progress: nextMilestone.value.progress,
      remaining: nextMilestone.value.points - currentBalance.value
    }
  }

  // Initialize
  async function initialize() {
    try {
      await Promise.all([
        fetchSummary(),
        fetchRedemptions()
      ])
    } catch (error) {
      console.error('Error initializing loyalty store:', error)
    }
  }

  return {
    // State
    summary,
    transactions,
    redemptions,
    loading,
    error,
    transactionsPagination,
    
    // Computed
    currentBalance,
    totalEarned,
    totalRedeemed,
    pointsExpiringSoon,
    earnRate,
    nextMilestone,
    availableRedemptions,
    
    // Actions
    fetchSummary,
    fetchTransactions,
    fetchRedemptions,
    redeemPoints,
    calculatePoints,
    initialize,
    
    // Helpers
    getTransactionIcon,
    getTransactionColor,
    formatTransactionDescription,
    canUseRedemption,
    getDiscountText,
    getMilestoneProgress
  }
})