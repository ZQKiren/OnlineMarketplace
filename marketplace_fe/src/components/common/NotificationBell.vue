<template>
  <div class="notification-bell-wrapper">
    <!-- Notification Bell Button -->
    <button 
      class="notification-bell-btn"
      @click="toggleDropdown"
      :class="{ 
        'has-notifications': unreadCount > 0, 
        'active': showDropdown,
        'pulse-animation': shouldPulse
      }"
      title="Thông báo"
    >
      <i class="material-icons">notifications</i>
      
      <!-- Unread Count Badge -->
      <span 
        v-if="unreadCount > 0" 
        class="notification-badge"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
      
      <!-- Connection Status Indicator -->
      <span 
        class="connection-status"
        :class="{ 'connected': isConnected, 'disconnected': !isConnected }"
        :title="isConnected ? 'Đã kết nối' : 'Mất kết nối'"
      ></span>
    </button>

    <!-- Notification Dropdown -->
    <div 
      v-if="showDropdown" 
      class="notification-dropdown"
      @click.stop
    >
      <!-- Header -->
      <div class="notification-header">
        <h6 class="notification-title">
          <i class="material-icons">notifications</i>
          Thông báo
          <span v-if="unreadCount > 0" class="unread-count">({{ unreadCount }})</span>
        </h6>
        
        <div class="notification-actions">
          <!-- Refresh Button -->
          <button 
            @click="refreshNotifications" 
            class="action-btn"
            :disabled="loading"
            title="Làm mới"
          >
            <i class="material-icons" :class="{ 'spinning': loading }">refresh</i>
          </button>
          
          <!-- Mark All Read Button -->
          <button 
            v-if="unreadCount > 0"
            @click="markAllAsRead" 
            class="action-btn mark-all-btn"
            title="Đánh dấu tất cả đã đọc"
          >
            <i class="material-icons">done_all</i>
          </button>
          
          <!-- Settings Button -->
          <button 
            @click="goToNotifications" 
            class="action-btn"
            title="Xem tất cả"
          >
            <i class="material-icons">settings</i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="notification-loading">
        <div class="loading-spinner"></div>
        <p>Đang tải thông báo...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!recentNotifications.length" class="notification-empty">
        <i class="material-icons">notifications_none</i>
        <p>Không có thông báo mới</p>
        <button @click="refreshNotifications" class="refresh-btn">
          <i class="material-icons">refresh</i>
          Làm mới
        </button>
      </div>

      <!-- Notifications List -->
      <div v-else class="notification-list">
        <div 
          v-for="notification in recentNotifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 
            'unread': !notification.isRead,
            'global': notification.isGlobal,
            'priority-high': notification.priority === 'HIGH'
          }"
          @click="handleNotificationClick(notification)"
        >
          <!-- Notification Icon -->
          <div class="notification-icon">
            <i class="material-icons" :class="getNotificationIconClass(notification.type)">
              {{ getNotificationIcon(notification.type) }}
            </i>
          </div>

          <!-- Notification Content -->
          <div class="notification-content">
            <h6 class="notification-item-title">{{ notification.title }}</h6>
            <p class="notification-message">{{ notification.message }}</p>
            
            <div class="notification-meta">
              <span class="notification-time">
                {{ formatTime(notification.createdAt) }}
              </span>
              <span v-if="notification.type" class="notification-type">
                {{ formatType(notification.type) }}
              </span>
            </div>
          </div>

          <!-- Unread Indicator -->
          <div v-if="!notification.isRead" class="unread-indicator"></div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="recentNotifications.length" class="notification-footer">
        <button @click="goToNotifications" class="view-all-btn">
          <i class="material-icons">visibility</i>
          Xem tất cả thông báo
        </button>
      </div>

      <!-- Connection Status -->
      <div class="connection-info" :class="{ 'connected': isConnected }">
        <i class="material-icons">
          {{ isConnected ? 'wifi' : 'wifi_off' }}
        </i>
        <span>
          {{ isConnected ? 'Đã kết nối' : 'Mất kết nối' }}
        </span>
        <button 
          v-if="!isConnected" 
          @click="reconnectSocket" 
          class="reconnect-btn"
        >
          Kết nối lại
        </button>
      </div>
    </div>

    <!-- Click Outside Overlay -->
    <div 
      v-if="showDropdown" 
      class="notification-overlay"
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()

