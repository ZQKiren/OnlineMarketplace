// src/services/api.js
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
    
    // ✅ FIX: Try auth store first, fallback to localStorage
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore()
    
    if (error.response?.status === 401) {
      // ✅ FIX: Clear both auth store and localStorage
      authStore.logout()
      localStorage.removeItem('token')
      
      // ✅ FIX: Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Updated function for Cloudinary-only URLs with debugging
export const getStaticUrl = (imagePath) => {
  console.log('🔍 getStaticUrl input:', imagePath)
  
  if (!imagePath) {
    console.log('❌ No image path provided')
    return null
  }
  
  // If it's already a full Cloudinary URL, return as is
  if (imagePath.startsWith('https://res.cloudinary.com/')) {
    console.log('✅ Full Cloudinary URL detected')
    return imagePath
  }
  
  // If it's a Cloudinary public_id format (product12345678 or avatar12345678)
  if (imagePath.match(/^(product|avatar)\d{8}$/)) {
    // Get cloud name from env or use default
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'
    const fullUrl = `https://res.cloudinary.com/${cloudName}/image/upload/marketplace/${imagePath}`
    console.log('🔧 Constructed Cloudinary URL:', fullUrl)
    return fullUrl
  }
  
  // If it's a relative path (legacy data), it should now be invalid
  if (imagePath.startsWith('/uploads/')) {
    console.warn('⚠️ Legacy local path detected:', imagePath)
    return null // Return null to trigger placeholder
  }
  
  // If it's some other format, assume it's already a valid URL
  console.log('🤔 Unknown format, returning as-is:', imagePath)
  return imagePath
}

export default api