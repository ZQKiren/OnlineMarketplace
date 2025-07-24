<!-- src/views/auth/Register.vue -->
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
          <h2>Create Account</h2>
          <p>Join us and start your shopping journey</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-alert">
          <AlertCircle class="alert-icon" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="success-alert">
          <CheckCircle class="alert-icon" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Register Form -->
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="input-group">
            <div class="input-wrapper">
              <User class="input-icon" />
              <input 
                type="text" 
                v-model="form.name"
                :class="{ error: errors.name }"
                @input="clearFieldError('name')"
                placeholder="Enter your full name"
              >
            </div>
            <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
          </div>

          <div class="input-group">
            <div class="input-wrapper">
              <Mail class="input-icon" />
              <input 
                type="text" 
                v-model="form.email"
                :class="{ error: errors.email }"
                @input="clearFieldError('email')"
                placeholder="Enter your email"
              >
            </div>
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>

          <div class="input-group">
            <div class="input-wrapper">
              <Phone class="input-icon" />
              <input 
                type="tel" 
                v-model="form.phone"
                :class="{ error: errors.phone }"
                @input="clearFieldError('phone')"
                placeholder="Enter your phone (optional)"
              >
            </div>
            <span v-if="errors.phone" class="error-text">{{ errors.phone }}</span>
          </div>

          <div class="input-group">
            <div class="input-wrapper">
              <Lock class="input-icon" />
              <input 
                :type="showPassword ? 'text' : 'password'" 
                v-model="form.password"
                :class="{ error: errors.password }"
                @input="clearFieldError('password')"
                placeholder="Create a password"
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
            <span v-else class="help-text">Minimum 6 characters</span>
          </div>

          <div class="input-group">
            <div class="input-wrapper">
              <LockKeyhole class="input-icon" />
              <input 
                :type="showConfirmPassword ? 'text' : 'password'" 
                v-model="form.confirmPassword"
                :class="{ error: errors.confirmPassword }"
                @input="clearFieldError('confirmPassword')"
                placeholder="Confirm your password"
              >
              <button 
                type="button" 
                class="password-toggle"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <Eye v-if="!showConfirmPassword" class="toggle-icon" />
                <EyeOff v-else class="toggle-icon" />
              </button>
            </div>
            <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
          </div>

          <div class="terms-wrapper">
            <label class="terms-checkbox">
              <input type="checkbox" v-model="form.agreeTerms" :class="{ error: errors.agreeTerms }" class="filled-in" />
              <span class="terms-text">
                I agree to the 
                <a href="/terms" target="_blank">Terms of Service</a> 
                and 
                <a href="/privacy" target="_blank">Privacy Policy</a>
              </span>
            </label>
            <span v-if="errors.agreeTerms" class="error-text">{{ errors.agreeTerms }}</span>
          </div>

          <button 
            type="submit" 
            class="auth-btn"
            :disabled="loading"
          >
            <span v-if="loading" class="loading-spinner"></span>
            <span v-else>Create Account</span>
          </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
          <p>Already have an account? 
            <router-link to="/login">Sign in here</router-link>
          </p>
        </div>
      </div>

      <!-- Side Panel -->
      <div class="side-panel">
        <div class="side-content">
          <div class="side-illustration">
            <UserPlus class="float-icon" />
            <ShoppingBag class="float-icon" />
            <Gift class="float-icon" />
          </div>
          <h3>Join Our Community</h3>
          <p>Create your account to unlock exclusive deals, personalized recommendations, and seamless shopping experience.</p>
          <div class="benefits">
            <div class="benefit">
              <Tag class="benefit-icon" />
              <span>Exclusive Offers</span>
            </div>
            <div class="benefit">
              <Star class="benefit-icon" />
              <span>Loyalty Rewards</span>
            </div>
            <div class="benefit">
              <Package class="benefit-icon" />
              <span>Order Tracking</span>
            </div>
            <div class="benefit">
              <Heart class="benefit-icon" />
              <span>Wishlist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { validators } from '@/utils/validators'

// Lucide Icons
import {
  Store,
  User,
  Mail,
  Phone,
  Lock,
  LockKeyhole,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  UserPlus,
  ShoppingBag,
  Gift,
  Tag,
  Star,
  Package,
  Heart
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const errors = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: ''
})

const clearFieldError = (field) => {
  errors[field] = ''
  if (errorMessage.value) {
    errorMessage.value = ''
  }
}

