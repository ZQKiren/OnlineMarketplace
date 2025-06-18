<template>
  <nav class="nav-extended optimized-navbar">
    <div class="nav-wrapper">
      <div class="container">
        <!-- ✅ FIX: Logo với z-index cao hơn -->
        <router-link to="/" class="brand-logo">
          <i class="material-icons">shopping_cart</i>
          <span class="brand-text">Marketplace</span>
        </router-link>
        
        <a href="#" data-target="mobile-nav" class="sidenav-trigger">
          <i class="material-icons">menu</i>
        </a>
        
        <ul class="right hide-on-med-and-down navbar-items">
          <!-- Products Link -->
          <li class="nav-item">
            <router-link to="/products" class="nav-link">
              <i class="material-icons">store</i>
              <span>Products</span>
            </router-link>
          </li>
          
          <template v-if="authStore.isAuthenticated">
            <!-- Notification Bell -->
            <li class="nav-item notification-item">
              <NotificationBell />
            </li>
            
            <!-- Messages/Chat Link -->
            <li class="nav-item">
              <router-link to="/chat" class="nav-link chat-link">
                <i class="material-icons">chat</i>
                <span>Messages</span>
                <span v-if="totalUnreadCount > 0" class="nav-badge">
                  {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
                </span>
              </router-link>
            </li>
            
            <!-- Cart Link -->
            <li class="nav-item">
              <router-link to="/cart" class="nav-link cart-link">
                <i class="material-icons">shopping_basket</i>
                <span>Cart</span>
                <span v-if="cartCount > 0" class="nav-badge">
                  {{ cartCount > 99 ? '99+' : cartCount }}
                </span>
              </router-link>
            </li>
            
            <!-- User Dropdown -->
            <li class="nav-item user-dropdown-item">
              <a 
                class="dropdown-trigger nav-link user-trigger" 
                href="#!" 
                data-target="user-dropdown"
                @click.prevent="handleDropdownClick"
                :class="{ active: showDropdown }"
                :aria-expanded="showDropdown"
              >
                <i class="material-icons user-icon">account_circle</i>
                <span class="user-name">{{ authStore.user?.name || 'User' }}</span>
                <i class="material-icons dropdown-arrow">arrow_drop_down</i>
              </a>
            </li>
          </template>
          
          <template v-else>
            <li class="nav-item">
              <router-link to="/login" class="nav-link">Login</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/register" class="nav-link">Register</router-link>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>

  <!-- User Dropdown -->
  <ul 
    id="user-dropdown" 
    class="dropdown-content user-dropdown-menu" 
    :class="{ show: showDropdown }"
    v-show="authStore.isAuthenticated"
  >
    <li class="dropdown-header">
      <div class="user-info">
        <i class="material-icons user-avatar">account_circle</i>
        <div class="user-details">
          <span class="user-display-name">{{ authStore.user?.name }}</span>
          <span class="user-email">{{ authStore.user?.email }}</span>
        </div>
      </div>
    </li>
    
    <li class="divider"></li>
    
    <li><a href="#!" @click.prevent="navigateTo('/profile')" class="dropdown-link">
      <i class="material-icons">person</i>My Profile
    </a></li>
    
    <li><a href="#!" @click.prevent="navigateTo('/my-products')" class="dropdown-link">
      <i class="material-icons">inventory</i>My Products
    </a></li>
    
    <li><a href="#!" @click.prevent="navigateTo('/orders')" class="dropdown-link">
      <i class="material-icons">receipt</i>My Orders
    </a></li>
    
    <li><a href="#!" @click.prevent="navigateTo('/my-reviews')" class="dropdown-link">
      <i class="material-icons">rate_review</i>My Reviews
    </a></li>
    
    <li><a href="#!" @click.prevent="navigateTo('/notifications')" class="dropdown-link">
      <i class="material-icons">notifications</i>My Notifications
      <span v-if="notificationUnreadCount > 0" class="dropdown-badge">
        {{ notificationUnreadCount }}
      </span>
    </a></li>
    
    <li><a href="#!" @click.prevent="navigateTo('/chat')" class="dropdown-link">
      <i class="material-icons">chat</i>My Messages
      <span v-if="totalUnreadCount > 0" class="dropdown-badge">
        {{ totalUnreadCount }}
      </span>
    </a></li>
    
    <li v-if="authStore.isAdmin" class="divider"></li>
    <li v-if="authStore.isAdmin">
      <a href="#!" @click.prevent="navigateTo('/admin/dashboard')" class="dropdown-link admin-link">
        <i class="material-icons">admin_panel_settings</i>Admin Dashboard
      </a>
    </li>
    
    <li class="divider"></li>
    <li>
      <a href="#!" @click.prevent="logout" class="dropdown-link logout-link">
        <i class="material-icons">logout</i>Logout
      </a>
    </li>
  </ul>

  <!-- Mobile Navigation -->
  <ul class="sidenav mobile-nav" id="mobile-nav">
    <li class="mobile-header">
      <div class="mobile-user-info" v-if="authStore.isAuthenticated">
        <i class="material-icons mobile-avatar">account_circle</i>
        <div class="mobile-user-details">
          <span class="mobile-user-name">{{ authStore.user?.name }}</span>
          <span class="mobile-user-email">{{ authStore.user?.email }}</span>
        </div>
      </div>
      <div v-else class="mobile-guest-info">
        <i class="material-icons">person_outline</i>
        <span>Guest User</span>
      </div>
    </li>
    
    <li class="mobile-divider"></li>
    
    <li><router-link to="/products" class="mobile-link">
      <i class="material-icons">store</i>Products
    </router-link></li>
    
    <template v-if="authStore.isAuthenticated">
      <li>
        <router-link to="/notifications" class="mobile-link mobile-notification-link">
          <i class="material-icons">notifications</i>
          <span>Notifications</span>
          <span v-if="notificationUnreadCount > 0" class="mobile-badge">
            {{ notificationUnreadCount }}
          </span>
        </router-link>
      </li>
      
      <li>
        <router-link to="/chat" class="mobile-link mobile-chat-link">
          <i class="material-icons">chat</i>
          <span>Messages</span>
          <span v-if="totalUnreadCount > 0" class="mobile-badge">
            {{ totalUnreadCount }}
          </span>
        </router-link>
      </li>
      
      <li><router-link to="/cart" class="mobile-link">
        <i class="material-icons">shopping_basket</i>Cart ({{ cartCount }})
      </router-link></li>
      
      <li class="mobile-divider"></li>
      
      <li><router-link to="/profile" class="mobile-link">
        <i class="material-icons">person</i>Profile
      </router-link></li>
      
      <li><router-link to="/orders" class="mobile-link">
        <i class="material-icons">receipt</i>Orders
      </router-link></li>
      
      <li v-if="authStore.isAdmin"><router-link to="/admin/dashboard" class="mobile-link admin-mobile-link">
        <i class="material-icons">admin_panel_settings</i>Admin Dashboard
      </router-link></li>
      
      <li class="mobile-divider"></li>
      
      <li><a @click="logout" class="mobile-link logout-mobile-link">
        <i class="material-icons">logout</i>Logout
      </a></li>
    </template>
    
    <template v-else>
      <li><router-link to="/login" class="mobile-link">
        <i class="material-icons">login</i>Login
      </router-link></li>
      <li><router-link to="/register" class="mobile-link">
        <i class="material-icons">person_add</i>Register
      </router-link></li>
    </template>
  </ul>

  <!-- Click outside overlay -->
  <div 
    v-if="showDropdown" 
    class="dropdown-overlay"
    @click="closeDropdown"
  ></div>

  <!-- Chat Notification Toast -->
  <div v-if="showChatNotification" class="chat-notification-toast" @click="goToChat">
    <div class="toast-content">
      <img :src="notificationAvatar" class="toast-avatar" @error="handleAvatarError">
      <div class="toast-text">
        <strong>{{ notificationSender }}</strong>
        <p>{{ notificationMessage }}</p>
      </div>
      <button @click.stop="hideChatNotification" class="toast-close">
        <i class="material-icons">close</i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useCategoryStore } from '@/stores/category'