// Local state
const showDropdown = ref(false)
const shouldPulse = ref(false)
const pulseTimeout = ref(null)

// Computed properties
const unreadCount = computed(() => notificationStore.unreadCount)
const recentNotifications = computed(() => notificationStore.recentNotifications)
const loading = computed(() => notificationStore.loading)
const isConnected = computed(() => notificationStore.isConnected)

// ✅ FIX: Control pulse animation properly
watch(() => unreadCount.value, (newCount, oldCount) => {
  console.log('🔔 Unread count changed:', { oldCount, newCount })
  
  // Clear any existing timeout
  if (pulseTimeout.value) {
    clearTimeout(pulseTimeout.value)
    pulseTimeout.value = null
  }
  
  // Only pulse when count increases (new notification received)
  if (newCount > 0 && oldCount !== undefined && newCount > oldCount) {
    console.log('✨ Starting pulse animation for new notification')
    shouldPulse.value = true
    
    // Stop pulsing after 3 seconds
    pulseTimeout.value = setTimeout(() => {
      shouldPulse.value = false
      console.log('🛑 Stopped pulse animation')
    }, 3000)
  } else if (newCount === 0) {
    // Stop pulsing immediately when no unread notifications
    shouldPulse.value = false
    console.log('🛑 No unread notifications, stopped pulse')
  }
})

// Methods
const toggleDropdown = async () => {
  showDropdown.value = !showDropdown.value
  
  // Stop pulsing when user opens dropdown
  if (showDropdown.value) {
    shouldPulse.value = false
    if (pulseTimeout.value) {
      clearTimeout(pulseTimeout.value)
      pulseTimeout.value = null
    }
    await refreshNotifications()
  }
}

const closeDropdown = () => {
  showDropdown.value = false
}

const refreshNotifications = async () => {
  try {
    await notificationStore.refreshData()
  } catch (error) {
    console.error('Error refreshing notifications:', error)
  }
}

const markAllAsRead = async () => {
  try {
    await notificationStore.markAllAsRead()
    // Animation will stop automatically due to watch on unreadCount
  } catch (error) {
    console.error('Error marking all as read:', error)
  }
}

const handleNotificationClick = async (notification) => {
  // Mark as read if unread
  if (!notification.isRead) {
    await notificationStore.markAsRead(notification.id)
  }
  
  // Handle navigation based on notification type
  if (notification.metadata?.orderId) {
    router.push(`/orders/${notification.metadata.orderId}`)
  } else if (notification.metadata?.productId) {
    router.push(`/products/${notification.metadata.productId}`)
  } else {
    router.push('/notifications')
  }
  
  closeDropdown()
}

const goToNotifications = () => {
  router.push('/notifications')
  closeDropdown()
}

const reconnectSocket = () => {
  if (authStore.token) {
    notificationStore.connectSocket(authStore.token)
  }
}

// ✅ IMPROVED: Utility methods
const getNotificationIcon = (type) => {
  const icons = {
    'ORDER_UPDATE': 'shopping_cart',
    'NEW_PRODUCT': 'new_releases',
    'PRICE_DROP': 'local_offer',
    'STOCK_ALERT': 'warning',
    'SYSTEM_UPDATE': 'info',
    'PROMOTION': 'campaign',
    'MESSAGE': 'message',
    'REMINDER': 'schedule',
    'SECURITY': 'security',
    'PAYMENT': 'payment'
  }
  return icons[type] || 'notifications'
}

