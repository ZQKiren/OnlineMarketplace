// src/services/chat.service.js - OPTIMIZED VERSION
import api from './api'

// ✅ OPTIMIZED: Cache for better performance
const chatCache = new Map()
const messageCache = new Map()

export default {
  // ✅ IMPROVED: Create/get chat with caching
  async createChat(data) {
    const { productId, sellerId } = data
    const cacheKey = `chat-${productId}-${sellerId}`
    
    // Check cache first
    if (chatCache.has(cacheKey)) {
      console.log('📋 Using cached chat:', cacheKey)
      return { data: chatCache.get(cacheKey) }
    }
    
    try {
      console.log('🔄 Creating/getting chat for product:', productId)
      
      const response = await api.post('/chat', {
        productId: productId.toString(),
        sellerId: sellerId.toString()
      })
      
      console.log('✅ Chat created/found:', response.data)
      
      // Cache the result
      chatCache.set(cacheKey, response.data)
      
      return response
    } catch (error) {
      console.error('❌ Error creating chat:', error.response?.data || error.message)
      
      // ✅ IMPROVED: Better error handling
      if (error.response?.status === 400) {
        throw new Error('Invalid product or seller information')
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to start chatting')
      } else if (error.response?.status === 403) {
        throw new Error('You cannot chat with yourself')
      } else {
        throw new Error('Unable to start chat. Please try again.')
      }
    }
  },

  // ✅ IMPROVED: Get user chats with pagination
  async getUserChats(page = 1, limit = 20) {
    try {
      console.log('📋 Fetching user chats, page:', page)
      
      const response = await api.get('/chat', { 
        params: { page, limit },
        timeout: 10000 // 10 second timeout
      })
      
      console.log('✅ Chats fetched:', response.data?.chats?.length || 0)
      return response
    } catch (error) {
      console.error('❌ Error fetching chats:', error.response?.data || error.message)
      
      // Return empty data structure on error
      return {
        data: {
          chats: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0
          }
        }
      }
    }
  },

  // ✅ IMPROVED: Get chat by ID with caching
  async getChatById(chatId) {
    const cacheKey = `chat-details-${chatId}`
    
    // Check cache first
    if (chatCache.has(cacheKey)) {
      console.log('📋 Using cached chat details:', chatId)
      return { data: chatCache.get(cacheKey) }
    }
    
    try {
      console.log('🔍 Fetching chat details:', chatId)
      
      const response = await api.get(`/chat/${chatId}`)
      
      // Cache the result
      chatCache.set(cacheKey, response.data)
      
      return response
    } catch (error) {
      console.error('❌ Error fetching chat:', error.response?.data || error.message)
      throw new Error('Chat not found or access denied')
    }
  },

  // ✅ OPTIMIZED: Get chat messages with caching
  async getChatMessages(chatId, page = 1, limit = 50) {
    const cacheKey = `messages-${chatId}-${page}-${limit}`
    
    // Check cache for first page only (recent messages)
    if (page === 1 && messageCache.has(cacheKey)) {
      const cachedData = messageCache.get(cacheKey)
      const cacheAge = Date.now() - cachedData.timestamp
      
      // Use cache if less than 30 seconds old
      if (cacheAge < 30000) {
        console.log('📋 Using cached messages:', chatId)
        return { data: cachedData.data }
      }
    }
    
    try {
      console.log('📨 Fetching messages for chat:', chatId, 'page:', page)
      
      const response = await api.get(`/chat/${chatId}/messages`, { 
        params: { page, limit },
        timeout: 8000 // 8 second timeout
      })
      
      const messages = response.data?.messages || response.data || []
      console.log('✅ Messages fetched:', messages.length)
      
      // Cache first page only
      if (page === 1) {
        messageCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        })
        
        // Clean old cache entries
        this._cleanMessageCache()
      }
      
      return response
    } catch (error) {
      console.error('❌ Error fetching messages:', error.response?.data || error.message)
      
      // Return empty structure on error
      return {
        data: {
          messages: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0
          }
        }
      }
    }
  },

  // ✅ OPTIMIZED: Send message with retry logic
  async sendMessage(chatId, content, type = 'TEXT', retries = 2) {
    if (!chatId || !content?.trim()) {
      throw new Error('Chat ID and message content are required')
    }
    
    const messageData = {
      chatId: chatId.toString(),
      content: content.trim(),
      type
    }
    
    let lastError = null
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`📤 Sending message (attempt ${attempt + 1}):`, content.substring(0, 50))
        
        const response = await api.post('/chat/messages', messageData, {
          timeout: 10000 // 10 second timeout
        })
        
        console.log('✅ Message sent successfully:', response.data?.id)
        
        // Invalidate message cache for this chat
        this._invalidateMessageCache(chatId)
        
        return response
      } catch (error) {
        lastError = error
        console.error(`❌ Send message attempt ${attempt + 1} failed:`, error.response?.data || error.message)
        
        // Don't retry on certain errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          break
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    // All retries failed
    if (lastError?.response?.status === 401) {
      throw new Error('Please log in to send messages')
    } else if (lastError?.response?.status === 403) {
      throw new Error('You do not have permission to send messages in this chat')
    } else if (lastError?.response?.status === 429) {
      throw new Error('Too many messages. Please wait a moment.')
    } else {
      throw new Error('Failed to send message. Please check your connection.')
    }
  },

  // ✅ IMPROVED: Mark messages as read
  async markMessagesAsRead(chatId) {
    if (!chatId) return
    
    try {
      console.log('✅ Marking messages as read for chat:', chatId)
      
      const response = await api.put(`/chat/${chatId}/read`, {}, {
        timeout: 5000 // 5 second timeout
      })
      
      // Invalidate message cache
      this._invalidateMessageCache(chatId)
      
      return response
    } catch (error) {
      console.error('❌ Error marking messages as read:', error.response?.data || error.message)
      // Don't throw error for this operation - it's not critical
    }
  },

  // ✅ IMPROVED: Archive chat
  async archiveChat(chatId) {
    if (!chatId) {
      throw new Error('Chat ID is required')
    }
    
    try {
      console.log('🗂️ Archiving chat:', chatId)
      
      const response = await api.put(`/chat/${chatId}/archive`, {}, {
        timeout: 8000 // 8 second timeout
      })
      
      // Clear from cache
      this._invalidateChatCache(chatId)
      this._invalidateMessageCache(chatId)
      
      return response
    } catch (error) {
      console.error('❌ Error archiving chat:', error.response?.data || error.message)
      
      if (error.response?.status === 404) {
        throw new Error('Chat not found')
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to archive this chat')
      } else {
        throw new Error('Failed to archive chat. Please try again.')
      }
    }
  },

  // ✅ NEW: Utility methods for cache management
  _cleanMessageCache() {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    
    for (const [key, value] of messageCache.entries()) {
      if (now - value.timestamp > maxAge) {
        messageCache.delete(key)
      }
    }
    
    // Keep cache size manageable
    if (messageCache.size > 50) {
      const entries = Array.from(messageCache.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      
      // Keep newest 30 entries
      messageCache.clear()
      entries.slice(0, 30).forEach(([key, value]) => {
        messageCache.set(key, value)
      })
    }
  },

  _invalidateMessageCache(chatId) {
    const keysToDelete = []
    for (const key of messageCache.keys()) {
      if (key.includes(`messages-${chatId}-`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => messageCache.delete(key))
  },

  _invalidateChatCache(chatId) {
    const keysToDelete = []
    for (const key of chatCache.keys()) {
      if (key.includes(chatId)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => chatCache.delete(key))
  },

  // ✅ NEW: Clear all cache (useful for logout)
  clearCache() {
    console.log('🧹 Clearing chat cache')
    chatCache.clear()
    messageCache.clear()
  },

  // ✅ NEW: Get cache status (for debugging)
  getCacheStatus() {
    return {
      chatCacheSize: chatCache.size,
      messageCacheSize: messageCache.size,
      chatCacheKeys: Array.from(chatCache.keys()),
      messageCacheKeys: Array.from(messageCache.keys())
    }
  }
}