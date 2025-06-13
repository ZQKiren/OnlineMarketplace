// src/services/order.service.js
import api from './api'

export default {
  // ✅ UPDATED: Create order with shipping address & payment method
  createOrder(orderData) {
    return api.post('/orders', orderData)
  },

  // ✅ UPDATED: Get user's own orders 
  getUserOrders(params) {
    return api.get('/orders', { params })
  },

  // ✅ NEW: Dedicated endpoint for user's order history
  getMyOrders(params) {
    return api.get('/orders/my-orders', { params })
  },

  // Get single order by ID
  getOrderById(id) {
    return api.get(`/orders/${id}`)
  },

  // Update order status (admin)
  updateOrderStatus(id, status) {
    return api.patch(`/orders/${id}/status`, { status })
  },

  // ✅ NEW: Complete COD payment when delivered (admin)
  completeCODPayment(orderId) {
    return api.post(`/orders/${orderId}/complete-cod-payment`)
  },

  // ✅ NEW: Cancel order
  cancelOrder(id) {
    return api.patch(`/orders/${id}/status`, { status: 'CANCELLED' })
  },

  // Admin endpoints
  getAllOrders(params) {
    return api.get('/admin/orders', { params })
  },

  // ✅ NEW: Get orders by payment method (admin analytics)
  getOrdersByPaymentMethod(paymentMethod, params) {
    return api.get('/admin/orders', { 
      params: { ...params, paymentMethod } 
    })
  },

  // ✅ NEW: Get COD orders that need attention (admin)
  getCODOrdersPending() {
    return api.get('/admin/orders', { 
      params: { paymentMethod: 'cod', status: 'SHIPPED' } 
    })
  },

  // ✅ NEW: Get order statistics (admin dashboard)
  getOrderStats(period = 'week') {
    return api.get('/admin/orders/stats', { params: { period } })
  },

  // ✅ NEW: Bulk update orders (admin)
  bulkUpdateOrders(orderIds, updates) {
    return api.patch('/admin/orders/bulk-update', { 
      orderIds, 
      updates 
    })
  }
}