const getNotificationIconClass = (type) => {
  const classes = {
    'ORDER_UPDATE': 'icon-order',
    'NEW_PRODUCT': 'icon-new',
    'PRICE_DROP': 'icon-sale',
    'STOCK_ALERT': 'icon-warning',
    'SYSTEM_UPDATE': 'icon-info',
    'PROMOTION': 'icon-promo',
    'MESSAGE': 'icon-message',
    'REMINDER': 'icon-reminder',
    'SECURITY': 'icon-security',
    'PAYMENT': 'icon-payment'
  }
  return classes[type] || 'icon-default'
}

const formatType = (type) => {
  const types = {
    'ORDER_UPDATE': 'Đơn hàng',
    'NEW_PRODUCT': 'Sản phẩm mới',
    'PRICE_DROP': 'Giảm giá',
    'STOCK_ALERT': 'Tồn kho',
    'SYSTEM_UPDATE': 'Hệ thống',
    'PROMOTION': 'Khuyến mãi',
    'MESSAGE': 'Tin nhắn',
    'REMINDER': 'Nhắc nhở',
    'SECURITY': 'Bảo mật',
    'PAYMENT': 'Thanh toán'
  }
  return types[type] || 'Thông báo'
}

const formatTime = (timestamp) => {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = Math.floor((now - time) / 1000) // seconds

  if (diff < 60) return 'Vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`
  
  return time.toLocaleDateString('vi-VN')
}

// Cleanup on unmount
onUnmounted(() => {
  closeDropdown()
  if (pulseTimeout.value) {
    clearTimeout(pulseTimeout.value)
    pulseTimeout.value = null
  }
})
</script>

<style scoped lang="scss">
.notification-bell-wrapper {
  position: relative;
  display: inline-block;
  margin: 0 4px; // ✅ Better spacing
}

.notification-bell-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px; // ✅ Fixed size for consistency
  height: 44px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
  }

  &.active {
    background-color: rgba(255, 255, 255, 0.2);
  }

  // ✅ FIX: Controlled pulse animation
  &.pulse-animation {
    animation: bellPulse 2s ease-in-out infinite;
  }

  // ✅ REMOVED: has-notifications class animation (causes unwanted shaking)

  i {
    font-size: 22px; // ✅ Slightly smaller for better balance
  }
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #f44336;
  color: white;
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
  border: 2px solid white;
  line-height: 1.2;
  
  // ✅ Smooth appear animation
  animation: badgeAppear 0.3s ease-out;
}

.connection-status {
  position: absolute;
  bottom: 2px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1px solid white;
  transition: all 0.3s ease;

  &.connected {
    background: #4caf50;
    box-shadow: 0 0 3px rgba(76, 175, 80, 0.6);
  }

  &.disconnected {
    background: #f44336;
    animation: statusBlink 2s ease-in-out infinite;
  }
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-width: 90vw;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border: 1px solid #e0e0e0;
  max-height: 500px;
  overflow: hidden;
  animation: dropdownSlide 0.3s ease;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);

  .notification-title {
    margin: 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      font-size: 20px;
      color: #1976d2;
    }

    .unread-count {
      color: #f44336;
      font-size: 14px;
      font-weight: 500;
    }
  }

  .notification-actions {
    display: flex;
    gap: 6px;
  }

  .action-btn {
    background: none;
    border: none;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    color: #666;
    transition: all 0.2s ease;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #e3f2fd;
      color: #1976d2;
      transform: scale(1.1);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    i {
      font-size: 16px;

      &.spinning {
        animation: spin 1s linear infinite;
      }
    }

    &.mark-all-btn {
      color: #4caf50;

      &:hover {
        background: #e8f5e8;
        color: #2e7d32;
      }
    }
  }
}

