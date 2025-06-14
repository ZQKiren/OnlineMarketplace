<template>
  <nav class="nav-extended">
    <div class="nav-wrapper">
      <div class="container">
        <router-link to="/" class="brand-logo">
          <i class="material-icons">shopping_cart</i>
          Marketplace
        </router-link>
        
        <a href="#" data-target="mobile-nav" class="sidenav-trigger">
          <i class="material-icons">menu</i>
        </a>
        
        <ul class="right hide-on-med-and-down">
          <li>
            <router-link to="/products">
              <i class="material-icons left">store</i>
              Products
            </router-link>
          </li>
          
          <template v-if="authStore.isAuthenticated">
            <!-- ✅ NEW: Messages/Chat Link -->
            <li>
              <router-link to="/chat" class="chat-link">
                <i class="material-icons left">chat</i>
                Messages
                <span v-if="totalUnreadCount > 0" class="badge chat-badge">
                  {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
                </span>
              </router-link>
            </li>
            
            <li>
              <router-link to="/cart" class="cart-link">
                <i class="material-icons left">shopping_basket</i>
                Cart
                <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
              </router-link>
            </li>
            
            <li>
              <a 
                class="dropdown-trigger" 
                href="#!" 
                data-target="user-dropdown"
                @click.prevent="handleDropdownClick"
                :class="{ clicked: showDropdown }"
                :aria-expanded="showDropdown"
              >
                <i class="material-icons left">account_circle</i>
                {{ authStore.user?.name }}
                <i class="material-icons right">arrow_drop_down</i>
              </a>
            </li>
          </template>
          
          <template v-else>
            <li><router-link to="/login">Login</router-link></li>
            <li><router-link to="/register">Register</router-link></li>
          </template>
        </ul>
      </div>
    </div>
  </nav>

  <!-- User Dropdown -->
  <ul 
    id="user-dropdown" 
    class="dropdown-content" 
    :class="{ show: showDropdown }"
    v-show="authStore.isAuthenticated"
  >
    <li><a href="#!" @click.prevent="navigateTo('/profile')">My Profile</a></li>
    <li><a href="#!" @click.prevent="navigateTo('/my-products')">My Products</a></li>
    <li><a href="#!" @click.prevent="navigateTo('/orders')">My Orders</a></li>
    <li><a href="#!" @click.prevent="navigateTo('/my-reviews')">My Reviews</a></li>
    <!-- ✅ NEW: Chat in dropdown -->
    <li><a href="#!" @click.prevent="navigateTo('/chat')">My Messages</a></li>
    <li v-if="authStore.isAdmin">
      <a href="#!" @click.prevent="navigateTo('/admin/dashboard')">Admin Dashboard</a>
    </li>
    <li class="divider"></li>
    <li><a href="#!" @click.prevent="logout">Logout</a></li>
  </ul>

  <!-- Mobile Navigation -->
  <ul class="sidenav" id="mobile-nav">
    <li><router-link to="/products">Products</router-link></li>
    <template v-if="authStore.isAuthenticated">
      <!-- ✅ NEW: Messages in mobile nav -->
      <li>
        <router-link to="/chat" class="mobile-chat-link">
          Messages
          <span v-if="totalUnreadCount > 0" class="mobile-unread-badge">
            {{ totalUnreadCount }}
          </span>
        </router-link>
      </li>
      <li><router-link to="/cart">Cart ({{ cartCount }})</router-link></li>
      <li><router-link to="/profile">Profile</router-link></li>
      <li><router-link to="/orders">Orders</router-link></li>
      <li><a @click="logout">Logout</a></li>
    </template>
    <template v-else>
      <li><router-link to="/login">Login</router-link></li>
      <li><router-link to="/register">Register</router-link></li>
    </template>
  </ul>

  <!-- Click outside overlay -->
  <div 
    v-if="showDropdown" 
    class="dropdown-overlay"
    @click="closeDropdown"
  ></div>

  <!-- ✅ NEW: Chat Notification Toast -->
  <div v-if="showChatNotification" class="chat-notification-toast" @click="goToChat">
    <div class="notification-content">
      <img :src="notificationAvatar" class="notification-avatar" @error="handleAvatarError">
      <div class="notification-text">
        <strong>{{ notificationSender }}</strong>
        <p>{{ notificationMessage }}</p>
      </div>
      <button @click.stop="hideChatNotification" class="notification-close">
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
import { useChatStore } from '@/stores/chat' // ✅ NEW
import socketService from '@/services/socket.service' // ✅ NEW
import { getStaticUrl } from '@/services/api' // ✅ NEW

const authStore = useAuthStore()
const cartStore = useCartStore()
const categoryStore = useCategoryStore()
const chatStore = useChatStore() // ✅ NEW
const router = useRouter()
const route = useRoute()

const cartCount = computed(() => cartStore.itemCount)

// ✅ NEW: Chat computed properties
const totalUnreadCount = computed(() => chatStore.totalUnreadCount || 0)

// Manual dropdown control
const showDropdown = ref(false)

// ✅ NEW: Chat notification state
const showChatNotification = ref(false)
const notificationSender = ref('')
const notificationMessage = ref('')
const notificationAvatar = ref('')
const notificationTimeout = ref(null)

// Instance references
let dropdownInstance = null
let sidenavInstance = null
let tabsInstance = null

const handleDropdownClick = () => {
  console.log('🖱️ Dropdown click - Current state:', showDropdown.value)
  
  // Try Materialize first
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
  
  // Fallback to manual control
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
  
  // ✅ NEW: Disconnect socket on logout
  socketService.disconnect()
  
  await authStore.logout()
  setTimeout(initializeMaterialize, 300)
}

// ✅ NEW: Chat notification methods
const showNewMessageNotification = (data) => {
  // Only show if not currently on chat page
  if (route.path.includes('/chat')) return
  
  notificationSender.value = data.senderName || 'Someone'
  notificationMessage.value = data.message?.content || 'Sent you a message'
  notificationAvatar.value = data.senderAvatar || '/placeholder-avatar.svg'
  showChatNotification.value = true
  
  // Auto hide after 5 seconds
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

// ✅ NEW: Setup chat notifications
const setupChatNotifications = () => {
  if (!authStore.isAuthenticated) return
  
  // Connect socket service
  socketService.connect()
  
  // Listen for new message notifications
  socketService.onNewChatNotification((data) => {
    console.log('🔔 New chat notification:', data)
    showNewMessageNotification({
      senderName: data.senderName,
      message: data.message,
      senderAvatar: data.senderAvatar
    })
    
    // Update unread count
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
    if (tabsInstance && typeof tabsInstance.destroy === 'function') {
      tabsInstance.destroy()
      tabsInstance = null
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
      // Initialize dropdown ONLY if user is authenticated
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
              console.log('📖 Materialize dropdown opening')
              showDropdown.value = true
            },
            onCloseStart: () => {
              console.log('📕 Materialize dropdown closing')  
              showDropdown.value = false
            }
          })
          console.log('✅ Dropdown initialized')
        }
      }
      
      // Initialize sidenav
      const sidenavElem = document.querySelector('.sidenav')
      if (sidenavElem) {
        sidenavInstance = M.Sidenav.init(sidenavElem)
      }
      
      // Initialize tabs
      const tabsElem = document.querySelector('.tabs')
      if (tabsElem) {
        tabsInstance = M.Tabs.init(tabsElem)
      }
    } catch (error) {
      console.warn('Error initializing Materialize:', error)
    }
  }, 200)
}

