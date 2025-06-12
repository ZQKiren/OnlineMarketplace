// src/services/user.service.js
import api from './api'

export default {
  // Get current user profile
  getProfile() {
    return api.get('/users/profile')
  },

  // Update user profile
  updateProfile(userData) {
    return api.put('/users/profile', userData)
  },

  // Upload avatar
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    return api.put('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Change password
  changePassword(passwordData) {
    return api.put('/users/password', passwordData)
  },

  // Get user's products
  getUserProducts() {
    return api.get('/users/products')
  },

  // Get user's orders
  getUserOrders() {
    return api.get('/users/orders')
  },

  // Admin only: Get user by ID
  getUserById(id) {
    return api.get(`/users/${id}`)
  },

  // Admin only: Delete user
  deleteUser(id) {
    return api.delete(`/users/${id}`)
  }
}