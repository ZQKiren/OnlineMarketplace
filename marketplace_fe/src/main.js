// src/main.js - FIXED WITH PROPER INITIALIZATION ORDER
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Import Materialize CSS và JS
import 'materialize-css/dist/css/materialize.min.css'
import M from 'materialize-css/dist/js/materialize.min.js'

import 'material-design-icons/iconfont/material-icons.css'
import './assets/styles/main.scss'

// ✅ Import stores và socket service
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import socketService from './services/socket.service'

// Làm cho Materialize M object có thể truy cập globally
window.M = M

const app = createApp(App)
const pinia = createPinia()

// Setup plugins
app.use(pinia)
app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
})

// ✅ CRITICAL: Initialize auth BEFORE mounting app
const initializeApp = async () => {
  console.log('🚀 Starting app initialization...')
  
  try {
    // Initialize stores
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    
    // ✅ CRITICAL: Initialize auth store FIRST
    console.log('🔐 Initializing authentication...')
    await authStore.initialize()
    
    // ✅ Setup real-time features if user is authenticated
    if (authStore.isAuthenticated) {
      console.log('✅ User authenticated, setting up real-time features...')
      await setupRealTimeFeatures(authStore, chatStore)
    } else {
      console.log('🔐 User not authenticated, skipping real-time setup')
      // Still setup handlers for when user logs in later
      setupSocketHandlers(chatStore)
    }
    
    // ✅ Setup auth state watcher
    setupAuthWatcher(authStore, chatStore)
    
    console.log('🎉 App initialization complete!')
    
  } catch (error) {
    console.error('❌ App initialization error:', error)
  }
}

// ✅ Setup real-time features
const setupRealTimeFeatures = async (authStore, chatStore) => {
  try {
    console.log('🔌 Setting up real-time features...')
    
    // Setup socket event handlers first
    setupSocketHandlers(chatStore)
    
    // Connect to socket
    await socketService.connect(authStore.token)
    console.log('✅ Socket connected!')
    
    // Load chats after socket is connected
    console.log('📋 Loading chats...')
    await chatStore.fetchChats()
    console.log('✅ Chats loaded!')
    
  } catch (error) {
    console.error('❌ Real-time setup failed:', error)
    // Don't logout user just because socket failed
  }
}

// ✅ Setup socket event handlers
const setupSocketHandlers = (chatStore) => {
  console.log('🔌 Setting up socket event handlers...')
  
  // Clear existing handlers first
  socketService.eventCallbacks.clear()
  
  // Handle new messages
  socketService.onNewMessage((message) => {
    console.log('🔔 Main: New message received:', message.id)
    chatStore.handleNewMessage(message)
  })
  
  // Handle user online/offline status
  socketService.onUserOnline((data) => {
    console.log('🟢 Main: User online:', data.userId)
    chatStore.updateOnlineStatus(data.userId, true)
  })
  
  socketService.onUserOffline((data) => {
    console.log('🔴 Main: User offline:', data.userId)
    chatStore.updateOnlineStatus(data.userId, false)
  })
  
  // Handle messages read
  socketService.onMessagesRead((data) => {
    console.log('✅ Main: Messages read:', data.chatId)
    chatStore.markChatAsRead(data.chatId, data.userId)
  })
  
  // Handle typing indicators
  socketService.onUserTyping((data) => {
    chatStore.setUserTyping(data.chatId, data.userId, data.userName, data.isTyping)
  })
  
  console.log('✅ Socket handlers setup complete')
}

// ✅ Setup auth state watcher
const setupAuthWatcher = (authStore, chatStore) => {
  let previousAuthState = authStore.isAuthenticated
  let previousToken = authStore.token
  
  console.log('👁️ Setting up auth state watcher...')
  
  const watchAuthChanges = () => {
    const currentAuthState = authStore.isAuthenticated
    const currentToken = authStore.token
    
    // Check if auth state changed
    if (currentAuthState !== previousAuthState || currentToken !== previousToken) {
      console.log('🔄 Auth state changed:', {
        wasAuth: previousAuthState,
        nowAuth: currentAuthState,
        hasToken: !!currentToken,
        hasUser: !!authStore.user
      })
      
      if (currentAuthState && currentToken && !previousAuthState) {
        // User just logged in
        console.log('👋 User logged in, setting up real-time...')
        setupRealTimeFeatures(authStore, chatStore)
        
      } else if (!currentAuthState && previousAuthState) {
        // User just logged out
        console.log('👋 User logged out, disconnecting...')
        socketService.disconnect()
        chatStore.clearData()
      }
      
      previousAuthState = currentAuthState
      previousToken = currentToken
    }
  }
  
  // Check every 2 seconds
  setInterval(watchAuthChanges, 2000)
}

// ✅ CRITICAL: Wait for router to be ready, then initialize, then mount
router.isReady().then(async () => {
  console.log('🛣️ Router is ready')
  
  // Initialize app BEFORE mounting
  await initializeApp()
  
  // NOW mount the app
  app.mount('#app')
  console.log('🚀 App mounted successfully')
})

// ✅ Better cleanup and reconnection handling
window.addEventListener('beforeunload', () => {
  console.log('👋 App closing, cleaning up...')
  socketService.disconnect()
})

// ✅ Handle page visibility for reconnection
document.addEventListener('visibilitychange', () => {
  const authStore = useAuthStore()
  
  if (!document.hidden && authStore.isAuthenticated) {
    setTimeout(() => {
      if (!socketService.isConnected && authStore.token) {
        console.log('👁️ Page visible, reconnecting socket...')
        socketService.connect(authStore.token).then(() => {
          console.log('✅ Socket reconnected on visibility')
        }).catch(error => {
          console.error('❌ Visibility reconnection failed:', error)
        })
      }
    }, 1000)
  }
})

// ✅ Handle window focus
window.addEventListener('focus', () => {
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated && !socketService.isConnected && authStore.token) {
    console.log('🎯 Window focused, checking connection...')
    setTimeout(() => {
      socketService.connect(authStore.token).then(() => {
        console.log('✅ Socket reconnected on focus')
      }).catch(error => {
        console.error('❌ Focus reconnection failed:', error)
      })
    }, 500)
  }
})

// ✅ Handle online/offline events
window.addEventListener('online', () => {
  console.log('🌐 Back online!')
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated && authStore.token) {
    setTimeout(() => {
      socketService.connect(authStore.token).then(() => {
        console.log('✅ Socket reconnected after coming online')
      }).catch(error => {
        console.error('❌ Online reconnection failed:', error)
      })
    }, 2000)
  }
})

window.addEventListener('offline', () => {
  console.log('📶 Gone offline')
})

// ✅ Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue Error:', error)
  console.error('Component:', instance)  
  console.error('Info:', info)
}

console.log('🚀 Vue app setup complete')

// ✅ DEBUGGING: Expose for manual testing in dev mode
if (import.meta.env.DEV) {
  window.socketService = socketService
  window.getAuthStore = () => useAuthStore()
  window.getChatStore = () => useChatStore()
  
  console.log('🐛 Debug: Socket service available at window.socketService')
  console.log('🐛 Debug: Stores available at window.getAuthStore() and window.getChatStore()')
}