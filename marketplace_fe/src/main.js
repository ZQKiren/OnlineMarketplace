// src/main.js - UPDATED WITH REAL-TIME CHAT
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

// Mount app first
app.mount('#app')

// ✅ UPDATED: Enhanced initialization with real-time chat
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app with real-time chat...')
    
    // Initialize stores
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    
    // ✅ Setup socket event handlers for chat store
    const setupSocketHandlers = () => {
      console.log('🔌 Setting up socket event handlers...')
      
      // Handle new messages
      socketService.onNewMessage((message) => {
        console.log('🔔 New message received:', message.id)
        chatStore.handleNewMessage(message)
      })
      
      // Handle user online/offline status
      socketService.onUserOnline((data) => {
        console.log('🟢 User online:', data.userId)
        chatStore.updateOnlineStatus(data.userId, true)
      })
      
      socketService.onUserOffline((data) => {
        console.log('🔴 User offline:', data.userId)
        chatStore.updateOnlineStatus(data.userId, false)
      })
      
      // Handle messages read
      socketService.onMessagesRead((data) => {
        console.log('✅ Messages read:', data.chatId)
        chatStore.markChatAsRead(data.chatId, data.userId)
      })
      
      // Handle typing indicators
      socketService.onUserTyping((data) => {
        chatStore.setUserTyping(data.chatId, data.userId, data.userName, data.isTyping)
      })
      
      console.log('✅ Socket handlers ready')
    }
    
    // ✅ Setup real-time connection
    const connectRealTime = async () => {
      if (!authStore.token) return
      
      try {
        console.log('🔌 Connecting real-time socket...')
        await socketService.connect(authStore.token)
        
        // Setup event handlers after connection
        setupSocketHandlers()
        
        // Load chats after socket is connected
        if (authStore.isAuthenticated) {
          console.log('📋 Loading chats...')
          await chatStore.fetchChats()
        }
        
        console.log('✅ Real-time chat connected!')
        
      } catch (error) {
        console.error('❌ Socket connection failed:', error)
      }
    }
    
    // Check if user is already logged in
    if (authStore.token) {
      try {
        console.log('🔐 Loading user profile...')
        await authStore.fetchProfile()
        console.log('✅ User profile loaded:', authStore.user?.name)
        
        // Connect real-time after profile is loaded
        await connectRealTime()
        
      } catch (error) {
        console.error('❌ Failed to load user profile:', error)
        authStore.logout()
      }
    } else {
      // Still setup socket handlers even if not logged in
      setupSocketHandlers()
    }
    
    // ✅ UPDATED: Better auth state watching with reactive approach
    let previousAuthState = authStore.isAuthenticated
    let previousToken = authStore.token
    
    // Watch for auth changes every second
    const watchAuthChanges = () => {
      const currentAuthState = authStore.isAuthenticated
      const currentToken = authStore.token
      
      // Check if auth state changed
      if (currentAuthState !== previousAuthState || currentToken !== previousToken) {
        console.log('🔄 Auth state changed:', {
          wasAuth: previousAuthState,
          nowAuth: currentAuthState,
          hasToken: !!currentToken
        })
        
        if (currentAuthState && currentToken && !previousAuthState) {
          // User just logged in
          console.log('👋 User logged in, connecting real-time...')
          connectRealTime()
          
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
    
    // Start watching auth changes
    setInterval(watchAuthChanges, 1000)
    
    console.log('🎉 App initialization complete!')
    
  } catch (error) {
    console.error('❌ App initialization error:', error)
  }
}

// ✅ Initialize after DOM is ready
setTimeout(initializeApp, 100)

// ✅ ENHANCED: Better cleanup and reconnection handling
window.addEventListener('beforeunload', () => {
  console.log('👋 App closing, cleaning up...')
  socketService.disconnect()
})

// ✅ Handle page visibility for reconnection
document.addEventListener('visibilitychange', () => {
  const authStore = useAuthStore()
  
  if (!document.hidden && authStore.isAuthenticated) {
    // Page became visible and user is authenticated
    if (!socketService.isConnected) {
      console.log('👁️ Page visible, reconnecting socket...')
      setTimeout(async () => {
        try {
          await socketService.connect(authStore.token)
          console.log('✅ Socket reconnected')
        } catch (error) {
          console.error('❌ Reconnection failed:', error)
        }
      }, 1000)
    }
  }
})

// ✅ Handle window focus
window.addEventListener('focus', () => {
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated && !socketService.isConnected) {
    console.log('🎯 Window focused, checking connection...')
    setTimeout(async () => {
      try {
        await socketService.connect(authStore.token)
        console.log('✅ Socket reconnected on focus')
      } catch (error) {
        console.error('❌ Focus reconnection failed:', error)
      }
    }, 500)
  }
})

// ✅ Handle online/offline events
window.addEventListener('online', () => {
  console.log('🌐 Back online!')
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated) {
    setTimeout(async () => {
      try {
        await socketService.connect(authStore.token)
        console.log('✅ Socket reconnected after coming online')
      } catch (error) {
        console.error('❌ Online reconnection failed:', error)
      }
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

console.log('🚀 Vue app with real-time chat started')