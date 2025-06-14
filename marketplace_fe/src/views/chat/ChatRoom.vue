<!-- src/views/chat/ChatRoom.vue -->
<template>
  <div class="chat-room-container">
    <div class="container">
      <div class="row">
        <!-- Chat List Sidebar -->
        <div class="col s12 l4" :class="{ 'hide-on-large-only': selectedChat && isMobile }">
          <div class="chat-sidebar">
            <ChatList 
              :selected-chat-id="selectedChat?.id"
              @chat-selected="handleChatSelected"
            />
          </div>
        </div>

        <!-- Chat Messages Area -->
        <div class="col s12 l8" :class="{ 'hide-on-large-only': !selectedChat && isMobile }">
          <div class="chat-main">
            <!-- No Chat Selected -->
            <div v-if="!selectedChat" class="no-chat-selected">
              <i class="material-icons large">chat</i>
              <h5>Select a conversation</h5>
              <p>Choose a conversation from the sidebar to start chatting.</p>
            </div>

            <!-- Chat Header -->
            <div v-else class="chat-header">
              <button 
                v-if="isMobile" 
                @click="goBackToList"
                class="btn-flat back-btn"
              >
                <i class="material-icons">arrow_back</i>
              </button>
              
              <div class="chat-user-info">
                <img 
                  :src="getUserAvatar(selectedChat.otherUser)" 
                  :alt="selectedChat.otherUser?.name"
                  class="user-avatar"
                  @error="handleAvatarError"
                >
                <div class="user-details">
                  <h6>{{ selectedChat.otherUser?.name }}</h6>
                  <span class="online-status" :class="{ online: isUserOnline(selectedChat.otherUser?.id) }">
                    {{ getOnlineStatusText(selectedChat.otherUser) }}
                  </span>
                </div>
              </div>

              <div class="chat-actions">
                <button 
                  @click="goToProduct"
                  class="btn-flat tooltipped"
                  data-tooltip="View Product"
                >
                  <i class="material-icons">visibility</i>
                </button>
                <button 
                  @click="showArchiveConfirm = true"
                  class="btn-flat tooltipped"
                  data-tooltip="Archive Chat"
                >
                  <i class="material-icons">archive</i>
                </button>
              </div>
            </div>

            <!-- Product Context -->
            <div v-if="selectedChat" class="product-context">
              <div class="product-info">
                <img 
                  :src="getProductImage(selectedChat.product)" 
                  :alt="selectedChat.product.name"
                  class="product-image"
                >
                <div class="product-details">
                  <h6>{{ selectedChat.product.name }}</h6>
                  <p class="price">${{ selectedChat.product.price?.toFixed(2) }}</p>
                </div>
              </div>
            </div>

            <!-- Messages Area -->
            <div v-if="selectedChat" class="messages-area">
              <div ref="messagesContainer" class="messages-container" @scroll="handleScroll">
                <!-- Load More Button -->
                <div v-if="hasMoreMessages" class="load-more-container">
                  <button 
                    @click="loadMoreMessages"
                    class="btn-flat load-more-btn"
                    :disabled="loadingMore"
                  >
                    <i class="material-icons left">
                      {{ loadingMore ? 'hourglass_empty' : 'expand_less' }}
                    </i>
                    {{ loadingMore ? 'Loading...' : 'Load Earlier Messages' }}
                  </button>
                </div>

                <!-- Messages -->
                <div 
                  v-for="message in currentMessages" 
                  :key="message.id"
                  class="message"
                  :class="{ 
                    'own-message': message.senderId === authStore.user?.id,
                    'system-message': message.type === 'SYSTEM'
                  }"
                >
                  <div class="message-content">
                    <div class="message-header" v-if="message.type !== 'SYSTEM'">
                      <img 
                        :src="getUserAvatar(message.sender)" 
                        :alt="message.sender.name"
                        class="sender-avatar"
                      >
                      <span class="sender-name">{{ message.sender.name }}</span>
                    </div>
                    
                    <div class="message-body">
                      <p>{{ message.content }}</p>
                      <div class="message-meta">
                        <span class="message-time">{{ formatMessageTime(message.createdAt) }}</span>
                        <i 
                          v-if="message.senderId === authStore.user?.id && message.isRead" 
                          class="material-icons read-indicator"
                          title="Read"
                        >
                          done_all
                        </i>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Typing Indicator -->
                <div v-if="typingUsers.size > 0" class="typing-indicator">
                  <div class="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span class="typing-text">{{ getTypingText() }}</span>
                </div>
              </div>

              <!-- Message Input -->
              <div class="message-input-area">
                <div class="input-container">
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
                    class="btn send-btn"
                    :disabled="!newMessage.trim() || sending"
                  >
                    <i class="material-icons">{{ sending ? 'hourglass_empty' : 'send' }}</i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Archive Confirmation Modal -->
    <div v-if="showArchiveConfirm" class="modal-overlay" @click="showArchiveConfirm = false">
      <div class="modal-content" @click.stop>
        <h6>Archive Conversation</h6>
        <p>Are you sure you want to archive this conversation? You can still access it later from your archived chats.</p>
        <div class="modal-actions">
          <button @click="showArchiveConfirm = false" class="btn-flat">Cancel</button>
          <button @click="archiveChat" class="btn red" :disabled="archiving">
            {{ archiving ? 'Archiving...' : 'Archive' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useToast } from 'vue-toastification'
import ChatList from '@/components/chat/ChatList.vue'
import socketService from '@/services/socket.service'
import { getStaticUrl } from '@/services/api'

export default {
  name: 'ChatRoom',
  components: { ChatList },
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    const toast = useToast()
    
    // State
    const selectedChat = ref(null)
    const currentMessages = ref([])
    const newMessage = ref('')
    const sending = ref(false)
    const loadingMore = ref(false)
    const hasMoreMessages = ref(false)
    const currentPage = ref(1)
    const typingUsers = ref(new Map())
    const typingTimeout = ref(null)
    const showArchiveConfirm = ref(false)
    const archiving = ref(false)
    const messagesContainer = ref(null)
    const messageInput = ref(null)
    
    // Computed
    const isMobile = computed(() => window.innerWidth <= 768)
    
    // Methods
    const getUserAvatar = (user) => {
      if (!user) return '/placeholder-avatar.svg'
      return getStaticUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1976d2&color=fff`
    }
    
    const handleAvatarError = (event) => {
      event.target.src = '/placeholder-avatar.svg'
    }
    
    const getProductImage = (product) => {
      if (product?.images?.length > 0) {
        return getStaticUrl(product.images[0]) || '/placeholder.jpg'
      }
      return '/placeholder.jpg'
    }
    
    const isUserOnline = (userId) => {
      return chatStore.isUserOnline(userId)
    }
    
    const getOnlineStatusText = (user) => {
      if (!user) return ''
      
      if (user.isOnline) {
        return 'Online'
      } else if (user.lastSeen) {
        const lastSeen = new Date(user.lastSeen)
        const now = new Date()
        const diffInMinutes = (now - lastSeen) / (1000 * 60)
        
        if (diffInMinutes < 60) {
          return `Last seen ${Math.floor(diffInMinutes)}m ago`
        } else if (diffInMinutes < 24 * 60) {
          return `Last seen ${Math.floor(diffInMinutes / 60)}h ago`
        } else {
          return `Last seen ${Math.floor(diffInMinutes / (24 * 60))}d ago`
        }
      }
      
      return 'Offline'
    }
    
    const formatMessageTime = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffInDays = (now - date) / (1000 * 60 * 60 * 24)
      
      if (diffInDays < 1) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      } else if (diffInDays < 7) {
        return date.toLocaleDateString('en-US', { 
          weekday: 'short',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      }
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
    
    const handleChatSelected = async (chat) => {
      if (selectedChat.value?.id === chat.id) return
      
      // Leave previous chat room
      if (selectedChat.value) {
        socketService.leaveChat(selectedChat.value.id)
      }
      
      selectedChat.value = chat
      chatStore.selectChat(chat)
      
      // Join new chat room
      socketService.joinChat(chat.id)
      
      // Fetch messages
      await loadMessages()
      
      // Mark as read
      socketService.markRead(chat.id)
      
      // Focus input
      await nextTick()
      messageInput.value?.focus()
    }
    
    const loadMessages = async () => {
      if (!selectedChat.value) return
      
      try {
        currentPage.value = 1
        const response = await chatStore.fetchMessages(selectedChat.value.id, 1, 50)
        currentMessages.value = response.messages
        hasMoreMessages.value = response.pagination.totalPages > 1
        
        await nextTick()
        scrollToBottom()
        
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }
    
    const loadMoreMessages = async () => {
      if (!selectedChat.value || loadingMore.value) return
      
      loadingMore.value = true
      try {
        const nextPage = currentPage.value + 1
        const response = await chatStore.fetchMessages(selectedChat.value.id, nextPage, 50)
        
        // Prepend older messages
        currentMessages.value.unshift(...response.messages)
        currentPage.value = nextPage
        hasMoreMessages.value = nextPage < response.pagination.totalPages
        
      } catch (error) {
        console.error('Error loading more messages:', error)
      } finally {
        loadingMore.value = false
      }
    }
    
    const sendMessage = async () => {
      if (!newMessage.value.trim() || sending.value || !selectedChat.value) return
      
      const content = newMessage.value.trim()
      newMessage.value = ''
      sending.value = true
      
      try {
        socketService.sendMessage(selectedChat.value.id, content)
        clearTyping()
      } catch (error) {
        console.error('Error sending message:', error)
        toast.error('Failed to send message')
        newMessage.value = content
      } finally {
        sending.value = false
      }
    }
    
    const handleTyping = () => {
      if (!selectedChat.value) return
      
      socketService.setTyping(selectedChat.value.id, true)
      
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
      }
      
      typingTimeout.value = setTimeout(() => {
        clearTyping()
      }, 3000)
    }
    
    const clearTyping = () => {
      if (selectedChat.value) {
        socketService.setTyping(selectedChat.value.id, false)
      }
      if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
        typingTimeout.value = null
      }
    }
    
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }
    
    const handleScroll = () => {
      // Could add auto-load more when scrolling to top
    }
    
    const goBackToList = () => {
      selectedChat.value = null
      currentMessages.value = []
      if (selectedChat.value) {
        socketService.leaveChat(selectedChat.value.id)
      }
    }
    
    const goToProduct = () => {
      if (selectedChat.value?.product?.id) {
        router.push(`/products/${selectedChat.value.product.id}`)
      }
    }
    
    const archiveChat = async () => {
      if (!selectedChat.value || archiving.value) return
      
      archiving.value = true
      try {
        await chatStore.archiveChat(selectedChat.value.id)
        toast.success('Conversation archived')
        showArchiveConfirm.value = false
        
        // Remove from list and go back
        await chatStore.fetchChats()
        goBackToList()
        
      } catch (error) {
        console.error('Error archiving chat:', error)
        toast.error('Failed to archive conversation')
      } finally {
        archiving.value = false
      }
    }
    
    // Socket event handlers
    const handleNewMessage = (message) => {
      if (message.chatId === selectedChat.value?.id) {
        currentMessages.value.push(message)
        socketService.markRead(selectedChat.value.id)
        nextTick(() => scrollToBottom())
      }
    }
    
    const handleUserTyping = (data) => {
      if (data.chatId === selectedChat.value?.id && data.userId !== authStore.user?.id) {
        if (data.isTyping) {
          typingUsers.value.set(data.userId, data.userName)
        } else {
          typingUsers.value.delete(data.userId)
        }
      }
    }
    
    const handleMessagesRead = (data) => {
      if (data.chatId === selectedChat.value?.id) {
        currentMessages.value.forEach(msg => {
          if (msg.senderId !== data.userId) {
            msg.isRead = true
          }
        })
      }
    }
    
    // Lifecycle
    onMounted(async () => {
      // Setup socket listeners
      socketService.onNewMessage(handleNewMessage)
      socketService.onUserTyping(handleUserTyping)
      socketService.onMessagesRead(handleMessagesRead)
      
      // Check if there's a specific chat ID in route
      const chatId = route.params.id
      if (chatId) {
        try {
          const chat = await chatStore.fetchChatById(chatId)
          await handleChatSelected(chat)
        } catch (error) {
          console.error('Error loading specific chat:', error)
          router.push('/chat')
        }
      }
      
      // Initialize Materialize tooltips
      nextTick(() => {
        if (window.M) {
          window.M.Tooltip.init(document.querySelectorAll('.tooltipped'))
        }
      })
    })
    
    onUnmounted(() => {
      // Clean up socket listeners
      socketService.off('new-message', handleNewMessage)
      socketService.off('user-typing', handleUserTyping)
      socketService.off('messages-read', handleMessagesRead)
      
      // Leave chat room
      if (selectedChat.value) {
        socketService.leaveChat(selectedChat.value.id)
      }
      
      clearTyping()
    })
    
    // Watch for new messages to auto-scroll
    watch(() => currentMessages.value.length, () => {
      nextTick(() => scrollToBottom())
    })
    
    return {
      // State
      selectedChat,
      currentMessages,
      newMessage,
      sending,
      loadingMore,
      hasMoreMessages,
      typingUsers,
      showArchiveConfirm,
      archiving,
      messagesContainer,
      messageInput,
      
      // Computed
      isMobile,
      
      // Stores
      authStore,
      chatStore,
      
      // Methods
      getUserAvatar,
      handleAvatarError,
      getProductImage,
      isUserOnline,
      getOnlineStatusText,
      formatMessageTime,
      getTypingText,
      handleChatSelected,
      loadMoreMessages,
      sendMessage,
      handleTyping,
      handleScroll,
      goBackToList,
      goToProduct,
      archiveChat,
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.chat-room-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: $spacing-lg 0;
}

.chat-sidebar {
  height: 80vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-main {
  height: 80vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #666;
  
  i {
    font-size: 4rem;
    margin-bottom: $spacing-lg;
    opacity: 0.5;
  }
  
  h5 {
    margin-bottom: $spacing-sm;
    color: #999;
  }
  
  p {
    font-size: 0.9rem;
    margin: 0;
  }
}

.chat-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: $spacing-md $spacing-lg;
  display: flex;
  align-items: center;
  gap: $spacing-md;
  
  .back-btn {
    margin: 0;
    padding: 8px;
    
    i {
      font-size: 1.5rem;
    }
  }
  
  .chat-user-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex: 1;
    
    .user-avatar {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #f0f0f0;
    }
    
    .user-details {
      h6 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
      }
      
      .online-status {
        font-size: 0.8rem;
        color: #999;
        
        &.online {
          color: #4caf50;
          font-weight: 500;
        }
      }
    }
  }
  
  .chat-actions {
    display: flex;
    gap: $spacing-xs;
    
    .btn-flat {
      margin: 0;
      padding: 8px;
      
      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
    }
  }
}

.product-context {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  padding: $spacing-sm $spacing-lg;
  
  .product-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .product-image {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #ddd;
    }
    
    .product-details {
      flex: 1;
      
      h6 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .price {
        margin: 0;
        font-size: 0.85rem;
        color: $primary-color;
        font-weight: 600;
      }
    }
  }
}

.messages-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.load-more-container {
  text-align: center;
  margin-bottom: $spacing-md;
  
  .load-more-btn {
    color: $primary-color;
    
    &:disabled {
      opacity: 0.6;
    }
  }
}

.message {
  display: flex;
  
  &.own-message {
    justify-content: flex-end;
    
    .message-content {
      background: $primary-color;
      color: white;
      margin-left: 60px;
      
      .message-header .sender-name {
        color: rgba(255, 255, 255, 0.9);
      }
      
      .message-meta .message-time {
        color: rgba(255, 255, 255, 0.8);
      }
      
      .read-indicator {
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
  
  &.system-message {
    justify-content: center;
    
    .message-content {
      background: #e3f2fd;
      color: #1976d2;
      font-style: italic;
      font-size: 0.85rem;
      max-width: 70%;
      text-align: center;
    }
  }
  
  .message-content {
    background: #f0f0f0;
    border-radius: 12px;
    padding: $spacing-sm $spacing-md;
    max-width: 70%;
    margin-right: 60px;
    
    .message-header {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      margin-bottom: $spacing-xs;
      
      .sender-avatar {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        object-fit: cover;
      }
      
      .sender-name {
        font-size: 0.75rem;
        font-weight: 600;
        color: #666;
      }
    }
    
    .message-body {
      p {
        margin: 0 0 $spacing-xs 0;
        line-height: 1.4;
        word-wrap: break-word;
      }
      
      .message-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .message-time {
          font-size: 0.7rem;
          color: #999;
        }
        
        .read-indicator {
          font-size: 0.9rem;
          color: #4caf50;
        }
      }
    }
  }
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-left: 30px;
  
  .typing-animation {
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
    font-size: 0.8rem;
    color: #666;
    font-style: italic;
  }
}

.message-input-area {
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  padding: $spacing-md $spacing-lg;
  
  .input-container {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    
    .message-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 25px;
      padding: 10px 20px;
      font-size: 0.9rem;
      outline: none;
      
      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
      }
    }
    
    .send-btn {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: $primary-color;
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
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  
  .modal-content {
    background: white;
    border-radius: 8px;
    padding: $spacing-xl;
    max-width: 400px;
    width: 90%;
    
    h6 {
      margin-bottom: $spacing-md;
      font-weight: 600;
    }
    
    p {
      margin-bottom: $spacing-lg;
      color: #666;
      line-height: 1.5;
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: $spacing-sm;
    }
  }
}

@media (max-width: $mobile) {
  .chat-room-container {
    padding: 0;
  }
  
  .chat-sidebar,
  .chat-main {
    height: 100vh;
    border-radius: 0;
  }
  
  .messages-container {
    padding: $spacing-md;
  }
  
  .message {
    &.own-message .message-content {
      margin-left: 20px;
    }
    
    .message-content {
      margin-right: 20px;
      max-width: 85%;
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

