<template>
  <div class="container">
    <h4>Quản Lý Đơn Hàng</h4>
    
    <div class="row">
      <div class="col s12">
        <div class="filters">
          <div class="input-field inline">
            <select v-model="filters.status" @change="fetchOrders">
              <option value="">Tất Cả Đơn Hàng</option>
              <option value="PENDING">Chờ Xử Lý</option>
              <option value="PROCESSING">Đang Xử Lý</option>
              <option value="SHIPPED">Đã Gửi</option>
              <option value="DELIVERED">Đã Giao</option>
              <option value="CANCELLED">Đã Hủy</option>
            </select>
            <label>Trạng Thái</label>
          </div>
          
          <div class="input-field inline">
            <input 
              type="date" 
              v-model="filters.startDate"
              @change="fetchOrders"
            >
            <label>Từ Ngày</label>
          </div>
          
          <div class="input-field inline">
            <input 
              type="date" 
              v-model="filters.endDate"
              @change="fetchOrders"
            >
            <label>Đến Ngày</label>
          </div>
          
          <button 
            class="btn-flat waves-effect"
            @click="resetFilters"
          >
            <i class="material-icons left">refresh</i>
            Đặt Lại
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Đang tải đơn hàng..." />
    </div>
    
    <div v-else>
      <!-- Orders Table -->
      <div class="custom-card">
        <table class="striped responsive-table">
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
            <tr v-if="orders.length === 0">
              <td colspan="8" class="center-align">
                <p>Không có đơn hàng nào</p>
              </td>
            </tr>
            <tr v-for="order in orders" :key="order.id">
              <td>
                <strong>#{{ order.id.slice(-8) }}</strong>
              </td>
              <td>
                <div class="customer-info">
                  <strong>{{ order.user?.name || 'N/A' }}</strong>
                  <p>{{ order.user?.email || '' }}</p>
                </div>
              </td>
              <td>{{ formatDateTime(order.createdAt) }}</td>
              <td>{{ order._count?.items || 0 }} sản phẩm</td>
              <td>
                <strong>${{ order.totalAmount?.toFixed(2) || '0.00' }}</strong>
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
                <div class="input-field inline status-select">
                  <select 
                    :value="order.status"
                    @change="updateOrderStatus(order.id, $event.target.value)"
                  >
                    <option value="PENDING">Chờ Xử Lý</option>
                    <option value="PROCESSING">Đang Xử Lý</option>
                    <option value="SHIPPED">Đã Gửi</option>
                    <option value="DELIVERED">Đã Giao</option>
                    <option value="CANCELLED">Đã Hủy</option>
                  </select>
                </div>
              </td>
              <td>
                <router-link 
                  :to="`/orders/${order.id}`"
                  class="btn-flat btn-small waves-effect"
                  title="Xem Chi Tiết"
                >
                  <i class="material-icons">visibility</i>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div class="center-align" v-if="totalPages > 1">
          <ul class="pagination">
            <li :class="{ disabled: currentPage === 1 }">
              <a @click="changePage(currentPage - 1)">
                <i class="material-icons">chevron_left</i>
              </a>
            </li>
            
            <li 
              v-for="page in Math.min(totalPages, 10)" 
              :key="page"
              :class="{ active: page === currentPage }"
            >
              <a @click="changePage(page)">{{ page }}</a>
            </li>
            
            <li :class="{ disabled: currentPage === totalPages }">
              <a @click="changePage(currentPage + 1)">
                <i class="material-icons">chevron_right</i>
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Order Stats -->
      <div class="row" style="margin-top: 30px;">
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <div class="stat-content">
              <i class="material-icons">shopping_cart</i>
              <div>
                <h6>Tổng Đơn Hàng</h6>
                <h5>{{ orderStats.total }}</h5>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <div class="stat-content">
              <i class="material-icons orange-text">schedule</i>
              <div>
                <h6>Chờ Xử Lý</h6>
                <h5 class="orange-text">{{ orderStats.pending }}</h5>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <div class="stat-content">
              <i class="material-icons blue-text">settings</i>
              <div>
                <h6>Đang Xử Lý</h6>
                <h5 class="blue-text">{{ orderStats.processing }}</h5>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <div class="stat-content">
              <i class="material-icons green-text">done</i>
              <div>
                <h6>Đã Giao</h6>
                <h5 class="green-text">{{ orderStats.delivered }}</h5>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import adminService from '@/services/admin.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const toast = useToast()

// State
const orders = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)

const filters = ref({
  status: '',
  startDate: '',
  endDate: ''
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

// Methods
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
  } catch (error) {
    console.error('Error fetching orders:', error)
    toast.error('Không thể tải danh sách đơn hàng')
  } finally {
    loading.value = false
  }
}

const updateOrderStatus = async (orderId, newStatus) => {
  try {
    await adminService.updateOrderStatus(orderId, newStatus)
    toast.success('Cập nhật trạng thái thành công')
    
    // Update local state
    const orderIndex = orders.value.findIndex(o => o.id === orderId)
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = newStatus
    }
    
    // Reinitialize select elements
    setTimeout(() => {
      const elems = document.querySelectorAll('select')
      M.FormSelect.init(elems)
    }, 100)
  } catch (error) {
    console.error('Error updating order status:', error)
    toast.error('Không thể cập nhật trạng thái đơn hàng')
  }
}

const resetFilters = () => {
  filters.value = {
    status: '',
    startDate: '',
    endDate: ''
  }
  currentPage.value = 1
  fetchOrders()
  
  // Reinitialize select elements
  setTimeout(() => {
    const elems = document.querySelectorAll('select')
    M.FormSelect.init(elems)
  }, 100)
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchOrders()
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('vi-VN')
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

// Lifecycle
onMounted(async () => {
  await fetchOrders()
  
  // Initialize Materialize components
  setTimeout(() => {
    const elems = document.querySelectorAll('select')
    M.FormSelect.init(elems)
  }, 100)
})
</script>

<style scoped lang="scss">
.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
  
  .input-field {
    margin: 0;
    min-width: 150px;
  }
  
  button {
    height: 36px;
    line-height: 36px;
    padding: 0 16px;
  }
}

.custom-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  margin: 0;
  
  th, td {
    padding: 12px 8px;
  }
  
  thead th {
    background: #f5f5f5;
    font-weight: 500;
  }
}

.customer-info {
  p {
    margin: 2px 0 0 0;
    font-size: 0.85rem;
    color: #666;
  }
}

.payment-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  
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

.status-select {
  margin: 0;
  min-width: 120px;
  
  select {
    font-size: 0.9rem;
  }
}

.stat-card {
  padding: 20px;
  text-align: center;
  
  .stat-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    
    i {
      font-size: 2.5rem;
    }
    
    div {
      text-align: left;
      
      h6 {
        margin: 0 0 5px 0;
        font-size: 0.9rem;
        color: #666;
        font-weight: 400;
      }
      
      h5 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 600;
      }
    }
  }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

@media (max-width: 768px) {
  .filters {
    .input-field {
      min-width: 130px;
    }
  }
  
  .stat-card .stat-content i {
    font-size: 2rem;
  }
}
</style>