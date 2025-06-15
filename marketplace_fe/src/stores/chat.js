// src/stores/chat.js - UPDATED VERSION
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
  const messages = ref(new Map()) // ✅ FIX: Messages stored by chatId
  const loading = ref(false)
  const messagesLoading = ref(false)
  const onlineUsers = ref(new Set())
  const typingUsers = ref(new Map()) // chatId -> Map of userId -> userName
  
  // Computed
  const totalUnreadCount = computed(() => {
    return chats.value.reduce((total, chat) => total + (chat.unreadCount || 0), 0)
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

  // ✅ NEW: Get messages for specific chat
  const getChatMessages = (chatId) => {
    return messages.value.get(chatId) || []
  }

  // Actions
  async function fetchChats(page = 1, limit = 20) {
    loading.value = true
    try {
      console.log('📋 Fetching chats, page:', page)
      
      const response = await chatService.getUserChats(page, limit)
      if (page === 1) {
        chats.value = response.data.chats || response.data
      } else {
        chats.value.push(...(response.data.chats || response.data))
      }
      
      console.log('✅ Chats loaded:', chats.value.length)
      return response.data
    } catch (error) {
      console.error('❌ Error fetching chats:', error)
      toast.error('Failed to load chats')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createChat(productId, sellerId) {
    try {
      console.log('💬 Creating chat for product:', productId, 'seller:', sellerId)
      
      const response = await chatService.createChat({
        productId,
        sellerId
      })
      const chat = response.data
      
      console.log('✅ Chat created/found:', chat)
      
      // Add to chats list if not exists
      const existingIndex = chats.value.findIndex(c => c.id === chat.id)
      if (existingIndex === -1) {
        chats.value.unshift(chat)
      } else {
        chats.value[existingIndex] = chat
      }
      
      return chat
    } catch (error) {
      console.error('❌ Error creating chat:', error)
      toast.error(error.response?.data?.message || 'Failed to start chat')
      throw error
    }
  }

  async function fetchChatById(chatId) {
    try {
      console.log('🔍 Fetching chat by ID:', chatId)
      
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
      console.error('❌ Error fetching chat:', error)
      toast.error('Chat not found')
      throw error
    }
  }

  // ✅ UPDATED: Better message fetching with centralized storage
  async function fetchMessages(chatId, page = 1, limit = 50) {
    messagesLoading.value = true
    try {
      console.log('📨 Fetching messages for chat:', chatId, 'page:', page)
      
      const response = await chatService.getChatMessages(chatId, page, limit)
      const chatMessages = response.data.messages || response.data || []
      
      console.log('✅ Messages fetched:', chatMessages.length)
      
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
      console.error('❌ Error fetching messages:', error)
      toast.error('Failed to load messages')
      throw error
    } finally {
      messagesLoading.value = false
    }
  }

  // ✅ NEW: Centralized send message method
  async function sendMessage(chatId, content) {
    try {
      console.log('📤 Sending message to chat:', chatId, 'content:', content)
      
      const response = await chatService.sendMessage(chatId, content)
      const newMessage = response.data
      
      console.log('✅ Message sent:', newMessage)
      
      // Add message to centralized storage
      const chatMessages = messages.value.get(chatId) || []
      const exists = chatMessages.some(m => m.id === newMessage.id)
      if (!exists) {
        chatMessages.push(newMessage)
        messages.value.set(chatId, chatMessages)
      }
      
      // Update chat's last message in list
      updateChatLastMessage(chatId, newMessage)
      
      return newMessage
    } catch (error) {
      console.error('❌ Error sending message:', error)
      throw error
    }
  }

  // ✅ UPDATED: Better message handling
  function addMessage(message) {
    console.log('📨 Adding message:', message.id, 'to chat:', message.chatId)
    
    const chatId = message.chatId || message.conversationId
    if (!chatId) {
      console.warn('⚠️ Message missing chatId:', message)
      return
    }
    
    // Add message to centralized storage
    const chatMessages = messages.value.get(chatId) || []
    const existingIndex = chatMessages.findIndex(m => m.id === message.id)
    if (existingIndex === -1) {
      chatMessages.push(message)
      messages.value.set(chatId, chatMessages)
      console.log('✅ Message added to chat:', chatId)
    } else {
      console.log('📝 Message already exists:', message.id)
    }

    // Update chat's last message and move to top
    updateChatLastMessage(chatId, message)
  }

  // ✅ NEW: Helper to update chat's last message
  function updateChatLastMessage(chatId, message) {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex !== -1) {
      chats.value[chatIndex].lastMessage = message
      chats.value[chatIndex].lastMessageAt = message.createdAt
      
      // Move chat to top
      const chat = chats.value.splice(chatIndex, 1)[0]
      chats.value.unshift(chat)
    }
  }

  // ✅ NEW: Mark messages as read
  async function markAsRead(chatId) {
    try {
      console.log('✅ Marking messages as read for chat:', chatId)
      
      await chatService.markMessagesAsRead(chatId)
      
      // Update local state
      markChatAsRead(chatId)
      
    } catch (error) {
      console.error('❌ Error marking as read:', error)
    }
  }

  function markChatAsRead(chatId, userId = null) {
    console.log('✅ Marking chat as read:', chatId)
    
    // Update messages as read in centralized storage
    const chatMessages = messages.value.get(chatId) || []
    chatMessages.forEach(msg => {
      if (!userId || msg.senderId !== userId) {
        msg.isRead = true
      }
    })
    messages.value.set(chatId, chatMessages)

    // Reset unread count for chat
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex !== -1) {
      chats.value[chatIndex].unreadCount = 0
    }
  }

  function updateOnlineStatus(userId, isOnline) {
    console.log('👤 User online status:', userId, isOnline)
    
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
    console.log('🎯 Selecting chat:', chat?.id)
    currentChat.value = chat
    if (chat) {
      clearTypingUsers(chat.id)
    }
  }

  function clearCurrentChat() {
    console.log('🔄 Clearing current chat')
    currentChat.value = null
  }

  function incrementUnreadCount(chatId) {
    const chatIndex = chats.value.findIndex(c => c.id === chatId)
    if (chatIndex !== -1) {
      chats.value[chatIndex].unreadCount = (chats.value[chatIndex].unreadCount || 0) + 1
    }
  }

  // ✅ NEW: Handle new message from socket
  function handleNewMessage(message) {
    console.log('🔔 Handling new message from socket:', message.id)
    
    addMessage(message)
    
    // Show notification if not in current chat
    if (currentChat.value?.id !== message.chatId) {
      incrementUnreadCount(message.chatId)
      
      if (message.sender?.name) {
        toast.info(`New message from ${message.sender.name}`)
      }
    }
  }

  // ✅ NEW: Archive chat
  async function archiveChat(chatId) {
    try {
      console.log('🗂️ Archiving chat:', chatId)
      
      await chatService.archiveChat(chatId)
      
      // Remove from local state
      chats.value = chats.value.filter(c => c.id !== chatId)
      messages.value.delete(chatId)
      
      if (currentChat.value?.id === chatId) {
        currentChat.value = null
      }
      
      console.log('✅ Chat archived successfully')
    } catch (error) {
      console.error('❌ Error archiving chat:', error)
      throw error
    }
  }

  // ✅ UPDATED: Setup socket listeners
  function setupSocketListeners() {
    console.log('🔌 Setting up socket listeners')
    
    // New message received
    socketService.onNewMessage((message) => {
      console.log('🔔 Socket: New message received')
      handleNewMessage(message)
    })

    // New chat notification
    socketService.onNewChatNotification((data) => {
      console.log('🔔 Socket: New chat notification')
      if (currentChat.value?.id !== data.chatId) {
        toast.info(`New message about ${data.productName}`)
      }
    })

    // Messages marked as read
    socketService.onMessagesRead((data) => {
      console.log('✅ Socket: Messages marked as read')
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
    
    // Methods
    getChatMessages, // ✅ NEW
    fetchChats,
    createChat,
    fetchChatById,
    fetchMessages,
    sendMessage, // ✅ NEW
    addMessage,
    handleNewMessage, // ✅ NEW
    markAsRead, // ✅ NEW
    markChatAsRead,
    updateOnlineStatus,
    setUserTyping,
    clearTypingUsers,
    selectChat,
    clearCurrentChat,
    incrementUnreadCount,
    archiveChat, // ✅ NEW
    setupSocketListeners,
  }
})