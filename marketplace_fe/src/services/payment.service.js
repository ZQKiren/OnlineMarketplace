// src/services/payment.service.js
import api from './api'

export default {
  // Existing methods
  createPaymentIntent(data) {
    return api.post('/payments/create-payment-intent', data)
  },

  confirmPayment(paymentIntentId) {
    return api.post('/payments/confirm', { paymentIntentId })
  },

  // ✅ NEW COD METHODS
  
  // Get payment methods statistics (admin)
  getPaymentMethodsStats() {
    return api.get('/payments/methods-stats')
  },

  // Get pending COD orders (admin) 
  getPendingCODOrders() {
    return api.get('/payments/pending-cod-orders')
  },

  // Process refund (admin)
  processRefund(paymentId, amount) {
    return api.post(`/payments/${paymentId}/refund`, { amount })
  },

  // Get payment history for reports
  getPaymentHistory(params) {
    return api.get('/payments/history', { params })
  },

  // Get payment by order ID
  getPaymentByOrderId(orderId) {
    return api.get(`/payments/order/${orderId}`)
  }
}