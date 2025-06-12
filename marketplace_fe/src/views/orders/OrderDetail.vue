<!-- src/views/orders/OrderDetail.vue -->
<template>
  <div class="container" v-if="order">
    <div class="row">
      <div class="col s12">
        <h4>Order Details</h4>
        <p class="order-number">Order #{{ order.id.slice(-8) }}</p>
      </div>
    </div>
    
    <div class="row">
      <div class="col s12 m8">
        <!-- Order Status -->
        <div class="custom-card">
          <h5>Order Status</h5>
          <div class="status-timeline">
            <div 
              v-for="(status, index) in orderStatuses" 
              :key="status.value"
              class="status-step"
              :class="{ 
                active: isStatusActive(status.value),
                completed: isStatusCompleted(status.value)
              }"
            >
              <div class="step-icon">
                <i class="material-icons">{{ status.icon }}</i>
              </div>
              <div class="step-info">
                <h6>{{ status.label }}</h6>
                <p v-if="getStatusDate(status.value)">
                  {{ formatDateTime(getStatusDate(status.value)) }}
                </p>
              </div>
              <div v-if="index < orderStatuses.length - 1" class="step-line"></div>
            </div>
          </div>
        </div>
        
        <!-- Order Items -->
        <div class="custom-card">
          <h5>Order Items</h5>
          <div class="order-items">
            <div 
              v-for="item in order.items" 
              :key="item.id"
              class="order-item"
            >
              <img 
                :src="item.product.images[0] || '/placeholder.jpg'" 
                :alt="item.product.name"
              >
              <div class="item-details">
                <h6>{{ item.product.name }}</h6>
                <p>Quantity: {{ item.quantity }} × ${{ item.price.toFixed(2) }}</p>
              </div>
              <div class="item-total">
                ${{ (item.quantity * item.price).toFixed(2) }}
              </div>
            </div>
          </div>
          
          <div class="order-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${{ order.totalAmount.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <span>${{ order.totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col s12 m4">
        <!-- Customer Information -->
        <div class="custom-card">
          <h5>Customer Information</h5>
          <div class="info-section">
            <p><strong>Name:</strong> {{ order.user.name }}</p>
            <p><strong>Email:</strong> {{ order.user.email }}</p>
            <p><strong>Phone:</strong> {{ order.user.phone || 'N/A' }}</p>
          </div>
        </div>
        
        <!-- Payment Information -->
        <div class="custom-card">
          <h5>Payment Information</h5>
          <div class="info-section">
            <p><strong>Method:</strong> {{ order.payment?.method || 'Card' }}</p>
            <p><strong>Status:</strong> 
              <span class="payment-status" :class="order.payment?.status.toLowerCase()">
                {{ formatPaymentStatus(order.payment?.status) }}
              </span>
            </p>
            <p><strong>Transaction ID:</strong> {{ order.payment?.stripePaymentId?.slice(-12) || 'N/A' }}</p>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="custom-card" v-if="canPerformActions">
          <h5>Actions</h5>
          <button 
            v-if="order.status === 'DELIVERED' && !hasReviewed"
            class="btn waves-effect waves-light full-width"
            @click="goToReview"
          >
            Leave a Review
          </button>
          
          <button 
            v-if="canCancel"
            class="btn red waves-effect waves-light full-width"
            @click="cancelOrder"
          >
            Cancel Order
          </button>
          
          <button 
            class="btn-flat waves-effect full-width"
            @click="downloadInvoice"
          >
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="container">
    <LoadingSpinner text="Loading order details..." />
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