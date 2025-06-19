// notification.service.js
import api from './api'

export const notificationService = {
  // User endpoints
  getNotifications(params = {}) {
    return api.get('/notifications', { params })
      .then(response => response.data)
  },

  getUnreadCount() {
    return api.get('/notifications/unread-count')
      .then(response => response.data)
  },

  markAsRead(notificationId) {
    return api.patch(`/notifications/${notificationId}/read`)
      .then(response => response.data)
  },

  markAllAsRead() {
    return api.patch('/notifications/mark-all-read')
      .then(response => response.data)
  },

  // Admin endpoints
  createNotification(data) {
    // Validate data before sending
    if (!data.title || !data.message || !data.type) {
      throw new Error('Missing required fields: title, message, type')
    }
    
    return api.post('/notifications', data)
      .then(response => response.data)
      .catch(error => {
        console.error('Error creating notification:', error.response?.data || error.message)
        throw error
      })
  },

  getAllNotifications(params = {}) {
    // Clean up params - remove empty values
    const cleanParams = Object.keys(params).reduce((acc, key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        acc[key] = params[key]
      }
      return acc
    }, {})
    
    return api.get('/notifications/admin/all', { 
      params: cleanParams,
      timeout: 10000
    })
      .then(response => {
        const result = response.data
        
        // Validate response structure
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid response format')
        }
        
        // Ensure data and meta exist
        return {
          data: result.data || [],
          meta: result.meta || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 1
          }
        }
      })
      .catch(error => {
        console.error('Error getting notifications:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        })
        
        // Re-throw with more info
        const enhancedError = new Error(`API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`)
        enhancedError.originalError = error
        enhancedError.status = error.response?.status
        enhancedError.data = error.response?.data
        throw enhancedError
      })
  },

  deleteNotification(notificationId) {
    if (!notificationId) {
      throw new Error('Notification ID is required')
    }
    
    return api.delete(`/notifications/${notificationId}`)
      .then(response => response.data)
      .catch(error => {
        console.error('Error deleting notification:', error.response?.data || error.message)
        throw error
      })
  },

  // Test endpoint for debugging
  testConnection() {
    return api.get('/notifications/admin/all?page=1&limit=1')
      .then(response => response.data)
      .catch(error => {
        console.error('Test connection failed:', error.response?.data || error.message)
        throw error
      })
  }
}

export default notificationService