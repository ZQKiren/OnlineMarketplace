// src/services/payment.service.js
import api from './api'

export default {
  createPaymentIntent(data) {
    return api.post('/payments/create-payment-intent', data)
  },

  confirmPayment(paymentIntentId) {
    return api.post('/payments/confirm', { paymentIntentId })
  }
}