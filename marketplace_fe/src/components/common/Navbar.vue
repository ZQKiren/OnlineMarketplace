<template>
  <nav class="nav-extended optimized-navbar">
    <div class="nav-wrapper">
      <div class="container">
        <!-- Logo với z-index cao hơn -->
        <router-link to="/" class="brand-logo" @click="handleLogoClick">
          <ShoppingCart class="brand-icon" />
          <span class="brand-text">Marketplace</span>
        </router-link>

        <a href="#" data-target="mobile-nav" class="sidenav-trigger">
          <Menu class="menu-icon" />
        </a>

        <ul class="right hide-on-med-and-down navbar-items">
          <!-- Products Link -->
          <li class="nav-item">
            <router-link to="/products" class="nav-link">
              <Store class="nav-icon" />
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
                <MessageCircle class="nav-icon" />
                <span>Messages</span>
                <span v-if="totalUnreadCount > 0" class="nav-badge">
                  {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
                </span>
              </router-link>
            </li>

            <!-- Cart Link -->
            <li class="nav-item">
              <router-link to="/cart" class="nav-link cart-link">
                <ShoppingBasket class="nav-icon" />
                <span>Cart</span>
                <span v-if="cartCount > 0" class="nav-badge" :class="{ 'large-count': cartCount > 99 }">
                  {{ cartCount > 99 ? '99+' : cartCount }}
                </span>
              </router-link>
            </li>

            <!-- User Dropdown -->
            <li class="nav-item user-dropdown-item">
              <a class="dropdown-trigger nav-link user-trigger" href="#!" data-target="user-dropdown"
                @click.prevent="handleDropdownClick" :class="{ active: showDropdown }" :aria-expanded="showDropdown">
                <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" alt="avatar" class="navbar-avatar" @error="onAvatarError" />
                <UserCircle v-else class="user-icon" />
                <span class="user-name">{{ authStore.user?.name || 'User' }}</span>
                <ChevronDown class="dropdown-arrow" />
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
  <ul id="user-dropdown" class="dropdown-content user-dropdown-menu" :class="{ show: showDropdown }"
    v-show="authStore.isAuthenticated">
    <li class="dropdown-header">
      <div class="user-info">
        <UserCircle class="user-avatar" />
        <div class="user-details">
          <span class="user-display-name">{{ authStore.user?.name }}</span>
          <span class="user-email">{{ authStore.user?.email }}</span>
        </div>
      </div>
    </li>

    <li class="divider"></li>

    <li><a href="#!" @click.prevent="navigateTo('/profile')" class="dropdown-link">
        <User class="dropdown-icon" />My Profile
      </a></li>

    <li><a href="#!" @click.prevent="navigateTo('/my-products')" class="dropdown-link">
        <Package class="dropdown-icon" />My Products
      </a></li>

    <li><a href="#!" @click.prevent="navigateTo('/orders')" class="dropdown-link">
        <Receipt class="dropdown-icon" />My Orders
      </a></li>

    <li><a href="#!" @click.prevent="navigateTo('/my-reviews')" class="dropdown-link">
        <MessageSquare class="dropdown-icon" />My Reviews
      </a></li>

    <li><a href="#!" @click.prevent="navigateTo('/notifications')" class="dropdown-link">
        <Bell class="dropdown-icon" />My Notifications
        <span v-if="notificationUnreadCount > 0" class="dropdown-badge">
          {{ notificationUnreadCount }}
        </span>
      </a></li>

    <li><a href="#!" @click.prevent="navigateTo('/chat')" class="dropdown-link">
        <MessageCircle class="dropdown-icon" />My Messages
        <span v-if="totalUnreadCount > 0" class="dropdown-badge">
          {{ totalUnreadCount }}
        </span>
      </a></li>

    <li v-if="authStore.isAdmin" class="divider"></li>
    <li v-if="authStore.isAdmin">
      <a href="#!" @click.prevent="navigateTo('/admin/dashboard')" class="dropdown-link admin-link">
        <Shield class="dropdown-icon" />Admin Dashboard
      </a>
    </li>

    <li class="divider"></li>
    <li>
      <a href="#!" @click.prevent="logout" class="dropdown-link logout-link">
        <LogOut class="dropdown-icon" />Logout
      </a>
    </li>
  </ul>

  <!-- Mobile Navigation -->
  <ul class="sidenav mobile-nav" id="mobile-nav">
    <li class="mobile-header">
      <div class="mobile-user-info" v-if="authStore.isAuthenticated">
        <UserCircle class="mobile-avatar" />
        <div class="mobile-user-details">
          <span class="mobile-user-name">{{ authStore.user?.name }}</span>
          <span class="mobile-user-email">{{ authStore.user?.email }}</span>
        </div>
      </div>
      <div v-else class="mobile-guest-info">
        <UserX class="mobile-guest-icon" />
        <span>Guest User</span>
      </div>
    </li>

    <li class="mobile-divider"></li>

    <li><router-link to="/products" class="mobile-link">
        <Store class="mobile-icon" />Products
      </router-link></li>

    <template v-if="authStore.isAuthenticated">
      <li>
        <router-link to="/notifications" class="mobile-link mobile-notification-link">
          <Bell class="mobile-icon" />
          <span>Notifications</span>
          <span v-if="notificationUnreadCount > 0" class="mobile-badge">
            {{ notificationUnreadCount }}
          </span>
        </router-link>
      </li>

      <li>
        <router-link to="/chat" class="mobile-link mobile-chat-link">
          <MessageCircle class="mobile-icon" />
          <span>Messages</span>
          <span v-if="totalUnreadCount > 0" class="mobile-badge">
            {{ totalUnreadCount }}
          </span>
        </router-link>
      </li>

      <li><router-link to="/cart" class="mobile-link">
          <ShoppingBasket class="mobile-icon" />Cart ({{ cartCount }})
        </router-link></li>

      <li class="mobile-divider"></li>

      <li><router-link to="/profile" class="mobile-link">
          <User class="mobile-icon" />Profile
        </router-link></li>

      <li><router-link to="/orders" class="mobile-link">
          <Receipt class="mobile-icon" />Orders
        </router-link></li>

      <li v-if="authStore.isAdmin"><router-link to="/admin/dashboard" class="mobile-link admin-mobile-link">
          <Shield class="mobile-icon" />Admin Dashboard
        </router-link></li>

      <li class="mobile-divider"></li>

      <li><a @click="logout" class="mobile-link logout-mobile-link">
          <LogOut class="mobile-icon" />Logout
        </a></li>
    </template>

    <template v-else>
      <li><router-link to="/login" class="mobile-link">
          <LogIn class="mobile-icon" />Login
        </router-link></li>
      <li><router-link to="/register" class="mobile-link">
          <UserPlus class="mobile-icon" />Register
        </router-link></li>
    </template>
  </ul>

  <!-- Click outside overlay -->
  <div v-if="showDropdown" class="dropdown-overlay" @click="closeDropdown"></div>

  <!-- Chat Notification Toast -->
  <div v-if="showChatNotification" class="chat-notification-toast" @click="goToChat">
    <div class="toast-content">
      <img :src="notificationAvatar" class="toast-avatar" @error="handleAvatarError">
      <div class="toast-text">
        <strong>{{ notificationSender }}</strong>
        <p>{{ notificationMessage }}</p>
      </div>
      <button @click.stop="hideChatNotification" class="toast-close">
        <X class="toast-close-icon" />
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

// Lucide Icons
import {
  ShoppingCart,
  Menu,
  Store,
  MessageCircle,
  ShoppingBasket,
  UserCircle,
  ChevronDown,
  User,
  Package,
  Receipt,
  MessageSquare,
  Bell,
  Shield,
  LogOut,
  UserX,
  LogIn,
  UserPlus,
  X
} from 'lucide-vue-next'

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
  if (dropdownInstance) {
    try {
      if (dropdownInstance.isOpen) {
        dropdownInstance.close()
        showDropdown.value = false
      } else {
        dropdownInstance.open()
        showDropdown.value = true
      }
      return
    } catch (error) {
      console.warn('Materialize dropdown failed:', error)
    }
  }

  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
  if (dropdownInstance && dropdownInstance.isOpen) {
    dropdownInstance.close()
  }
}

