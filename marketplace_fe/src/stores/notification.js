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

  // Animation control state
  const lastNotificationTime = ref(0)
  const shouldShowAnimation = ref(false)

  // Getters
  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.isRead)
  )

  const recentNotifications = computed(() =>
    notifications.value.slice(0, 5)
  )

  // Actions
  const fetchNotifications = async (query = {}) => {
    try {
      loading.value = true
      const response = await notificationService.getNotifications(query)

      const wasEmpty = notifications.value.length === 0
      notifications.value = response.data

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

      if (unreadCount.value !== newCount) {
        const oldCount = unreadCount.value
        unreadCount.value = newCount

        if (newCount > oldCount && oldCount > 0) {
          triggerNewNotificationAnimation()
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const triggerNewNotificationAnimation = () => {
    const now = Date.now()

    if (now - lastNotificationTime.value < 2000) {
      return
    }

    lastNotificationTime.value = now
    shouldShowAnimation.value = true

    setTimeout(() => {
      shouldShowAnimation.value = false
    }, 3000)
  }

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)

      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification && !notification.isRead) {
        notification.isRead = true
        notification.readAt = new Date().toISOString()

        const newCount = Math.max(0, unreadCount.value - 1)
        unreadCount.value = newCount

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

      notifications.value.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true
          notification.readAt = new Date().toISOString()
        }
      })

      unreadCount.value = 0
      shouldShowAnimation.value = false

      toast.success('Đã đánh dấu tất cả thông báo là đã đọc')

    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Không thể đánh dấu tất cả đã đọc')
    }
  }

  const addNotification = (notification) => {
    const existingIndex = notifications.value.findIndex(n => n.id === notification.id)
    if (existingIndex !== -1) {
      notifications.value[existingIndex] = { ...notification, isRead: false }
    } else {
      notifications.value.unshift({ ...notification, isRead: false })
    }

    const newCount = unreadCount.value + 1
    unreadCount.value = newCount

    triggerNewNotificationAnimation()
  }

  const connectSocket = (token) => {
    if (socket.value?.connected) {
      return
    }

    if (!token) {
      console.error('No token provided for socket connection')
      return
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token

    try {
      socket.value = io(import.meta.env.VITE_BASE_URL, {
        auth: {
          token: cleanToken
        },
        query: {
          token: cleanToken
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: maxRetries,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: true,
        forceNew: false,
      })

      socket.value.on('connect', () => {
        isConnected.value = true
        connectionAttempts.value = 0
        socket.value.emit('ping')
      })

      socket.value.on('connection_success', (data) => {
        setTimeout(() => {
          fetchUnreadCount()
        }, 1000)
      })

      socket.value.on('auth_error', (error) => {
        console.error('Authentication error:', error)
        toast.error(`Lỗi xác thực: ${error.message}`)
        isConnected.value = false
        socket.value?.disconnect()
      })

      socket.value.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        isConnected.value = false
        connectionAttempts.value++

        if (connectionAttempts.value >= maxRetries) {
          toast.error('Không thể kết nối thông báo real-time. Vui lòng refresh trang.')
        }
      })

      socket.value.on('error', (error) => {
        console.error('Socket error:', error)
      })

      socket.value.on('disconnect', (reason) => {
        isConnected.value = false

        if (reason === 'io server disconnect') {
          socket.value?.connect()
        }
      })

      socket.value.on('new-notification', (notification) => {
        addNotification(notification)

        toast.info(notification.title, {
          timeout: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          icon: '🔔'
        })
      })

      socket.value.on('unread-count-update', (data) => {
        const newCount = data.unreadCount

        if (unreadCount.value !== newCount) {
          unreadCount.value = newCount
          if (newCount === 0) {
            shouldShowAnimation.value = false
          }
        }
      })

    } catch (error) {
      console.error('Failed to create socket connection:', error)
      toast.error('Không thể khởi tạo kết nối socket')
    }
  }

  const disconnectSocket = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
      connectionAttempts.value = 0
    }
  }

  const clearNotifications = () => {
    notifications.value = []
    unreadCount.value = 0
    shouldShowAnimation.value = false
    lastNotificationTime.value = 0
  }

  const stopAnimation = () => {
    shouldShowAnimation.value = false
  }

  const startAnimation = () => {
    if (unreadCount.value > 0) {
      triggerNewNotificationAnimation()
    }
  }

  const testSocketConnection = () => {
    if (socket.value?.connected) {
      socket.value.emit('ping')
      return true
    } else {
      return false
    }
  }

  const refreshData = async () => {
    try {
      await Promise.all([
        fetchNotifications(),
        fetchUnreadCount()
      ])
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

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
    shouldShowAnimation,

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

    // Animation controls
    triggerNewNotificationAnimation,
    stopAnimation,
    startAnimation,

    // Debug
    getDebugInfo,
  }
})