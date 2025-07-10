// src/stores/auth.js - COMPLETE VERSION WITH BLOCKED USER HANDLING
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/auth.service'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const isInitialized = ref(false)
  const isLoading = ref(false)

  // ✅ Enhanced authentication check - must not be blocked
  const isAuthenticated = computed(() => {
    return !!token.value && !user.value?.isBlocked
  })

  // ✅ Check if user data is fully loaded and not blocked
  const isUserLoaded = computed(() => {
    return !!user.value && isInitialized.value && !user.value?.isBlocked
  })

  // ✅ Admin check - must be admin and not blocked
  const isAdmin = computed(() => user.value?.role === 'ADMIN' && !user.value?.isBlocked)

  // ✅ Check if current user is blocked
  const isBlocked = computed(() => user.value?.isBlocked === true)

  // ✅ Initialize store on app startup
  const initialize = async () => {
    if (isInitialized.value) return
    
    // If we have a token, try to load user profile
    if (token.value) {
      try {
        isLoading.value = true
        await fetchProfile()
        
        // Check if user is blocked after profile fetch
        if (user.value?.isBlocked) {
          logout()
          return
        }
        
      } catch (error) {
        // Check if it's a blocked user error
        if (error.response?.status === 403 && error.response?.data?.blocked) {
          logout()
          return
        }
        
        // Only logout if it's a clear auth error
        if (error.response?.status === 401) {
          logout()
        }
      } finally {
        isLoading.value = false
      }
    }
    
    isInitialized.value = true
  }

  async function login(credentials) {
    try {
      const response = await authService.login(credentials)
      
      // ✅ Check if user is blocked in response
      if (response.data.user?.isBlocked) {
        throw new Error('Your account has been blocked. Please contact support.')
      }
      
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      isInitialized.value = true
      
      router.push('/')
      return response
    } catch (error) {
      // ✅ Handle blocked user during login - don't set any auth data
      if (error.response?.status === 403 && error.response?.data?.blocked) {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
      }
      
      throw error
    }
  }

  async function register(userData) {
    try {
      const response = await authService.register(userData)
      
      // ✅ Check if newly registered user is somehow blocked
      if (response.data.user?.isBlocked) {
        throw new Error('Account registration failed. Please contact support.')
      }
      
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      isInitialized.value = true
      
      router.push('/')
      return response
    } catch (error) {
      throw error
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    isInitialized.value = false
    
    // Only redirect if not already on auth pages
    const currentPath = router.currentRoute.value.path
    if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
      router.push('/login')
    }
  }

  async function fetchProfile() {
    if (!token.value) {
      return
    }
    
    try {
      const response = await authService.getProfile()
      
      // ✅ Check if user became blocked
      if (response.data.isBlocked) {
        logout()
        throw new Error('Your account has been blocked. Please contact support.')
      }
      
      user.value = response.data
      return response
    } catch (error) {
      // ✅ Handle blocked user in profile fetch
      if (error.response?.status === 403 && error.response?.data?.blocked) {
        logout()
        return null
      }
      
      throw error
    }
  }

  // ✅ NEW: Force check current user block status
  const checkBlockedStatus = async () => {
    if (!token.value || !user.value) return false
    
    try {
      await fetchProfile()
      return user.value?.isBlocked || false
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.blocked) {
        return true
      }
      return false
    }
  }

  // ✅ NEW: Force logout if user is blocked
  const forceLogoutIfBlocked = () => {
    if (user.value?.isBlocked) {
      logout()
      return true
    }
    return false
  }

  // ✅ NEW: Refresh user data periodically to check block status
  const refreshUserData = async () => {
    if (!isAuthenticated.value) return
    
    try {
      await fetchProfile()
    } catch (error) {
      // If blocked, logout will be handled in fetchProfile
    }
  }

  return {
    user,
    token,
    isInitialized,
    isLoading,
    isAuthenticated,
    isUserLoaded,
    isAdmin,
    isBlocked,
    initialize,
    login,
    register,
    logout,
    fetchProfile,
    checkBlockedStatus,
    forceLogoutIfBlocked,
    refreshUserData
  }
})