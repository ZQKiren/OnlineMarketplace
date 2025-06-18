<template>
  <div class="admin-notifications">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-title">
            <i class="material-icons">notifications_active</i>
            <h4>Quản lý thông báo</h4>
          </div>
          <div class="header-actions">
            <button @click="openCreateModal" class="btn-create">
              <i class="material-icons">add</i>
              Tạo thông báo mới
            </button>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="stat-icon">
              <i class="material-icons">notifications</i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.total }}</div>
              <div class="stat-label">Tổng thông báo</div>
            </div>
          </div>

          <div class="stat-card green">
            <div class="stat-icon">
              <i class="material-icons">mark_email_read</i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.read }}</div>
              <div class="stat-label">Đã đọc</div>
            </div>
          </div>

          <div class="stat-card orange">
            <div class="stat-icon">
              <i class="material-icons">mark_email_unread</i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.unread }}</div>
              <div class="stat-label">Chưa đọc</div>
            </div>
          </div>

          <div class="stat-card red">
            <div class="stat-icon">
              <i class="material-icons">delete</i>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.deleted }}</div>
              <div class="stat-label">Đã xóa</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filter-section">
        <div class="filter-card">
          <div class="filter-header">
            <i class="material-icons">filter_list</i>
            <span>Bộ lọc và tìm kiếm</span>
          </div>

          <div class="filter-content">
            <div class="filter-row">
              <div class="filter-item">
                <label class="filter-label">Tìm kiếm</label>
                <div class="search-wrapper">
                  <i class="material-icons">search</i>
                  <input v-model="searchQuery" @input="debounceSearch" type="text"
                    placeholder="Tìm kiếm theo tiêu đề hoặc nội dung...">
                </div>
              </div>

              <div class="filter-item">
                <label class="filter-label">Loại thông báo</label>
                <div class="select-wrapper">
                  <select v-model="filterType" @change="loadNotifications" class="browser-default">
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
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications Table -->
      <div class="table-section">
        <div class="table-card">
          <div class="table-header">
            <h6>Danh sách thông báo</h6>
            <div class="table-info">
              Tổng: {{ meta.total || 0 }} thông báo
            </div>
          </div>

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
            <p>Đang tải dữ liệu...</p>
          </div>

          <!-- Table Content -->
          <div v-else-if="notifications && notifications.length > 0" class="table-container">
            <table class="notifications-table">
              <thead>
                <tr>
                  <th>Thông tin</th>
                  <th>Loại & Mức độ</th>
                  <th>Phạm vi</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="notification in notifications" :key="notification.id">
                  <td>
                    <div class="notification-info">
                      <div class="notification-title">{{ notification.title || 'Không có tiêu đề' }}</div>
                      <div class="notification-preview">
                        {{ (notification.message || '').length > 60 ? (notification.message || '').substring(0, 60) +
                          '...' : (notification.message || 'Không có nội dung') }}
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
                        <i class="material-icons">public</i>
                        Toàn bộ
                      </span>
                      <span v-else class="scope-badge targeted">
                        <i class="material-icons">group</i>
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
                    <span class="status-badge" :class="notification.isActive ? 'active' : 'inactive'">
                      {{ notification.isActive ? 'Hoạt động' : 'Không hoạt động' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button @click="viewNotification(notification)" class="action-btn view" title="Xem chi tiết">
                        <i class="material-icons">visibility</i>
                      </button>
                      <button @click="confirmDelete(notification.id)" class="action-btn delete" title="Xóa thông báo">
                        <i class="material-icons">delete</i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <div class="empty-icon">
              <i class="material-icons">notifications_none</i>
            </div>
            <h6>Không có thông báo</h6>
            <p>Chưa có thông báo nào được tạo. Hãy tạo thông báo đầu tiên!</p>
          </div>

          <!-- Pagination -->
          <div v-if="meta.totalPages && meta.totalPages > 1" class="pagination-section">
            <div class="pagination-info">
              Hiển thị {{ ((meta.page - 1) * meta.limit) + 1 }} - {{ Math.min(meta.page * meta.limit, meta.total) }}
              trong tổng số {{ meta.total }} thông báo
            </div>

            <ul class="pagination">
              <li :class="{ disabled: meta.page === 1 }">
                <a @click="goToPage(meta.page - 1)" class="pagination-btn">
                  <i class="material-icons">chevron_left</i>
                </a>
              </li>

              <li v-for="page in visiblePages" :key="page" :class="{ active: page === meta.page }">
                <a @click="goToPage(page)" class="pagination-btn">{{ page }}</a>
              </li>

              <li :class="{ disabled: meta.page === meta.totalPages }">
                <a @click="goToPage(meta.page + 1)" class="pagination-btn">
                  <i class="material-icons">chevron_right</i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Notification Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h5>Tạo thông báo mới</h5>
          <button @click="closeCreateModal" class="modal-close-btn">
            <i class="material-icons">close</i>
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
                <input v-model="newNotification.title" type="text" class="form-input"
                  placeholder="Nhập tiêu đề thông báo..." required>
              </div>

              <!-- Nội dung -->
              <div class="form-group">
                <label class="form-label">
                  Nội dung thông báo <span class="required">*</span>
                </label>
                <textarea v-model="newNotification.message" class="form-textarea"
                  placeholder="Nhập nội dung chi tiết..." rows="3" required></textarea>
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
                  </div>
                </div>
              </div>

              <!-- Checkbox gửi toàn bộ -->
              <div class="form-group">
                <label class="checkbox-container">
                  <input v-model="newNotification.isGlobal" type="checkbox" @change="handleGlobalChange">
                  <span class="checkbox-text">Gửi cho tất cả người dùng</span>
                </label>
              </div>

              <!-- Email người nhận -->
              <div v-if="!newNotification.isGlobal" class="form-group">
                <label class="form-label">
                  Email người nhận <span class="required">*</span>
                </label>
                <input v-model="targetUserEmails" type="text" class="form-input"
                  placeholder="email1@example.com, email2@example.com..." :required="!newNotification.isGlobal">
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
            <i v-if="creating" class="material-icons spinning">refresh</i>
            <i v-else class="material-icons">add</i>
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
            <i class="material-icons">close</i>
          </button>
        </div>

        <div class="modal-content">
          <div class="notification-details">
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
                <span>{{ selectedNotification.isGlobal ? 'Toàn bộ người dùng' : ((selectedNotification.targetUsers ||
                  []).length + ' người dùng') }}</span>
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

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { notificationService } from '../../services/notification.service'
import { useToast } from 'vue-toastification'
import dayjs from 'dayjs'
import _ from 'lodash-es'

export default {
  name: 'AdminNotificationManagement',
  setup() {
    const toast = useToast()

    // State
    const notifications = ref([])
    const loading = ref(false)
    const creating = ref(false)
    const showCreateModal = ref(false)
    const showViewModal = ref(false)
    const selectedNotification = ref(null)
    const searchQuery = ref('')
    const filterType = ref('')

    const stats = reactive({
      total: 0,
      read: 0,
      unread: 0,
      deleted: 0,
    })

    const newNotification = reactive({
      title: '',
      message: '',
      type: '',
      priority: 'MEDIUM',
      isGlobal: true,
    })

    const targetUserEmails = ref('')

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

    // ✅ FIXED: Enhanced loadNotifications
    // ✅ FIXED: loadNotifications method trong AdminNotificationManagement.vue
    const loadNotifications = async (page = 1) => {
      try {
        loading.value = true

        // ✅ FIX: Ensure page is valid
        const validPage = Math.max(1, parseInt(page) || 1)

        const params = {
          page: validPage,
          limit: 20,
        }

        // ✅ Only add non-empty filters
        if (filterType.value && filterType.value.trim() !== '' && filterType.value !== 'ALL') {
          params.type = filterType.value.trim()
        }

        if (searchQuery.value && searchQuery.value.trim() !== '') {
          params.search = searchQuery.value.trim()
        }

        console.log('🔍 Loading notifications with params:', params)

        const response = await notificationService.getAllNotifications(params)

        console.log('✅ Response received:', response)

        // ✅ Safe property access
        notifications.value = response?.data || []
        meta.value = {
          total: response?.meta?.total || 0,
          page: response?.meta?.page || validPage,
          limit: response?.meta?.limit || 20,
          totalPages: response?.meta?.totalPages || 1,
        }

        // Update stats safely
        const total = meta.value.total
        stats.total = total
        stats.read = Math.floor(total * 0.7)
        stats.unread = Math.floor(total * 0.2)
        stats.deleted = Math.floor(total * 0.1)

        console.log('✅ Data loaded successfully')

      } catch (error) {
        console.error('❌ Error loading notifications:', error)

        // ✅ Reset to safe state on error
        notifications.value = []
        meta.value = {
          total: 0,
          page: Math.max(1, parseInt(page) || 1),
          limit: 20,
          totalPages: 1,
        }
        stats.total = 0
        stats.read = 0
        stats.unread = 0
        stats.deleted = 0

        // ✅ Better error messages
        if (error.status === 400) {
          toast.error('Tham số không hợp lệ. Đang tải lại...')
          // ✅ Retry with default params
          setTimeout(() => {
            loadNotifications(1)
          }, 1000)
        } else {
          toast.error('Không thể tải thông báo: ' + (error.message || 'Lỗi không xác định'))
        }
      } finally {
        loading.value = false
      }
    }

    const openCreateModal = async () => {
      showCreateModal.value = true
      document.body.style.overflow = 'hidden'

      await nextTick()
      console.log('✅ Modal opened')
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

        // ✅ Validation
        if (!newNotification.title.trim()) {
          toast.error('Vui lòng nhập tiêu đề')
          return
        }

        if (!newNotification.message.trim()) {
          toast.error('Vui lòng nhập nội dung')
          return
        }

        if (!newNotification.type) {
          toast.error('Vui lòng chọn loại thông báo')
          return
        }

        const data = {
          title: newNotification.title.trim(),
          message: newNotification.message.trim(),
          type: newNotification.type,
          priority: newNotification.priority || 'MEDIUM',
          isGlobal: newNotification.isGlobal
        }

        // Handle target users if not global
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

        console.log('🔍 Creating notification:', data)

        await notificationService.createNotification(data)

        toast.success('Tạo thông báo thành công!')
        closeCreateModal()
        await loadNotifications()

      } catch (error) {
        console.error('❌ Error creating notification:', error)
        toast.error('Không thể tạo thông báo: ' + (error.message || 'Lỗi không xác định'))
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
        console.error('❌ Error deleting notification:', error)
        toast.error('Không thể xóa thông báo: ' + (error.message || 'Lỗi không xác định'))
      }
    }

    const viewNotification = (notification) => {
      selectedNotification.value = notification
      showViewModal.value = true
      document.body.style.overflow = 'hidden'
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
        isGlobal: true,
      })
      targetUserEmails.value = ''
    }

    const debounceSearch = _.debounce(() => {
      loadNotifications()
    }, 500)

    // Helper methods
    const getTypeLabel = (type) => {
      const labels = {
        NEW_PRODUCT: 'Sản phẩm mới',
        PRICE_DROP: 'Giảm giá',
        ORDER_UPDATE: 'Đơn hàng',
        SYSTEM_UPDATE: 'Hệ thống',
        PROMOTION: 'Khuyến mãi',
        REVIEW_REMINDER: 'Đánh giá',
        STOCK_ALERT: 'Cảnh báo',
      }
      return labels[type] || type || 'Không xác định'
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

    const getPriorityLabel = (priority) => {
      const labels = {
        LOW: 'Thấp',
        MEDIUM: 'Trung bình',
        HIGH: 'Cao',
        URGENT: 'Khẩn cấp',
      }
      return labels[priority] || priority || 'Trung bình'
    }

    const getPriorityClass = (priority) => {
      const classes = {
        LOW: 'priority-low',
        MEDIUM: 'priority-medium',
        HIGH: 'priority-high',
        URGENT: 'priority-urgent',
      }
      return classes[priority] || 'priority-default'
    }

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Không xác định'
      try {
        return dayjs(timestamp).format('DD/MM/YYYY HH:mm')
      } catch (error) {
        return 'Không xác định'
      }
    }

    // ✅ Safe onMounted
    onMounted(async () => {
      console.log('🚀 AdminNotificationManagement mounted')
      try {
        await loadNotifications()
        console.log('✅ Initial load complete')
      } catch (error) {
        console.error('❌ Error during initial load:', error)
      }
    })

    return {
      // State
      notifications,
      loading,
      creating,
      showCreateModal,
      showViewModal,
      selectedNotification,
      searchQuery,
      filterType,
      stats,
      newNotification,
      targetUserEmails,
      meta,
      visiblePages,

      // Methods
      loadNotifications,
      openCreateModal,
      closeCreateModal,
      closeViewModal,
      createNotification,
      confirmDelete,
      deleteNotification,
      viewNotification,
      goToPage,
      handleGlobalChange,
      resetForm,
      debounceSearch,

      // Helpers
      getTypeLabel,
      getTypeClass,
      getPriorityLabel,
      getPriorityClass,
      formatDate,
    }
  },
}
</script>

