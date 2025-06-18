import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationService } from '../services/notification.service'
import { useToast } from 'vue-toastification'
import { io } from 'socket.io-client'

export const useNotificationStore = defineStore('notification', () => {
  const toast = useToast()

  // State
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const socket = ref(null)
  const isConnected = ref(false)
  const connectionAttempts = ref(0)
  const maxRetries = 5

  // ✅ FIX: Animation control state
  const lastNotificationTime = ref(0)
  const shouldShowAnimation = ref(false)

  // Getters
  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.isRead)
  )

  const recentNotifications = computed(() =>
    notifications.value.slice(0, 5)
  )

  // ✅ IMPROVED: Actions with better state management
  const fetchNotifications = async (query = {}) => {
    try {
      loading.value = true
      const response = await notificationService.getNotifications(query)

      // ✅ FIX: Update notifications without triggering animation for initial load
      const wasEmpty = notifications.value.length === 0
      notifications.value = response.data

      // Don't show animation for initial load
      if (wasEmpty) {
        shouldShowAnimation.value = false
      }

      return response
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Không thể tải thông báo')
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount()
      const newCount = response.unreadCount

      // ✅ FIX: Only update if count actually changed
      if (unreadCount.value !== newCount) {
        const oldCount = unreadCount.value
        unreadCount.value = newCount

        console.log('📊 Unread count updated:', { oldCount, newCount })

        // ✅ FIX: Only trigger animation for increases (new notifications)
        if (newCount > oldCount && oldCount > 0) {
          triggerNewNotificationAnimation()
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  // ✅ FIX: Controlled animation trigger
  const triggerNewNotificationAnimation = () => {
    const now = Date.now()

    // Prevent spam animations (max 1 per 2 seconds)
    if (now - lastNotificationTime.value < 2000) {
      console.log('🚫 Animation throttled')
      return
    }

    lastNotificationTime.value = now
    shouldShowAnimation.value = true

    console.log('✨ Triggering notification animation')

    // Stop animation after 3 seconds
    setTimeout(() => {
      shouldShowAnimation.value = false
      console.log('🛑 Animation stopped')
    }, 3000)
  }

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)

      // Update local state
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification && !notification.isRead) {
        notification.isRead = true
        notification.readAt = new Date().toISOString()

        // ✅ FIX: Properly decrease unread count
        const newCount = Math.max(0, unreadCount.value - 1)
        unreadCount.value = newCount

        console.log('✅ Marked as read locally, new unread count:', newCount)

        // ✅ FIX: Stop animation when no unread notifications
        if (newCount === 0) {
          shouldShowAnimation.value = false
        }
      }

    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Không thể đánh dấu đã đọc')
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()

      // Update local state
      let updatedCount = 0
      notifications.value.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true
          notification.readAt = new Date().toISOString()
          updatedCount++
        }
      })

      // ✅ FIX: Reset everything when marking all as read
      unreadCount.value = 0
      shouldShowAnimation.value = false

      console.log(`✅ Marked ${updatedCount} notifications as read`)
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc')

    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Không thể đánh dấu tất cả đã đọc')
    }
  }

  // ✅ IMPROVED: Better notification handling
  const addNotification = (notification) => {
    console.log('📨 Adding new notification to store:', notification)

    // Check if notification already exists
    const existingIndex = notifications.value.findIndex(n => n.id === notification.id)
    if (existingIndex !== -1) {
      console.log('⚠️ Notification already exists, updating...')
      notifications.value[existingIndex] = { ...notification, isRead: false }
    } else {
      // Add to beginning of array
      notifications.value.unshift({ ...notification, isRead: false })
      console.log('✅ New notification added to store')
    }

    // ✅ FIX: Increment unread count and trigger animation
    const newCount = unreadCount.value + 1
    unreadCount.value = newCount

    // ✅ Always trigger animation for new notifications
    triggerNewNotificationAnimation()

    console.log('📊 New unread count:', newCount)
  }

  // ✅ IMPROVED: WebSocket connection with better error handling
  const connectSocket = (token) => {
    if (socket.value?.connected) {
      console.log('🔌 Socket already connected')
      return
    }

    if (!token) {
      console.error('❌ No token provided for socket connection')
      return
    }

    console.log('🔌 Connecting to notification socket...')
    console.log('🔗 API URL:', import.meta.env.VITE_API_URL)

    // Clean token
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token

    socket.value = io(import.meta.env.VITE_API_URL, {
      auth: { token: cleanToken },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: maxRetries,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // ✅ REMOVE: path: '/notifications', // Remove this line
      // ✅ REMOVE: namespace: '/notifications', // Remove this line
      autoConnect: true,
      forceNew: false,
    })
    // ✅ Connection event handlers
    socket.value.on('connect', () => {
      console.log('✅ Connected to notification socket:', socket.value.id)
      isConnected.value = true
      connectionAttempts.value = 0

      // Test connection
      socket.value.emit('ping')

      // Initial data fetch after connection
      setTimeout(() => {
        fetchUnreadCount()
      }, 1000)
    })

    socket.value.on('connected', (data) => {
      console.log('✅ Socket connection confirmed:', data)
      toast.success('Kết nối thông báo thành công!', { timeout: 2000 })
    })

    socket.value.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from notification socket:', reason)
      isConnected.value = false
    })

    socket.value.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
      isConnected.value = false
      connectionAttempts.value++

      if (connectionAttempts.value >= maxRetries) {
        console.error('❌ Max connection attempts reached')
        toast.error('Không thể kết nối thông báo real-time')
      }
    })

    socket.value.on('error', (error) => {
      console.error('❌ Socket error:', error)
      toast.error(error.message || 'Lỗi kết nối thông báo')
    })

    // ✅ IMPROVED: Notification event handlers
    socket.value.on('new-notification', (notification) => {
      console.log('📨 Received new notification via socket:', notification)

      // Add notification and trigger animation
      addNotification(notification)

      // Show toast with better configuration
      toast.info(notification.title, {
        timeout: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        hideProgressBar: false,
        icon: '🔔'
      })
    })

    // ✅ IMPROVED: Unread count updates
    socket.value.on('unread-count-update', (data) => {
      console.log('📊 Received unread count update:', data)

      const newCount = data.unreadCount
      const oldCount = unreadCount.value

      // ✅ FIX: Only update if different and don't trigger animation for server updates
      if (oldCount !== newCount) {
        unreadCount.value = newCount
        console.log('📊 Unread count synchronized:', { oldCount, newCount })

        // Stop animation if count reaches zero
        if (newCount === 0) {
          shouldShowAnimation.value = false
        }
      }
    })

    // ✅ Notification read confirmations
    socket.value.on('notification-read', (data) => {
      console.log('✅ Notification read confirmation:', data)
      const notification = notifications.value.find(n => n.id === data.notificationId)
      if (notification) {
        notification.isRead = true
        notification.readAt = new Date(data.timestamp).toISOString()
      }
    })

    // ✅ Test connection with ping/pong
    socket.value.on('pong', (data) => {
      console.log('🏓 Pong received:', data)
    })

    // ✅ Periodic ping to keep connection alive
    socket.value.on('connect', () => {
      const pingInterval = setInterval(() => {
        if (socket.value?.connected) {
          socket.value.emit('ping')
        } else {
          clearInterval(pingInterval)
        }
      }, 30000)
    })
  }

  const disconnectSocket = () => {
    if (socket.value) {
      console.log('🔌 Disconnecting socket...')
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
      connectionAttempts.value = 0
    }
  }

  // ✅ IMPROVED: Clear with animation reset
  const clearNotifications = () => {
    console.log('🧹 Clearing all notifications from store')
    notifications.value = []
    unreadCount.value = 0
    shouldShowAnimation.value = false
    lastNotificationTime.value = 0
  }

  // ✅ Manual animation control
  const stopAnimation = () => {
    shouldShowAnimation.value = false
    console.log('🛑 Animation manually stopped')
  }

  const startAnimation = () => {
    if (unreadCount.value > 0) {
      triggerNewNotificationAnimation()
    }
  }

  // ✅ Test methods
  const testSocketConnection = () => {
    if (socket.value?.connected) {
      console.log('🧪 Testing socket connection...')
      socket.value.emit('ping')
      return true
    } else {
      console.log('❌ Socket not connected')
      return false
    }
  }

  const refreshData = async () => {
    console.log('🔄 Refreshing notification data...')
    try {
      await Promise.all([
        fetchNotifications(),
        fetchUnreadCount()
      ])
      console.log('✅ Notification data refreshed')
    } catch (error) {
      console.error('❌ Error refreshing data:', error)
    }
  }

  // ✅ Debug method
  const getDebugInfo = () => {
    return {
      unreadCount: unreadCount.value,
      notificationCount: notifications.value.length,
      isConnected: isConnected.value,
      shouldShowAnimation: shouldShowAnimation.value,
      lastNotificationTime: lastNotificationTime.value,
      connectionAttempts: connectionAttempts.value
    }
  }

  return {
    // State
    notifications,
    unreadCount,
    loading,
    isConnected,
    connectionAttempts,
    shouldShowAnimation, // ✅ NEW: Export animation state

    // Getters
    unreadNotifications,
    recentNotifications,

    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    connectSocket,
    disconnectSocket,
    clearNotifications,
    testSocketConnection,
    refreshData,

    // ✅ NEW: Animation controls
    triggerNewNotificationAnimation,
    stopAnimation,
    startAnimation,

    // ✅ NEW: Debug
    getDebugInfo,
  }
})