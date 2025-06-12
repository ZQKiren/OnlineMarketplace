<!-- src/views/auth/Login.vue -->
<template>
  <div class="container">
    <div class="row">
      <div class="col s12 m6 offset-m3 l4 offset-l4">
        <div class="card login-card">
          <div class="card-content">
            <span class="card-title center-align">Login</span>
            
            <form @submit.prevent="handleLogin">
              <div class="input-field">
                <i class="material-icons prefix">email</i>
                <input 
                  id="email" 
                  type="email" 
                  v-model="form.email"
                  required
                >
                <label for="email">Email</label>
              </div>
              
              <div class="input-field">
                <i class="material-icons prefix">lock</i>
                <input 
                  id="password" 
                  type="password" 
                  v-model="form.password"
                  required
                >
                <label for="password">Password</label>
              </div>
              
              <button 
                type="submit" 
                class="btn waves-effect waves-light full-width"
                :disabled="loading"
              >
                {{ loading ? 'Logging in...' : 'Login' }}
              </button>
            </form>
            
            <div class="card-action center-align">
              <p>Don't have an account? 
                <router-link to="/register">Register here</router-link>
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
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  
  try {
    await authStore.login(form.value)
    toast.success('Login successful!')
    
    // Redirect to intended route or home
    const redirectTo = route.query.redirect || '/'
    router.push(redirectTo)
  } catch (error) {
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-card {
  margin-top: 50px;
  
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