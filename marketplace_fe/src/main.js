// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Import Materialize CSS và JS
import 'materialize-css/dist/css/materialize.min.css'
import 'materialize-css/dist/js/materialize.min.js'  // ← THIẾU DÒNG NÀY

import 'material-design-icons/iconfont/material-icons.css'
import './assets/styles/main.scss'

import socketService from './services/socket.service'
// Làm cho Materialize M object có thể truy cập globally
window.M = M  // ← THIẾU DÒNG NÀY

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
})

app.mount('#app')

// ✨ NEW: Initialize socket connection after app is mounted
// Wait for auth store to be ready
const authStore = useAuthStore()

// Connect socket when user is authenticated
if (authStore.token) {
  socketService.connect()
}

// Watch for auth changes to connect/disconnect socket
let previousAuthState = authStore.isAuthenticated

setInterval(() => {
  const currentAuthState = authStore.isAuthenticated
  
  if (currentAuthState !== previousAuthState) {
    if (currentAuthState) {
      socketService.connect()
    } else {
      socketService.disconnect()
    }
    previousAuthState = currentAuthState
  }
}, 1000)