import { useChatStore } from '@/stores/chat'
import { useNotificationStore } from '@/stores/notification'
import NotificationBell from './NotificationBell.vue'
import socketService from '@/services/socket.service'

const authStore = useAuthStore()
const cartStore = useCartStore()
const categoryStore = useCategoryStore()
const chatStore = useChatStore()
const notificationStore = useNotificationStore()
const router = useRouter()
const route = useRoute()

// Computed properties
const cartCount = computed(() => cartStore.itemCount)
const totalUnreadCount = computed(() => chatStore.totalUnreadCount || 0)
const notificationUnreadCount = computed(() => notificationStore.unreadCount || 0)

// Local state
const showDropdown = ref(false)
const showChatNotification = ref(false)
const notificationSender = ref('')
const notificationMessage = ref('')
const notificationAvatar = ref('')
const notificationTimeout = ref(null)

// Instance references
let dropdownInstance = null
let sidenavInstance = null

// Methods
const handleDropdownClick = () => {
  console.log('🖱️ Dropdown click - Current state:', showDropdown.value)
  
  if (dropdownInstance) {
    try {
      if (dropdownInstance.isOpen) {
        dropdownInstance.close()
        showDropdown.value = false
      } else {
        dropdownInstance.open()
        showDropdown.value = true
      }
      console.log('✅ Materialize dropdown toggled')
      return
    } catch (error) {
      console.warn('⚠️ Materialize dropdown failed:', error)
    }
  }
  
  console.log('🔄 Using manual dropdown control')
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  console.log('❌ Closing dropdown')
  showDropdown.value = false
  if (dropdownInstance && dropdownInstance.isOpen) {
    dropdownInstance.close()
  }
}

