<template>
  <div class="notification-page">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-title">
            <Bell class="header-icon" />
            <h4>Thông báo</h4>
            <span class="notification-count" v-if="unreadCount > 0">
              {{ unreadCount }} chưa đọc
            </span>
          </div>
          <div class="header-actions">
            <button 
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="btn waves-effect waves-light blue"
            >
              <CheckCheck class="btn-icon" />
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="filter-card">
          <div class="filter-header">
            <Filter class="filter-icon" />
            <span>Bộ lọc</span>
          </div>
          
          <div class="filter-content">
            <div class="filter-row">
              <div class="filter-item">
                <label class="filter-label">Loại thông báo</label>
                <div class="select-wrapper">
                  <select v-model="filters.type" @change="applyFilters">
                    <option value="">Tất cả loại</option>
                    <option value="NEW_PRODUCT">Sản phẩm mới</option>
                    <option value="PRICE_DROP">Giảm giá</option>
                    <option value="ORDER_UPDATE">Cập nhật đơn hàng</option>
                    <option value="SYSTEM_UPDATE">Cập nhật hệ thống</option>
                    <option value="PROMOTION">Khuyến mãi</option>
                    <option value="REVIEW_REMINDER">Nhắc nhở đánh giá</option>
                    <option value="STOCK_ALERT">Cảnh báo hết hàng</option>
                  </select>
                </div>
              </div>
              
              <div class="filter-item">
                <label class="filter-label">Tìm kiếm</label>
                <div class="search-wrapper">
                  <Search class="search-icon" />
                  <input 
                    v-model="filters.search"
                    @input="debounceSearch"
                    type="text"
                    placeholder="Tìm kiếm thông báo..."
                  >
                </div>
              </div>
              
              <div class="filter-item">
                <label class="filter-label">Hiển thị</label>
                <div class="checkbox-wrapper">
                  <label class="checkbox-label">
                    <input 
                      v-model="filters.unreadOnly"
                      @change="applyFilters"
                      type="checkbox"
                      class="filled-in"
                    />
                    <span>Chỉ thông báo chưa đọc</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications Content -->
      <div class="notifications-section">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">
            <div class="preloader-wrapper medium active">
              <div class="spinner-layer spinner-blue-only">
                <div class="circle-clipper left">
                  <div class="circle"></div>
                </div>
                <div class="gap-patch">
                  <div class="circle"></div>
                </div>
                <div class="circle-clipper right">
                  <div class="circle"></div>
                </div>
              </div>
            </div>
          </div>
          <p>Đang tải thông báo...</p>
        </div>

        <!-- Notifications List -->
        <div v-else-if="notifications.length > 0" class="notifications-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-card"
            :class="{ 'unread': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-indicator" v-if="!notification.isRead"></div>
            
            <div class="notification-icon">
              <component :is="getNotificationIcon(notification.type)" class="notification-type-icon" />
            </div>
            
            <div class="notification-body">
              <div class="notification-header">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-meta">
                  <span class="notification-type" :class="getTypeClass(notification.type)">
                    {{ getNotificationTypeLabel(notification.type) }}
                  </span>
                  <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                </div>
              </div>
              
              <div class="notification-message">{{ notification.message }}</div>
              
              <div class="notification-footer" v-if="!notification.isRead">
                <button 
                  @click.stop="markAsRead(notification.id)"
                  class="mark-read-btn"
                >
                  <Check class="mark-read-icon" />
                  Đánh dấu đã đọc
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <BellOff />
          </div>
          <h5>{{ filters.unreadOnly ? 'Bạn đã đọc hết thông báo' : 'Không có thông báo' }}</h5>
          <p>{{ filters.unreadOnly ? 'Tất cả thông báo đều đã được đọc.' : 'Chưa có thông báo nào được gửi đến bạn.' }}</p>
        </div>

        <!-- Pagination -->
        <div v-if="meta.totalPages > 1" class="pagination-section">
          <div class="pagination-info">
            Hiển thị {{ ((meta.page - 1) * meta.limit) + 1 }} - {{ Math.min(meta.page * meta.limit, meta.total) }} 
            trong tổng số {{ meta.total }} thông báo
          </div>
          
          <ul class="pagination">
            <li :class="{ disabled: meta.page === 1 }">
              <a @click="goToPage(meta.page - 1)" class="pagination-btn">
                <ChevronLeft />
              </a>
            </li>
            
            <li
              v-for="page in visiblePages"
              :key="page"
              :class="{ active: page === meta.page }"
            >
              <a @click="goToPage(page)" class="pagination-btn">{{ page }}</a>
            </li>
            
            <li :class="{ disabled: meta.page === meta.totalPages }">
              <a @click="goToPage(meta.page + 1)" class="pagination-btn">
                <ChevronRight />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useNotificationStore } from '../../stores/notification'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import dayjs from 'dayjs'
