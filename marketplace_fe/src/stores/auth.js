// src/stores/auth.js - FINAL FIX
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/auth.service'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const isInitialized = ref(false) // ✅ NEW: Track if store is initialized
  const isLoading = ref(false)

  // ✅ FIXED: Authentication check that doesn't cause redirects during initialization
  const isAuthenticated = computed(() => {
    // If we have a token, consider user authenticated even if profile isn't loaded yet
    return !!token.value
  })

  // ✅ NEW: Check if user data is fully loaded
  const isUserLoaded = computed(() => {
    return !!user.value && isInitialized.value
  })

  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  // ✅ NEW: Initialize store on app startup
  const initialize = async () => {
    if (isInitialized.value) return
    
    console.log('🔐 Initializing auth store...')
    
    // If we have a token, try to load user profile
    if (token.value) {
      try {
        isLoading.value = true
        await fetchProfile()
        console.log('✅ Auth initialization successful:', user.value?.name)
      } catch (error) {
        console.error('❌ Auth initialization failed:', error)
        // Only logout if it's a clear auth error
        if (error.response?.status === 401 || error.response?.status === 403) {
          logout()
        }
      } finally {
        isLoading.value = false
      }
    }
    
    isInitialized.value = true
    console.log('✅ Auth store initialized')
  }

  async function login(credentials) {
    try {
      console.log('🔐 Logging in...')
      const response = await authService.login(credentials)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      isInitialized.value = true
      
      console.log('✅ Login successful:', user.value.name)
      router.push('/')
      return response
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  async function register(userData) {
    try {
      console.log('📝 Registering...')
      const response = await authService.register(userData)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      isInitialized.value = true
      
      console.log('✅ Registration successful:', user.value.name)
      router.push('/')
      return response
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  function logout() {
    console.log('🔐 Logging out...')
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    isInitialized.value = false
    
    console.log('✅ Logout successful')
    router.push('/login')
  }

  async function fetchProfile() {
    if (!token.value) {
      console.log('⚠️ No token available for profile fetch')
      return
    }
    
    try {
      console.log('👤 Fetching user profile...')
      const response = await authService.getProfile()
      user.value = response.data
      console.log('✅ Profile loaded:', user.value.name)
      return response
    } catch (error) {
      console.error('❌ Profile fetch failed:', error)
      throw error
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
    initialize,
    login,
    register,
    logout,
    fetchProfile,
  }
})