const navigateTo = (path) => {
  console.log('🔄 Navigating to:', path)
  closeDropdown()
  router.push(path)
}

const logout = async () => {
  console.log('🚪 Logging out...')
  closeDropdown()
  
  socketService.disconnect()
  notificationStore.disconnectSocket()
  notificationStore.clearNotifications()
  
  await authStore.logout()
  setTimeout(initializeMaterialize, 300)
}

// Chat notification methods
const showNewMessageNotification = (data) => {
  if (route.path.includes('/chat')) return
  
  notificationSender.value = data.senderName || 'Someone'
  notificationMessage.value = data.message?.content || 'Sent you a message'
  notificationAvatar.value = data.senderAvatar || '/placeholder-avatar.svg'
  showChatNotification.value = true
  
  if (notificationTimeout.value) {
    clearTimeout(notificationTimeout.value)
  }
  notificationTimeout.value = setTimeout(() => {
    hideChatNotification()
  }, 5000)
}

const hideChatNotification = () => {
  showChatNotification.value = false
  if (notificationTimeout.value) {
    clearTimeout(notificationTimeout.value)
    notificationTimeout.value = null
  }
}

const goToChat = () => {
  hideChatNotification()
  router.push('/chat')
}

const handleAvatarError = (event) => {
  event.target.src = '/placeholder-avatar.svg'
}

// Setup functions
const setupNotifications = () => {
  if (!authStore.isAuthenticated) return
  
  notificationStore.connectSocket(authStore.token)
  notificationStore.fetchUnreadCount()
}

const setupChatNotifications = () => {
  if (!authStore.isAuthenticated) return
  
  socketService.connect()
  
  socketService.onNewChatNotification((data) => {
    console.log('🔔 New chat notification:', data)
    showNewMessageNotification({
      senderName: data.senderName,
      message: data.message,
      senderAvatar: data.senderAvatar
    })
    
    chatStore.fetchChats()
  })
}

