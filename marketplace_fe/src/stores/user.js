// src/stores/user.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import userService from '@/services/user.service' // Changed from authService
import authService from '@/services/auth.service' // Keep for getProfile if needed

export const useUserStore = defineStore('user', () => {
  const profile = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Fetch user profile (can use authService or userService)
  async function fetchProfile() {
    loading.value = true
    error.value = null
    
    try {
      const response = await userService.getProfile()
      profile.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching profile:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update user profile
  async function updateProfile(data) {
    loading.value = true
    error.value = null
    
    try {
      const response = await userService.updateProfile(data)
      profile.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Upload avatar
  async function uploadAvatar(file) {
    loading.value = true
    error.value = null
    
    try {
      const response = await userService.uploadAvatar(file)
      if (profile.value) {
        profile.value.avatar = response.data.avatar
      }
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Change password - NEW
  async function changePassword(passwordData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await userService.changePassword(passwordData)
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get user's products - NEW
  async function getUserProducts() {
    loading.value = true
    error.value = null
    
    try {
      const response = await userService.getUserProducts()
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get user's orders - NEW
  async function getUserOrders() {
    loading.value = true
    error.value = null
    
    try {
      const response = await userService.getUserOrders()
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    profile,
    loading,
    error, // NEW
    fetchProfile,
    updateProfile,
    uploadAvatar,
    changePassword, // NEW
    getUserProducts, // NEW
    getUserOrders // NEW
  }
})