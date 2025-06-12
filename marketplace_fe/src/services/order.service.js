// src/services/order.service.js
import api from './api'

export default {
  createOrder(orderData) {
    return api.post('/orders', orderData)
  },

  getUserOrders(params) {
    return api.get('/orders', { params })
  },

  getOrderById(id) {
    return api.get(`/orders/${id}`)
  },

  updateOrderStatus(id, status) {
    return api.patch(`/orders/${id}/status`, { status })
  },

  // Admin endpoints
  getAllOrders(params) {
    return api.get('/admin/orders', { params })
  }
}