// src/stores/chat.js - REAL-TIME VERSION
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import chatService from '@/services/chat.service'
import socketService from '@/services/socket.service'
import { useToast } from 'vue-toastification'

export const useChatStore = defineStore('chat', () => {
  const toast = useToast()
  
  // State
  const chats = ref([])
  const currentChat = ref(null)
  const messages = ref(new Map()) 
  const loading = ref(false)
  const messagesLoading = ref(false)
  const onlineUsers = ref(new Set())
  const typingUsers = ref(new Map()) 
  const unreadCounts = ref(new Map()) 
  const isSocketReady = ref(false)

  // Computed
  const totalUnreadCount = computed(() => {
    return Array.from(unreadCounts.value.values()).reduce((total, count) => total + count, 0)
  })

  const currentChatMessages = computed(() => {
    if (!currentChat.value?.id) return []
    return messages.value.get(currentChat.value.id) || []
  })

  const isUserOnline = computed(() => (userId) => {
    return onlineUsers.value.has(userId)
  })

  const getChatTypingUsers = computed(() => (chatId) => {
    return typingUsers.value.get(chatId) || new Map()
  })

  // Get messages for specific chat
  const getChatMessages = (chatId) => {
    return messages.value.get(chatId) || []
  }

  // Setup socket listeners
  const setupSocketListeners = () => {
    // NEW MESSAGE EVENT
    socketService.onNewMessage((message) => {
      handleNewMessage(message)
    })

    // NEW CHAT NOTIFICATION
    socketService.onNewChatNotification((data) => {
      handleNewChatNotification(data)
    })

    // MESSAGES READ EVENT
    socketService.onMessagesRead((data) => {
      handleMessagesRead(data)
    })

    // USER TYPING EVENT
    socketService.onUserTyping((data) => {
      handleUserTyping(data)
    })

    // USER ONLINE/OFFLINE EVENTS
    socketService.onUserOnline((data) => {
      updateOnlineStatus(data.userId, true)
    })

    socketService.onUserOffline((data) => {
      updateOnlineStatus(data.userId, false)
    })

    isSocketReady.value = true
  }

  // Better new message handling
  const handleNewMessage = (message) => {
    const chatId = message.chatId || message.conversationId
    if (!chatId) {
      console.warn('Message missing chatId:', message)
      return
    }

    // Add to messages map
    addMessageToChat(chatId, message)

    // Update chat list
    updateChatLastMessage(chatId, message)

    // Handle unread count
    if (currentChat.value?.id !== chatId) {
      incrementUnreadCount(chatId)
      
      // Show notification
      if (message.sender?.name) {
        toast.info(`💬 ${message.sender.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`, {
          timeout: 4000,
          icon: false
        })
      }
    } else {
      // Auto-mark as read if in current chat
      socketService.markRead(chatId)
    }
  }

  // Handle new chat notification
  const handleNewChatNotification = (data) => {
    if (data.productName) {
      toast.info(`💬 New message about ${data.productName}`)
    }
    
    // Refresh chat list to get new chat
    fetchChats()
  }

  // Handle messages read
  const handleMessagesRead = (data) => {
    const { chatId, userId } = data
    
    // Mark messages as read in local storage
    const chatMessages = messages.value.get(chatId) || []
    let updated = false
    
    chatMessages.forEach(msg => {
      if (msg.senderId === userId && !msg.isRead) {
        msg.isRead = true
        updated = true
      }
    })
    
    if (updated) {
      messages.value.set(chatId, [...chatMessages])
    }
  }

  // Handle user typing
  const handleUserTyping = (data) => {
    const { chatId, userId, userName, isTyping } = data
    
    if (!typingUsers.value.has(chatId)) {
      typingUsers.value.set(chatId, new Map())
    }
    
    const chatTypingUsers = typingUsers.value.get(chatId)
    
    if (isTyping) {
      chatTypingUsers.set(userId, userName)
    } else {
      chatTypingUsers.delete(userId)
    }
    
    // Trigger reactivity
    typingUsers.value.set(chatId, new Map(chatTypingUsers))
  }

  // Add message to chat with deduplication
  const addMessageToChat = (chatId, message) => {
    const chatMessages = messages.value.get(chatId) || []
    
    // Check if message already exists
    const existingIndex = chatMessages.findIndex(m => m.id === message.id)
    if (existingIndex === -1) {
      // Add new message
      chatMessages.push(message)
      messages.value.set(chatId, [...chatMessages])
    } else {
      // Update existing message
      chatMessages[existingIndex] = message
      messages.value.set(chatId, [...chatMessages])
    }
  }

  // Update chat's last message and move to top
  const updateChatLastMessage = (chatId, message) => {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex !== -1) {
      const chat = { ...chats.value[chatIndex] }
      chat.lastMessage = message
      chat.lastMessageAt = message.createdAt
      
      // Remove from current position and add to top
      chats.value.splice(chatIndex, 1)
      chats.value.unshift(chat)
    }
  }

  // Increment unread count
  const incrementUnreadCount = (chatId) => {
    const currentCount = unreadCounts.value.get(chatId) || 0
    unreadCounts.value.set(chatId, currentCount + 1)
    
    // Also update in chat list
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex !== -1) {
      chats.value[chatIndex].unreadCount = currentCount + 1
    }
  }

  // Actions
  const fetchChats = async (page = 1, limit = 20) => {
    loading.value = true
    try {
      const response = await chatService.getUserChats(page, limit)
      const chatData = response.data.chats || response.data || []
      
      if (page === 1) {
        chats.value = chatData
        
        // Initialize unread counts
        chatData.forEach(chat => {
          if (chat.unreadCount > 0) {
            unreadCounts.value.set(chat.id, chat.unreadCount)
          }
        })
      } else {
        chats.value.push(...chatData)
      }
      
      return response.data
    } catch (error) {
      console.error('Error fetching chats:', error)
      toast.error('Failed to load chats')
      throw error
    } finally {
      loading.value = false
    }
  }

  const createChat = async (productId, sellerId) => {
    try {
      const response = await chatService.createChat({ productId, sellerId })
      const chat = response.data
      
      // Add to chats list if not exists
      const existingIndex = chats.value.findIndex(c => c.id === chat.id)
      if (existingIndex === -1) {
        chats.value.unshift(chat)
      } else {
        chats.value[existingIndex] = chat
      }
      
      return chat
    } catch (error) {
      console.error('Error creating chat:', error)
      toast.error(error.response?.data?.message || 'Failed to start chat')
      throw error
    }
  }

  const fetchChatById = async (chatId) => {
    try {
      const response = await chatService.getChatById(chatId)
      const chat = response.data
      
      // Update in chats list
      const existingIndex = chats.value.findIndex(c => c.id === chat.id)
      if (existingIndex !== -1) {
        chats.value[existingIndex] = chat
      } else {
        chats.value.unshift(chat)
      }
      
      return chat
    } catch (error) {
      console.error('Error fetching chat:', error)
      toast.error('Chat not found')
      throw error
    }
  }

  // Better message fetching
  const fetchMessages = async (chatId, page = 1, limit = 50) => {
    messagesLoading.value = true
    try {
      const response = await chatService.getChatMessages(chatId, page, limit)
      const chatMessages = response.data.messages || response.data || []
      
      if (page === 1) {
        // Replace all messages for this chat
        messages.value.set(chatId, chatMessages)
      } else {
        // Prepend older messages for pagination
        const existing = messages.value.get(chatId) || []
        messages.value.set(chatId, [...chatMessages, ...existing])
      }
      
      return response.data
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
      throw error
    } finally {
      messagesLoading.value = false
    }
  }

  // Optimized send message
  const sendMessage = async (chatId, content) => {
    try {
      const response = await chatService.sendMessage(chatId, content)
      const newMessage = response.data
      
      // Add to local storage immediately for better UX
      addMessageToChat(chatId, newMessage)
      
      // Update chat list
      updateChatLastMessage(chatId, newMessage)
      
      return newMessage
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  // Mark as read with local update
  const markAsRead = async (chatId) => {
    try {
      // Update local state immediately
      unreadCounts.value.delete(chatId)
      
      const chatIndex = chats.value.findIndex(c => c.id === chatId)
      if (chatIndex !== -1) {
        chats.value[chatIndex].unreadCount = 0
      }
      
      // Send to server
      await chatService.markMessagesAsRead(chatId)
      
      // Emit socket event
      socketService.markRead(chatId)
      
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const selectChat = (chat) => {
    // Leave previous chat room
    if (currentChat.value?.id) {
      socketService.leaveChat(currentChat.value.id)
    }
    
    currentChat.value = chat
    
    if (chat) {
      // Join new chat room
      socketService.joinChat(chat.id)
      
      // Clear typing for this chat
      clearTypingUsers(chat.id)
      
      // Mark as read
      markAsRead(chat.id)
    }
  }

  const clearCurrentChat = () => {
    if (currentChat.value?.id) {
      socketService.leaveChat(currentChat.value.id)
    }
    
    currentChat.value = null
  }

  const updateOnlineStatus = (userId, isOnline) => {
    if (isOnline) {
      onlineUsers.value.add(userId)
    } else {
      onlineUsers.value.delete(userId)
    }

    // Update chat list
    chats.value.forEach(chat => {
      if (chat.otherUser?.id === userId) {
        chat.otherUser.isOnline = isOnline
        if (!isOnline) {
          chat.otherUser.lastSeen = new Date()
        }
      }
    })

    // Update current chat
    if (currentChat.value?.otherUser?.id === userId) {
      currentChat.value.otherUser.isOnline = isOnline
      if (!isOnline) {
        currentChat.value.otherUser.lastSeen = new Date()
      }
    }
  }

  const clearTypingUsers = (chatId) => {
    typingUsers.value.delete(chatId)
  }

  const archiveChat = async (chatId) => {
    try {
      await chatService.archiveChat(chatId)
      
      // Remove from local state
      chats.value = chats.value.filter(c => c.id !== chatId)
      messages.value.delete(chatId)
      unreadCounts.value.delete(chatId)
      
      if (currentChat.value?.id === chatId) {
        currentChat.value = null
      }
      
    } catch (error) {
      console.error('Error archiving chat:', error)
      throw error
    }
  }

  // Initialize chat store
  const initialize = () => {
    setupSocketListeners()
  }

  // Clear all data (useful for logout)
  const clearData = () => {
    chats.value = []
    currentChat.value = null
    messages.value.clear()
    unreadCounts.value.clear()
    onlineUsers.value.clear()
    typingUsers.value.clear()
    isSocketReady.value = false
  }

  // Auto-initialize when store is created
  initialize()

  return {
    // State
    chats,
    currentChat,
    messages,
    loading,
    messagesLoading,
    onlineUsers,
    typingUsers,
    isSocketReady,
    
    // Computed
    totalUnreadCount,
    currentChatMessages,
    isUserOnline,
    getChatTypingUsers,
    
    // Methods
    getChatMessages,
    fetchChats,
    createChat,
    fetchChatById,
    fetchMessages,
    sendMessage,
    markAsRead,
    selectChat,
    clearCurrentChat,
    updateOnlineStatus,
    clearTypingUsers,
    archiveChat,
    initialize,
    clearData,
    
    // Internal methods (for components)
    addMessageToChat,
    handleNewMessage,
    incrementUnreadCount,
  }
})