const destroyInstances = () => {
  try {
    if (dropdownInstance && typeof dropdownInstance.destroy === 'function') {
      dropdownInstance.destroy()
      dropdownInstance = null
    }
    if (sidenavInstance && typeof sidenavInstance.destroy === 'function') {
      sidenavInstance.destroy()
      sidenavInstance = null
    }
  } catch (error) {
    console.warn('Error destroying instances:', error)
  }
}

const initializeMaterialize = () => {
  if (!window.M) {
    console.warn('Materialize not available')
    return
  }

  destroyInstances()

  setTimeout(() => {
    try {
      if (authStore.isAuthenticated) {
        const dropdownElem = document.querySelector('.dropdown-trigger')
        if (dropdownElem) {
          dropdownInstance = M.Dropdown.init(dropdownElem, {
            coverTrigger: false,
            constrainWidth: false,
            hover: false,
            alignment: 'right',
            closeOnClick: true,
            inDuration: 300,
            outDuration: 200,
            onOpenStart: () => {
              showDropdown.value = true
            },
            onCloseStart: () => {
              showDropdown.value = false
            }
          })
          console.log('✅ Dropdown initialized')
        }
      }
      
      const sidenavElem = document.querySelector('.sidenav')
      if (sidenavElem) {
        sidenavInstance = M.Sidenav.init(sidenavElem)
      }
    } catch (error) {
      console.warn('Error initializing Materialize:', error)
    }
  }, 200)
}

// Watchers
watch(() => authStore.isAuthenticated, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    showDropdown.value = false
    await nextTick()
    setTimeout(initializeMaterialize, 300)
    
    if (newVal) {
      setTimeout(() => {
        setupNotifications()
        setupChatNotifications()
      }, 500)
    } else {
      notificationStore.disconnectSocket()
      notificationStore.clearNotifications()
    }
  }
})

watch(() => authStore.user, async () => {
  if (authStore.isAuthenticated) {
    await nextTick()
    setTimeout(initializeMaterialize, 300)
  }
})

watch(() => route.path, () => {
  closeDropdown()
  if (sidenavInstance) {
    sidenavInstance.close()
  }
  hideChatNotification()
})

const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeDropdown()
    hideChatNotification()
  }
}

onMounted(async () => {
  await nextTick()
  
  document.addEventListener('keydown', handleEscape)
  
  await categoryStore.fetchCategories()
  if (authStore.isAuthenticated) {
    await cartStore.fetchCart()
    
    try {
      await chatStore.fetchChats()
      setTimeout(() => {
        setupNotifications()
        setupChatNotifications()
      }, 500)
    } catch (error) {
      console.error('Error loading chat/notification data:', error)
    }
  }
  
  setTimeout(initializeMaterialize, 100)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  destroyInstances()
  
  if (notificationTimeout.value) {
    clearTimeout(notificationTimeout.value)
  }
  
  notificationStore.disconnectSocket()
})
</script>