import _ from 'lodash-es'

// Lucide Icons
import { 
  Bell, 
  BellOff, 
  CheckCheck, 
  Check, 
  Filter, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  TrendingDown,
  ShoppingBag,
  RefreshCw,
  Tag,
  MessageSquare,
  AlertTriangle
} from 'lucide-vue-next'

export default {
  name: 'NotificationList',
  components: {
    Bell,
    BellOff,
    CheckCheck,
    Check,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    TrendingDown,
    ShoppingBag,
    RefreshCw,
    Tag,
    MessageSquare,
    AlertTriangle
  },
  setup() {
    const notificationStore = useNotificationStore()
    const router = useRouter()
    const toast = useToast()

    const {
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    } = notificationStore

    const filters = reactive({
      type: '',
      search: '',
      unreadOnly: false,
      page: 1,
      limit: 20,
    })

    const meta = ref({
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    })

    const visiblePages = computed(() => {
      const pages = []
      const start = Math.max(1, meta.value.page - 2)
      const end = Math.min(meta.value.totalPages, meta.value.page + 2)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    })

    const loadNotifications = async () => {
      try {
        const response = await fetchNotifications(filters)
        meta.value = response.meta
      } catch (error) {
        toast.error('Không thể tải thông báo')
      }
    }

    const applyFilters = () => {
      filters.page = 1
      loadNotifications()
    }

    const debounceSearch = _.debounce(() => {
      applyFilters()
    }, 500)

    const goToPage = (page) => {
      if (page >= 1 && page <= meta.value.totalPages) {
        filters.page = page
        loadNotifications()
      }
    }

    const handleNotificationClick = async (notification) => {
      if (!notification.isRead) {
        await markAsRead(notification.id)
      }
      
      // Navigate based on notification metadata
      if (notification.metadata?.productId) {
        router.push(`/products/${notification.metadata.productId}`)
      } else if (notification.metadata?.orderId) {
        router.push(`/orders/${notification.metadata.orderId}`)
      }
    }

    const getNotificationIcon = (type) => {
      const icons = {
        NEW_PRODUCT: 'Sparkles',
        PRICE_DROP: 'TrendingDown',
        ORDER_UPDATE: 'ShoppingBag',
        SYSTEM_UPDATE: 'RefreshCw',
        PROMOTION: 'Tag',
        REVIEW_REMINDER: 'MessageSquare',
        STOCK_ALERT: 'AlertTriangle',
      }
      return icons[type] || 'Bell'
    }

    const getNotificationTypeLabel = (type) => {
      const labels = {
        NEW_PRODUCT: 'Sản phẩm mới',
        PRICE_DROP: 'Giảm giá',
        ORDER_UPDATE: 'Đơn hàng',
        SYSTEM_UPDATE: 'Hệ thống',
        PROMOTION: 'Khuyến mãi',
        REVIEW_REMINDER: 'Đánh giá',
        STOCK_ALERT: 'Cảnh báo',
      }
      return labels[type] || 'Thông báo'
    }

    const getTypeClass = (type) => {
      const classes = {
        NEW_PRODUCT: 'type-product',
        PRICE_DROP: 'type-price',
        ORDER_UPDATE: 'type-order',
        SYSTEM_UPDATE: 'type-system',
        PROMOTION: 'type-promotion',
        REVIEW_REMINDER: 'type-review',
        STOCK_ALERT: 'type-alert',
      }
      return classes[type] || 'type-default'
    }

    const formatTime = (timestamp) => {
      return dayjs(timestamp).fromNow()
    }

    onMounted(async () => {
      await loadNotifications()
      
      // Initialize Materialize components
      await nextTick()
      M.FormSelect.init(document.querySelectorAll('select'))
    })

    return {
      notifications,
      unreadCount,
      loading,
      filters,
      meta,
      visiblePages,
      loadNotifications,
      applyFilters,
      debounceSearch,
      goToPage,
      handleNotificationClick,
      markAsRead,
      markAllAsRead,
      getNotificationIcon,
      getNotificationTypeLabel,
      getTypeClass,
      formatTime,
    }
  },
}
</script>

