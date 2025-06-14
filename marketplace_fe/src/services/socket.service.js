// src/services/socket.service.js
import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect() {
    const authStore = useAuthStore()
    
    if (!authStore.token || this.isConnected) {
      return
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000/chat'

    this.socket = io(socketUrl, {
      auth: {
        token: authStore.token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
    })

    this.setupEventListeners()
  }

  setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id)
      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Join user room for notifications
      const authStore = useAuthStore()
      if (authStore.user) {
        this.socket.emit('join-user', { userId: authStore.user.id })
      }
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      this.isConnected = false
      
      // Auto reconnect if not intentional disconnect
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++
          console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`)
          this.connect()
        }, 2000 * this.reconnectAttempts)
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.isConnected = false
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    // Custom events will be handled by individual components
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Event emitters
  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-chat', { chatId })
    }
  }

  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-chat', { chatId })
    }
  }

  sendMessage(chatId, content, type = 'TEXT') {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-message', { chatId, content, type })
    }
  }

  markRead(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark-read', { chatId })
    }
  }

  setTyping(chatId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { chatId, isTyping })
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback)
    }
  }

  onNewChatNotification(callback) {
    if (this.socket) {
      this.socket.on('new-chat-notification', callback)
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages-read', callback)
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback)
    }
  }

  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('user-online', callback)
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('user-offline', callback)
    }
  }

  // Remove listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }
}

// Export singleton instance
export default new SocketService()