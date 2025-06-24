// src/services/api.js - FIXED VERSION WITHOUT ALERT POPUP
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    
    // ✅ Try auth store first, fallback to localStorage
    let token = authStore.token
    if (!token) {
      token = localStorage.getItem('token')
      if (token) {
        // Update auth store if token found in localStorage
        authStore.token = token
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ✅ ENHANCED Response interceptor WITHOUT ALERT POPUP
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore()
    
    console.log('🔍 API Error Response:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      blocked: error.response?.data?.blocked,
      url: error.config?.url
    })

    // ✅ Handle blocked user (403 Forbidden)
    if (error.response?.status === 403) {
      const message = error.response.data?.message
      
      // Check if it's a blocked user error
      if (message && (
        message.includes('blocked') ||
        message.includes('Blocked') ||
        error.response.data?.blocked === true
      )) {
        console.log('🚫 User account blocked - forcing logout')
        
        // Set blocked flag for better error handling
        error.response.data.blocked = true
        
        // Clear auth data immediately
        authStore.logout()
        localStorage.removeItem('token')
        
        // ✅ REMOVED: alert() popup - only use toast now
        // Toast will be shown in auth store or components
        
        // Redirect to login with blocked flag
        if (typeof window !== 'undefined' && window.location && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?blocked=true'
        }
        
        return Promise.reject(error)
      }
    }
    
    // ✅ Handle regular 401 unauthorized
    if (error.response?.status === 401) {
      console.log('🔓 Unauthorized - clearing auth')
      
      // Clear both auth store and localStorage
      authStore.logout()
      localStorage.removeItem('token')
      
      // Only redirect if not already on auth pages
      if (typeof window !== 'undefined' && window.location) {
        const pathname = window.location.pathname
        if (!pathname.includes('/login') && !pathname.includes('/register')) {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Updated function for Cloudinary-only URLs
export const getStaticUrl = (imagePath) => {
  if (!imagePath) {
    return null
  }
  
  // If it's already a full Cloudinary URL, return as is
  if (imagePath.startsWith('https://res.cloudinary.com/')) {
    return imagePath
  }
  
  // If it's a Cloudinary public_id format (product12345678 or avatar12345678)
  if (imagePath.match(/^(product|avatar)\d{8}$/)) {
    // Get cloud name from env or use default
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'
    const fullUrl = `https://res.cloudinary.com/${cloudName}/image/upload/marketplace/${imagePath}`
    return fullUrl
  }
  
  // If it's a relative path (legacy data), it should now be invalid
  if (imagePath.startsWith('/uploads/')) {
    return null // Return null to trigger placeholder
  }
  
  // If it's some other format, assume it's already a valid URL
  return imagePath
}

export default api