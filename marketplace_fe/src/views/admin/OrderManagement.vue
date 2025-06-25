<template>
  <div class="container">
    <div class="page-header">
      <h4>Quản Lý Đơn Hàng</h4>
      <div class="header-actions">
        <button 
          class="btn waves-effect waves-light"
          @click="exportOrders"
          :disabled="orders.length === 0"
        >
          <i class="material-icons left">file_download</i>
          Xuất Excel
        </button>
      </div>
    </div>
    
    <!-- Enhanced Filters -->
    <div class="filters-container">
      <div class="filters-card">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Trạng Thái</label>
            <div class="input-field">
              <select 
                key="status-filter"
                v-model="filters.status" 
                @change="applyFilters"
                class="filter-select"
              >
                <option value="">Tất Cả Đơn Hàng</option>
                <option value="PENDING">Chờ Xử Lý</option>
                <option value="PROCESSING">Đang Xử Lý</option>
                <option value="SHIPPED">Đã Gửi</option>
                <option value="DELIVERED">Đã Giao</option>
                <option value="CANCELLED">Đã Hủy</option>
              </select>
            </div>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Từ Ngày</label>
            <div class="input-field">
              <input 
                type="date" 
                v-model="filters.startDate"
                @change="applyFilters"
              >
            </div>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Đến Ngày</label>
            <div class="input-field">
              <input 
                type="date" 
                v-model="filters.endDate"
                @change="applyFilters"
              >
            </div>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Tìm Kiếm</label>
            <div class="input-field">
              <input 
                type="text" 
                v-model="filters.search"
                @input="debounceSearch"
                placeholder="Mã đơn, tên khách hàng..."
              >
            </div>
          </div>
          
          <div class="filter-actions">
            <button 
              class="btn-flat waves-effect reset-btn"
              @click="resetFilters"
            >
              <i class="material-icons left">refresh</i>
              Đặt Lại
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Active Filters Display -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="filter-label">Bộ lọc đang áp dụng:</span>
      <div class="filter-chips">
        <div v-if="filters.status" class="chip">
          Trạng thái: {{ getStatusLabel(filters.status) }}
          <i class="material-icons" @click="clearFilter('status')">close</i>
        </div>
        <div v-if="filters.startDate" class="chip">
          Từ: {{ formatDate(filters.startDate) }}
          <i class="material-icons" @click="clearFilter('startDate')">close</i>
        </div>
        <div v-if="filters.endDate" class="chip">
          Đến: {{ formatDate(filters.endDate) }}
          <i class="material-icons" @click="clearFilter('endDate')">close</i>
        </div>
        <div v-if="filters.search" class="chip">
          Tìm kiếm: {{ filters.search }}
          <i class="material-icons" @click="clearFilter('search')">close</i>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <LoadingSpinner text="Đang tải đơn hàng..." />
    </div>
    
    <div v-else class="content-wrapper">
      <!-- Orders Table -->
      <div class="table-container">
        <div class="table-header">
          <h6>Danh Sách Đơn Hàng</h6>
          <span class="result-count">{{ orders.length }} đơn hàng</span>
        </div>
        
        <div class="table-wrapper">
          <table class="responsive-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Ngày Đặt</th>
                <th>Sản Phẩm</th>
                <th>Tổng Tiền</th>
                <th>Thanh Toán</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="orders.length === 0" class="empty-row">
                <td colspan="8" class="center-align">
                  <div class="empty-state">
                    <i class="material-icons">inbox</i>
                    <p>Không có đơn hàng nào phù hợp</p>
                  </div>
                </td>
              </tr>
              <tr 
                v-for="order in orders" 
                :key="order.id"
                class="order-row"
                :class="{ 'status-changed': order._statusChanged }"
              >
                <td>
                  <div class="order-id">
                    <strong>#{{ order.id.slice(-8) }}</strong>
                  </div>
                </td>
                <td>
                  <div class="customer-info">
                    <strong>{{ order.user?.name || 'N/A' }}</strong>
                    <span class="email">{{ order.user?.email || '' }}</span>
                  </div>
                </td>
                <td>
                  <div class="date-info">
                    {{ formatDateTime(order.createdAt) }}
                  </div>
                </td>
                <td>
                  <div class="items-count">
                    <i class="material-icons tiny">shopping_basket</i>
                    {{ order._count?.items || 0 }} sản phẩm
                  </div>
                </td>
                <td>
                  <div class="amount">
                    <strong>${{ order.totalAmount?.toFixed(2) || '0.00' }}</strong>
                  </div>
                </td>
                <td>
                  <span 
                    class="payment-badge"
                    :class="getPaymentStatusClass(order.payment?.status)"
                  >
                    {{ formatPaymentStatus(order.payment?.status) }}
                  </span>
                </td>
                <td>
                  <div class="status-wrapper">
                    <select 
                      :key="`status-${order.id}-${order.status}`"
                      :value="order.status"
                      @change="updateOrderStatus(order.id, $event.target.value)"
                      :disabled="updatingStatus === order.id"
                      class="browser-default status-select-native"
                    >
                      <option value="PENDING">Chờ Xử Lý</option>
                      <option value="PROCESSING">Đang Xử Lý</option>
                      <option value="SHIPPED">Đã Gửi</option>
                      <option value="DELIVERED">Đã Giao</option>
                      <option value="CANCELLED">Đã Hủy</option>
                    </select>
                    <div v-if="updatingStatus === order.id" class="status-loading">
                      <div class="preloader-wrapper tiny active">
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
                  </div>
                </td>
                <td>
                  <div class="action-buttons">
                    <router-link 
                      :to="`/orders/${order.id}`"
                      class="btn-flat btn-small waves-effect action-btn"
                      title="Xem Chi Tiết"
                    >
                      <i class="material-icons">visibility</i>
                    </router-link>
                    <button 
                      class="btn-flat btn-small waves-effect action-btn"
                      @click="printOrder(order)"
                      title="In Đơn Hàng"
                    >
                      <i class="material-icons">print</i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Enhanced Pagination -->
        <div class="pagination-wrapper" v-if="totalPages > 1">
          <div class="pagination-info">
            Trang {{ currentPage }} / {{ totalPages }}
          </div>
          <ul class="pagination">
            <li :class="{ disabled: currentPage === 1 }">
              <a @click="changePage(1)" title="Trang đầu">
                <i class="material-icons">first_page</i>
              </a>
            </li>
            <li :class="{ disabled: currentPage === 1 }">
              <a @click="changePage(currentPage - 1)" title="Trang trước">
                <i class="material-icons">chevron_left</i>
              </a>
            </li>
            
            <li 
              v-for="page in getVisiblePages()" 
              :key="page"
              :class="{ active: page === currentPage }"
            >
              <a @click="changePage(page)">{{ page }}</a>
            </li>
            
            <li :class="{ disabled: currentPage === totalPages }">
              <a @click="changePage(currentPage + 1)" title="Trang sau">
                <i class="material-icons">chevron_right</i>
              </a>
            </li>
            <li :class="{ disabled: currentPage === totalPages }">
              <a @click="changePage(totalPages)" title="Trang cuối">
                <i class="material-icons">last_page</i>
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Enhanced Order Stats -->
      <div class="stats-container">
        <h6>Thống Kê Đơn Hàng</h6>
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-icon">
              <i class="material-icons">shopping_cart</i>
            </div>
            <div class="stat-content">
              <h6>Tổng Đơn Hàng</h6>
              <h4>{{ orderStats.total }}</h4>
            </div>
          </div>
          
          <div class="stat-card pending">
            <div class="stat-icon">
              <i class="material-icons">schedule</i>
            </div>
            <div class="stat-content">
              <h6>Chờ Xử Lý</h6>
              <h4>{{ orderStats.pending }}</h4>
            </div>
          </div>
          
          <div class="stat-card processing">
            <div class="stat-icon">
              <i class="material-icons">settings</i>
            </div>
            <div class="stat-content">
              <h6>Đang Xử Lý</h6>
              <h4>{{ orderStats.processing }}</h4>
            </div>
          </div>
          
          <div class="stat-card shipped">
            <div class="stat-icon">
              <i class="material-icons">local_shipping</i>
            </div>
            <div class="stat-content">
              <h6>Đã Gửi</h6>
              <h4>{{ orderStats.shipped }}</h4>
            </div>
          </div>
          
          <div class="stat-card delivered">
            <div class="stat-icon">
              <i class="material-icons">done</i>
            </div>
            <div class="stat-content">
              <h6>Đã Giao</h6>
              <h4>{{ orderStats.delivered }}</h4>
            </div>
          </div>
          
          <div class="stat-card cancelled">
            <div class="stat-icon">
              <i class="material-icons">cancel</i>
            </div>
            <div class="stat-content">
              <h6>Đã Hủy</h6>
              <h4>{{ orderStats.cancelled }}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useToast } from 'vue-toastification'
