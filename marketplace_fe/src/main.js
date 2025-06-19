// src/main.js - ENHANCED WITH NOTIFICATION SYSTEM
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Import dayjs with plugins
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/vi'

// Setup dayjs plugins
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.locale('vi')

// Import Materialize CSS và JS
import 'materialize-css/dist/css/materialize.min.css'
import M from 'materialize-css/dist/js/materialize.min.js'

import 'material-design-icons/iconfont/material-icons.css'
import './assets/styles/main.scss'

// Import stores và services
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useNotificationStore } from '@/stores/notification'
import socketService from './services/socket.service'

// Make Materialize M object available globally
window.M = M
window.dayjs = dayjs

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

// Make dayjs available in all components
app.config.globalProperties.$dayjs = dayjs

// Initialize app with notification system
const initializeApp = async () => {
  try {
    // Initialize stores
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    const notificationStore = useNotificationStore()
    
    // Initialize auth store first
    await authStore.initialize()
    
    // Setup real-time features if user is authenticated
    if (authStore.isAuthenticated) {
      await setupRealTimeFeatures(authStore, chatStore, notificationStore)
    } else {
      // Setup handlers for when user logs in later
      setupSocketHandlers(chatStore, notificationStore)
    }
    
    // Setup auth state watcher
    setupAuthWatcher(authStore, chatStore, notificationStore)
    
  } catch (error) {
    console.error('App initialization error:', error)
  }
}

// Setup real-time features with notifications
const setupRealTimeFeatures = async (authStore, chatStore, notificationStore) => {
  try {
    // Setup socket event handlers first
    setupSocketHandlers(chatStore, notificationStore)
    
    // Connect to chat socket
    await socketService.connect(authStore.token)
    
    // Connect to notification socket
    notificationStore.connectSocket(authStore.token)
    
    // Load data after sockets are connected
    await Promise.all([
      chatStore.fetchChats(),
      notificationStore.fetchNotifications(),
      notificationStore.fetchUnreadCount()
    ])
    
  } catch (error) {
    console.error('Real-time setup failed:', error)
  }
}

// Setup socket event handlers with notifications
const setupSocketHandlers = (chatStore, notificationStore) => {
  // Clear existing handlers first
  socketService.eventCallbacks.clear()
  
  // Chat handlers
  socketService.onNewMessage((message) => {
    chatStore.handleNewMessage(message)
  })
  
  socketService.onUserOnline((data) => {
    chatStore.updateOnlineStatus(data.userId, true)
  })
  
  socketService.onUserOffline((data) => {
    chatStore.updateOnlineStatus(data.userId, false)
  })
  
  socketService.onMessagesRead((data) => {
    chatStore.markChatAsRead(data.chatId, data.userId)
  })
  
  socketService.onUserTyping((data) => {
    chatStore.setUserTyping(data.chatId, data.userId, data.userName, data.isTyping)
  })
}

// Setup auth state watcher with notifications
const setupAuthWatcher = (authStore, chatStore, notificationStore) => {
  let previousAuthState = authStore.isAuthenticated
  let previousToken = authStore.token
  
  const watchAuthChanges = () => {
    const currentAuthState = authStore.isAuthenticated
    const currentToken = authStore.token
    
    // Check if auth state changed
    if (currentAuthState !== previousAuthState || currentToken !== previousToken) {
      
      if (currentAuthState && currentToken && !previousAuthState) {
        // User just logged in
        setupRealTimeFeatures(authStore, chatStore, notificationStore)
        
      } else if (!currentAuthState && previousAuthState) {
        // User just logged out
        socketService.disconnect()
        chatStore.clearData()
        notificationStore.disconnectSocket()
        notificationStore.clearNotifications()
      }
      
      previousAuthState = currentAuthState
      previousToken = currentToken
    }
  }
  
  // Check every 2 seconds
  setInterval(watchAuthChanges, 2000)
}

// Wait for router to be ready, then initialize, then mount
router.isReady().then(async () => {
  await initializeApp()
  app.mount('#app')
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  socketService.disconnect()
  const notificationStore = useNotificationStore()
  notificationStore.disconnectSocket()
})

// Handle page visibility for reconnection
document.addEventListener('visibilitychange', () => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  
  if (!document.hidden && authStore.isAuthenticated) {
    setTimeout(() => {
      // Reconnect chat socket
      if (!socketService.isConnected && authStore.token) {
        socketService.connect(authStore.token).catch(error => {
          console.error('Chat visibility reconnection failed:', error)
        })
      }
      
      // Reconnect notification socket
      if (!notificationStore.isConnected && authStore.token) {
        notificationStore.connectSocket(authStore.token)
      }
    }, 1000)
  }
})

// Handle window focus
window.addEventListener('focus', () => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  
  if (authStore.isAuthenticated && authStore.token) {
    setTimeout(() => {
      // Check chat socket
      if (!socketService.isConnected) {
        socketService.connect(authStore.token).catch(error => {
          console.error('Chat focus reconnection failed:', error)
        })
      }
      
      // Check notification socket
      if (!notificationStore.isConnected) {
        notificationStore.connectSocket(authStore.token)
      }
    }, 500)
  }
})

// Handle online/offline events
window.addEventListener('online', () => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()
  
  if (authStore.isAuthenticated && authStore.token) {
    setTimeout(() => {
      // Reconnect chat socket
      socketService.connect(authStore.token).catch(error => {
        console.error('Chat online reconnection failed:', error)
      })
      
      // Reconnect notification socket
      notificationStore.connectSocket(authStore.token)
      
      // Refresh notification data
      notificationStore.refreshData()
      
    }, 2000)
  }
})

window.addEventListener('offline', () => {
  // Silent handling - no log needed
})

// Global error handler with dayjs error handling
app.config.errorHandler = (error, instance, info) => {
  console.error('Vue Error:', error)
  
  // Special handling for dayjs errors
  if (error.message && error.message.includes('fromNow')) {
    console.error('DayJS fromNow error - check if relativeTime plugin is loaded')
  }
}

// Expose for manual testing in dev mode
if (import.meta.env.DEV) {
  window.socketService = socketService
  window.getAuthStore = () => useAuthStore()
  window.getChatStore = () => useChatStore()
  window.getNotificationStore = () => useNotificationStore()
  window.dayjs = dayjs
  
  window.testNotificationSocket = () => {
    const notificationStore = window.getNotificationStore()
    return notificationStore.testSocketConnection()
  }
  
  window.testDayjs = () => {
    console.log('Testing dayjs...')
    console.log('Current time:', dayjs().format())
    console.log('Relative time:', dayjs().subtract(1, 'hour').fromNow())
    return 'Check console for dayjs test results'
  }
}