// src/stores/chat.js
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
  const messages = ref([])
  const loading = ref(false)
  const messagesLoading = ref(false)
  const onlineUsers = ref(new Set())
  const typingUsers = ref(new Map()) // chatId -> Set of userIds
  
  // Computed
  const totalUnreadCount = computed(() => {
    return chats.value.reduce((total, chat) => total + (chat.unreadCount || 0), 0)
  })

  const currentChatMessages = computed(() => {
    return messages.value.filter(msg => msg.chatId === currentChat.value?.id)
  })

  const isUserOnline = computed(() => (userId) => {
    return onlineUsers.value.has(userId)
  })

  const getChatTypingUsers = computed(() => (chatId) => {
    return typingUsers.value.get(chatId) || new Set()
  })

  // Actions
  async function fetchChats(page = 1, limit = 20) {
    loading.value = true
    try {
      const response = await chatService.getUserChats(page, limit)
      if (page === 1) {
        chats.value = response.data.chats
      } else {
        chats.value.push(...response.data.chats)
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

  async function createChat(productId, sellerId) {
    try {
      const response = await chatService.createChat(productId, sellerId)
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

  async function fetchChatById(chatId) {
    try {
      const response = await chatService.getChatById(chatId)
      currentChat.value = response.data
      return response.data
    } catch (error) {
      console.error('Error fetching chat:', error)
      toast.error('Chat not found')
      throw error
    }
  }

  async function fetchMessages(chatId, page = 1, limit = 50) {
    messagesLoading.value = true
    try {
      const response = await chatService.getChatMessages(chatId, page, limit)
      if (page === 1) {
        messages.value = response.data.messages
      } else {
        // Prepend older messages
        messages.value.unshift(...response.data.messages)
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

  function addMessage(message) {
    // Add message to messages array
    const existingIndex = messages.value.findIndex(m => m.id === message.id)
    if (existingIndex === -1) {
      messages.value.push(message)
    }

    // Update chat's last message and unread count
    const chatIndex = chats.value.findIndex(c => c.id === message.chatId)
    if (chatIndex !== -1) {
      chats.value[chatIndex].lastMessage = message
      chats.value[chatIndex].lastMessageAt = message.createdAt
      
      // Move chat to top
      const chat = chats.value.splice(chatIndex, 1)[0]
      chats.value.unshift(chat)
    }
  }

  function markChatAsRead(chatId, userId) {
    // Update messages as read
    messages.value.forEach(msg => {
      if (msg.chatId === chatId && msg.senderId !== userId) {
        msg.isRead = true
      }
    })

    // Reset unread count for chat
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex !== -1) {
      chats.value[chatIndex].unreadCount = 0
    }
  }

  function updateOnlineStatus(userId, isOnline) {
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

  function setUserTyping(chatId, userId, userName, isTyping) {
    if (!typingUsers.value.has(chatId)) {
      typingUsers.value.set(chatId, new Map())
    }
    
    const chatTypingUsers = typingUsers.value.get(chatId)
    
    if (isTyping) {
      chatTypingUsers.set(userId, userName)
    } else {
      chatTypingUsers.delete(userId)
    }
  }

  function clearTypingUsers(chatId) {
    typingUsers.value.delete(chatId)
  }

  function selectChat(chat) {
    currentChat.value = chat
    clearTypingUsers(chat.id)
  }

  function clearCurrentChat() {
    currentChat.value = null
    messages.value = []
  }

  function incrementUnreadCount(chatId) {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex !== -1) {
      chats.value[chatIndex].unreadCount = (chats.value[chatIndex].unreadCount || 0) + 1
    }
  }

  // Setup socket listeners
  function setupSocketListeners() {
    // New message received
    socketService.onNewMessage((message) => {
      addMessage(message)
      
      // Show notification if not in current chat
      if (currentChat.value?.id !== message.chatId) {
        incrementUnreadCount(message.chatId)
        toast.info(`New message from ${message.sender.name}`)
      }
    })

    // New chat notification
    socketService.onNewChatNotification((data) => {
      if (currentChat.value?.id !== data.chatId) {
        toast.info(`New message about ${data.productName}`)
      }
    })

    // Messages marked as read
    socketService.onMessagesRead((data) => {
      markChatAsRead(data.chatId, data.userId)
    })

    // User typing
    socketService.onUserTyping((data) => {
      setUserTyping(data.chatId, data.userId, data.userName, data.isTyping)
    })

    // User online/offline
    socketService.onUserOnline((data) => {
      updateOnlineStatus(data.userId, true)
    })

    socketService.onUserOffline((data) => {
      updateOnlineStatus(data.userId, false)
    })
  }

  // Initialize socket when store is created
  setupSocketListeners()

  return {
    // State
    chats,
    currentChat,
    messages,
    loading,
    messagesLoading,
    onlineUsers,
    typingUsers,
    
    // Computed
    totalUnreadCount,
    currentChatMessages,
    isUserOnline,
    getChatTypingUsers,
    
    // Actions
    fetchChats,
    createChat,
    fetchChatById,
    fetchMessages,
    addMessage,
    markChatAsRead,
    updateOnlineStatus,
    setUserTyping,
    clearTypingUsers,
    selectChat,
    clearCurrentChat,
    incrementUnreadCount,
    setupSocketListeners,
  }
})