import adminService from '@/services/admin.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const toast = useToast()

// State
const orders = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const updatingStatus = ref(null)
const searchTimeout = ref(null)

const filters = ref({
  status: '',
  startDate: '',
  endDate: '',
  search: ''
})

// Computed
const orderStats = computed(() => {
  const stats = {
    total: orders.value.length,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  }

  orders.value.forEach(order => {
    const status = order.status?.toLowerCase()
    if (stats.hasOwnProperty(status)) {
      stats[status]++
    }
  })

  return stats
})

const hasActiveFilters = computed(() => {
  return filters.value.status || 
         filters.value.startDate || 
         filters.value.endDate || 
         filters.value.search
})

// Methods
const initializeMaterialize = () => {
  nextTick(() => {
    // Only initialize filter selects, not table status selects
    const filterSelects = document.querySelectorAll('.filter-select')
    
    // Destroy existing instances first to prevent duplicates
    filterSelects.forEach(select => {
      const instance = M.FormSelect.getInstance(select)
      if (instance) {
        instance.destroy()
      }
    })
    
    // Initialize filter select elements only
    if (filterSelects.length > 0) {
      M.FormSelect.init(filterSelects, {
        dropdownOptions: {
          container: document.body,
          constrainWidth: false
        }
      })
      console.log('✅ Materialize filter selects initialized:', filterSelects.length)
    } else {
      console.warn('⚠️ No filter select elements found for Materialize initialization')
    }
  })
}

