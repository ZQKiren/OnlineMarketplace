// src/services/auth.service.js - COMPLETE VERSION WITH BLOCKED USER HANDLING
import api from './api'

export default {
  // Authentication endpoints
  async login(credentials) {
    try {
      console.log('🔐 Auth Service: Attempting login for:', credentials.email)
      const response = await api.post('/auth/login', credentials)
      
      // ✅ Check if user is blocked in response
      if (response.data.user?.isBlocked) {
        console.log('🚫 Auth Service: User is blocked in login response')
        const error = new Error('Your account has been blocked. Please contact support.')
        error.response = {
          status: 403,
          data: {
            message: 'Your account has been blocked. Please contact support.',
            blocked: true
          }
        }
        throw error
      }
      
      console.log('✅ Auth Service: Login successful for:', response.data.user.email)
      return response
    } catch (error) {
      // ✅ Enhanced error handling for blocked users
      if (error.response?.status === 403) {
        console.log('🚫 Auth Service: Login blocked:', error.response.data?.message)
        
        // Ensure blocked flag is set
        if (!error.response.data) {
          error.response.data = {}
        }
        error.response.data.blocked = true
      }
      
      console.error('❌ Auth Service: Login failed:', error.message)
      throw error
    }
  },

  async register(userData) {
    try {
      console.log('📝 Auth Service: Attempting registration for:', userData.email)
      const response = await api.post('/auth/register', userData)
      
      // ✅ Check if newly registered user is somehow blocked
      if (response.data.user?.isBlocked) {
        console.log('🚫 Auth Service: New user is blocked in registration response')
        const error = new Error('Account registration failed. Please contact support.')
        error.response = {
          status: 403,
          data: {
            message: 'Account registration failed. Please contact support.',
            blocked: true
          }
        }
        throw error
      }
      
      console.log('✅ Auth Service: Registration successful for:', response.data.user.email)
      return response
    } catch (error) {
      console.error('❌ Auth Service: Registration failed:', error.message)
      throw error
    }
  },

  // User profile endpoints (moved from auth to users)
  async getProfile() {
    try {
      console.log('👤 Auth Service: Fetching user profile')
      const response = await api.get('/users/profile')
      
      // ✅ Check if user became blocked
      if (response.data.isBlocked) {
        console.log('🚫 Auth Service: User is blocked in profile response')
        const error = new Error('Your account has been blocked. Please contact support.')
        error.response = {
          status: 403,
          data: {
            message: 'Your account has been blocked. Please contact support.',
            blocked: true
          }
        }
        throw error
      }
      
      console.log('✅ Auth Service: Profile loaded for:', response.data.email)
      return response
    } catch (error) {
      // ✅ Handle blocked user in profile fetch
      if (error.response?.status === 403) {
        console.log('🚫 Auth Service: Profile fetch blocked:', error.response.data?.message)
        
        if (!error.response.data) {
          error.response.data = {}
        }
        error.response.data.blocked = true
      }
      
      console.error('❌ Auth Service: Profile fetch failed:', error.message)
      throw error
    }
  },

  updateProfile(data) {
    console.log('📝 Auth Service: Updating profile')
    return api.put('/users/profile', data)
  },

  uploadAvatar(file) {
    console.log('📷 Auth Service: Uploading avatar')
    const formData = new FormData()
    formData.append('avatar', file)
    return api.put('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  changePassword(passwordData) {
    console.log('🔑 Auth Service: Changing password')
    return api.put('/users/password', passwordData)
  }
}