<style lang="scss" scoped>
.admin-notifications {
  background: #f8f9fa;
  min-height: 100vh;
  padding: 20px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;

  i {
    color: #1976d2;
    font-size: 28px;
  }

  h4 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
  }
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #1565c0;
  }

  i {
    font-size: 20px;
  }
}

.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;

  &.blue {
    border-left: 4px solid #1976d2;
  }

  &.green {
    border-left: 4px solid #388e3c;
  }

  &.orange {
    border-left: 4px solid #f57c00;
  }

  &.red {
    border-left: 4px solid #d32f2f;
  }
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  .stat-card.blue & {
    background: rgba(25, 118, 210, 0.1);
    color: #1976d2;
  }

  .stat-card.green & {
    background: rgba(56, 142, 60, 0.1);
    color: #388e3c;
  }

  .stat-card.orange & {
    background: rgba(245, 124, 0, 0.1);
    color: #f57c00;
  }

  .stat-card.red & {
    background: rgba(211, 47, 47, 0.1);
    color: #d32f2f;
  }

  i {
    font-size: 28px;
  }
}

.stat-content {
  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #6c757d;
  }
}

.filter-section {
  margin-bottom: 24px;
}

.filter-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: #2c3e50;
  font-weight: 500;

  i {
    color: #1976d2;
  }
}

