// ✅ FIXED: notification.service.js
import api from './api'

export const notificationService = {
  // User endpoints
  getNotifications(params = {}) {
    console.log('🔍 Getting user notifications:', params)
    return api.get('/notifications', { params })
      .then(response => {
        console.log('✅ User notifications response:', response.data)
        return response.data // ✅ Extract .data from axios response
      })
  },

  getUnreadCount() {
    console.log('🔍 Getting unread count...')
    return api.get('/notifications/unread-count')
      .then(response => {
        console.log('✅ Unread count response:', response.data)
        return response.data // ✅ Extract .data
      })
  },

  markAsRead(notificationId) {
    console.log('🔍 Marking as read:', notificationId)
    return api.patch(`/notifications/${notificationId}/read`)
      .then(response => {
        console.log('✅ Mark as read response:', response.data)
        return response.data // ✅ Extract .data
      })
  },

  markAllAsRead() {
    console.log('🔍 Marking all as read...')
    return api.patch('/notifications/mark-all-read')
      .then(response => {
        console.log('✅ Mark all as read response:', response.data)
        return response.data // ✅ Extract .data
      })
  },

  // ✅ FIXED: Admin endpoints with proper data extraction
  createNotification(data) {
    console.log('🔍 Creating notification:', data)
    
    // Validate data before sending
    if (!data.title || !data.message || !data.type) {
      throw new Error('Missing required fields: title, message, type')
    }
    
    return api.post('/notifications', data)
      .then(response => {
        console.log('✅ Create notification response:', response.data)
        return response.data // ✅ Extract .data
      })
      .catch(error => {
        console.error('❌ Error creating notification:', error)
        console.error('❌ Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        })
        throw error
      })
  },

  // ✅ CRITICAL FIX: This was the main issue!
  getAllNotifications(params = {}) {
    console.log('🔍 Getting all notifications (admin):', params)
    
    // Clean up params - remove empty values
    const cleanParams = Object.keys(params).reduce((acc, key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        acc[key] = params[key]
      }
      return acc
    }, {})
    
    console.log('🔍 Clean params:', cleanParams)
    
    return api.get('/notifications/admin/all', { 
      params: cleanParams,
      timeout: 10000
    })
      .then(response => {
        console.log('✅ Get all notifications axios response:', response)
        console.log('✅ Response data:', response.data)
        
        // ✅ CRITICAL: Extract .data from axios response
        const result = response.data
        
        // ✅ Validate response structure
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid response format')
        }
        
        // ✅ Ensure data and meta exist
        const finalResult = {
          data: result.data || [],
          meta: result.meta || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 1
          }
        }
        
        console.log('✅ Final processed result:', finalResult)
        return finalResult
      })
      .catch(error => {
        console.error('❌ Error getting all notifications:', error)
        console.error('❌ Request config:', error.config)
        console.error('❌ Error response:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
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
    console.log('🔍 Deleting notification:', notificationId)
    
    if (!notificationId) {
      throw new Error('Notification ID is required')
    }
    
    return api.delete(`/notifications/${notificationId}`)
      .then(response => {
        console.log('✅ Delete notification response:', response.data)
        return response.data // ✅ Extract .data
      })
      .catch(error => {
        console.error('❌ Error deleting notification:', error)
        console.error('❌ Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        })
        throw error
      })
  },

  // ✅ NEW: Test endpoint to debug
  testConnection() {
    console.log('🔍 Testing API connection...')
    return api.get('/notifications/admin/all?page=1&limit=1')
      .then(response => {
        console.log('✅ Test connection successful:', response.data)
        return response.data
      })
      .catch(error => {
        console.error('❌ Test connection failed:', error)
        throw error
      })
  }
}

// ✅ Export default as well for compatibility
export default notificationService