<style scoped lang="scss">
// ✅ FIXED NAVBAR STYLES WITH PROPER Z-INDEX
.optimized-navbar {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 1000; // ✅ FIX: Ensure navbar has proper z-index
  
  .nav-wrapper {
    position: relative;
    z-index: 1001; // ✅ FIX: Nav wrapper z-index
    
    .container {
      display: flex;
      align-items: center;
      height: 64px;
      position: relative;
    }
  }
  
  // ✅ FIX: Logo với z-index cao và positioning đúng
  .brand-logo {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 1.4rem;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1050; // ✅ FIX: Logo z-index cao nhất
    color: white !important;
    text-decoration: none;
    
    &:hover {
      transform: scale(1.02);
      color: rgba(255, 255, 255, 0.9) !important;
    }
    
    i {
      margin-right: 8px;
      font-size: 28px;
    }
    
    .brand-text {
      @media (max-width: 600px) {
        display: none;
      }
    }
  }
  
  .navbar-items {
    display: flex;
    align-items: center;
    height: 100%;
    margin: 0;
    position: relative;
    z-index: 1000; // ✅ FIX: Navbar items z-index
    
    .nav-item {
      display: flex;
      align-items: center;
      height: 100%;
      margin: 0 2px;
      
      &.notification-item {
        margin: 0 4px;
        position: relative;
        z-index: 900; // ✅ FIX: Notification item z-index thấp hơn logo
      }
      
      &.user-dropdown-item {
        margin-left: 8px;
      }
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 16px;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.3s ease;
      position: relative;
      font-weight: 500;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
        color: white;
      }
      
      &.router-link-active {
        background-color: rgba(255, 255, 255, 0.15);
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: white;
          border-radius: 1px;
        }
      }
      
      i {
        margin-right: 6px;
        font-size: 20px;
      }
      
      span {
        font-size: 14px;
        
        @media (max-width: 768px) {
          display: none;
        }
      }
    }
    
    .user-trigger {
      padding: 0 12px;
      min-width: 140px;
      justify-content: space-between;
      
      &.active {
        background-color: rgba(255, 255, 255, 0.15);
      }
      
      .user-icon {
        margin-right: 8px;
        font-size: 24px;
      }
      
      .user-name {
        flex: 1;
        text-align: left;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .dropdown-arrow {
        margin-left: 4px;
        margin-right: 0;
        font-size: 18px;
        transition: transform 0.3s ease;
      }
      
      &.active .dropdown-arrow {
        transform: rotate(180deg);
      }
    }
  }
  
  .nav-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #f44336;
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 600;
    min-width: 16px;
    text-align: center;
    border: 2px solid white;
    animation: badgeBounce 0.3s ease-out;
  }
  
  // ✅ FIX: Sidenav trigger positioning
  .sidenav-trigger {
    position: relative;
    z-index: 1002;
  }
}

// ✅ FIX: User dropdown z-index
.user-dropdown-menu {
  min-width: 280px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  overflow: hidden;
  position: relative;
  z-index: 950; // ✅ FIX: Dropdown z-index thấp hơn logo
  
  .dropdown-header {
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #dee2e6;
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .user-avatar {
        font-size: 36px;
        color: #6c757d;
      }
      
      .user-details {
        display: flex;
        flex-direction: column;
        
        .user-display-name {
          font-weight: 600;
          color: #333;
          font-size: 16px;
          margin-bottom: 2px;
        }
        
        .user-email {
          color: #6c757d;
          font-size: 12px;
        }
      }
    }
  }
  
  .dropdown-link {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: #333;
    text-decoration: none;
    transition: all 0.2s ease;
    position: relative;
    
    &:hover {
      background: #f8f9fa;
      color: #1976d2;
      transform: translateX(4px);
    }
    
    i {
      margin-right: 12px;
      font-size: 18px;
      width: 18px;
      text-align: center;
    }
    
    .dropdown-badge {
      margin-left: auto;
      background: #f44336;
      color: white;
      border-radius: 8px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      min-width: 16px;
      text-align: center;
    }
    
    &.admin-link {
      color: #ff9800;
      
      &:hover {
        background: #fff3e0;
        color: #f57c00;
      }
    }
    
    &.logout-link {
      color: #f44336;
      
      &:hover {
        background: #ffebee;
        color: #d32f2f;
      }
    }
  }
  
  .divider {
    height: 1px;
    background: #dee2e6;
    margin: 8px 0;
  }
}

// ✅ MOBILE NAVIGATION
.mobile-nav {
  width: 300px;
  z-index: 1100; // ✅ FIX: Mobile nav z-index
  
  .mobile-header {
    padding: 20px;
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    
    .mobile-user-info,
    .mobile-guest-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .mobile-avatar {
        font-size: 32px;
      }
      
      .mobile-user-details {
        display: flex;
        flex-direction: column;
        
        .mobile-user-name {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 2px;
        }
        
        .mobile-user-email {
          font-size: 12px;
          opacity: 0.8;
        }
      }
    }
  }
  
  .mobile-divider {
    height: 1px;
    background: #dee2e6;
    margin: 8px 16px;
  }
  
  .mobile-link {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: #333;
    text-decoration: none;
    transition: all 0.2s ease;
    
    &:hover {
      background: #f8f9fa;
      color: #1976d2;
    }
    
    &.router-link-active {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    i {
      margin-right: 12px;
      font-size: 20px;
      width: 20px;
      text-align: center;
    }
    
    .mobile-badge {
      margin-left: auto;
      background: #f44336;
      color: white;
      border-radius: 8px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      min-width: 16px;
      text-align: center;
    }
    
    &.admin-mobile-link {
      color: #ff9800;
    }
    
    &.logout-mobile-link {
      color: #f44336;
    }
  }
}