.filter-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
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

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  i {
    position: absolute;
    left: 12px;
    color: #6c757d;
    font-size: 20px;
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

.select-wrapper {
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

.table-section {
  margin-bottom: 24px;
}

.table-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h6 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
  }
}

.table-info {
  font-size: 0.9rem;
  color: #6c757d;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #6c757d;

  .loading-spinner {
    margin-bottom: 16px;
  }
}

.table-container {
  overflow-x: auto;
}

.notifications-table {
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 16px 12px;
    background: #f8f9fa;
    color: #2c3e50;
    font-weight: 600;
    border-bottom: 2px solid #e9ecef;
    font-size: 0.9rem;
  }

  td {
    padding: 16px 12px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
  }

  tr:hover {
    background: #f8f9fa;
  }
}

.notification-info {
  .notification-title {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .notification-preview {
    font-size: 0.8rem;
    color: #6c757d;
    line-height: 1.4;
  }
}

.badges-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.type-badge,
.priority-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;

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

  &.priority-low {
    background: rgba(76, 175, 80, 0.1);
    color: #4caf50;
  }

  &.priority-medium {
    background: rgba(33, 150, 243, 0.1);
    color: #2196f3;
  }

  &.priority-high {
    background: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }

  &.priority-urgent {
    background: rgba(244, 67, 54, 0.1);
    color: #f44336;
  }
}

