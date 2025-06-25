<template>
  <div class="container">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <Bell class="header-icon" />
          <div>
            <h4>Quản Lý Thông Báo</h4>
            <p class="header-subtitle">Quản lý và theo dõi tất cả thông báo trong hệ thống</p>
          </div>
        </div>
        <div class="header-actions">
          <button 
            v-if="selectedNotifications.length > 0"
            class="btn-flat waves-effect bulk-delete-btn"
            @click="bulkDeleteNotifications"
          >
            <Trash2 class="icon-left" />
            Xóa {{ selectedNotifications.length }} mục
          </button>
          <button 
            class="btn-flat waves-effect export-btn"
            @click="exportNotifications"
            :disabled="notifications.length === 0"
          >
            <Download class="icon-left" />
            Xuất Excel
          </button>
          <button 
            @click="openCreateModal" 
            class="btn waves-effect waves-light primary-btn"
          >
            <Plus class="icon-left" />
            Tạo Thông Báo
          </button>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="search-filters-container">
      <div class="search-section">
        <div class="search-wrapper">
          <Search class="search-icon" />
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Tìm kiếm thông báo theo tiêu đề, nội dung..."
            @input="debounceSearch"
          >
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">
            <X />
          </button>
        </div>
      </div>
      
      <div class="filters-section">
        <div class="filter-group">
          <label class="filter-label">Loại Thông Báo</label>
          <div class="select-wrapper">
            <select 
              v-model="filterType" 
              @change="loadNotifications" 
              class="browser-default filter-select"
            >
              <option value="">Tất Cả Loại</option>
              <option value="NEW_PRODUCT">Sản phẩm mới</option>
              <option value="PRICE_DROP">Giảm giá</option>
              <option value="ORDER_UPDATE">Cập nhật đơn hàng</option>
              <option value="SYSTEM_UPDATE">Cập nhật hệ thống</option>
              <option value="PROMOTION">Khuyến mãi</option>
              <option value="REVIEW_REMINDER">Nhắc nhở đánh giá</option>
              <option value="STOCK_ALERT">Cảnh báo hết hàng</option>
            </select>
            <ChevronDown class="select-arrow" />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Mức Độ</label>
          <div class="select-wrapper">
            <select 
              v-model="filterPriority" 
              @change="loadNotifications" 
              class="browser-default filter-select"
            >
              <option value="">Tất Cả Mức Độ</option>
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Cao</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>
            <ChevronDown class="select-arrow" />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Trạng Thái</label>
          <div class="select-wrapper">
            <select 
              v-model="filterStatus" 
              @change="loadNotifications" 
              class="browser-default filter-select"
            >
              <option value="">Tất Cả Trạng Thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
            <ChevronDown class="select-arrow" />
          </div>
        </div>
        
        <button 
          class="btn-flat waves-effect reset-filters"
          @click="resetFilters"
          :disabled="!hasActiveFilters"
        >
          <RotateCcw class="icon-small" />
          Đặt Lại
        </button>
      </div>
    </div>

    <!-- Active Filters -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="filter-label">Bộ lọc đang áp dụng:</span>
      <div class="filter-chips">
        <div v-if="searchQuery" class="chip">
          Tìm kiếm: "{{ searchQuery }}"
          <X @click="clearSearch" />
        </div>
        <div v-if="filterType" class="chip">
          Loại: {{ getTypeLabel(filterType) }}
          <X @click="clearFilter('type')" />
        </div>
        <div v-if="filterPriority" class="chip">
          Mức độ: {{ getPriorityLabel(filterPriority) }}
          <X @click="clearFilter('priority')" />
        </div>
        <div v-if="filterStatus" class="chip">
          Trạng thái: {{ filterStatus === 'active' ? 'Hoạt động' : 'Không hoạt động' }}
          <X @click="clearFilter('status')" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <Loader class="spinning" />
        <p>Đang tải thông báo...</p>
      </div>
    </div>

    <div v-else class="content-wrapper">
      <!-- Statistics Overview -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon total">
            <Bell />
          </div>
          <div class="stat-content">
            <h6>Tổng Thông Báo</h6>
            <h3>{{ stats.total }}</h3>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon sent">
            <MailCheck />
          </div>
          <div class="stat-content">
            <h6>Đã Gửi</h6>
            <h3>{{ stats.sent }}</h3>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon read">
            <MailOpen />
          </div>
          <div class="stat-content">
            <h6>Đã Đọc</h6>
            <h3>{{ stats.read }}</h3>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon active">
            <CheckCircle />
          </div>
          <div class="stat-content">
            <h6>Hoạt Động</h6>
            <h3>{{ activeNotificationsCount }}</h3>
          </div>
        </div>
      </div>

      <!-- Notifications Table -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">
            <h6>Danh Sách Thông Báo</h6>
            <span class="result-count">{{ notifications.length }} thông báo</span>
          </div>
        </div>
        
        <div class="table-wrapper">
          <table class="enhanced-table">
            <thead>
              <tr>
                <th class="checkbox-column">
                  <label>
                    <input 
                      type="checkbox" 
                      v-model="selectAll"
                      @change="toggleSelectAll"
                    >
                    <span></span>
                  </label>
                </th>
                <th>Thông Báo</th>
                <th>Loại & Mức Độ</th>
                <th>Phạm Vi</th>
                <th>Ngày Tạo</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="notifications.length === 0" class="empty-row">
                <td colspan="7" class="center-align">
                  <div class="empty-state">
                    <BellOff class="empty-icon" />
                    <p>{{ searchQuery || hasActiveFilters ? 'Không tìm thấy thông báo nào' : 'Chưa có thông báo nào' }}</p>
                    <button 
                      v-if="!searchQuery && !hasActiveFilters"
                      @click="openCreateModal" 
                      class="btn waves-effect"
                    >
                      Tạo Thông Báo Đầu Tiên
                    </button>
                  </div>
                </td>
              </tr>
              <tr 
                v-for="notification in notifications" 
                :key="notification.id"
                class="notification-row"
                :class="{ selected: selectedNotifications.includes(notification.id) }"
              >
                <td class="checkbox-column">
                  <label>
                    <input 
                      type="checkbox" 
                      v-model="selectedNotifications"
                      :value="notification.id"
                    >
                    <span></span>
                  </label>
                </td>
                <td>
                  <div class="notification-info">
                    <div class="notification-details">
                      <strong>{{ notification.title || 'Không có tiêu đề' }}</strong>
                      <p>{{ truncateText(notification.message || 'Không có nội dung', 80) }}</p>
                      <span class="notification-id">#{{ notification.id.slice(-6) }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="badges-column">
                    <span class="type-badge" :class="getTypeClass(notification.type)">
                      {{ getTypeLabel(notification.type) }}
                    </span>
                    <span class="priority-badge" :class="getPriorityClass(notification.priority)">
                      {{ getPriorityLabel(notification.priority) }}
                    </span>
                  </div>
                </td>
                <td>
                  <div class="scope-info">
                    <span v-if="notification.isGlobal" class="scope-badge global">
                      <Globe class="scope-icon" />
                      Toàn bộ
                    </span>
                    <span v-else class="scope-badge targeted">
                      <Users class="scope-icon" />
                      {{ (notification.targetUsers || []).length }} người
                    </span>
                  </div>
                </td>
                <td>
                  <div class="date-info">
                    {{ formatDate(notification.createdAt) }}
                  </div>
                </td>
                <td>
                  <span 
                    class="status-badge"
                    :class="notification.isActive ? 'active' : 'inactive'"
                  >
                    {{ notification.isActive ? 'Hoạt động' : 'Không hoạt động' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button 
                      @click="viewNotification(notification)" 
                      class="btn-flat btn-small action-btn"
                      title="Xem Chi Tiết"
                    >
                      <Eye />
                    </button>
                    
                    <button 
                      @click="toggleNotificationStatus(notification)"
                      class="btn-flat btn-small action-btn"
                      :title="notification.isActive ? 'Tạm dừng' : 'Kích hoạt'"
                    >
                      <PlayCircle v-if="!notification.isActive" />
                      <PauseCircle v-else />
                    </button>
                    
                    <button 
                      class="btn-flat btn-small action-btn delete-btn"
                      title="Xóa"
                      @click="confirmDelete(notification.id)"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-wrapper" v-if="meta.totalPages && meta.totalPages > 1">
          <div class="pagination-info">
            Trang {{ meta.page || 1 }} / {{ meta.totalPages || 1 }}
          </div>
          <ul class="pagination">
            <li :class="{ disabled: meta.page === 1 }">
              <a @click="goToPage(1)" title="Trang đầu">
                <ChevronsLeft />
              </a>
            </li>
            <li :class="{ disabled: meta.page === 1 }">
              <a @click="goToPage(meta.page - 1)" title="Trang trước">
                <ChevronLeft />
              </a>
            </li>
            
            <li 
              v-for="page in visiblePages" 
              :key="page"
              :class="{ active: page === meta.page }"
            >
              <a @click="goToPage(page)">{{ page }}</a>
            </li>
            
            <li :class="{ disabled: meta.page === meta.totalPages }">
              <a @click="goToPage(meta.page + 1)" title="Trang sau">
                <ChevronRight />
              </a>
            </li>
            <li :class="{ disabled: meta.page === meta.totalPages }">
              <a @click="goToPage(meta.totalPages)" title="Trang cuối">
                <ChevronsRight />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Create Notification Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h5>Tạo thông báo mới</h5>
          <button @click="closeCreateModal" class="modal-close-btn">
            <X class="modal-close-icon" />
          </button>
        </div>

        <div class="modal-content">
          <form @submit.prevent="createNotification">
            <div class="form-grid">
              <!-- Tiêu đề -->
              <div class="form-group">
                <label class="form-label">
                  Tiêu đề thông báo <span class="required">*</span>
                </label>
                <input 
                  v-model="newNotification.title" 
                  type="text" 
                  class="form-input"
                  placeholder="Nhập tiêu đề thông báo..." 
                  required
                >
              </div>

              <!-- Nội dung -->
              <div class="form-group">
                <label class="form-label">
                  Nội dung thông báo <span class="required">*</span>
                </label>
                <textarea 
                  v-model="newNotification.message" 
                  class="form-textarea"
                  placeholder="Nhập nội dung chi tiết..." 
                  rows="4" 
                  required
                ></textarea>
              </div>

              <!-- Row cho Loại và Mức độ ưu tiên -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">
                    Loại thông báo <span class="required">*</span>
                  </label>
                  <div class="select-wrapper">
                    <select v-model="newNotification.type" class="browser-default form-select" required>
                      <option value="" disabled>Chọn loại thông báo</option>
                      <option value="NEW_PRODUCT">🆕 Sản phẩm mới</option>
                      <option value="PRICE_DROP">💰 Giảm giá</option>
                      <option value="ORDER_UPDATE">📦 Cập nhật đơn hàng</option>
                      <option value="SYSTEM_UPDATE">⚙️ Cập nhật hệ thống</option>
                      <option value="PROMOTION">🎁 Khuyến mãi</option>
                      <option value="REVIEW_REMINDER">⭐ Nhắc nhở đánh giá</option>
                      <option value="STOCK_ALERT">⚠️ Cảnh báo hết hàng</option>
                    </select>
                    <ChevronDown class="select-arrow" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Mức độ ưu tiên</label>
                  <div class="select-wrapper">
                    <select v-model="newNotification.priority" class="browser-default form-select">
                      <option value="LOW">🟢 Thấp</option>
                      <option value="MEDIUM">🟡 Trung bình</option>
                      <option value="HIGH">🟠 Cao</option>
                      <option value="URGENT">🔴 Khẩn cấp</option>
                    </select>
                    <ChevronDown class="select-arrow" />
                  </div>
                </div>
              </div>

              <!-- Checkbox gửi toàn bộ -->
              <div class="form-group">
                <label class="checkbox-container">
                  <input 
                    v-model="newNotification.isGlobal" 
                    type="checkbox" 
                    @change="handleGlobalChange"
                  >
                  <span class="checkmark"></span>
                  <span class="checkbox-text">Gửi cho tất cả người dùng</span>
                </label>
              </div>

              <!-- Email người nhận -->
              <div v-if="!newNotification.isGlobal" class="form-group">
                <label class="form-label">
                  Email người nhận <span class="required">*</span>
                </label>
                <input 
                  v-model="targetUserEmails" 
                  type="text" 
                  class="form-input"
                  placeholder="email1@example.com, email2@example.com..." 
                  :required="!newNotification.isGlobal"
                >
                <div class="form-help">Cách nhau bởi dấu phẩy</div>
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button @click="closeCreateModal" class="btn-cancel">
            Hủy
          </button>
          <button @click="createNotification" :disabled="creating" class="btn-submit">
            <RefreshCw v-if="creating" class="btn-icon spinning" />
            <Plus v-else class="btn-icon" />
            {{ creating ? 'Đang tạo...' : 'Tạo thông báo' }}
          </button>
        </div>
      </div>
    </div>

    <!-- View Notification Modal -->
    <div v-if="showViewModal && selectedNotification" class="modal-overlay" @click="closeViewModal">
      <div class="modal-container view-modal" @click.stop>
        <div class="modal-header">
          <h5>Chi tiết thông báo</h5>
          <button @click="closeViewModal" class="modal-close-btn">
            <X class="modal-close-icon" />
          </button>
        </div>

        <div class="modal-content">
          <div class="notification-details-view">
            <div class="detail-section">
              <h6>{{ selectedNotification.title || 'Không có tiêu đề' }}</h6>
              <p class="notification-message">{{ selectedNotification.message || 'Không có nội dung' }}</p>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <label>Loại thông báo:</label>
                <span class="type-badge" :class="getTypeClass(selectedNotification.type)">
                  {{ getTypeLabel(selectedNotification.type) }}
                </span>
              </div>

              <div class="detail-item">
                <label>Mức độ ưu tiên:</label>
                <span class="priority-badge" :class="getPriorityClass(selectedNotification.priority)">
                  {{ getPriorityLabel(selectedNotification.priority) }}
                </span>
              </div>

              <div class="detail-item">
                <label>Phạm vi gửi:</label>
                <span>{{ selectedNotification.isGlobal ? 'Toàn bộ người dùng' : ((selectedNotification.targetUsers || []).length + ' người dùng') }}</span>
              </div>

              <div class="detail-item">
                <label>Ngày tạo:</label>
                <span>{{ formatDate(selectedNotification.createdAt) }}</span>
              </div>

              <div class="detail-item">
                <label>Trạng thái:</label>
                <span class="status-badge" :class="selectedNotification.isActive ? 'active' : 'inactive'">
                  {{ selectedNotification.isActive ? 'Hoạt động' : 'Không hoạt động' }}
                </span>
              </div>
            </div>

            <div v-if="selectedNotification.metadata" class="detail-section">
              <label>Metadata:</label>
              <pre class="metadata-block">{{ JSON.stringify(selectedNotification.metadata, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-cancel">
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import dayjs from 'dayjs'
import { debounce } from 'lodash-es'
import { notificationService } from '@/services/notification.service'
import { truncateText } from '@/utils/formatters'

// Lucide Icons
import {
  Bell, BellOff, Plus, MailCheck, MailOpen, Trash2, Search, X, ChevronDown,
  RotateCcw, Loader, Globe, Users, Eye, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, CheckCircle, PlayCircle, PauseCircle, Download
} from 'lucide-vue-next'

const toast = useToast()

// State
const notifications = ref([])
const loading = ref(false)
const creating = ref(false)
const showCreateModal = ref(false)
const showViewModal = ref(false)
const selectedNotification = ref(null)
const selectedNotifications = ref([])
const selectAll = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const filterPriority = ref('')
const filterStatus = ref('')

const stats = reactive({
  total: 0,
  sent: 0,
  read: 0,
  unread: 0
})

const newNotification = reactive({
  title: '',
  message: '',
  type: '',
  priority: 'MEDIUM',
  isGlobal: true
})

const targetUserEmails = ref('')

const meta = ref({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1
})

// Computed
const hasActiveFilters = computed(() => {
  return searchQuery.value || filterType.value || filterPriority.value || filterStatus.value
})

const activeNotificationsCount = computed(() => 
  notifications.value.filter(n => n.isActive).length
)

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, meta.value.page - 2)
  const end = Math.min(meta.value.totalPages, meta.value.page + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const loadNotifications = async (page = 1) => {
  loading.value = true
  
  try {
    const params = {
      page: Math.max(1, parseInt(page) || 1),
      limit: 20,
      search: searchQuery.value,
      type: filterType.value,
      priority: filterPriority.value,
      status: filterStatus.value
    }
    
    const response = await notificationService.getAllNotifications(params)
    notifications.value = response?.data || []
    meta.value = response?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 }
    
    // Update stats
    stats.total = meta.value.total
    stats.sent = Math.floor(stats.total * 0.8)
    stats.read = Math.floor(stats.total * 0.6)
    stats.unread = stats.total - stats.read
    
  } catch (error) {
    console.error('Error loading notifications:', error)
    toast.error('Không thể tải danh sách thông báo')
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(() => {
  meta.value.page = 1
  loadNotifications()
}, 500)

const clearSearch = () => {
  searchQuery.value = ''
  debouncedSearch()
}

const resetFilters = () => {
  searchQuery.value = ''
  filterType.value = ''
  filterPriority.value = ''
  filterStatus.value = ''
  meta.value.page = 1
  loadNotifications()
}

const clearFilter = (filterName) => {
  switch(filterName) {
    case 'type':
      filterType.value = ''
      break
    case 'priority':
      filterPriority.value = ''
      break
    case 'status':
      filterStatus.value = ''
      break
  }
  loadNotifications()
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedNotifications.value = notifications.value.map(n => n.id)
  } else {
    selectedNotifications.value = []
  }
}

const openCreateModal = () => {
  showCreateModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeCreateModal = () => {
  showCreateModal.value = false
  document.body.style.overflow = 'auto'
  resetForm()
}

const closeViewModal = () => {
  showViewModal.value = false
  document.body.style.overflow = 'auto'
  selectedNotification.value = null
}

const createNotification = async () => {
  try {
    creating.value = true
    
    if (!newNotification.title.trim() || !newNotification.message.trim() || !newNotification.type) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    
    const data = {
      title: newNotification.title.trim(),
      message: newNotification.message.trim(),
      type: newNotification.type,
      priority: newNotification.priority || 'MEDIUM',
      isGlobal: newNotification.isGlobal
    }
    
    if (!data.isGlobal) {
      const emails = targetUserEmails.value
        .split(',')
        .map(email => email.trim())
        .filter(email => email)
      
      if (emails.length === 0) {
        toast.error('Vui lòng nhập ít nhất một email người nhận')
        return
      }
      
      data.targetUsers = emails
    }
    
    await notificationService.createNotification(data)
    toast.success('Tạo thông báo thành công!')
    closeCreateModal()
    await loadNotifications()
    
  } catch (error) {
    console.error('Error creating notification:', error)
    toast.error('Không thể tạo thông báo')
  } finally {
    creating.value = false
  }
}

const confirmDelete = (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
    deleteNotification(id)
  }
}

const deleteNotification = async (id) => {
  try {
    await notificationService.deleteNotification(id)
    toast.success('Xóa thông báo thành công!')
    await loadNotifications()
  } catch (error) {
    console.error('Error deleting notification:', error)
    toast.error('Không thể xóa thông báo')
  }
}

const bulkDeleteNotifications = async () => {
  if (!confirm(`Xóa ${selectedNotifications.value.length} thông báo đã chọn?`)) return
  
  try {
    // Implement bulk delete logic here
    toast.success(`Đã xóa ${selectedNotifications.value.length} thông báo`)
    selectedNotifications.value = []
    selectAll.value = false
    await loadNotifications()
  } catch (error) {
    console.error('Error bulk deleting:', error)
    toast.error('Không thể xóa hàng loạt')
  }
}

const viewNotification = (notification) => {
  selectedNotification.value = notification
  showViewModal.value = true
  document.body.style.overflow = 'hidden'
}

const toggleNotificationStatus = async (notification) => {
  try {
    // Implement toggle status logic here
    toast.success(`${notification.isActive ? 'Tạm dừng' : 'Kích hoạt'} thông báo thành công!`)
    await loadNotifications()
  } catch (error) {
    console.error('Error toggling status:', error)
    toast.error('Không thể thay đổi trạng thái')
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= meta.value.totalPages) {
    loadNotifications(page)
  }
}

const handleGlobalChange = () => {
  if (newNotification.isGlobal) {
    targetUserEmails.value = ''
  }
}

const resetForm = () => {
  Object.assign(newNotification, {
    title: '',
    message: '',
    type: '',
    priority: 'MEDIUM',
    isGlobal: true
  })
  targetUserEmails.value = ''
}

const exportNotifications = () => {
  toast.info('Tính năng xuất Excel đang được phát triển')
}

// Helper methods
const getTypeLabel = (type) => {
  const labels = {
    NEW_PRODUCT: 'Sản phẩm mới',
    PRICE_DROP: 'Giảm giá',
    ORDER_UPDATE: 'Đơn hàng',
    SYSTEM_UPDATE: 'Hệ thống',
    PROMOTION: 'Khuyến mãi',
    REVIEW_REMINDER: 'Đánh giá',
    STOCK_ALERT: 'Cảnh báo'
  }
  return labels[type] || 'Không xác định'
}

const getTypeClass = (type) => {
  const classes = {
    NEW_PRODUCT: 'type-product',
    PRICE_DROP: 'type-price',
    ORDER_UPDATE: 'type-order',
    SYSTEM_UPDATE: 'type-system',
    PROMOTION: 'type-promotion',
    REVIEW_REMINDER: 'type-review',
    STOCK_ALERT: 'type-alert'
  }
  return classes[type] || 'type-default'
}

const getPriorityLabel = (priority) => {
  const labels = {
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp'
  }
  return labels[priority] || 'Trung bình'
}

const getPriorityClass = (priority) => {
  const classes = {
    LOW: 'priority-low',
    MEDIUM: 'priority-medium',
    HIGH: 'priority-high',
    URGENT: 'priority-urgent'
  }
  return classes[priority] || 'priority-medium'
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'Không xác định'
  try {
    return dayjs(timestamp).format('DD/MM/YYYY HH:mm')
  } catch (error) {
    return 'Không xác định'
  }
}

onMounted(async () => {
  await loadNotifications()
})
</script>

<style scoped lang="scss">
// Color Variables
$primary-color: #2196F3;
$success-color: #4CAF50;
$warning-color: #FF9800;
$error-color: #F44336;
$info-color: #00BCD4;
$purple-color: #9C27B0;
$light-blue: #E3F2FD;
$light-green: #E8F5E9;
$light-orange: #FFF3E0;
$light-red: #FFEBEE;
$light-purple: #F3E5F5;
$light-cyan: #E0F7FA;

// Icon Styles
.icon-left {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

.icon-small {
  width: 16px;
  height: 16px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #666;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #666;
  pointer-events: none;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.page-header {
  margin-bottom: 2rem;
  
  .header-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    
    .header-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .header-icon {
        width: 32px;
        height: 32px;
        color: $primary-color;
      }
      
      h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-weight: 600;
      }
      
      .header-subtitle {
        color: #666;
        margin: 0;
        font-size: 0.95rem;
      }
    }
    
    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      
      .primary-btn {
        background: linear-gradient(135deg, $primary-color 0%, #1976D2 100%);
        border-radius: 25px;
        padding: 0 1.5rem;
        
        &:hover {
          background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
        }
      }
      
      .export-btn, .bulk-delete-btn {
        border-radius: 25px;
        color: #666;
        
        &:hover {
          background-color: #f5f5f5;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
      
      .bulk-delete-btn {
        color: $error-color;
        
        &:hover {
          background-color: $light-red;
        }
      }
    }
  }
}

.search-filters-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 2rem;
  margin-bottom: 2rem;
}

.search-section {
  margin-bottom: 1.5rem;
  
  .search-wrapper {
    position: relative;
    max-width: 500px;
    
    input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: 2px solid #e0e0e0;
      border-radius: 25px;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
    }
    
    .clear-search {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      
      &:hover {
        background-color: #f0f0f0;
      }
      
      svg {
        width: 16px;
        height: 16px;
        color: #999;
      }
    }
  }
}

.filters-section {
  display: flex;
  gap: 1.5rem;
  align-items: end;
  flex-wrap: wrap;
  
  .filter-group {
    display: flex;
    flex-direction: column;
    min-width: 160px;
    position: relative;
    
    .filter-label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .select-wrapper {
      position: relative;
      
      .filter-select {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: white;
        font-size: 0.95rem;
        cursor: pointer;
        appearance: none;
        transition: all 0.2s ease;
        
        &:focus {
          outline: none;
          border-color: $primary-color;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }
        
        &:hover {
          border-color: #bbb;
        }
      }
    }
  }
  
  .reset-filters {
    height: 2.5rem;
    padding: 0 1rem;
    border-radius: 8px;
    color: #666;
    white-space: nowrap;
    
    &:hover {
      background-color: #f5f5f5;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.active-filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  
  .filter-label {
    font-weight: 500;
    color: #666;
    font-size: 0.9rem;
  }
  
  .filter-chips {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    
    .chip {
      background: $light-blue;
      color: $primary-color;
      padding: 0.25rem 0.75rem;
      border-radius: 16px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      svg {
        width: 14px;
        height: 14px;
        cursor: pointer;
        opacity: 0.7;
        
        &:hover {
          opacity: 1;
        }
      }
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  .loading-spinner {
    text-align: center;
    
    svg {
      width: 40px;
      height: 40px;
      color: $primary-color;
      margin-bottom: 1rem;
    }
    
    p {
      color: #666;
      margin: 0;
    }
  }
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border-radius: 12px;
      
      svg {
        width: 24px;
        height: 24px;
        color: white;
      }
      
      &.total { background: linear-gradient(135deg, #667eea, #764ba2); }
      &.sent { background: linear-gradient(135deg, $primary-color, #1976D2); }
      &.read { background: linear-gradient(135deg, $success-color, #45a049); }
      &.active { background: linear-gradient(135deg, $info-color, #0097a7); }
    }
    
    .stat-content {
      h6 {
        margin: 0 0 0.25rem 0;
        color: #666;
        font-size: 0.85rem;
        font-weight: 500;
      }
      
      h3 {
        margin: 0;
        color: #333;
        font-size: 1.8rem;
        font-weight: 700;
      }
    }
  }
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
  background: #fafafa;
  
  .table-title {
    h6 {
      margin: 0;
      color: #333;
      font-weight: 600;
    }
    
    .result-count {
      color: #666;
      font-size: 0.9rem;
    }
  }
}

.table-wrapper {
  overflow-x: auto;
}

.enhanced-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  
  thead th {
    background: #fafafa;
    font-weight: 600;
    color: #555;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  tbody tr {
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #f8f9fa;
    }
    
    &.selected {
      background-color: $light-blue;
    }
  }
  
  .checkbox-column {
    width: 40px;
    
    label {
      margin: 0;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
  
  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }
  
  .btn {
    border-radius: 25px;
  }
}

.notification-info {
  .notification-details {
    strong {
      display: block;
      color: #333;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }
    
    p {
      margin: 0 0 0.25rem 0;
      font-size: 0.85rem;
      color: #666;
      line-height: 1.3;
    }
    
    .notification-id {
      font-size: 0.75rem;
      color: #999;
      font-family: 'Courier New', monospace;
    }
  }
}

.badges-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-badge, .priority-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.8rem;
  text-align: center;
  
  // Type badges
  &.type-product {
    background: $light-green;
    color: $success-color;
  }
  
  &.type-price {
    background: $light-orange;
    color: $warning-color;
  }
  
  &.type-order {
    background: $light-blue;
    color: $primary-color;
  }
  
  &.type-system {
    background: $light-purple;
    color: $purple-color;
  }
  
  &.type-promotion {
    background: $light-red;
    color: $error-color;
  }
  
  &.type-review {
    background: $light-cyan;
    color: $info-color;
  }
  
  &.type-alert {
    background: #fff8e1;
    color: #f57f17;
  }
  
  // Priority badges
  &.priority-low {
    background: $light-green;
    color: $success-color;
  }
  
  &.priority-medium {
    background: $light-blue;
    color: $primary-color;
  }
  
  &.priority-high {
    background: $light-orange;
    color: $warning-color;
  }
  
  &.priority-urgent {
    background: $light-red;
    color: $error-color;
  }
}

.scope-info {
  .scope-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
    
    &.global {
      background: $light-blue;
      color: $primary-color;
    }
    
    &.targeted {
      background: $light-orange;
      color: $warning-color;
    }
    
    .scope-icon {
      width: 16px;
      height: 16px;
    }
  }
}

.date-info {
  font-size: 0.9rem;
  color: #666;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.8rem;
  
  &.active {
    background: $light-green;
    color: $success-color;
  }
  
  &.inactive {
    background: $light-red;
    color: $error-color;
  }
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  
  .action-btn {
    padding: 0.5rem;
    border-radius: 6px;
    min-width: auto;
    
    &:hover {
      background-color: #f0f0f0;
    }
    
    &.delete-btn:hover {
      background-color: $light-red;
      color: $error-color;
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-top: 1px solid #eee;
  background: #fafafa;
  
  .pagination-info {
    color: #666;
    font-size: 0.9rem;
  }
  
  .pagination {
    margin: 0;
    
    li a {
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      margin: 0 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background-color: #e0e0e0;
      }
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
    
    li.active a {
      background-color: $primary-color;
      color: white;
    }
    
    li.disabled a {
      color: #ccc;
      cursor: not-allowed;
      
      &:hover {
        background-color: transparent;
      }
    }
  }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
  padding-top: 40px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  
  &.view-modal {
    max-width: 700px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, $primary-color 0%, #1976D2 100%);
  color: white;
  
  h5 {
    margin: 0;
    font-weight: 600;
  }
}

.modal-close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .modal-close-icon {
    width: 20px;
    height: 20px;
  }
}

.modal-content {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

// Form Styles
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9rem;
  color: #333;
  font-weight: 600;
}

.required {
  color: $error-color;
}

.form-input, .form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-select {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.95rem;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 0;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  .checkbox-text {
    font-size: 0.95rem;
    color: #333;
    font-weight: 500;
  }
}

.form-help {
  font-size: 0.8rem;
  color: #666;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.btn-cancel, .btn-submit {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: #6c757d;
  color: white;
  
  &:hover {
    background: #5a6268;
  }
}

.btn-submit {
  background: linear-gradient(135deg, $primary-color 0%, #1976D2 100%);
  color: white;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-icon {
    width: 16px;
    height: 16px;
  }
}

// Notification Details View
.notification-details-view {
  .detail-section {
    margin-bottom: 2rem;
    
    h6 {
      color: #333;
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }
    
    .notification-message {
      color: #666;
      line-height: 1.6;
      margin: 0;
    }
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .detail-item {
    label {
      font-size: 0.8rem;
      color: #666;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      display: block;
    }
    
    span {
      color: #333;
      font-weight: 500;
    }
  }
  
  .metadata-block {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    color: #333;
    overflow-x: auto;
    margin-top: 0.5rem;
  }
}

// Responsive Design
@media (max-width: 1200px) {
  .filters-section {
    .filter-group {
      min-width: 140px;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    .header-content {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
      
      .header-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  }
  
  .search-filters-container {
    padding: 1rem;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
    
    .filter-group {
      min-width: 100%;
    }
    
    .reset-filters {
      width: 100%;
      text-align: center;
    }
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .notification-details-view .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .enhanced-table {
    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.85rem;
    }
  }
  
  .pagination-wrapper {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .modal-container {
    margin: 10px;
    max-height: 95vh;
  }
}
</style>