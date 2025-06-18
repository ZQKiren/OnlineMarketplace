// src/stores/recommendation.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import recommendationService from '@/services/recommendation.service'
import { useToast } from 'vue-toastification'

export const useRecommendationStore = defineStore('recommendation', () => {
  const toast = useToast()
  
  // State
  const personalizedRecommendations = ref([])
  const similarProducts = ref([])
  const popularProducts = ref([])
  const trendingProducts = ref([])
  const userPreferences = ref([])
  const loading = ref(false)
  const similarLoading = ref(false)
  const trendingLoading = ref(false)

  // Computed
  const hasPersonalizedRecommendations = computed(() => {
    return personalizedRecommendations.value.length > 0
  })

  const topCategories = computed(() => {
    return userPreferences.value
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  })

  // Actions
  const trackProductView = async (productId) => {
    try {
      await recommendationService.trackProductView(productId)
      console.log('✅ Product view tracked:', productId)
    } catch (error) {
      console.error('❌ Failed to track product view:', error)
      // Don't show error to user for tracking
    }
  }

  const fetchPersonalizedRecommendations = async (limit = 10) => {
    loading.value = true
    try {
      console.log('📊 Fetching personalized recommendations...')
      
      const response = await recommendationService.getPersonalizedRecommendations(limit)
      personalizedRecommendations.value = response.data.data || []
      
      console.log('✅ Personalized recommendations loaded:', personalizedRecommendations.value.length)
    } catch (error) {
      console.error('❌ Error fetching personalized recommendations:', error)
      
      // Fallback to popular products
      await fetchPopularProducts(limit)
    } finally {
      loading.value = false
    }
  }

  const fetchSimilarProducts = async (productId, limit = 6) => {
    similarLoading.value = true
    try {
      console.log('🔍 Fetching similar products for:', productId)
      
      const response = await recommendationService.getSimilarProducts(productId, limit)
      similarProducts.value = response.data.data || []
      
      console.log('✅ Similar products loaded:', similarProducts.value.length)
      return similarProducts.value
    } catch (error) {
      console.error('❌ Error fetching similar products:', error)
      similarProducts.value = []
      return []
    } finally {
      similarLoading.value = false
    }
  }

  const fetchPopularProducts = async (limit = 10) => {
    try {
      console.log('🔥 Fetching popular products...')
      
      const response = await recommendationService.getPopularProducts(limit)
      popularProducts.value = response.data.data || []
      
      // If no personalized recommendations, use popular as fallback
      if (personalizedRecommendations.value.length === 0) {
        personalizedRecommendations.value = popularProducts.value
      }
      
      console.log('✅ Popular products loaded:', popularProducts.value.length)
    } catch (error) {
      console.error('❌ Error fetching popular products:', error)
      popularProducts.value = []
    }
  }

  const fetchTrendingProducts = async (limit = 8) => {
    trendingLoading.value = true
    try {
      console.log('📈 Fetching trending products...')
      
      const response = await recommendationService.getTrendingProducts(limit)
      trendingProducts.value = response.data.data || []
      
      console.log('✅ Trending products loaded:', trendingProducts.value.length)
    } catch (error) {
      console.error('❌ Error fetching trending products:', error)
      trendingProducts.value = []
    } finally {
      trendingLoading.value = false
    }
  }

  const fetchUserPreferences = async () => {
    try {
      console.log('⚙️ Fetching user preferences...')
      
      const response = await recommendationService.getUserPreferences()
      userPreferences.value = response.data.data || []
      
      console.log('✅ User preferences loaded:', userPreferences.value.length)
    } catch (error) {
      console.error('❌ Error fetching user preferences:', error)
      userPreferences.value = []
    }
  }

  const updateUserPreference = async (categoryId, score) => {
    try {
      console.log('⚙️ Updating user preference:', { categoryId, score })
      
      const response = await recommendationService.updateUserPreference(categoryId, score)
      
      // Update local state
      const existingIndex = userPreferences.value.findIndex(p => p.categoryId === categoryId)
      if (existingIndex !== -1) {
        userPreferences.value[existingIndex] = response.data.data
      } else {
        userPreferences.value.push(response.data.data)
      }
      
      toast.success('Preference updated successfully')
      console.log('✅ User preference updated')
      
      // Refresh personalized recommendations
      await fetchPersonalizedRecommendations()
      
    } catch (error) {
      console.error('❌ Error updating user preference:', error)
      toast.error('Failed to update preference')
    }
  }

  const clearRecommendations = () => {
    personalizedRecommendations.value = []
    similarProducts.value = []
    popularProducts.value = []
    trendingProducts.value = []
    userPreferences.value = []
  }

  // ✅ Initialize recommendations for authenticated users
  const initializeRecommendations = async () => {
    try {
      await Promise.all([
        fetchPersonalizedRecommendations(),
        fetchTrendingProducts(),
        fetchUserPreferences()
      ])
    } catch (error) {
      console.error('❌ Error initializing recommendations:', error)
    }
  }

  return {
    // State
    personalizedRecommendations,
    similarProducts,
    popularProducts,
    trendingProducts,
    userPreferences,
    loading,
    similarLoading,
    trendingLoading,

    // Computed
    hasPersonalizedRecommendations,
    topCategories,

    // Actions
    trackProductView,
    fetchPersonalizedRecommendations,
    fetchSimilarProducts,
    fetchPopularProducts,
    fetchTrendingProducts,
    fetchUserPreferences,
    updateUserPreference,
    clearRecommendations,
    initializeRecommendations
  }
})