// Watch for auth changes
watch(() => authStore.isAuthenticated, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    showDropdown.value = false // Reset dropdown state
    await nextTick()
    setTimeout(initializeMaterialize, 300)
    
    // ✅ NEW: Setup chat notifications when user logs in
    if (newVal) {
      setTimeout(setupChatNotifications, 500)
    }
  }
})

// Watch for user changes
watch(() => authStore.user, async () => {
  if (authStore.isAuthenticated) {
    await nextTick()
    setTimeout(initializeMaterialize, 300)
  }
})

// Close dropdown on route change
watch(() => route.path, () => {
  closeDropdown()
  if (sidenavInstance) {
    sidenavInstance.close()
  }
  // ✅ NEW: Hide chat notification when navigating
  hideChatNotification()
})

// Close dropdown on ESC key
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeDropdown()
    hideChatNotification() // ✅ NEW
  }
}

onMounted(async () => {
  await nextTick()
  
  // Add escape key listener
  document.addEventListener('keydown', handleEscape)
  
  // Fetch data first
  await categoryStore.fetchCategories()
  if (authStore.isAuthenticated) {
    await cartStore.fetchCart()
    
    // ✅ NEW: Load chat data and setup notifications
    try {
      await chatStore.fetchChats()
      setTimeout(setupChatNotifications, 500)
    } catch (error) {
      console.error('Error loading chat data:', error)
    }
  }
  
  // Initialize after data is loaded
  setTimeout(initializeMaterialize, 100)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  destroyInstances()
  
  // ✅ NEW: Clean up notification timeout
  if (notificationTimeout.value) {
    clearTimeout(notificationTimeout.value)
  }
})
</script>

<style scoped lang="scss">
nav {
  background-color: #1976d2;
  
  .brand-logo {
    display: flex;
    align-items: center;
    
    i {
      margin-right: 10px;
    }
  }
  
  .cart-link {
    position: relative;
    
    .badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #f44336;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 12px;
      min-width: 20px;
      text-align: center;
    }
  }
  
  // ✅ NEW: Chat link styling
  .chat-link {
    position: relative;
    transition: background-color 0.3s ease;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .chat-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #f44336;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 12px;
      min-width: 20px;
      text-align: center;
      animation: pulse 2s infinite;
    }
  }
}

// ✅ NEW: Mobile chat styling
.mobile-chat-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .mobile-unread-badge {
    background: #f44336;
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
  }
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: transparent;
}

// ✅ NEW: Chat notification toast
.chat-notification-toast {
  position: fixed;
  top: 80px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 12px;
  z-index: 9999;
  max-width: 300px;
  cursor: pointer;
  animation: slideInRight 0.3s ease;
  border-left: 4px solid #1976d2;
  
  &:hover {
    transform: translateX(-2px);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .notification-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #f0f0f0;
    }
    
    .notification-text {
      flex: 1;
      
      strong {
        display: block;
        font-size: 0.9rem;
        color: #333;
        margin-bottom: 2px;
      }
      
      p {
        margin: 0;
        font-size: 0.8rem;
        color: #666;
        line-height: 1.3;
        max-height: 40px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
    
    .notification-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: #f0f0f0;
      }
      
      i {
        font-size: 1rem;
        color: #999;
      }
    }
  }
}

// ✅ NEW: Animations
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
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

// Responsive improvements
@media (max-width: 992px) {
  .chat-notification-toast {
    right: 10px;
    left: 10px;
    max-width: none;
  }
}

@media (max-width: 600px) {
  .chat-notification-toast {
    top: 70px;
  }
}
</style>