const fetchOrders = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      limit: 20,
      ...filters.value
    }
    
    console.log('Fetching orders with params:', params)
    const response = await adminService.getAllOrders(params)
    
    orders.value = response.data.data || []
    totalPages.value = response.data.meta?.totalPages || 1
    
    console.log(`Loaded ${orders.value.length} orders`)
    
    // Initialize Materialize components after data is loaded
    initializeMaterialize()
    
  } catch (error) {
    console.error('Error fetching orders:', error)
    toast.error('Không thể tải danh sách đơn hàng')
  } finally {
    loading.value = false
  }
}

const updateOrderStatus = async (orderId, newStatus) => {
  updatingStatus.value = orderId
  
  try {
    await adminService.updateOrderStatus(orderId, newStatus)
    
    // Update local state
    const orderIndex = orders.value.findIndex(o => o.id === orderId)
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = newStatus
      orders.value[orderIndex]._statusChanged = true
      
      // Remove the flag after animation
      setTimeout(() => {
        if (orders.value[orderIndex]) {
          orders.value[orderIndex]._statusChanged = false
        }
      }, 2000)
    }
    
    toast.success('Cập nhật trạng thái thành công')
    
  } catch (error) {
    console.error('Error updating order status:', error)
    toast.error('Không thể cập nhật trạng thái đơn hàng')
  } finally {
    updatingStatus.value = null
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchOrders()
}

const debounceSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    applyFilters()
  }, 500)
}

const resetFilters = () => {
  filters.value = {
    status: '',
    startDate: '',
    endDate: '',
    search: ''
  }
  currentPage.value = 1
  fetchOrders()
}

const clearFilter = (filterName) => {
  filters.value[filterName] = ''
  applyFilters()
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchOrders()
  }
}

const getVisiblePages = () => {
  const delta = 2
  const range = []
  const rangeWithDots = []

  for (let i = Math.max(2, currentPage.value - delta);
       i <= Math.min(totalPages.value - 1, currentPage.value + delta);
       i++) {
    range.push(i)
  }

  if (currentPage.value - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (currentPage.value + delta < totalPages.value - 1) {
    rangeWithDots.push('...', totalPages.value)
  } else {
    rangeWithDots.push(totalPages.value)
  }

  return rangeWithDots
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('vi-VN')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const formatPaymentStatus = (status) => {
  const statusMap = {
    'COMPLETED': 'Đã Thanh Toán',
    'PENDING': 'Chờ Thanh Toán',
    'FAILED': 'Thất Bại'
  }
  return statusMap[status] || 'Chưa Rõ'
}

const getPaymentStatusClass = (status) => {
  const classMap = {
    'COMPLETED': 'completed',
    'PENDING': 'pending',
    'FAILED': 'failed'
  }
  return classMap[status] || 'pending'
}

const getStatusLabel = (status) => {
  const statusMap = {
    'PENDING': 'Chờ Xử Lý',
    'PROCESSING': 'Đang Xử Lý',
    'SHIPPED': 'Đã Gửi',
    'DELIVERED': 'Đã Giao',
    'CANCELLED': 'Đã Hủy'
  }
  return statusMap[status] || status
}

const exportOrders = () => {
  // TODO: Implement export functionality
  toast.info('Tính năng xuất Excel đang được phát triển')
}

const printOrder = (order) => {
  // TODO: Implement print functionality
  toast.info('Tính năng in đơn hàng đang được phát triển')
}

// Lifecycle
onMounted(async () => {
  await fetchOrders()
})

// Watch for orders changes to reinitialize Materialize components
watch(orders, () => {
  initializeMaterialize()
}, { flush: 'post' })
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h4 {
    margin: 0;
    color: #333;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
  }
}

.filters-container {
  margin-bottom: 2rem;
}

.filters-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1.5rem;
}