<style lang="scss" scoped>
.notification-page {
  background: #f8f9fa;
  min-height: 100vh;
  padding: 20px 0;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .header-icon {
    color: #1976d2;
    width: 28px;
    height: 28px;
  }
  
  h4 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
  }
}

.notification-count {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #2c3e50;
  font-weight: 500;
  
  .filter-icon {
    color: #1976d2;
    width: 20px;
    height: 20px;
  }
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.select-wrapper {
  position: relative;
  
  select {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    font-size: 0.9rem;
    color: #2c3e50;
    outline: none;
    
    &:focus {
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }
  }
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  
  .search-icon {
    position: absolute;
    left: 12px;
    color: #6c757d;
    width: 20px;
    height: 20px;
  }
  
  input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
    
    &:focus {
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }
    
    &::placeholder {
      color: #999;
    }
  }
}

.checkbox-wrapper {
  padding-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #2c3e50;
  cursor: pointer;
  
  input[type="checkbox"] {
    margin: 0;
  }
}

.notifications-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  min-height: 400px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6c757d;
  
  .loading-spinner {
    margin-bottom: 16px;
  }
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: #f5f5f5;
    border-color: #e0e0e0;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  &.unread {
    background: #f3f8ff;
    border-color: #2196f3;
    
    &:hover {
      background: #e8f4fd;
    }
  }
}

.notification-indicator {
  position: absolute;
  top: 16px;
  left: 8px;
  width: 6px;
  height: 6px;
  background: #2196f3;
  border-radius: 50%;
}

.notification-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: #e3f2fd;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .notification-type-icon {
    color: #1976d2;
    width: 24px;
    height: 24px;
  }
}

.notification-body {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 16px;
}

.notification-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.3;
  flex: 1;
}

.notification-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.notification-type {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.type-product {
    background: rgba(76, 175, 80, 0.1);
    color: #4caf50;
  }
  
  &.type-price {
    background: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }
  
  &.type-order {
    background: rgba(33, 150, 243, 0.1);
    color: #2196f3;
  }
  
  &.type-system {
    background: rgba(156, 39, 176, 0.1);
    color: #9c27b0;
  }
  
  &.type-promotion {
    background: rgba(244, 67, 54, 0.1);
    color: #f44336;
  }
  
  &.type-review {
    background: rgba(0, 188, 212, 0.1);
    color: #00bcd4;
  }
  
  &.type-alert {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
  }
  
  &.type-default {
    background: rgba(158, 158, 158, 0.1);
    color: #9e9e9e;
  }
}

.notification-time {
  font-size: 0.8rem;
  color: #6c757d;
}

.notification-message {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.notification-footer {
  display: flex;
  justify-content: flex-end;
}

.mark-read-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #1565c0;
  }
  
  .mark-read-icon {
    width: 16px;
    height: 16px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: #6c757d;
}

.empty-icon {
  margin-bottom: 20px;
  
  svg {
    width: 80px;
    height: 80px;
    color: #e0e0e0;
  }
}

.empty-state h5 {
  margin: 0 0 8px;
  color: #2c3e50;
  font-weight: 500;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
  max-width: 400px;
}

.pagination-section {
  margin-top: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.pagination-info {
  font-size: 0.9rem;
  color: #6c757d;
}

.pagination {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 4px;
  
  li {
    margin: 0;
    
    &.disabled .pagination-btn {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
    
    &.active .pagination-btn {
      background: #1976d2;
      color: white;
    }
  }
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #2c3e50;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(.disabled) {
    background: #f5f5f5;
    border-color: #1976d2;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
}

// Responsive Design
@media (max-width: 768px) {
  .notification-page {
    padding: 16px 0;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
    padding: 20px;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .notification-card {
    padding: 16px;
    gap: 12px;
  }
  
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .notification-meta {
    flex-direction: row;
    align-items: center;
    align-self: stretch;
    justify-content: space-between;
  }
  
  .notification-icon {
    width: 40px;
    height: 40px;
    
    .notification-type-icon {
      width: 20px;
      height: 20px;
    }
  }
  
  .pagination-section {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .notifications-section {
    padding: 16px;
  }
  
  .filter-card {
    padding: 16px;
  }
  
  .notification-card {
    padding: 12px;
  }
  
  .empty-state {
    padding: 40px 16px;
  }
  
  .empty-icon svg {
    width: 60px;
    height: 60px;
  }
}
</style>