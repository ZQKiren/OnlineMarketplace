<!-- src/components/chat/ChatWidget.vue - FIXED & OPTIMIZED -->
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
            <h6>{{ otherUser?.name || 'Loading...' }}</h6>
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
          <!-- ✅ OPTIMIZED: Better loading state -->
          <div v-if="isInitialLoading" class="loading-messages">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <span>Loading conversation...</span>
            </div>
          </div>

          <!-- ✅ FIXED: Use local messages with fallback -->
          <div v-for="message in displayMessages" :key="message.id" 
               class="message" 
               :class="{ 'own-message': message.senderId === authStore.user?.id }">
            <div class="message-content">
              <p>{{ message.content }}</p>
              <span class="message-time">{{ formatTime(message.createdAt) }}</span>
            </div>
          </div>

          <!-- ✅ Show placeholder if no messages -->
          <div v-if="!isInitialLoading && displayMessages.length === 0" class="no-messages">
            <i class="material-icons">chat_bubble_outline</i>
            <p>Start your conversation...</p>
          </div>

          <!-- Typing indicator -->
          <div v-if="showTypingIndicator" class="typing-indicator">
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
            @keydown.enter.prevent="sendMessage"
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
        <span>{{ otherUser?.name || 'Chat' }}</span>
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
    const isInitialLoading = ref(false)
    const newMessage = ref('')
    const messagesContainer = ref(null)
    const messageInput = ref(null)
    const currentChat = ref(null)
    const localMessages = ref([]) // ✅ Local message storage for better performance
    const typingUsers = ref(new Map())
    const typingTimeout = ref(null)
    const unreadCount = ref(0)
    
    // ✅ OPTIMIZED: Use local messages with store fallback
    const displayMessages = computed(() => {
      // Prefer local messages for better performance
      if (localMessages.value.length > 0) {
        return localMessages.value
      }
      // Fallback to store messages
      return currentChat.value ? chatStore.getChatMessages(currentChat.value.id) : []
    })
    
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
    
    const showTypingIndicator = computed(() => {
      return typingUsers.value.size > 0
    })
    
    // ✅ OPTIMIZED: Cached methods
    const getUserAvatar = (user) => {
      if (!user) return '/placeholder-avatar.svg'
      return getStaticUrl(user.avatar) || generateDefaultAvatar(user)
    }
    
    const generateDefaultAvatar = (user) => {
      if (!user?.name) return '/placeholder-avatar.svg'
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
      if (!dateString) return ''
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
    
    // ✅ FIXED: Improved chat opening with better error handling
    const openChat = async () => {
      if (loading.value) return
      
      loading.value = true
      console.log('💬 ChatWidget: Opening chat for product:', props.product.id)
      
      try {
        // ✅ OPTIMIZED: Use direct API call instead of store for faster response
        const response = await chatService.createChat({
          productId: props.product.id,
          sellerId: props.product.seller.id
        })
        
        const chat = response.data
        currentChat.value = chat
        
        console.log('✅ ChatWidget: Chat created:', chat.id)
        
        // Open chat immediately for better UX
        isOpen.value = true
        isMinimized.value = false
        
        // Focus input
        await nextTick()
        messageInput.value?.focus()
        
        // Load messages in background
        await loadMessages()
        
      } catch (error) {
        console.error('❌ ChatWidget: Error opening chat:', error)
        
        // ✅ IMPROVED: Better error handling
        if (error.response?.status === 400) {
          toast.error('Unable to start chat. Please try again.')
        } else if (error.response?.status === 401) {
          toast.error('Please log in to start chatting.')
          authStore.logout()
        } else {
          toast.error('Failed to start chat. Please check your connection.')
        }
      } finally {
        loading.value = false
      }
    }
    
    // ✅ OPTIMIZED: Faster message loading
    const loadMessages = async () => {
      if (!currentChat.value?.id) return
      
      isInitialLoading.value = true
      try {
        console.log('📨 ChatWidget: Loading messages for chat:', currentChat.value.id)
        
        const response = await chatService.getChatMessages(currentChat.value.id)
        const messages = response.data.messages || response.data || []
        
        // Store locally for better performance
        localMessages.value = messages
        console.log('✅ ChatWidget: Messages loaded:', messages.length)
        
        // Scroll to bottom
        await nextTick()
        scrollToBottom()
        
      } catch (error) {
        console.error('❌ ChatWidget: Error loading messages:', error)
        // Don't show error toast for message loading - just log it
      } finally {
        isInitialLoading.value = false
      }
    }
    
    // ✅ OPTIMIZED: Faster message sending with optimistic updates
    const sendMessage = async () => {
      if (!newMessage.value.trim() || sending.value || !currentChat.value) return

      const content = newMessage.value.trim()
      const tempMessageId = 'temp-' + Date.now()
      
      // ✅ OPTIMIZED: Optimistic update for instant feedback
      const tempMessage = {
        id: tempMessageId,
        content,
        senderId: authStore.user.id,
        createdAt: new Date().toISOString(),
        sender: authStore.user,
        isPending: true
      }
      
      // Add to local messages immediately
      localMessages.value.push(tempMessage)
      newMessage.value = ''
      sending.value = true
      
      // Scroll to bottom immediately
      await nextTick()
      scrollToBottom()

      try {
        console.log('📤 ChatWidget: Sending message:', content)
        
        const response = await chatService.sendMessage(currentChat.value.id, content)
        const sentMessage = response.data
        
        console.log('✅ ChatWidget: Message sent:', sentMessage.id)
        
        // Replace temp message with real message
        const tempIndex = localMessages.value.findIndex(m => m.id === tempMessageId)
        if (tempIndex !== -1) {
          localMessages.value[tempIndex] = sentMessage
        }
        
        // Also update store
        if (chatStore.addMessage) {
          chatStore.addMessage(sentMessage)
        }

      } catch (error) {
        console.error('❌ ChatWidget: Error sending message:', error)
        
        // Remove temp message on error
        const tempIndex = localMessages.value.findIndex(m => m.id === tempMessageId)
        if (tempIndex !== -1) {
          localMessages.value.splice(tempIndex, 1)
        }
        
        // Restore message content
        newMessage.value = content
        toast.error('Failed to send message. Please try again.')
      } finally {
        sending.value = false
      }
    }
    
    const handleTyping = () => {
      if (!currentChat.value) return
      
      // Clear existing timeout
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
      }
      
      // Set timeout to stop typing
      typingTimeout.value = setTimeout(() => {
        // Handle typing stop
      }, 3000)
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
    }
    
    const restoreChat = () => {
      isOpen.value = true
      isMinimized.value = false
      nextTick(() => {
        messageInput.value?.focus()
      })
    }
    
    const closeChat = () => {
      isOpen.value = false
      isMinimized.value = false
      currentChat.value = null
      localMessages.value = []
      typingUsers.value.clear()
      unreadCount.value = 0
    }
    
    // ✅ OPTIMIZED: Watch for message changes with debouncing
    let scrollTimeout = null
    watch(displayMessages, () => {
      if (isOpen.value && displayMessages.value.length > 0) {
        // Debounce scrolling for better performance
        if (scrollTimeout) clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          scrollToBottom()
        }, 100)
      }
    }, { deep: true })
    
    // Lifecycle
    onMounted(() => {
      console.log('🔧 ChatWidget: Mounted for product:', props.product.id)
    })
    
    onUnmounted(() => {
      console.log('🔧 ChatWidget: Unmounted')
      if (scrollTimeout) clearTimeout(scrollTimeout)
      if (typingTimeout.value) clearTimeout(typingTimeout.value)
      closeChat()
    })
    
    return {
      // State
      isOpen,
      isMinimized,
      loading,
      sending,
      isInitialLoading,
      newMessage,
      messagesContainer,
      messageInput,
      currentChat,
      displayMessages,
      typingUsers,
      unreadCount,
      
      // Computed
      canStartChat,
      otherUser,
      isMobile,
      showTypingIndicator,
      
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
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.7;
    transform: none !important;
    cursor: not-allowed;
  }
}

