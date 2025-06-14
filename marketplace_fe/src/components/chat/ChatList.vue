<!-- src/components/chat/ChatList.vue -->
<template>
  <div class="chat-list">
    <div class="chat-list-header">
      <h5>Messages</h5>
      <div class="chat-stats">
        <span v-if="totalUnreadCount > 0" class="unread-total">
          {{ totalUnreadCount }} unread
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && chats.length === 0" class="loading-wrapper">
      <div class="preloader-wrapper active">
        <div class="spinner-layer spinner-blue-only">
          <div class="circle-clipper left">
            <div class="circle"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading && chats.length === 0" class="empty-state">
      <i class="material-icons large">chat_bubble_outline</i>
      <h6>No conversations yet</h6>
      <p>Start chatting with sellers by visiting product pages!</p>
    </div>

    <!-- Chat List -->
    <div v-else class="chats-container">
      <div 
        v-for="chat in chats" 
        :key="chat.id"
        class="chat-item"
        :class="{ 
          active: selectedChatId === chat.id,
          unread: chat.unreadCount > 0 
        }"
        @click="selectChat(chat)"
      >
        <!-- User Avatar -->
        <div class="chat-avatar-container">
          <img 
            :src="getUserAvatar(chat.otherUser)" 
            :alt="chat.otherUser?.name"
            class="chat-avatar"
            @error="handleAvatarError"
          >
          <div 
            v-if="isUserOnline(chat.otherUser?.id)" 
            class="online-indicator"
          ></div>
        </div>

        <!-- Chat Content -->
        <div class="chat-content">
          <div class="chat-header">
            <h6 class="chat-name">{{ chat.otherUser?.name }}</h6>
            <span class="chat-time">{{ formatTime(chat.lastMessageAt) }}</span>
          </div>
          
          <div class="chat-product">
            <span class="product-name">{{ chat.product.name }}</span>
            <span class="product-price">${{ chat.product.price?.toFixed(2) }}</span>
          </div>
          
          <div class="chat-preview">
            <p class="last-message">
              {{ getLastMessagePreview(chat.lastMessage) }}
            </p>
            <div v-if="chat.unreadCount > 0" class="unread-badge">
              {{ chat.unreadCount }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { getStaticUrl } from '@/services/api'

export default {
  name: 'ChatList',
  
  props: {
    selectedChatId: {
      type: String,
      default: null
    }
  },
  
  emits: ['chat-selected'],
  
  setup(props, { emit }) {
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    
    // Computed
    const chats = computed(() => chatStore.chats)
    const loading = computed(() => chatStore.loading)
    const totalUnreadCount = computed(() => chatStore.totalUnreadCount)
    
    // Methods
    const getUserAvatar = (user) => {
      if (!user) return '/placeholder-avatar.svg'
      return getStaticUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1976d2&color=fff`
    }
    
    const handleAvatarError = (event) => {
      event.target.src = '/placeholder-avatar.svg'
    }
    
    const isUserOnline = (userId) => {
      return chatStore.isUserOnline(userId)
    }
    
    const formatTime = (dateString) => {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (now - date) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      } else if (diffInHours < 24 * 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }
    }
    
    const getLastMessagePreview = (lastMessage) => {
      if (!lastMessage) return 'No messages yet'
      
      const maxLength = 50
      const content = lastMessage.content
      
      if (content.length > maxLength) {
        return content.substring(0, maxLength) + '...'
      }
      
      return content
    }
    
    const selectChat = (chat) => {
      emit('chat-selected', chat)
    }
    
    // Lifecycle
    onMounted(async () => {
      try {
        await chatStore.fetchChats()
      } catch (error) {
        console.error('Error fetching chats:', error)
      }
    })
    
    return {
      // Computed
      chats,
      loading,
      totalUnreadCount,
      
      // Methods
      getUserAvatar,
      handleAvatarError,
      isUserOnline,
      formatTime,
      getLastMessagePreview,
      selectChat,
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.chat-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.chat-list-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  padding: $spacing-lg;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h5 {
    margin: 0;
    font-weight: 600;
    color: #333;
  }
  
  .chat-stats {
    .unread-total {
      background: $primary-color;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }
  }
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $spacing-xl;
}

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: #666;
  
  i {
    font-size: 4rem;
    margin-bottom: $spacing-lg;
    opacity: 0.5;
  }
  
  h6 {
    margin-bottom: $spacing-sm;
    color: #999;
  }
  
  p {
    font-size: 0.875rem;
    margin: 0;
  }
}

.chats-container {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &.active {
    background: rgba(25, 118, 210, 0.1);
    border-left: 4px solid $primary-color;
  }
  
  &.unread {
    background: rgba(25, 118, 210, 0.03);
  }
  
  .chat-avatar-container {
    position: relative;
    flex-shrink: 0;
    
    .chat-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #f0f0f0;
    }
    
    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #4caf50;
      border: 2px solid white;
      border-radius: 50%;
    }
  }
  
  .chat-content {
    flex: 1;
    min-width: 0;
    
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
      
      .chat-name {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #333;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
      
      .chat-time {
        font-size: 0.75rem;
        color: #999;
        white-space: nowrap;
        margin-left: $spacing-sm;
      }
    }
    
    .chat-product {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      
      .product-name {
        font-size: 0.8rem;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
      
      .product-price {
        font-size: 0.8rem;
        color: $primary-color;
        font-weight: 600;
        margin-left: $spacing-sm;
        white-space: nowrap;
      }
    }
    
    .chat-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .last-message {
        font-size: 0.875rem;
        color: #666;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
      
      .unread-badge {
        background: $primary-color;
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
        margin-left: $spacing-sm;
        flex-shrink: 0;
      }
    }
  }
}

@media (max-width: $mobile) {
  .chat-list-header {
    padding: $spacing-md;
  }
  
  .chat-item {
    padding: $spacing-sm $spacing-md;
    
    .chat-avatar-container .chat-avatar {
      width: 40px;
      height: 40px;
    }
    
    .chat-content {
      .chat-header .chat-name {
        font-size: 0.9rem;
      }
      
      .chat-product,
      .chat-preview .last-message {
        font-size: 0.8rem;
      }
    }
  }
}
</style>