// ✅ CHAT NOTIFICATION TOAST
// ✅ CHAT NOTIFICATION TOAST - COMPACT VERSION
.chat-notification-toast {
  position: fixed;
  top: 80px;
  right: 20px;
  background: white;
  border-radius: 8px; // Reduced from 12px
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); // Reduced shadow
  padding: 10px; // Reduced from 16px
  z-index: 10000;
  max-width: 260px; // Reduced from 320px
  cursor: pointer;
  animation: slideInRight 0.4s ease;
  border-left: 3px solid #1976d2; // Reduced from 4px
  
  &:hover {
    transform: translateX(-2px); // Reduced from -4px
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  
  .toast-content {
    display: flex;
    align-items: center;
    gap: 8px; // Reduced from 12px
    
    .toast-avatar {
      width: 32px; // Reduced from 44px
      height: 32px; // Reduced from 44px
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #f0f0f0; // Reduced from 2px
    }
    
    .toast-text {
      flex: 1;
      
      strong {
        display: block;
        font-size: 12px; // Reduced from 14px
        color: #333;
        margin-bottom: 2px; // Reduced from 4px
        font-weight: 600;
        line-height: 1.3;
      }
      
      p {
        margin: 0;
        font-size: 11px; // Reduced from 13px
        color: #666;
        line-height: 1.3; // Reduced from 1.4
        max-height: 28px; // Reduced from 40px
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
    
    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px; // Reduced from 6px
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      min-width: 20px; // Add minimum width
      
      &:hover {
        background: #f0f0f0;
        transform: scale(1.05); // Reduced from 1.1
      }
      
      i {
        font-size: 14px; // Reduced from 16px
        color: #999;
      }
    }
  }
}

// ✅ RESPONSIVE DESIGN - MOBILE COMPACT
@media (max-width: 992px) {
  .chat-notification-toast {
    right: 12px; // Reduced from 16px
    left: 12px; // Reduced from 16px
    max-width: none;
    padding: 8px; // Even smaller on mobile
    
    .toast-content {
      gap: 6px; // Smaller gap on mobile
      
      .toast-avatar {
        width: 28px; // Even smaller on mobile
        height: 28px;
      }
      
      .toast-text {
        strong {
          font-size: 11px;
        }
        
        p {
          font-size: 10px;
          max-height: 24px;
        }
      }
      
      .toast-close {
        padding: 3px;
        
        i {
          font-size: 12px;
        }
      }
    }
  }
}

// ✅ EXTRA COMPACT VERSION (Optional - if you want even smaller)
.chat-notification-toast.compact {
  max-width: 220px;
  padding: 8px;
  border-radius: 6px;
  
  .toast-content {
    gap: 6px;
    
    .toast-avatar {
      width: 28px;
      height: 28px;
    }
    
    .toast-text {
      strong {
        font-size: 11px;
        margin-bottom: 1px;
      }
      
      p {
        font-size: 10px;
        max-height: 24px;
        line-height: 1.2;
      }
    }
    
    .toast-close {
      padding: 3px;
      
      i {
        font-size: 12px;
      }
    }
  }
}

// ✅ FIX: Dropdown overlay z-index
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 949; // ✅ FIX: Overlay z-index thấp hơn dropdown
  background: transparent;
}

// ✅ ANIMATIONS
@keyframes badgeBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

// ✅ RESPONSIVE DESIGN
@media (max-width: 992px) {
  .chat-notification-toast {
    right: 16px;
    left: 16px;
    max-width: none;
  }
}
</style>