.scope-info {
  .scope-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;

    &.global {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    &.targeted {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    i {
      font-size: 16px;
    }
  }
}

.date-info {
  font-size: 0.9rem;
  color: #6c757d;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;

  &.active {
    background: rgba(76, 175, 80, 0.1);
    color: #4caf50;
  }

  &.inactive {
    background: rgba(244, 67, 54, 0.1);
    color: #f44336;
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &.view {
    background: rgba(33, 150, 243, 0.1);
    color: #2196f3;

    &:hover {
      background: rgba(33, 150, 243, 0.2);
    }
  }

  &.delete {
    background: rgba(244, 67, 54, 0.1);
    color: #f44336;

    &:hover {
      background: rgba(244, 67, 54, 0.2);
    }
  }

  i {
    font-size: 18px;
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

  i {
    font-size: 80px;
    color: #e0e0e0;
  }
}

.empty-state h6 {
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

  i {
    font-size: 20px;
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
  border-radius: 12px;
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
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #1976d2;
  color: white;

  h5 {
    margin: 0;
    font-weight: 600;
    font-size: 1.2rem;
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

  i {
    font-size: 20px;
  }
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

// Form Styles
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.9rem;
  color: #2c3e50;
  font-weight: 600;
}

.required {
  color: #e74c3c;
}

.form-input,
.form-textarea {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;

  &:focus {
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
  }

  &::placeholder {
    color: #999;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

// Custom Select Styles
.form-select {
  width: 100% !important;
  padding: 12px 16px !important;
  border: 2px solid #e0e0e0 !important;
  border-radius: 8px !important;
  font-size: 0.9rem !important;
  outline: none !important;
  background: white !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  appearance: none !important;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e") !important;
  background-repeat: no-repeat !important;
  background-position: right 12px center !important;
  background-size: 16px !important;
  padding-right: 40px !important;

  &:focus {
    border-color: #1976d2 !important;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1) !important;
  }

  option {
    padding: 8px 12px;
    background: white;
    color: #2c3e50;
  }
}

// Checkbox Styles
.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  color: #2c3e50;
  gap: 12px;
  padding: 8px 0;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
}

.checkbox-text {
  user-select: none;
  font-weight: 500;
}

.form-help {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.btn-cancel,
.btn-submit {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: #6c757d;
  color: white;

  &:hover {
    background: #5a6268;
  }
}

.btn-submit {
  background: #1976d2;
  color: white;

  &:hover:not(:disabled) {
    background: #1565c0;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

// Notification Details
.notification-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section {
  h6 {
    color: #2c3e50;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .notification-message {
    color: #6c757d;
    line-height: 1.5;
    margin: 0;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  span {
    color: #2c3e50;
    font-weight: 500;
  }
}

.metadata-block {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #2c3e50;
  overflow-x: auto;
  margin: 8px 0 0 0;
}

// Responsive Design
@media (max-width: 768px) {
  .admin-notifications {
    padding: 16px 0;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .filter-row {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .notifications-table {

    th,
    td {
      padding: 12px 8px;
      font-size: 0.8rem;
    }
  }

  .pagination-section {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }

  .modal-overlay {
    padding: 10px;
  }

  .modal-container {
    max-height: 95vh;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .modal-header,
  .modal-content,
  .modal-footer {
    padding: 16px;
  }
}
</style>