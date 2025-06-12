// src/services/auth.service.js
import api from './api'

export default {
  // Authentication endpoints
  login(credentials) {
    return api.post('/auth/login', credentials)
  },

  register(userData) {
    return api.post('/auth/register', userData)
  },

  // User profile endpoints (moved from auth to users)
  getProfile() {
    return api.get('/users/profile')  // ✅ Consistent with users controller
  },

  updateProfile(data) {
    return api.put('/users/profile', data)
  },

  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.put('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  changePassword(passwordData) {
    return api.put('/users/password', passwordData)
  }
}