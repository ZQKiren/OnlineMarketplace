// src/services/socket.service.js - DEBUG VERSION
import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.eventCallbacks = new Map()
    this.debugMode = true // ✅ Enable debug logging
  }

  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`🔌 Socket: ${message}`, data)
      } else {
        console.log(`🔌 Socket: ${message}`)
      }
    }
  }

  // ✅ Connect to socket server with better error handling
  async connect(token) {
    if (this.isConnected) {
      this.log('Already connected, skipping...')
      return Promise.resolve()
    }

    if (!token) {
      this.log('❌ No token provided, cannot connect')
      return Promise.reject(new Error('No token provided'))
    }

    return new Promise((resolve, reject) => {
      this.log('Connecting to socket server...', { token: token.substring(0, 20) + '...' })
      
      // ✅ Make sure to use correct URL format
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
      this.log('Socket URL:', socketUrl)

      this.socket = io(socketUrl, {
        auth: { 
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 15000,
        forceNew: true,
        autoConnect: true
      })

      // Connection success
      this.socket.on('connect', () => {
        this.log('✅ Connected successfully!', { id: this.socket.id })
        this.isConnected = true
        this.setupEventListeners()
        resolve()
      })

      // Connection error
      this.socket.on('connect_error', (error) => {
        this.log('❌ Connection error:', error)
        this.isConnected = false
        reject(error)
      })

      // Disconnect handling
      this.socket.on('disconnect', (reason) => {
        this.log('❌ Disconnected:', reason)
        this.isConnected = false
        
        // Auto-reconnect after 3 seconds if not manual disconnect
        if (reason !== 'io client disconnect') {
          setTimeout(() => {
            this.log('🔄 Auto-reconnecting...')
            this.connect(token).catch(err => {
              this.log('❌ Auto-reconnect failed:', err)
            })
          }, 3000)
        }
      })

      // General error
      this.socket.on('error', (error) => {
        this.log('❌ Socket error:', error)
      })

      // ✅ Listen for ANY event for debugging
      this.socket.onAny((event, data) => {
        this.log(`📥 Received event: ${event}`, data)
      })
    })
  }

  // ✅ Setup socket event listeners with debug
  setupEventListeners() {
    if (!this.socket) {
      this.log('❌ Cannot setup listeners - no socket')
      return
    }

    this.log('Setting up event listeners...')

    // New message event
    this.socket.on('new-message', (message) => {
      this.log('🔔 NEW MESSAGE received:', message)
      this.triggerCallback('new-message', message)
    })

    // User online/offline events
    this.socket.on('user-online', (data) => {
      this.log('🟢 USER ONLINE:', data)
      this.triggerCallback('user-online', data)
    })

    this.socket.on('user-offline', (data) => {
      this.log('🔴 USER OFFLINE:', data)
      this.triggerCallback('user-offline', data)
    })

    // Messages read event
    this.socket.on('messages-read', (data) => {
      this.log('✅ MESSAGES READ:', data)
      this.triggerCallback('messages-read', data)
    })

    // User typing event
    this.socket.on('user-typing', (data) => {
      this.log('✏️ USER TYPING:', data)
      this.triggerCallback('user-typing', data)
    })

    // New chat notification
    this.socket.on('new-chat-notification', (data) => {
      this.log('🔔 NEW CHAT NOTIFICATION:', data)
      this.triggerCallback('new-chat-notification', data)
    })

    this.log('✅ Event listeners setup complete')
  }

  // ✅ Trigger callbacks for events
  triggerCallback(event, data) {
    const callbacks = this.eventCallbacks.get(event) || []
    this.log(`Triggering ${callbacks.length} callbacks for event: ${event}`)
    
    callbacks.forEach((callback, index) => {
      try {
        callback(data)
        this.log(`✅ Callback ${index + 1} executed for ${event}`)
      } catch (error) {
        this.log(`❌ Error in callback ${index + 1} for ${event}:`, error)
      }
    })
  }

  // ✅ Add event listener
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, [])
    }
    this.eventCallbacks.get(event).push(callback)
    this.log(`Added listener for event: ${event}`, { total: this.eventCallbacks.get(event).length })
  }

  // ✅ Remove event listener
  off(event, callback) {
    if (!this.eventCallbacks.has(event)) return
    
    const callbacks = this.eventCallbacks.get(event)
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
      this.log(`Removed listener for event: ${event}`)
    }
  }

  // ✅ Convenience methods for main events
  onNewMessage(callback) {
    this.on('new-message', callback)
  }

  onUserOnline(callback) {
    this.on('user-online', callback)
  }

  onUserOffline(callback) {
    this.on('user-offline', callback)
  }

  onMessagesRead(callback) {
    this.on('messages-read', callback)
  }

  onUserTyping(callback) {
    this.on('user-typing', callback)
  }

  onNewChatNotification(callback) {
    this.on('new-chat-notification', callback)
  }

  // ✅ Emit events to server with debug
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.log(`📤 EMITTING ${event}:`, data)
      this.socket.emit(event, data)
    } else {
      this.log(`❌ Cannot emit ${event} - socket not connected`)
      this.log('Socket state:', { 
        hasSocket: !!this.socket, 
        isConnected: this.isConnected 
      })
    }
  }

  // ✅ Chat-specific methods with debug
  joinChat(chatId) {
    this.log('🚪 JOINING CHAT:', chatId)
    this.emit('join-chat', { chatId })
  }

  leaveChat(chatId) {
    this.log('🚪 LEAVING CHAT:', chatId)
    this.emit('leave-chat', { chatId })
  }

  markRead(chatId) {
    this.log('✅ MARKING AS READ:', chatId)
    this.emit('mark-read', { chatId })
  }

  setTyping(chatId, isTyping) {
    this.log('✏️ SETTING TYPING:', { chatId, isTyping })
    this.emit('typing', { chatId, isTyping })
  }

  // ✅ Test connection
  testConnection() {
    this.log('🧪 TESTING CONNECTION...')
    this.emit('ping', { timestamp: Date.now() })
  }

  // ✅ Disconnect socket
  disconnect() {
    this.log('Disconnecting socket...')
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.isConnected = false
    this.eventCallbacks.clear()
    this.log('✅ Disconnected and cleaned up')
  }

  // ✅ Get detailed status
  getStatus() {
    const status = {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      hasSocket: !!this.socket,
      eventListeners: Object.fromEntries(
        Array.from(this.eventCallbacks.entries()).map(([event, callbacks]) => [
          event, 
          callbacks.length
        ])
      )
    }
    
    this.log('Current status:', status)
    return status
  }

  // ✅ Enable/disable debug mode
  setDebugMode(enabled) {
    this.debugMode = enabled
    this.log(`Debug mode ${enabled ? 'enabled' : 'disabled'}`)
  }
}

// Export singleton instance
export default new SocketService()