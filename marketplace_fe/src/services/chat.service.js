// src/services/chat.service.js
import api from './api'

export default {
  // Chat endpoints
  createChat(productId, sellerId) {
    return api.post('/chat', { productId, sellerId })
  },

  getUserChats(page = 1, limit = 20) {
    return api.get('/chat', { params: { page, limit } })
  },

  getChatById(chatId) {
    return api.get(`/chat/${chatId}`)
  },

  getChatMessages(chatId, page = 1, limit = 50) {
    return api.get(`/chat/${chatId}/messages`, { params: { page, limit } })
  },

  sendMessage(chatId, content, type = 'TEXT') {
    return api.post('/chat/messages', { chatId, content, type })
  },

  markMessagesAsRead(chatId) {
    return api.put(`/chat/${chatId}/read`)
  },

  archiveChat(chatId) {
    return api.put(`/chat/${chatId}/archive`)
  }
}



