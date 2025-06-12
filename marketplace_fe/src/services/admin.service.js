// src/services/admin.service.js
import api from './api'

export default {
  // Dashboard
  getDashboardStats() {
    return api.get('/admin/dashboard')
  },

  // User Management
  getUsers(params) {
    return api.get('/admin/users', { params })
  },

  getUserById(userId) {
    return api.get(`/admin/users/${userId}`)
  },

  createUser(userData) {
    return api.post('/admin/users', userData)
  },

  updateUser(userId, userData) {
    return api.patch(`/admin/users/${userId}`, userData)
  },

  deleteUser(userId) {
    return api.delete(`/admin/users/${userId}`)
  },

  blockUser(userId) {
    return api.post(`/admin/users/${userId}/block`)
  },

  unblockUser(userId) {
    return api.post(`/admin/users/${userId}/unblock`)
  },

  // Order Management
  getAllOrders(params) {
    return api.get('/admin/orders', { params })
  },

  getOrderStats() {
    return api.get('/admin/orders/stats')
  },

  updateOrderStatus(orderId, status) {
    return api.patch(`/admin/orders/${orderId}/status`, { status })
  },

  // Product Management
  getAllProducts(params) {
    return api.get('/admin/products', { params })
  },

  getProductStats() {
    return api.get('/admin/products/stats')
  },

  approveProduct(productId) {
    return api.post(`/admin/products/${productId}/approve`)
  },

  rejectProduct(productId, reason) {
    return api.post(`/admin/products/${productId}/reject`, { reason })
  },

  featureProduct(productId) {
    return api.post(`/admin/products/${productId}/feature`)
  },

  unfeatureProduct(productId) {
    return api.post(`/admin/products/${productId}/unfeature`)
  },

  bulkDeleteProducts(productIds) {
    return api.post('/admin/products/bulk-delete', { productIds })
  },

  bulkUpdateProductStatus(productIds, status) {
    return api.post('/admin/products/bulk-status', { productIds, status })
  },

  // Category Management - ADDED MISSING METHODS
  getAllCategories(params) {
    return api.get('/categories', { params }) // Use regular categories endpoint
  },

  getCategoryStats() {
    return api.get('/admin/categories/stats')
  },

  createCategory(categoryData) {
    return api.post('/categories', categoryData)
  },

  updateCategory(categoryId, categoryData) {
    return api.patch(`/categories/${categoryId}`, categoryData)
  },

  deleteCategory(categoryId) {
    return api.delete(`/categories/${categoryId}`)
  },

  // Review Management
  getAllReviews(params) {
    return api.get('/admin/reviews', { params })
  },

  approveReview(reviewId) {
    return api.post(`/admin/reviews/${reviewId}/approve`)
  },

  deleteReview(reviewId) {
    return api.delete(`/admin/reviews/${reviewId}`)
  },

  // Payment Management
  getPayments(params) {
    return api.get('/admin/payments', { params })
  },

  getPaymentStats() {
    return api.get('/admin/payments/stats')
  },

  refundPayment(paymentId, amount) {
    return api.post(`/admin/payments/${paymentId}/refund`, { amount })
  },

  // Reports & Analytics
  getRevenueReport(params) {
    return api.get('/admin/reports/revenue', { params })
  },

  getSalesReport(params) {
    return api.get('/admin/reports/sales', { params })
  },

  getUserActivityReport(params) {
    return api.get('/admin/reports/user-activity', { params })
  },

  getProductPerformanceReport(params) {
    return api.get('/admin/reports/product-performance', { params })
  },

  exportReport(type, params) {
    return api.get(`/admin/reports/export/${type}`, {
      params,
      responseType: 'blob'
    })
  },

  // System Settings
  getSystemSettings() {
    return api.get('/admin/settings')
  },

  updateSystemSettings(settings) {
    return api.patch('/admin/settings', settings)
  },

  // Notifications
  sendNotification(notification) {
    return api.post('/admin/notifications', notification)
  },

  sendBulkNotification(userIds, notification) {
    return api.post('/admin/notifications/bulk', {
      userIds,
      ...notification
    })
  },

  // Audit Logs
  getAuditLogs(params) {
    return api.get('/admin/audit-logs', { params })
  },

  // Statistics & Metrics
  getMetrics(period = 'week') {
    return api.get('/admin/metrics', {
      params: { period }
    })
  },

  getGrowthStats(params) {
    return api.get('/admin/stats/growth', { params })
  },

  getTopSellers(params) {
    return api.get('/admin/stats/top-sellers', { params })
  },

  getTopBuyers(params) {
    return api.get('/admin/stats/top-buyers', { params })
  },

  // Cache Management
  clearCache(type) {
    return api.post('/admin/cache/clear', { type })
  },

  // Backup
  createBackup() {
    return api.post('/admin/backup/create')
  },

  getBackups() {
    return api.get('/admin/backup/list')
  },

  restoreBackup(backupId) {
    return api.post(`/admin/backup/${backupId}/restore`)
  }
}