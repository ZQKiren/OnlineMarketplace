<!-- src/views/auth/Login.vue -->
<template>
  <div class="auth-container">
    <div class="auth-wrapper">
      <div class="auth-card">
        <!-- Header -->
        <div class="auth-header">
          <div class="logo">
            <Store class="logo-icon" />
            <h1>ShopApp</h1>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-alert">
          <AlertCircle class="alert-icon" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="input-group">
            <div class="input-wrapper">
              <Mail class="input-icon" />
              <input 
                type="email" 
                v-model="form.email"
                :class="{ error: errors.email }"
                @input="clearFieldError('email')"
                placeholder="Enter your email"
                required
              >
            </div>
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>

          <div class="input-group">
            <div class="input-wrapper">
              <Lock class="input-icon" />
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="form.password"
                :class="{ error: errors.password }"
                @input="clearFieldError('password')"
                placeholder="Enter your password"
                required
              >
              <button 
                type="button" 
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="toggle-icon" />
                <EyeOff v-else class="toggle-icon" />
              </button>
            </div>
            <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
          </div>

          <div class="form-options">
            <label class="remember-me">
              <input type="checkbox" v-model="rememberMe">
              <span class="checkmark"></span>
              Remember me
            </label>
            <router-link to="/forgot-password" class="forgot-link">
              Forgot password?
            </router-link>
          </div>

          <button 
            type="submit" 
            class="auth-btn"
            :disabled="loading"
          >
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
          <p>Don't have an account? 
            <router-link to="/register">Create one here</router-link>
          </p>
        </div>
      </div>

      <!-- Side Panel -->
      <div class="side-panel">
        <div class="side-content">
          <div class="side-illustration">
            <ShoppingCart class="float-icon" />
            <Heart class="float-icon" />
            <Truck class="float-icon" />
          </div>
          <h3>Your Shopping Journey Starts Here</h3>
          <p>Discover amazing products, track your orders, and enjoy a seamless shopping experience.</p>
          <div class="features">
            <div class="feature">
              <CheckCircle class="feature-icon" />
              <span>Secure Shopping</span>
            </div>
            <div class="feature">
              <CheckCircle class="feature-icon" />
              <span>Fast Delivery</span>
            </div>
            <div class="feature">
              <CheckCircle class="feature-icon" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { validators } from '@/utils/validators'

// Lucide Icons
import {
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShoppingCart,
  Heart,
  Truck,
  CheckCircle
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)
const errorMessage = ref('')
const errors = reactive({
  email: '',
  password: ''
})

const clearFieldError = (field) => {
  errors[field] = ''
  if (errorMessage.value) {
    errorMessage.value = ''
  }
}

const clearAllErrors = () => {
  errorMessage.value = ''
  errors.email = ''
  errors.password = ''
}

const validateForm = () => {
  clearAllErrors()
  let isValid = true
  
  const emailResult = validators.email(form.value.email)
  if (emailResult !== true) {
    errors.email = emailResult
    isValid = false
  }
  
  const passwordResult = validators.required(form.value.password)
  if (passwordResult !== true) {
    errors.password = passwordResult
    isValid = false
  }
  
  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) {
    toast.error('Please check your information!')
    return
  }
  
  loading.value = true
  clearAllErrors()
  
  try {
    await authStore.login(form.value)
    toast.success('Welcome back!')
    
    const redirectTo = route.query.redirect || '/'
    router.push(redirectTo)
  } catch (error) {
    console.error('Login error:', error)
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      switch (status) {
        case 401:
          errorMessage.value = 'Invalid email or password!'
          break
        case 404:
          errorMessage.value = 'Account not found!'
          break
        case 403:
          errorMessage.value = 'Account is locked or not activated!'
          break
        case 422:
          if (data.errors) {
            errors.email = data.errors.email?.[0] || ''
            errors.password = data.errors.password?.[0] || ''
          } else {
            errorMessage.value = data.message || 'Invalid data!'
          }
          break
        case 429:
          errorMessage.value = 'Too many login attempts. Please try again later!'
          break
        case 500:
          errorMessage.value = 'System error. Please try again later!'
          break
        default:
          errorMessage.value = data.message || 'Login failed!'
      }
    } else if (error.request) {
      errorMessage.value = 'Unable to connect to server. Please check your network!'
    } else {
      errorMessage.value = 'An unexpected error occurred!'
    }
    
    toast.error('Login failed!')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  }
}

