<template>
  <div id="app">
    <!-- Conditionally show Navbar -->
    <Navbar v-if="!$route.meta.hideNavbar" />
    
    <!-- Main content with conditional padding -->
    <main class="main-content" :class="{ 'auth-layout': isAuthPage }">
      <router-view v-slot="{ Component }" :key="$route.fullPath">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- Conditionally show Footer -->
    <Footer v-if="!$route.meta.hideFooter" />
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification' // ✅ NEW
import Navbar from '@/components/common/Navbar.vue'
import Footer from '@/components/common/Footer.vue'

const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore() // ✅ NEW

// Check if current page is auth page
const isAuthPage = computed(() => {
  return route.meta.hideNavbar || route.meta.hideFooter
})

onMounted(async () => {
  // BỎ M.AutoInit() để tránh conflict với Navbar
  // Manual init trong từng component sẽ stable hơn
   
  // Fetch user profile if token exists
  if (authStore.token) {
    await authStore.fetchProfile()
    
    // ✅ NEW: Initialize notification system after auth
    if (authStore.isAuthenticated) {
      try {
        // Connect notification socket with token
        notificationStore.connectSocket(authStore.token)
        
        // Fetch initial notification data
        await notificationStore.fetchUnreadCount()
        
      } catch (error) {
        console.error('❌ Error initializing notifications:', error)
      }
    }
  }
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 20px;
  padding-bottom: 40px;
  
  // Remove padding for auth pages
  &.auth-layout {
    padding: 0;
  }
}

.fade-enter-active, 
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, 
.fade-leave-to {
  opacity: 0;
}
</style>