const clearAllErrors = () => {
  errorMessage.value = ''
  successMessage.value = ''
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

const validateForm = () => {
  clearAllErrors()
  let isValid = true
  
  // Validate name
  const nameResult = validators.required(form.value.name)
  if (nameResult !== true) {
    errors.name = nameResult
    isValid = false
  } else {
    const nameLength = validators.minLength(2)(form.value.name)
    if (nameLength !== true) {
      errors.name = nameLength
      isValid = false
    }
  }
  
  // Validate email
  const emailRequired = validators.required(form.value.email)
  if (emailRequired !== true) {
    errors.email = emailRequired
    isValid = false
  } else {
    const emailFormat = validators.email(form.value.email)
    if (emailFormat !== true) {
      errors.email = emailFormat
      isValid = false
    }
  }
  
  // Validate phone (optional)
  if (form.value.phone) {
    const phoneResult = validators.phoneNumber(form.value.phone)
    if (phoneResult !== true) {
      errors.phone = phoneResult
      isValid = false
    }
  }
  
  // Validate password
  const passwordRequired = validators.required(form.value.password)
  if (passwordRequired !== true) {
    errors.password = passwordRequired
    isValid = false
  } else {
    const passwordLength = validators.password(form.value.password)
    if (passwordLength !== true) {
      errors.password = passwordLength
      isValid = false
    }
  }
  
  // Validate confirm password
  const confirmPasswordRequired = validators.required(form.value.confirmPassword)
  if (confirmPasswordRequired !== true) {
    errors.confirmPassword = confirmPasswordRequired
    isValid = false
  } else {
    const confirmPasswordMatch = validators.confirmPassword(form.value.password)(form.value.confirmPassword)
    if (confirmPasswordMatch !== true) {
      errors.confirmPassword = confirmPasswordMatch
      isValid = false
    }
  }
  
  // Validate terms agreement
  if (!form.value.agreeTerms) {
    errors.agreeTerms = 'You must agree to the terms and conditions'
    isValid = false
  }
  
  return isValid
}

const handleRegister = async () => {
  if (!validateForm()) {
    toast.error('Please check your information!')
    return
  }
  
  loading.value = true
  clearAllErrors()
  
  try {
    const { confirmPassword, agreeTerms, ...registerData } = form.value
    await authStore.register(registerData)
    
    successMessage.value = 'Account created successfully! Redirecting...'
    toast.success('Welcome to ShopApp!')
    
    setTimeout(() => {
      router.push('/')
    }, 1500)
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      
      switch (status) {
        case 400:
          errorMessage.value = 'Invalid data provided!'
          break
        case 409:
          errorMessage.value = 'This email is already registered!'
          errors.email = 'Email already exists'
          break
        case 422:
          if (data.errors) {
            errors.name = data.errors.name?.[0] || ''
            errors.email = data.errors.email?.[0] || ''
            errors.phone = data.errors.phone?.[0] || ''
            errors.password = data.errors.password?.[0] || ''
          } else {
            errorMessage.value = data.message || 'Invalid data!'
          }
          break
        case 429:
          errorMessage.value = 'Too many registration attempts. Please try again later!'
          break
        case 500:
          errorMessage.value = 'System error. Please try again later!'
          break
        default:
          errorMessage.value = data.message || 'Registration failed!'
      }
    } else if (error.request) {
      errorMessage.value = 'Unable to connect to server. Please check your network!'
    } else {
      errorMessage.value = 'An unexpected error occurred!'
    }
    
    toast.error('Registration failed!')
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
  max-width: 1100px;
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
  padding: 50px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-height: 90vh;
  overflow-y: auto;
  
  @media (max-width: $tablet) {
    padding: 40px 30px;
  }
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
  
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 25px;
    
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
  margin-bottom: 20px;
  border-left: 4px solid #c62828;
  
  .alert-icon {
    width: 20px;
    height: 20px;
  }
}

.success-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #e8f5e8;
  color: #2e7d32;
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border-left: 4px solid #4caf50;
  
  .alert-icon {
    width: 20px;
    height: 20px;
  }
}

.auth-form {
  margin-bottom: 25px;
}

.input-group {
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-height: 38px;
  padding: 0 10px;
  
  &:focus-within {
    border-color: $primary-color;
    background: white;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }
  
  .input-icon {
    color: #6c757d;
    margin: 0 8px;
    width: 18px;
    height: 18px;
  }
  
  input {
    flex: 1;
    border: none;
    border-bottom: 1.5px solid #bdbdbd;
    border-radius: 0;
    transition: border-color 0.2s;
    box-shadow: none;
    background: transparent;
    padding: 10px 0;
    font-size: 15px;
    color: #333;
    outline: none;
    min-height: 36px;
    
    &::placeholder {
      color: #6c757d;
    }
    
    &.error {
      color: #c62828;
    }

    &:focus {
      border-bottom: 2px solid #1976d2;
      outline: none;
      box-shadow: none;
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
  font-size: 13px;
  margin-top: 6px;
  margin-left: 4px;
}

.help-text {
  color: #6c757d;
  font-size: 13px;
  margin-top: 6px;
  margin-left: 4px;
}

.terms-wrapper {
  margin-bottom: 25px;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  line-height: 1.5;
  
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
    flex-shrink: 0;
    margin-top: 2px;
    
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
  
  .terms-text {
    font-size: 14px;
    color: #666;
    
    a {
      color: $primary-color;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
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
  padding: 50px 35px;
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
  gap: 15px;
  margin-bottom: 35px;
  
  .float-icon {
    width: 40px;
    height: 40px;
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
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  p {
    font-size: 15px;
    line-height: 1.6;
    opacity: 0.9;
    margin-bottom: 30px;
  }
}

.benefits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.benefit {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .benefit-icon {
    width: 18px;
    height: 18px;
    color: #4caf50;
  }
  
  span {
    font-size: 13px;
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