.notification-loading {
  padding: 40px 20px;
  text-align: center;
  color: #666;

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 2px solid #f0f0f0;
    border-top: 2px solid #1976d2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.notification-empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;

  i {
    font-size: 42px;
    color: #ddd;
    margin-bottom: 12px;
  }

  p {
    margin: 0 0 16px;
    font-size: 14px;
  }

  .refresh-btn {
    background: #1976d2;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 auto;
    transition: all 0.2s ease;

    &:hover {
      background: #1565c0;
      transform: translateY(-1px);
    }
  }
}

.notification-list {
  max-height: 320px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f9f9f9;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
    
    &:hover {
      background: #a1a1a1;
    }
  }
}

.notification-item {
  display: flex;
  padding: 14px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: #f8f9fa;
    transform: translateX(2px);
  }

  &.unread {
    background: linear-gradient(90deg, #f3f8ff 0%, #ffffff 100%);
    border-left: 3px solid #1976d2;

    &:hover {
      background: linear-gradient(90deg, #e3f2fd 0%, #f8f9fa 100%);
    }
  }

  &.priority-high {
    border-left-color: #f44336;
    
    &.unread {
      background: linear-gradient(90deg, #fff3f3 0%, #ffffff 100%);
      
      &:hover {
        background: linear-gradient(90deg, #ffebee 0%, #f8f9fa 100%);
      }
    }
  }

  &.global {
    .notification-icon i {
      color: #ff9800;
    }
  }

  &:last-child {
    border-bottom: none;
  }
}

.notification-icon {
  margin-right: 14px;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
  
  i {
    font-size: 18px;
    color: #666;
    width: 18px;
    text-align: center;
    
    // ✅ Icon color coding
    &.icon-order { color: #2196f3; }
    &.icon-new { color: #4caf50; }
    &.icon-sale { color: #ff5722; }
    &.icon-warning { color: #ff9800; }
    &.icon-info { color: #9c27b0; }
    &.icon-promo { color: #e91e63; }
    &.icon-message { color: #00bcd4; }
    &.icon-reminder { color: #795548; }
    &.icon-security { color: #f44336; }
    &.icon-payment { color: #607d8b; }
  }
}

.notification-content {
  flex: 1;
  min-width: 0;

  .notification-item-title {
    margin: 0 0 4px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    line-height: 1.3;
  }

  .notification-message {
    margin: 0 0 8px;
    font-size: 13px;
    color: #666;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .notification-meta {
    display: flex;
    gap: 10px;
    font-size: 11px;
    color: #999;
    align-items: center;

    .notification-type {
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 8px;
      font-weight: 500;
      font-size: 10px;
    }
  }
}

.unread-indicator {
  width: 6px;
  height: 6px;
  background: #1976d2;
  border-radius: 50%;
  margin-left: 8px;
  flex-shrink: 0;
  margin-top: 10px;
  box-shadow: 0 0 4px rgba(25, 118, 210, 0.4);
}

.notification-footer {
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;

  .view-all-btn {
    width: 100%;
    background: none;
    border: 1px solid #1976d2;
    color: #1976d2;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: #1976d2;
      color: white;
      transform: translateY(-1px);
    }
  }
}

.connection-info {
  padding: 8px 20px;
  background: #fff3cd;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #856404;

  &.connected {
    background: #d4edda;
    color: #155724;
  }

  i {
    font-size: 14px;
  }

  .reconnect-btn {
    margin-left: auto;
    background: #ffc107;
    color: #212529;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #e0a800;
      transform: translateY(-1px);
    }
  }
}

.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: transparent;
}

// ✅ IMPROVED ANIMATIONS
@keyframes bellPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

@keyframes badgeAppear {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes statusBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// ✅ RESPONSIVE IMPROVEMENTS
@media (max-width: 480px) {
  .notification-dropdown {
    width: 340px;
    right: -10px;
  }
  
  .notification-bell-btn {
    width: 40px;
    height: 40px;
    
    i {
      font-size: 20px;
    }
  }
}
</style>