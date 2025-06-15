// src/main.js - FIXED VERSION
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Import Materialize CSS và JS
import 'materialize-css/dist/css/materialize.min.css'
import M from 'materialize-css/dist/js/materialize.min.js' // ✅ FIX: Import M properly

import 'material-design-icons/iconfont/material-icons.css'
import './assets/styles/main.scss'

// ✅ FIX: Import stores BEFORE using them
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import socketService from './services/socket.service'

// Làm cho Materialize M object có thể truy cập globally
window.M = M

const app = createApp(App)
const pinia = createPinia()

// ✅ IMPORTANT: Setup pinia BEFORE mounting
app.use(pinia)
app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
})

// ✅ Mount app first
app.mount('#app')

// ✅ FIXED: Initialize stores and socket AFTER app is mounted
const initializeApp = async () => {
  try {
    // Initialize stores
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    
    console.log('🚀 App initialized with stores')
    
    // Fetch user profile if token exists
    if (authStore.token) {
      try {
        await authStore.fetchProfile()
        console.log('✅ User profile loaded')
        
        // Connect socket after successful auth
        socketService.connect(authStore, chatStore)
        console.log('🔌 Socket connected')
      } catch (error) {
        console.error('❌ Failed to load user profile:', error)
        authStore.logout()
      }
    }
    
    // ✅ FIX: Proper auth state watching
    let isWatching = false
    const watchAuthChanges = () => {
      if (isWatching) return
      isWatching = true
      
      // Watch for auth changes
      let previousAuthState = authStore.isAuthenticated
      
      setInterval(() => {
        const currentAuthState = authStore.isAuthenticated
        
        if (currentAuthState !== previousAuthState) {
          console.log('🔄 Auth state changed:', currentAuthState)
          
          if (currentAuthState && authStore.token) {
            // User logged in
            socketService.connect(authStore, chatStore)
          } else {
            // User logged out
            socketService.disconnect()
          }
          previousAuthState = currentAuthState
        }
      }, 1000)
    }
    
    watchAuthChanges()
    
  } catch (error) {
    console.error('❌ App initialization error:', error)
  }
}

// Initialize after DOM is ready
setTimeout(initializeApp, 100)

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  socketService.disconnect()
})