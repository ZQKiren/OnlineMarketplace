// src/stores/auth.js - UPDATED WITH SOCKET INTEGRATION
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/auth.service'
import socketService from '@/services/socket.service' // ✅ NEW: Import socket service
import router from '@/router'
import { useToast } from 'vue-toastification' // ✅ NEW: For notifications

export const useAuthStore = defineStore('auth', () => {
  const toast = useToast()
  
  // ✅ EXISTING STATE
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  
  // ✅ NEW: Socket state
  const socketConnected = ref(false)
  const loading = ref(false)

  // ✅ EXISTING COMPUTED
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  // ✅ NEW: Initialize auth on app start
  const initializeAuth = async () => {
    if (token.value) {
      try {
        console.log('🔐 Initializing auth with existing token...')
        
        // Get user profile first
        const response = await authService.getProfile()
        user.value = response.data
        
        console.log('✅ User profile loaded:', user.value.name)
        
        // Then connect socket
        await connectSocket()
        
      } catch (error) {
        console.error('❌ Auth initialization failed:', error)
        logout()
      }
    }
  }

  // ✅ NEW: Connect socket when authenticated
  const connectSocket = async () => {
    if (!token.value || socketConnected.value) return

    try {
      console.log('🔌 Connecting socket for user:', user.value?.id)
      await socketService.connect(token.value)
      socketConnected.value = true
      console.log('✅ Socket connected successfully')
    } catch (error) {
      console.error('❌ Socket connection failed:', error)
      socketConnected.value = false
    }
  }

  // ✅ NEW: Disconnect socket
  const disconnectSocket = () => {
    if (socketConnected.value) {
      console.log('🔌 Disconnecting socket')
      socketService.disconnect()
      socketConnected.value = false
    }
  }

  // ✅ UPDATED: Login with socket connection
  async function login(credentials) {
    loading.value = true
    try {
      console.log('🔐 Logging in...')
      
      const response = await authService.login(credentials)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      
      console.log('✅ Login successful:', user.value.name)
      
      // ✅ NEW: Connect socket after login
      await connectSocket()
      
      // ✅ NEW: Show success message
      if (toast) {
        toast.success(`Welcome back, ${user.value.name}!`)
      }
      
      router.push('/')
      return response
    } catch (error) {
      console.error('❌ Login failed:', error)
      
      // ✅ NEW: Show error message
      if (toast) {
        const message = error.response?.data?.message || 'Login failed'
        toast.error(message)
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  // ✅ UPDATED: Register with socket connection
  async function register(userData) {
    loading.value = true
    try {
      console.log('📝 Registering...')
      
      const response = await authService.register(userData)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', response.data.token)
      
      console.log('✅ Registration successful:', user.value.name)
      
      // ✅ NEW: Connect socket after registration
      await connectSocket()
      
      // ✅ NEW: Show success message
      if (toast) {
        toast.success(`Welcome to our platform, ${user.value.name}!`)
      }
      
      router.push('/')
      return response
    } catch (error) {
      console.error('❌ Registration failed:', error)
      
      // ✅ NEW: Show error message
      if (toast) {
        const message = error.response?.data?.message || 'Registration failed'
        toast.error(message)
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  // ✅ UPDATED: Logout with socket disconnection
  function logout() {
    console.log('🔐 Logging out...')
    
    // ✅ NEW: Disconnect socket first
    disconnectSocket()
    
    // ✅ EXISTING: Clear auth data
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    
    console.log('✅ Logout successful')
    
    // ✅ NEW: Show logout message
    if (toast) {
      toast.info('You have been logged out')
    }
    
    router.push('/login')
  }

  // ✅ UPDATED: Fetch profile (renamed from existing)
  async function fetchProfile() {
    if (!token.value) return
    
    try {
      const response = await authService.getProfile()
      user.value = response.data
      
      // ✅ NEW: Connect socket if not connected
      if (!socketConnected.value) {
        await connectSocket()
      }
      
      return response
    } catch (error) {
      console.error('❌ Fetch profile failed:', error)
      logout()
      throw error
    }
  }

  // ✅ NEW: Update profile method
  const updateProfile = async (profileData) => {
    loading.value = true
    try {
      const response = await authService.updateProfile(profileData)
      user.value = response.data
      
      if (toast) {
        toast.success('Profile updated successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ Profile update failed:', error)
      
      if (toast) {
        const message = error.response?.data?.message || 'Profile update failed'
        toast.error(message)
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  // ✅ NEW: Change password method
  const changePassword = async (passwordData) => {
    loading.value = true
    try {
      const response = await authService.changePassword(passwordData)
      
      if (toast) {
        toast.success('Password changed successfully')
      }
      
      return response
    } catch (error) {
      console.error('❌ Password change failed:', error)
      
      if (toast) {
        const message = error.response?.data?.message || 'Password change failed'
        toast.error(message)
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  // ✅ NEW: Socket status methods
  const getSocketStatus = () => {
    return {
      connected: socketConnected.value,
      ...socketService.getStatus()
    }
  }

  // ✅ NEW: Force reconnect socket
  const reconnectSocket = async () => {
    if (!token.value) return
    
    console.log('🔄 Manually reconnecting socket...')
    disconnectSocket()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await connectSocket()
  }

  return {
    // ✅ EXISTING STATE
    user,
    token,
    isAuthenticated,
    isAdmin,
    
    // ✅ NEW STATE
    socketConnected,
    loading,
    
    // ✅ EXISTING METHODS (updated)
    login,
    register,
    logout,
    fetchProfile,
    
    // ✅ NEW METHODS
    initializeAuth,
    connectSocket,
    disconnectSocket,
    updateProfile,
    changePassword,
    getSocketStatus,
    reconnectSocket,
  }
})