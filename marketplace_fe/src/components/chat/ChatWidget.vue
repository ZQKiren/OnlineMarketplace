<!-- src/components/chat/ChatWidget.vue - FIXED VERSION -->
<template>
  <div class="chat-widget">
    <!-- Chat Button -->
    <button 
      v-if="!isOpen && authStore.isAuthenticated && canStartChat"
      @click="openChat"
      class="btn waves-effect waves-light chat-trigger-btn"
      :disabled="loading"
    >
      <i class="material-icons left">chat</i>
      {{ loading ? 'Starting...' : 'Chat with Seller' }}
    </button>

    <!-- Login Prompt -->
    <div v-else-if="!authStore.isAuthenticated" class="chat-login-prompt">
      <div class="card-panel amber lighten-4">
        <i class="material-icons left">chat</i>
        <router-link to="/login">Login</router-link> to chat with the seller
      </div>
    </div>

    <!-- Chat Panel -->
    <div v-if="isOpen" class="chat-panel" :class="{ 'mobile-fullscreen': isMobile }">
      <div class="chat-header">
        <div class="chat-user-info">
          <img 
            :src="getUserAvatar(otherUser)" 
            :alt="otherUser?.name"
            class="chat-avatar"
            @error="handleAvatarError"
          >
          <div class="chat-user-details">
            <h6>{{ otherUser?.name }}</h6>
            <span class="online-status" :class="{ online: isUserOnline(otherUser?.id) }">
              {{ isUserOnline(otherUser?.id) ? 'Online' : 'Offline' }}
            </span>
          </div>
        </div>
        <div class="chat-actions">
          <button @click="minimizeChat" class="btn-flat btn-small">
            <i class="material-icons">remove</i>
          </button>
          <button @click="closeChat" class="btn-flat btn-small">
            <i class="material-icons">close</i>
          </button>
        </div>
      </div>

      <div class="chat-body">
        <!-- Product Info -->
        <div v-if="product" class="chat-product-info">
          <div class="product-summary">
            <img :src="getProductImage()" :alt="product.name" class="product-thumb">
            <div class="product-details">
              <h6>{{ product.name }}</h6>
              <p class="price">${{ product.price?.toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="chat-messages" @scroll="handleScroll">
          <!-- ✅ FIXED: Show loading only when no messages -->
          <div v-if="messagesLoading && messages.length === 0" class="loading-messages">
            <div class="preloader-wrapper small active">
              <div class="spinner-layer spinner-blue-only">
                <div class="circle-clipper left">
                  <div class="circle"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- ✅ FIXED: Display all messages -->
          <div v-for="message in messages" :key="message.id" 
               class="message" 
               :class="{ 'own-message': message.senderId === authStore.user?.id }">
            <div class="message-content">
              <p>{{ message.content }}</p>
              <span class="message-time">{{ formatTime(message.createdAt) }}</span>
            </div>
          </div>

          <!-- ✅ Show placeholder if no messages -->
          <div v-if="!messagesLoading && messages.length === 0" class="no-messages">
            <p>Start your conversation...</p>
          </div>

          <!-- Typing indicator -->
          <div v-if="typingUsers.size > 0" class="typing-indicator">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="typing-text">{{ getTypingText() }}</span>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="chat-footer">
        <div class="message-input-container">
          <input 
            ref="messageInput"
            v-model="newMessage"
            @keydown.enter="sendMessage"
            @input="handleTyping"
            type="text" 
            placeholder="Type a message..."
            class="message-input"
            :disabled="sending"
            maxlength="1000"
          >
          <button 
            @click="sendMessage"
            class="btn-flat send-btn"
            :disabled="!newMessage.trim() || sending"
          >
            <i class="material-icons">{{ sending ? 'hourglass_empty' : 'send' }}</i>
          </button>
        </div>
      </div>
    </div>

    <!-- Minimized Chat -->
    <div v-if="isMinimized" class="chat-minimized" @click="restoreChat">
      <div class="minimized-header">
        <img :src="getUserAvatar(otherUser)" :alt="otherUser?.name" class="mini-avatar">
        <span>{{ otherUser?.name }}</span>
        <div v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useToast } from 'vue-toastification'
import chatService from '@/services/chat.service'
import socketService from '@/services/socket.service'
import { getStaticUrl } from '@/services/api'

export default {
  name: 'ChatWidget',
  
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  
  setup(props) {
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    const toast = useToast()
    
    // State
    const isOpen = ref(false)
    const isMinimized = ref(false)
    const loading = ref(false)
    const sending = ref(false)
    const newMessage = ref('')
    const messagesContainer = ref(null)
    const messageInput = ref(null)
    const currentChat = ref(null)
    const messages = ref([]) // ✅ FIXED: Local messages array
    const typingUsers = ref(new Map())
    const typingTimeout = ref(null)
    const unreadCount = ref(0)
    
    // Computed
    const canStartChat = computed(() => {
      return props.product?.seller?.id !== authStore.user?.id
    })
    
    const otherUser = computed(() => {
      return currentChat.value?.otherUser || props.product?.seller
    })
    
    const isMobile = computed(() => {
      return window.innerWidth <= 768
    })
    
    const messagesLoading = computed(() => chatStore.messagesLoading)
    
    // Methods
    const getUserAvatar = (user) => {
      if (!user) return '/placeholder-avatar.svg'
      return getStaticUrl(user.avatar) || generateDefaultAvatar(user)
    }
    
    const generateDefaultAvatar = (user) => {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1976d2&color=fff`
    }
    
    const handleAvatarError = (event) => {
      event.target.src = '/placeholder-avatar.svg'
    }
    
    const getProductImage = () => {
      const images = props.product?.images
      if (images && images.length > 0) {
        return getStaticUrl(images[0]) || '/placeholder.jpg'
      }
      return '/placeholder.jpg'
    }
    
    const isUserOnline = (userId) => {
      return chatStore.isUserOnline(userId)
    }
    
    const formatTime = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    }
    
    const getTypingText = () => {
      const users = Array.from(typingUsers.value.values())
      if (users.length === 1) {
        return `${users[0]} is typing...`
      } else if (users.length > 1) {
        return `${users.length} people are typing...`
      }
      return ''
    }
    
    const openChat = async () => {
      loading.value = true
      try {
        console.log('💬 Opening chat for product:', props.product.id)
        
        const chat = await chatStore.createChat(props.product.id, props.product.seller.id)
        currentChat.value = chat
        
        console.log('✅ Chat created:', chat)
        
        // Join chat room
        socketService.joinChat(chat.id)
        
        // Fetch messages
        await fetchMessages()
        
        isOpen.value = true
        isMinimized.value = false
        
        // Focus input
        await nextTick()
        messageInput.value?.focus()
        
      } catch (error) {
        console.error('❌ Error opening chat:', error)
        toast.error(error.response?.data?.message || 'Failed to start chat')
      } finally {
        loading.value = false
      }
    }
    
    // ✅ FIXED: Proper message fetching and display
    const fetchMessages = async () => {
      if (!currentChat.value) return
      
      try {
        console.log('📨 Fetching messages for chat:', currentChat.value.id)
        
        const response = await chatService.getChatMessages(currentChat.value.id)
        messages.value = response.data.messages || []
        
        console.log('✅ Messages loaded:', messages.value)
        
        // Mark messages as read
        await markAsRead()
        
        // Scroll to bottom
        await nextTick()
        scrollToBottom()
        
      } catch (error) {
        console.error('❌ Error fetching messages:', error)
      }
    }
    
    // ✅ FIXED: Proper message sending
    const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value || !currentChat.value) return

  const content = newMessage.value.trim()
  const tempMessage = {
    id: 'temp-' + Date.now(),
    content,
    senderId: authStore.user.id,
    createdAt: new Date().toISOString(),
    sender: authStore.user
  }

  // Add message optimistically to UI
  messages.value.push(tempMessage)
  newMessage.value = ''
  sending.value = true

  // Scroll to bottom immediately
  await nextTick()
  scrollToBottom()

  try {
    console.log('📤 Sending message:', content)

    // Chỉ gửi qua API
    const response = await chatService.sendMessage(currentChat.value.id, content)

    console.log('✅ Message sent:', response.data)

    // Replace temp message with real message
    const messageIndex = messages.value.findIndex(m => m.id === tempMessage.id)
    if (messageIndex !== -1) {
      messages.value[messageIndex] = response.data
    }

  } catch (error) {
    console.error('❌ Error sending message:', error)
    toast.error('Failed to send message')

    // Remove temp message on error
    const messageIndex = messages.value.findIndex(m => m.id === tempMessage.id)
    if (messageIndex !== -1) {
      messages.value.splice(messageIndex, 1)
    }

    // Restore message content
    newMessage.value = content
  } finally {
    sending.value = false
  }
}
    
    const handleTyping = () => {
      if (!currentChat.value) return
      
      // Send typing start
      socketService.setTyping(currentChat.value.id, true)
      
      // Clear existing timeout
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
      }
      
      // Set timeout to stop typing
      typingTimeout.value = setTimeout(() => {
        clearTyping()
      }, 3000)
    }
    
    const clearTyping = () => {
      if (currentChat.value) {
        socketService.setTyping(currentChat.value.id, false)
      }
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
        typingTimeout.value = null
      }
    }
    
    const markAsRead = async () => {
      if (!currentChat.value) return
      
      try {
        await chatService.markMessagesAsRead(currentChat.value.id)
        unreadCount.value = 0
      } catch (error) {
        console.error('Error marking as read:', error)
      }
    }
    
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }
    
    const handleScroll = () => {
      // Could implement loading older messages here
    }
    
    const minimizeChat = () => {
      isOpen.value = false
      isMinimized.value = true
      clearTyping()
    }
    
    const restoreChat = () => {
      isOpen.value = true
      isMinimized.value = false
      markAsRead()
      nextTick(() => {
        messageInput.value?.focus()
      })
    }
    
    const closeChat = () => {
      if (currentChat.value) {
        socketService.leaveChat(currentChat.value.id)
      }
      
      isOpen.value = false
      isMinimized.value = false
      currentChat.value = null
      messages.value = []
      typingUsers.value.clear()
      unreadCount.value = 0
      clearTyping()
    }
    
    // ✅ FIXED: Socket event handlers
    const handleNewMessage = (message) => {
      if (message.chatId === currentChat.value?.id) {
        console.log('📨 New message received:', message)
        
        // Add message if not already exists
        const exists = messages.value.some(m => m.id === message.id)
        if (!exists) {
          messages.value.push(message)
          nextTick(() => scrollToBottom())
        }
        
        if (isOpen.value) {
          markAsRead()
        } else {
          unreadCount.value++
        }
      }
    }
    
    const handleUserTyping = (data) => {
      if (data.chatId === currentChat.value?.id && data.userId !== authStore.user?.id) {
        if (data.isTyping) {
          typingUsers.value.set(data.userId, data.userName)
        } else {
          typingUsers.value.delete(data.userId)
        }
      }
    }
    
    // Lifecycle
    onMounted(() => {
      // Setup socket listeners
      socketService.onNewMessage(handleNewMessage)
      socketService.onUserTyping(handleUserTyping)
    })
    
    onUnmounted(() => {
      // Clean up
      socketService.off('new-message', handleNewMessage)
      socketService.off('user-typing', handleUserTyping)
      closeChat()
    })
    
    // Watch for new messages to scroll
    watch(() => messages.value.length, () => {
      if (isOpen.value) {
        nextTick(() => scrollToBottom())
      }
    })
    
    return {
      // State
      isOpen,
      isMinimized,
      loading,
      sending,
      newMessage,
      messagesContainer,
      messageInput,
      currentChat,
      messages,
      typingUsers,
      unreadCount,
      
      // Computed
      canStartChat,
      otherUser,
      isMobile,
      messagesLoading,
      
      // Stores
      authStore,
      chatStore,
      
      // Methods
      getUserAvatar,
      handleAvatarError,
      getProductImage,
      isUserOnline,
      formatTime,
      getTypingText,
      openChat,
      sendMessage,
      handleTyping,
      markAsRead,
      handleScroll,
      minimizeChat,
      restoreChat,
      closeChat,
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.chat-widget {
  position: relative;
}

.chat-trigger-btn {
  background: linear-gradient(135deg, #1976d2, #1565c0) !important;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  
  &:hover {
    box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    transform: none !important;
  }
}

.chat-login-prompt {
  margin: $spacing-md 0;
  
  .card-panel {
    display: flex;
    align-items: center;
    margin: 0;
    
    a {
      color: #1976d2;
      font-weight: 500;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.chat-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
  
  &.mobile-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
  
  @media (max-width: $mobile) {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0;
  }
}

.chat-header {
  background: $primary-color;
  color: white;
  padding: $spacing-md;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  
  .chat-user-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .chat-user-details {
      h6 {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
      }
      
      .online-status {
        font-size: 0.75rem;
        opacity: 0.8;
        
        &.online {
          color: #4caf50;
          opacity: 1;
        }
      }
    }
  }
  
  .chat-actions {
    display: flex;
    gap: $spacing-xs;
    
    .btn-flat {
      color: white;
      margin: 0;
      padding: 8px;
      min-width: auto;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      i {
        font-size: 1.2rem;
      }
    }
  }
}

.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-product-info {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  padding: $spacing-sm;
  flex-shrink: 0;
  
  .product-summary {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .product-thumb {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }
    
    .product-details {
      flex: 1;
      
      h6 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 500;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .price {
        margin: 0;
        font-size: 0.875rem;
        color: $primary-color;
        font-weight: 600;
      }
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-sm;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  
  .loading-messages {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: $spacing-md;
  }
  
  .no-messages {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: $spacing-xl;
    color: #999;
    font-style: italic;
  }
  
  .message {
    display: flex;
    
    &.own-message {
      justify-content: flex-end;
      
      .message-content {
        background: $primary-color;
        color: white;
        margin-left: 40px;
      }
    }
    
    .message-content {
      background: #f0f0f0;
      border-radius: 18px;
      padding: 8px 12px;
      max-width: 80%;
      margin-right: 40px;
      
      p {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.4;
        word-wrap: break-word;
      }
      
      .message-time {
        font-size: 0.75rem;
        opacity: 0.7;
        margin-top: 4px;
        display: block;
      }
    }
  }
  
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs;
    
    .typing-dots {
      display: flex;
      gap: 2px;
      
      span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #999;
        animation: typing 1.4s infinite ease-in-out;
        
        &:nth-child(1) { animation-delay: 0s; }
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
    
    .typing-text {
      font-size: 0.75rem;
      color: #666;
      font-style: italic;
    }
  }
}

.chat-footer {
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  padding: $spacing-sm;
  flex-shrink: 0;
  
  .message-input-container {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    
    .message-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 0.875rem;
      outline: none;
      
      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
      }
    }
    
    .send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: $primary-color;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 0;
      
      &:hover {
        background: darken($primary-color, 10%);
      }
      
      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      
      i {
        font-size: 1.2rem;
      }
    }
  }
}

.chat-minimized {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: $primary-color;
  color: white;
  padding: $spacing-sm $spacing-md;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
  
  .minimized-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .mini-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    span {
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .unread-badge {
      background: #f44336;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }
  }
}

@keyframes typing {
  0%, 20% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.7;
  }
  80%, 100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>