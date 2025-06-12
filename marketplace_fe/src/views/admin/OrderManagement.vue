<!-- src/views/admin/OrderManagement.vue -->
<template>
  <div class="container">
    <h4>Order Management</h4>
    
    <div class="row">
      <div class="col s12">
        <div class="filters">
          <div class="input-field inline">
            <select v-model="filters.status" @change="fetchOrders">
              <option value="">All Orders</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <label>Status</label>
          </div>
          
          <div class="input-field inline">
            <input 
              type="date" 
              v-model="filters.startDate"
              @change="fetchOrders"
            >
            <label>From Date</label>
          </div>
          
          <div class="input-field inline">
            <input 
              type="date" 
              v-model="filters.endDate"
              @change="fetchOrders"
            >
            <label>To Date</label>
          </div>
          
          <button 
            class="btn-flat waves-effect"
            @click="resetFilters"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Loading orders..." />
    </div>
    
    <div v-else>
      <!-- Orders Table -->
      <div class="custom-card">
        <table class="striped responsive-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>#{{ order.id.slice(-8) }}</td>
              <td>
                <div class="customer-info">
                  <strong>{{ order.user.name }}</strong>
                  <p>{{ order.user.email }}</p>
                </div>
              </td>
              <td>{{ formatDateTime(order.createdAt) }}</td>
              <td>{{ order._count.items }} items</td>
              <td>${{ order.totalAmount.toFixed(2) }}</td>
              <td>
                <span 
                  class="payment-badge"
                  :class="order.payment?.status.toLowerCase()"
                >
                  {{ order.payment?.status || 'PENDING' }}
                </span>
              </td>
              <td>
                <div class="input-field inline status-select">
                  <select 
                    :value="order.status"
                    @change="updateOrderStatus(order.id, $event.target.value)"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </td>
              <td>
                <router-link 
                  :to="`/orders/${order.id}`"
                  class="btn-flat btn-small waves-effect"
                  title="View Details"
                >
                  <i class="material-icons">visibility</i>
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div class="center-align">
          <ul class="pagination">
            <li :class="{ disabled: currentPage === 1 }">
              <a @click="changePage(currentPage - 1)">
                <i class="material-icons">chevron_left</i>
              </a>
            </li>
            
            <li 
              v-for="page in totalPages" 
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
      <div class="row">
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <h6>Total Orders</h6>
            <h5>{{ orderStats.total }}</h5>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <h6>Pending</h6>
            <h5 class="orange-text">{{ orderStats.pending }}</h5>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <h6>Processing</h6>
            <h5 class="blue-text">{{ orderStats.processing }}</h5>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <h6>Delivered</h6>
            <h5 class="green-text">{{ orderStats.delivered }}</h5>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores/order'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDateTime, formatPaymentStatus } from '@/utils/formatters'

// Add your component logic here (merge both script blocks if needed)
const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const authStore = useAuthStore()
const toast = useToast()

const orderId = computed(() => route.params.id)
const order = computed(() => orderStore.currentOrder)

const orderStatuses = [
  { value: 'PENDING', label: 'Order Placed', icon: 'shopping_cart' },
  { value: 'PROCESSING', label: 'Processing', icon: 'settings' },
  { value: 'SHIPPED', label: 'Shipped', icon: 'local_shipping' },
  { value: 'DELIVERED', label: 'Delivered', icon: 'done' }
]

const canPerformActions = computed(() => {
  return order.value?.userId === authStore.user?.id || authStore.isAdmin
})

const canCancel = computed(() => {
  return order.value?.status === 'PENDING' || order.value?.status === 'PROCESSING'
})

const hasReviewed = ref(false) // TODO: Check if user has reviewed products

const isStatusActive = (status) => {
  return order.value?.status === status
}

const isStatusCompleted = (status) => {
  const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
  const currentIndex = statusOrder.indexOf(order.value?.status)
  const checkIndex = statusOrder.indexOf(status)
  return checkIndex <= currentIndex
}

const getStatusDate = (status) => {
  // In real app, you'd track status change dates
  if (status === 'PENDING') return order.value?.createdAt
  return null
}

const goToReview = () => {
  // Navigate to first product for review
  const firstProduct = order.value.items[0]?.product
  if (firstProduct) {
    router.push(`/products/${firstProduct.id}#reviews`)
  }
}

const cancelOrder = async () => {
  if (!confirm('Are you sure you want to cancel this order?')) return
  
  try {
    await orderStore.updateOrderStatus(orderId.value, 'CANCELLED')
    toast.success('Order cancelled successfully')
  } catch (error) {
    console.error('Error cancelling order:', error)
  }
}

const downloadInvoice = () => {
  toast.info('Invoice download coming soon')
  // Implement invoice generation
}

onMounted(async () => {
  await orderStore.fetchOrderById(orderId.value)
})
</script>

<style scoped lang="scss">
.order-number {
  color: #666;
  font-size: 1.1rem;
  margin-top: -10px;
}

.status-timeline {
  position: relative;
  padding: 20px 0;
  
  .status-step {
    display: flex;
    align-items: start;
    position: relative;
    margin-bottom: 30px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .step-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      i {
        color: white;
        font-size: 24px;
      }
    }
    
    .step-info {
      margin-left: 20px;
      
      h6 {
        margin: 0 0 5px 0;
        font-weight: 500;
      }
      
      p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }
    }
    
    .step-line {
      position: absolute;
      left: 25px;
      top: 50px;
      width: 2px;
      height: 30px;
      background: #e0e0e0;
    }
    
    &.completed {
      .step-icon {
        background: #4caf50;
      }
      
      .step-line {
        background: #4caf50;
      }
    }
    
    &.active {
      .step-icon {
        background: #1976d2;
        animation: pulse 2s infinite;
      }
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
}

.order-items {
  .order-item {
    display: flex;
    align-items: center;
    padding: 15px 0;
    border-bottom: 1px solid #e0e0e0;
    
    &:last-child {
      border-bottom: none;
    }
    
    img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
      margin-right: 15px;
    }
    
    .item-details {
      flex: 1;
      
      h6 {
        margin: 0 0 5px 0;
        font-weight: 500;
      }
      
      p {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }
    }
    
    .item-total {
      font-weight: 600;
      font-size: 1.1rem;
    }
  }
}

.order-summary {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    
    &.total {
      font-weight: 600;
      font-size: 1.2rem;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
    }
  }
}

.info-section {
  p {
    margin: 10px 0;
  }
}

.payment-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  
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

.full-width {
  width: 100%;
  margin-bottom: 10px;
}
</style>