.filter-row {
  display: flex;
  gap: 1.5rem;
  align-items: end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 160px;
  flex: 1;
  
  .filter-label {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  .input-field {
    margin: 0;
    
    input {
      height: 2.5rem;
      font-size: 0.95rem;
      border-radius: 6px;
      border: 1px solid #ddd;
      padding: 0 0.75rem;
      background: white;
      
      &:focus {
        border-color: #2196F3;
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
      }
    }
    
    // Materialize select styling for filter only
    .filter-select {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    // Ensure Materialize dropdown is visible for filter
    .dropdown-content {
      display: block !important;
      visibility: visible !important;
      z-index: 9999 !important;
    }
  }
}

.filter-actions {
  display: flex;
  align-items: end;
  
  .reset-btn {
    height: 2.5rem;
    line-height: 2.5rem;
    padding: 0 1rem;
    border-radius: 6px;
    color: #666;
    
    &:hover {
      background-color: #f5f5f5;
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
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.75rem;
      border-radius: 16px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      i {
        font-size: 1rem;
        cursor: pointer;
        opacity: 0.7;
        
        &:hover {
          opacity: 1;
        }
      }
    }
  }
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  background: #fafafa;
  
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

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  
  th, td {
    padding: 1rem 0.75rem;
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
    
    &.status-changed {
      background-color: #e8f5e9;
      animation: statusChanged 2s ease-out;
    }
  }
}

@keyframes statusChanged {
  0% { background-color: #4caf50; }
  100% { background-color: #e8f5e9; }
}

.empty-row {
  .empty-state {
    padding: 3rem;
    text-align: center;
    color: #999;
    
    i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    
    p {
      font-size: 1.1rem;
      margin: 0;
    }
  }
}

.order-id strong {
  color: #2196F3;
  font-family: 'Courier New', monospace;
}

.customer-info {
  .email {
    display: block;
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.25rem;
  }
}

.date-info {
  font-size: 0.9rem;
  color: #555;
}

.items-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  
  i {
    color: #999;
  }
}

.amount strong {
  color: #4caf50;
  font-size: 1.05rem;
}

.payment-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.completed {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  &.pending {
    background: #fff3cd;
    color: #856404;
  }
  
  &.failed {
    background: #ffebee;
    color: #c62828;
  }
}

.status-wrapper {
  position: relative;
  
  .status-select-native {
    font-size: 0.9rem;
    height: 2rem;
    line-height: 2rem;
    padding: 0 0.5rem;
    border-radius: 6px;
    border: 1px solid #ddd;
    background: white;
    min-width: 140px;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: #2196F3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .status-loading {
    position: absolute;
    top: 50%;
    right: 0.5rem;
    transform: translateY(-50%);
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
    
    i {
      font-size: 1.1rem;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
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
      
      &:hover {
        background-color: #e0e0e0;
      }
    }
    
    li.active a {
      background-color: #2196F3;
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

.stats-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1.5rem;
  
  h6 {
    margin: 0 0 1.5rem 0;
    color: #333;
    font-weight: 600;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &.total {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  &.pending {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
  }
  
  &.processing {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
  }
  
  &.shipped {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    color: white;
  }
  
  &.delivered {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
  }
  
  &.cancelled {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    color: #333;
  }
  
  .stat-icon {
    i {
      font-size: 2.5rem;
      opacity: 0.8;
    }
  }
  
  .stat-content {
    h6 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      opacity: 0.9;
      font-weight: 400;
    }
    
    h4 {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

// Responsive Design
@media (max-width: 1200px) {
  .filter-row {
    .filter-group {
      min-width: 140px;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    
    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
    
    .filter-group {
      min-width: 100%;
    }
    
    .filter-actions {
      align-items: stretch;
      
      .reset-btn {
        width: 100%;
        text-align: center;
      }
    }
  }
  
  .active-filters {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .pagination-wrapper {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    .stat-icon i {
      font-size: 2rem;
    }
    
    .stat-content h4 {
      font-size: 1.75rem;
    }
  }
}

@media (max-width: 480px) {
  table {
    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.85rem;
    }
  }
  
  .customer-info strong {
    font-size: 0.9rem;
  }
  
  .amount strong {
    font-size: 0.95rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>