.chat-login-prompt {
  margin: $spacing-md 0;
  
  .card-panel {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 16px;
    border-radius: 8px;
    
    i {
      margin-right: 8px;
      color: #ff9800;
    }
    
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
  animation: slideUp 0.3s ease-out;
  
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

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
    min-width: 0;
    flex: 1;
    
    .chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.3);
      flex-shrink: 0;
    }
    
    .chat-user-details {
      min-width: 0;
      
      h6 {
        margin: 0;
        font-size: 1rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
    flex-shrink: 0;
    
    .btn-flat {
      color: white;
      margin: 0;
      padding: 8px;
      min-width: auto;
      border-radius: 50%;
      
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
      flex-shrink: 0;
    }
    
    .product-details {
      flex: 1;
      min-width: 0;
      
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
  scroll-behavior: smooth;
  
  .loading-messages {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: $spacing-xl;
    color: #666;
    
    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-sm;
      
      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid $primary-color;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      span {
        font-size: 0.875rem;
      }
    }
  }
  
  .no-messages {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: $spacing-xl;
    color: #999;
    text-align: center;
    
    i {
      font-size: 3rem;
      margin-bottom: $spacing-sm;
      opacity: 0.5;
    }
    
    p {
      margin: 0;
      font-style: italic;
    }
  }
  
  .message {
    display: flex;
    animation: fadeIn 0.3s ease-out;
    
    &.own-message {
      justify-content: flex-end;
      
      .message-content {
        background: $primary-color;
        color: white;
        margin-left: 40px;
        
        &.pending {
          opacity: 0.7;
        }
      }
    }
    
    .message-content {
      background: #f0f0f0;
      border-radius: 18px;
      padding: 8px 12px;
      max-width: 80%;
      margin-right: 40px;
      word-wrap: break-word;
      
      p {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.4;
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
    animation: fadeIn 0.3s ease-out;
    
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
      transition: border-color 0.3s ease;
      
      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
      }
      
      &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
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
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        background: darken($primary-color, 10%);
        transform: scale(1.05);
      }
      
      &:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
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
  animation: slideUp 0.3s ease-out;
  
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
      flex-shrink: 0;
    }
    
    span {
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
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
      flex-shrink: 0;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

// Scrollbar styling
.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}
</style>