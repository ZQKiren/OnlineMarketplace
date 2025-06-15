// src/services/socket.service.js - FIXED REAL-TIME VERSION
import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = null
    this.eventCallbacks = new Map()
    this.queuedEmissions = []
  }

  // ✅ FIX: Auto-connect when token is available
  connect(token) {
    if (this.isConnected || this.socket) {
      console.log('🔌 Socket already connected')
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to socket...')
      
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

      this.socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        autoConnect: true
      })

      // Connection success
      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id)
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // Clear reconnect interval
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval)
          this.reconnectInterval = null
        }
        
        // Process queued emissions
        this.processQueuedEmissions()
        
        // Setup all event listeners
        this.setupEventListeners()
        
        resolve()
      })

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error)
        this.isConnected = false
        reject(error)
      })

      // Disconnect handling
      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        this.isConnected = false
        
        // Auto reconnect if not intentional disconnect
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token)
        }
      })

      // General error handling
      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error)
      })
    })
  }

  // ✅ FIX: Better reconnection logic
  scheduleReconnect(token) {
    if (this.reconnectInterval) return
    
    this.reconnectInterval = setInterval(() => {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('❌ Max reconnection attempts reached')
        clearInterval(this.reconnectInterval)
        this.reconnectInterval = null
        return
      }

      this.reconnectAttempts++
      console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`)
      
      this.disconnect()
      this.connect(token).catch(console.error)
    }, 2000 * this.reconnectAttempts)
  }

  // ✅ FIX: Process queued emissions when connected
  processQueuedEmissions() {
    while (this.queuedEmissions.length > 0) {
      const emission = this.queuedEmissions.shift()
      this.socket.emit(emission.event, emission.data)
    }
  }

  // ✅ FIX: Setup event listeners for real-time events
  setupEventListeners() {
    if (!this.socket) return

    // ✅ NEW MESSAGE EVENT
    this.socket.on('new-message', (message) => {
      console.log('🔔 Received new message:', message.id)
      this.triggerCallback('new-message', message)
    })

    // ✅ NEW CHAT NOTIFICATION
    this.socket.on('new-chat-notification', (data) => {
      console.log('🔔 New chat notification:', data)
      this.triggerCallback('new-chat-notification', data)
    })

    // ✅ MESSAGES READ EVENT
    this.socket.on('messages-read', (data) => {
      console.log('✅ Messages read:', data)
      this.triggerCallback('messages-read', data)
    })

    // ✅ USER TYPING EVENT
    this.socket.on('user-typing', (data) => {
      console.log('✏️ User typing:', data)
      this.triggerCallback('user-typing', data)
    })

    // ✅ USER ONLINE/OFFLINE EVENTS
    this.socket.on('user-online', (data) => {
      console.log('🟢 User online:', data.userId)
      this.triggerCallback('user-online', data)
    })

    this.socket.on('user-offline', (data) => {
      console.log('🔴 User offline:', data.userId)
      this.triggerCallback('user-offline', data)
    })

    // ✅ CHAT UPDATES
    this.socket.on('chat-updated', (data) => {
      console.log('🔄 Chat updated:', data)
      this.triggerCallback('chat-updated', data)
    })
  }

  // ✅ FIX: Safe emit with queue
  emit(event, data) {
    if (this.isConnected && this.socket) {
      console.log(`📤 Emitting ${event}:`, data)
      this.socket.emit(event, data)
    } else {
      console.log(`📋 Queueing ${event} (socket not connected)`)
      this.queuedEmissions.push({ event, data })
    }
  }

  // ✅ FIX: Improved event handling
  triggerCallback(event, data) {
    const callbacks = this.eventCallbacks.get(event) || []
    callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in ${event} callback:`, error)
      }
    })
  }

  // ✅ FIX: Better listener management
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, [])
    }
    this.eventCallbacks.get(event).push(callback)
    
    console.log(`👂 Added listener for ${event}`)
  }

  off(event, callback) {
    if (!this.eventCallbacks.has(event)) return
    
    const callbacks = this.eventCallbacks.get(event)
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
      console.log(`🚫 Removed listener for ${event}`)
    }
  }

  // ✅ CHAT ACTIONS
  joinChat(chatId) {
    console.log('🚪 Joining chat:', chatId)
    this.emit('join-chat', { chatId })
  }

  leaveChat(chatId) {
    console.log('🚪 Leaving chat:', chatId)
    this.emit('leave-chat', { chatId })
  }

  markRead(chatId) {
    console.log('✅ Marking as read:', chatId)
    this.emit('mark-read', { chatId })
  }

  setTyping(chatId, isTyping) {
    this.emit('typing', { chatId, isTyping })
  }

  // ✅ CONVENIENCE METHODS
  onNewMessage(callback) {
    this.on('new-message', callback)
  }

  onNewChatNotification(callback) {
    this.on('new-chat-notification', callback)
  }

  onMessagesRead(callback) {
    this.on('messages-read', callback)
  }

  onUserTyping(callback) {
    this.on('user-typing', callback)
  }

  onUserOnline(callback) {
    this.on('user-online', callback)
  }

  onUserOffline(callback) {
    this.on('user-offline', callback)
  }

  // ✅ FIX: Clean disconnect
  disconnect() {
    console.log('🔌 Disconnecting socket...')
    
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = null
    }
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.isConnected = false
    this.eventCallbacks.clear()
    this.queuedEmissions = []
  }

  // ✅ STATUS CHECKS
  getStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      queuedEmissions: this.queuedEmissions.length
    }
  }
}

// Export singleton instance
export default new SocketService()