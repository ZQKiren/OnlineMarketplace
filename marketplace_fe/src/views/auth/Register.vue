<!-- src/views/auth/Register.vue -->
<template>
  <div class="container">
    <div class="row">
      <div class="col s12 m8 offset-m2 l6 offset-l3">
        <div class="card register-card">
          <div class="card-content">
            <span class="card-title center-align">Create Account</span>
            
            <form @submit.prevent="handleRegister">
              <div class="row">
                <div class="input-field col s12">
                  <i class="material-icons prefix">person</i>
                  <input 
                    id="name" 
                    type="text" 
                    v-model="form.name"
                    required
                  >
                  <label for="name">Full Name</label>
                </div>
                
                <div class="input-field col s12">
                  <i class="material-icons prefix">email</i>
                  <input 
                    id="email" 
                    type="email" 
                    v-model="form.email"
                    required
                  >
                  <label for="email">Email</label>
                </div>
                
                <div class="input-field col s12">
                  <i class="material-icons prefix">phone</i>
                  <input 
                    id="phone" 
                    type="tel" 
                    v-model="form.phone"
                  >
                  <label for="phone">Phone (Optional)</label>
                </div>
                
                <div class="input-field col s12">
                  <i class="material-icons prefix">lock</i>
                  <input 
                    id="password" 
                    type="password" 
                    v-model="form.password"
                    required
                    minlength="6"
                  >
                  <label for="password">Password</label>
                  <span class="helper-text">Minimum 6 characters</span>
                </div>
                
                <div class="input-field col s12">
                  <i class="material-icons prefix">lock_outline</i>
                  <input 
                    id="confirmPassword" 
                    type="password" 
                    v-model="form.confirmPassword"
                    required
                  >
                  <label for="confirmPassword">Confirm Password</label>
                </div>
              </div>
              
              <button 
                type="submit" 
                class="btn waves-effect waves-light full-width"
                :disabled="loading"
              >
                {{ loading ? 'Creating Account...' : 'Register' }}
              </button>
            </form>
            
            <div class="card-action center-align">
              <p>Already have an account? 
                <router-link to="/login">Login here</router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)

const handleRegister = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    toast.error('Passwords do not match')
    return
  }
  
  loading.value = true
  
  try {
    const { confirmPassword, ...registerData } = form.value
    await authStore.register(registerData)
    toast.success('Registration successful!')
    router.push('/')
  } catch (error) {
    console.error('Registration error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-card {
  margin-top: 30px;
  
  .card-title {
    font-size: 2rem;
    font-weight: 500;
    margin-bottom: 30px;
  }
  
  .full-width {
    width: 100%;
  }
  
  .card-action {
    background-color: transparent;
    border-top: none;
    
    p {
      margin: 0;
    }
  }
}
</style>