const navigateTo = (path) => {
  closeDropdown()
  router.push(path)
}

const logout = async () => {
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

const handleLogoClick = (event) => {
  event.currentTarget.blur();
};

const handleAvatarError = (event) => {
  event.target.src = '/placeholder-avatar.svg'
}

const onAvatarError = (e) => {
  e.target.src = '/placeholder-avatar.svg'
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
// FIXED NAVBAR STYLES WITH PROPER Z-INDEX
// Fixed CSS for navigation badge positioning
.optimized-navbar {
  .navbar-items {
    .nav-item {
      position: relative; // Quan trọng: đảm bảo nav-item có relative positioning

      .nav-link {
        display: flex;
        align-items: center;
        position: relative; // Đảm bảo nav-link cũng có relative positioning

        // Cart và Messages links cần special handling
        &.cart-link,
        &.chat-link {
          .nav-badge {
            position: absolute;
            top: 4px; // Điều chỉnh từ 8px xuống 4px
            right: 4px; // Điều chỉnh từ 8px xuống 4px
            background: #f44336;
            color: white;
            border-radius: 10px;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 600;
            min-width: 16px;
            height: 16px; // Thêm height cố định
            text-align: center;
            border: 2px solid white;
            line-height: 12px; // Thêm line-height để center text
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10; // Đảm bảo badge luôn ở trên
            animation: badgeBounce 0.3s ease-out;

            // Đảm bảo text không bị wrap
            white-space: nowrap;
            overflow: hidden;

            // Fix cho số lớn
            &.large-count {
              padding: 1px 4px;
              font-size: 9px;
              min-width: 18px;
              height: 14px;
              line-height: 12px;
            }
          }
        }
        .nav-icon {
          margin-right: 8px;
          width: 20px;
          height: 20px;
        }
      }
    }
  }
}

// Mobile badge positioning
@media (max-width: 768px) {
  .optimized-navbar {
    .navbar-items {
      .nav-link {

        &.cart-link,
        &.chat-link {
          .nav-badge {
            top: 2px;
            right: 2px;
            font-size: 9px;
            padding: 1px 4px;
            min-width: 14px;
            height: 14px;
            line-height: 12px;
          }
        }
      }
    }
  }
}

// Mobile navigation badge fix
.mobile-nav {
  .mobile-link {
    .mobile-badge {
      margin-left: auto;
      background: #f44336;
      color: white;
      border-radius: 8px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      min-width: 16px;
      height: 16px;
      text-align: center;
      line-height: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

// User dropdown z-index
.user-dropdown-menu {
  min-width: 280px;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(25, 118, 210, 0.15);
  border: 1px solid #e0e0e0;
  overflow: hidden;
  position: relative;
  z-index: 950;
  background: #fff;

  .dropdown-header {
    padding: 20px 24px 14px 24px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e3eaf5 100%);
    border-bottom: 2px solid #e3eaf5;
    display: flex;
    align-items: center;
    gap: 14px;
    .user-info {
      display: flex;
      align-items: center;
      gap: 14px;
      .user-avatar {
        width: 44px;
        height: 44px;
        color: #1976d2;
      }
      .user-details {
        display: flex;
        flex-direction: column;
        .user-display-name {
          font-weight: 700;
          color: #222;
          font-size: 18px;
          margin-bottom: 2px;
        }
        .user-email {
          color: #6c757d;
          font-size: 13px;
        }
      }
    }
  }
  .dropdown-link {
    display: flex;
    align-items: center;
    padding: 14px 24px;
    color: #333;
    text-decoration: none;
    transition: all 0.2s;
    position: relative;
    font-size: 15px;
    gap: 12px;
    &:hover {
      background: #f5faff;
      color: #1976d2;
      .dropdown-icon {
        color: #1976d2;
      }
    }
    .dropdown-icon {
      margin-right: 12px;
      width: 20px;
      height: 20px;
      color: #90a4ae;
      transition: color 0.2s;
    }
    .dropdown-badge {
      margin-left: auto;
      background: #f44336;
      color: white;
      border-radius: 8px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 700;
      min-width: 18px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(244,67,54,0.12);
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

// MOBILE NAVIGATION
.mobile-nav {
  width: 300px;
  z-index: 1100;

  .mobile-header {
    padding: 20px;
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;

    .mobile-user-info,
    .mobile-guest-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .mobile-avatar,
      .mobile-guest-icon {
        width: 32px;
        height: 32px;
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

    .mobile-icon {
      margin-right: 12px;
      width: 20px;
      height: 20px;
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

// CHAT NOTIFICATION TOAST - COMPACT VERSION
.chat-notification-toast {
  position: fixed;
  top: 80px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 10px;
  z-index: 10000;
  max-width: 260px;
  cursor: pointer;
  animation: slideInRight 0.4s ease;
  border-left: 3px solid #1976d2;

  &:hover {
    transform: translateX(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 8px;

    .toast-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #f0f0f0;
    }

    .toast-text {
      flex: 1;

      strong {
        display: block;
        font-size: 12px;
        color: #333;
        margin-bottom: 2px;
        font-weight: 600;
        line-height: 1.3;
      }

      p {
        margin: 0;
        font-size: 11px;
        color: #666;
        line-height: 1.3;
        max-height: 28px;
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
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      min-width: 20px;

      &:hover {
        background: #f0f0f0;
        transform: scale(1.05);
      }

      .toast-close-icon {
        width: 14px;
        height: 14px;
        color: #999;
      }
    }
  }
}

// RESPONSIVE DESIGN - MOBILE COMPACT
@media (max-width: 992px) {
  .chat-notification-toast {
    right: 12px;
    left: 12px;
    max-width: none;
    padding: 8px;

    .toast-content {
      gap: 6px;

      .toast-avatar {
        width: 28px;
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

        .toast-close-icon {
          width: 12px;
          height: 12px;
        }
      }
    }
  }
}

// EXTRA COMPACT VERSION (Optional - if you want even smaller)
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

      .toast-close-icon {
        width: 12px;
        height: 12px;
      }
    }
  }
}

// Dropdown overlay z-index
.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 949;
  background: transparent;
}

// ANIMATIONS
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

.navbar-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
  border: 1.5px solid #e3eaf5;
  background: #fff;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: color 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  max-width: 100%;
  overflow: hidden;
  outline: none;
  border: none;
}
@media (max-width: 600px) {
  .brand-logo {
    max-width: 100%;
    overflow: hidden;
    padding-left: 0;
    padding-right: 0;
  }
}
.brand-logo:focus, .brand-logo:active,
button:focus, button:active,
.nav-link:focus, .nav-link:active {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
}
.brand-logo .brand-icon,
.brand-logo .brand-text {
  transition: color 0.2s, transform 0.2s, box-shadow 0.2s;
}
.brand-logo:hover .brand-icon,
.brand-logo:focus .brand-icon {
  color: #ff9800 !important;
  transform: none;
  box-shadow: none;
}
.brand-logo:hover .brand-text,
.brand-logo:focus .brand-text {
  color: #ff9800 !important;
  transform: none;
  box-shadow: none;
}
</style>