.auth-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1000px;
  width: 100%;
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  position: relative;
  z-index: 1;
  
  @media (max-width: $tablet) {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
}

.auth-card {
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  @media (max-width: $tablet) {
    padding: 40px 30px;
  }
}

.auth-header {
  text-align: center;
  margin-bottom: 40px;
  
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 30px;
    
    .logo-icon {
      width: 32px;
      height: 32px;
      color: $primary-color;
    }
    
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }
  }
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 700;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 16px;
  }
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffebee;
  color: #c62828;
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  border-left: 4px solid #c62828;
  
  .alert-icon {
    width: 20px;
    height: 20px;
  }
}

.auth-form {
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 24px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: $primary-color;
    background: white;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }
  
  .input-icon {
    color: #6c757d;
    margin: 0 15px;
    width: 20px;
    height: 20px;
  }
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 18px 0;
    font-size: 16px;
    color: #333;
    outline: none;
    
    &::placeholder {
      color: #6c757d;
    }
    
    &.error {
      color: #c62828;
    }
  }
  
  .password-toggle {
    background: none;
    border: none;
    padding: 0 15px;
    cursor: pointer;
    color: #6c757d;
    display: flex;
    align-items: center;
    
    &:hover {
      color: $primary-color;
    }
    
    .toggle-icon {
      width: 20px;
      height: 20px;
    }
  }
}

.error-text {
  color: #c62828;
  font-size: 14px;
  margin-top: 6px;
  margin-left: 4px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  @media (max-width: $mobile) {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  
  input[type="checkbox"] {
    display: none;
  }
  
  .checkmark {
    width: 18px;
    height: 18px;
    border: 2px solid #ddd;
    border-radius: 4px;
    position: relative;
    transition: all 0.3s ease;
    
    &::after {
      content: '';
      position: absolute;
      left: 6px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
  }
  
  input:checked + .checkmark {
    background: $primary-color;
    border-color: $primary-color;
    
    &::after {
      opacity: 1;
    }
  }
}

.forgot-link {
  color: $primary-color;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
}

.auth-btn {
  width: 100%;
  background: linear-gradient(135deg, $primary-color, darken($primary-color, 10%));
  color: white;
  border: none;
  padding: 18px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(25, 118, 210, 0.3);
  }
  
  &:disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
  
  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s ease-in-out infinite;
  }
}

.auth-footer {
  text-align: center;
  
  p {
    margin: 0;
    color: #666;
    font-size: 14px;
    
    a {
      color: $primary-color;
      text-decoration: none;
      font-weight: 600;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.side-panel {
  background: linear-gradient(135deg, $primary-color, darken($primary-color, 15%));
  color: white;
  padding: 60px 40px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
  }
  
  @media (max-width: $tablet) {
    display: none;
  }
}

.side-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.side-illustration {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  
  .float-icon {
    width: 48px;
    height: 48px;
    opacity: 0.9;
    animation: float 3s ease-in-out infinite;
    
    &:nth-child(2) {
      animation-delay: -1s;
    }
    
    &:nth-child(3) {
      animation-delay: -2s;
    }
  }
}

.side-content {
  h3 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  p {
    font-size: 16px;
    line-height: 1.6;
    opacity: 0.9;
    margin-bottom: 30px;
  }
}

.features {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .feature-icon {
    width: 20px;
    height: 20px;
    color: #4caf50;
  }
  
  span {
    font-size: 14px;
    opacity: 0.9;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>