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