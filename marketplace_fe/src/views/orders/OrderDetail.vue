<!-- src/views/orders/OrderDetail.vue -->
<template>
  <div class="container" v-if="order">
    <div class="row">
      <div class="col s12">
        <div class="order-header">
          <h4>Order Details</h4>
          <div class="order-meta">
            <p class="order-number">Order #{{ order.id.slice(-8).toUpperCase() }}</p>
            <p class="order-date">Placed on {{ formatDateTime(order.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col s12 m8">
        <!-- Order Status -->
        <div class="custom-card">
          <h5>Order Status</h5>
          <div class="current-status">
            <div class="status-badge" :class="order.status.toLowerCase()">
              <i class="material-icons">{{ getCurrentStatusIcon() }}</i>
              <span>{{ formatOrderStatus(order.status) }}</span>
            </div>
            <p class="status-description">{{ getStatusDescription() }}</p>
          </div>
          
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
        
        <!-- Shipping Address (if available) -->
        <div v-if="order.shippingAddress" class="custom-card">
          <h5>Shipping Address</h5>
          <div class="address-info">
            <p><strong>{{ order.shippingAddress.fullName }}</strong></p>
            <p>{{ order.shippingAddress.address }}</p>
            <p>{{ order.shippingAddress.city }}, {{ order.shippingAddress.zipCode }}</p>
            <p><i class="material-icons tiny">phone</i> {{ order.shippingAddress.phone }}</p>
          </div>
        </div>
        
        <!-- Order Items -->
        <div class="custom-card">
          <h5>Order Items ({{ order.items.length }} {{ order.items.length === 1 ? 'item' : 'items' }})</h5>
          <div class="order-items">
            <div 
              v-for="item in order.items" 
              :key="item.id"
              class="order-item"
            >
              <img 
                :src="getProductImage(item.product)" 
                :alt="item.product.name"
                @error="handleImageError"
              >
              <div class="item-details">
                <h6>
                  <router-link :to="`/products/${item.product.id}`">
                    {{ item.product.name }}
                  </router-link>
                </h6>
                <p class="item-seller">Sold by: {{ item.product.seller?.name || 'Marketplace' }}</p>
                <p class="item-price">{{ item.quantity }} × ${{ item.price.toFixed(2) }}</p>
                
                <!-- Review Button for Delivered Items -->
                <div v-if="order.status === 'DELIVERED' && canReview" class="item-actions">
                  <button 
                    class="btn-small waves-effect waves-light"
                    @click="reviewProduct(item.product)"
                  >
                    <i class="material-icons left">star</i>
                    Review
                  </button>
                </div>
              </div>
              <div class="item-total">
                ${{ (item.quantity * item.price).toFixed(2) }}
              </div>
            </div>
          </div>
          
          <div class="order-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${{ calculateSubtotal().toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div class="summary-row">
              <span>Tax (8%)</span>
              <span>${{ calculateTax().toFixed(2) }}</span>
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
            <div class="customer-info">
              <img 
                :src="getUserAvatar()" 
                :alt="order.user.name"
                class="customer-avatar"
                @error="handleAvatarError"
              >
              <div>
                <p><strong>{{ order.user.name }}</strong></p>
                <p><i class="material-icons tiny">email</i> {{ order.user.email }}</p>
                <p v-if="order.user.phone">
                  <i class="material-icons tiny">phone</i> {{ order.user.phone }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Payment Information -->
        <div class="custom-card">
          <h5>Payment Information</h5>
          <div class="info-section">
            <div class="payment-method">
              <i class="material-icons">{{ getPaymentMethodIcon() }}</i>
              <div>
                <p><strong>{{ getPaymentMethodDisplay() }}</strong></p>
                <p class="payment-status" :class="order.payment?.status?.toLowerCase()">
                  <i class="material-icons tiny">{{ getPaymentStatusIcon() }}</i>
                  {{ formatPaymentStatus(order.payment?.status) }}
                </p>
              </div>
            </div>
            
            <div class="transaction-info">
              <p><strong>Transaction ID:</strong></p>
              <p class="transaction-id">{{ getTransactionId() }}</p>
              
              <p><strong>Payment Date:</strong></p>
              <p>{{ formatDateTime(order.payment?.createdAt || order.createdAt) }}</p>
            </div>
            
            <div v-if="order.paymentMethod === 'COD'" class="cod-notice">
              <i class="material-icons">info</i>
              <div>
                <p><strong>Cash on Delivery</strong></p>
                <p>Payment will be collected when the order is delivered to your address.</p>
                <p class="cod-amount">Amount to pay: <strong>${{ order.totalAmount.toFixed(2) }}</strong></p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="custom-card" v-if="canPerformActions">
          <h5>Actions</h5>
          <div class="action-buttons">
            <!-- User Actions -->
            <template v-if="!authStore.isAdmin">
              <button 
                v-if="canCancel"
                class="btn red waves-effect waves-light full-width"
                @click="cancelOrder"
                :disabled="processing"
              >
                <i class="material-icons left">cancel</i>
                Cancel Order
              </button>
              
              <button 
                v-if="order.status === 'DELIVERED'"
                class="btn waves-effect waves-light full-width"
                @click="reorderItems"
                :disabled="processing"
              >
                <i class="material-icons left">refresh</i>
                Reorder Items
              </button>
            </template>
            
            <!-- Admin Actions -->
            <template v-else>
              <div class="admin-status-update">
                <label>Update Status:</label>
                <select v-model="newStatus" class="browser-default">
                  <option value="">Select Status</option>
                  <option 
                    v-for="status in adminStatuses" 
                    :key="status.value"
                    :value="status.value"
                    :disabled="!canUpdateToStatus(status.value)"
                  >
                    {{ status.label }}
                  </option>
                </select>
                <button 
                  class="btn waves-effect waves-light"
                  @click="updateOrderStatus"
                  :disabled="!newStatus || processing"
                >
                  Update
                </button>
              </div>
              
              <button 
                v-if="order.paymentMethod === 'COD' && order.payment?.status === 'PENDING'"
                class="btn green waves-effect waves-light full-width"
                @click="completeCODPayment"
                :disabled="processing"
              >
                <i class="material-icons left">payment</i>
                Mark COD as Paid
              </button>
            </template>
            
            <!-- Common Actions -->
            <button 
              class="btn-flat waves-effect full-width"
              @click="downloadInvoice"
            >
              <i class="material-icons left">description</i>
              Download Invoice
            </button>
            
            <button 
              class="btn-flat waves-effect full-width"
              @click="shareOrder"
            >
              <i class="material-icons left">share</i>
              Share Order
            </button>
          </div>
        </div>
        
        <!-- Need Help -->
        <div class="custom-card">
          <h5>Need Help?</h5>
          <div class="help-links">
            <a href="#" @click.prevent="contactSupport">
              <i class="material-icons">support_agent</i>
              Contact Support
            </a>
            <a href="#" @click.prevent="reportIssue">
              <i class="material-icons">report_problem</i>
              Report an Issue
            </a>
            <a href="#" @click.prevent="trackShipment" v-if="order.status === 'SHIPPED'">
              <i class="material-icons">local_shipping</i>
              Track Shipment
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div v-else-if="loading" class="container">
    <div class="loading-section">
      <div class="preloader-wrapper active">
        <div class="spinner-layer spinner-blue-only">
          <div class="circle-clipper left">
            <div class="circle"></div>
          </div>
        </div>
      </div>
      <p>Loading order details...</p>
    </div>
  </div>
  
  <div v-else class="container">
    <div class="error-section">
      <i class="material-icons large">error_outline</i>
      <h5>Order Not Found</h5>
      <p>The order you're looking for doesn't exist or you don't have permission to view it.</p>
      <router-link to="/orders" class="btn waves-effect waves-light">
        Back to Orders
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useToast } from 'vue-toastification'
import orderService from '@/services/order.service'
import paymentService from '@/services/payment.service'
import { formatDateTime } from '@/utils/formatters'
import { getStaticUrl } from '@/services/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const toast = useToast()

const order = ref(null)
const loading = ref(true)
const processing = ref(false)
const newStatus = ref('')

const orderId = computed(() => route.params.id)

const orderStatuses = [
  { value: 'PENDING', label: 'Order Placed', icon: 'shopping_cart' },
  { value: 'PROCESSING', label: 'Processing', icon: 'settings' },
  { value: 'SHIPPED', label: 'Shipped', icon: 'local_shipping' },
  { value: 'DELIVERED', label: 'Delivered', icon: 'done_all' },
]

const adminStatuses = [
  { value: 'PROCESSING', label: 'Mark as Processing' },
  { value: 'SHIPPED', label: 'Mark as Shipped' },
  { value: 'DELIVERED', label: 'Mark as Delivered' },
  { value: 'CANCELLED', label: 'Cancel Order' },
]

const canPerformActions = computed(() => {
  return order.value && (
    order.value.userId === authStore.user?.id || 
    authStore.isAdmin
  )
})

const canCancel = computed(() => {
  return order.value && 
    order.value.userId === authStore.user?.id &&
    (order.value.status === 'PENDING' || order.value.status === 'PROCESSING')
})

const canReview = computed(() => {
  return order.value && 
    order.value.userId === authStore.user?.id &&
    order.value.status === 'DELIVERED'
})

// Status helpers
const getCurrentStatusIcon = () => {
  const statusIcons = {
    'PENDING': 'hourglass_empty',
    'PROCESSING': 'settings',
    'SHIPPED': 'local_shipping',
    'DELIVERED': 'done_all',
    'CANCELLED': 'cancel'
  }
  return statusIcons[order.value?.status] || 'help'
}

const formatOrderStatus = (status) => {
  const statusLabels = {
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'SHIPPED': 'Shipped',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled'
  }
  return statusLabels[status] || status
}

const getStatusDescription = () => {
  const descriptions = {
    'PENDING': 'Your order has been placed and is awaiting confirmation.',
    'PROCESSING': 'Your order is being prepared for shipment.',
    'SHIPPED': 'Your order is on its way to you.',
    'DELIVERED': 'Your order has been delivered successfully.',
    'CANCELLED': 'This order has been cancelled.'
  }
  return descriptions[order.value?.status] || ''
}

const isStatusActive = (status) => {
  return order.value?.status === status
}

const isStatusCompleted = (status) => {
  const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
  const currentIndex = statusOrder.indexOf(order.value?.status)
  const checkIndex = statusOrder.indexOf(status)
  return checkIndex <= currentIndex && order.value?.status !== 'CANCELLED'
}

const getStatusDate = (status) => {
  if (status === 'PENDING') return order.value?.createdAt
  // In real app, you'd track status change timestamps
  return null
}

// Payment helpers
const getPaymentMethodDisplay = () => {
  if (order.value?.paymentMethod === 'COD') {
    return 'Cash on Delivery'
  }
  return order.value?.payment?.method === 'COD' ? 'Cash on Delivery' : 'Credit Card'
}

const getPaymentMethodIcon = () => {
  if (order.value?.paymentMethod === 'COD') {
    return 'local_atm'
  }
  return 'credit_card'
}

const formatPaymentStatus = (status) => {
  const statusLabels = {
    'PENDING': 'Pending',
    'COMPLETED': 'Completed',
    'FAILED': 'Failed',
    'REFUNDED': 'Refunded'
  }
  return statusLabels[status] || status || 'Pending'
}

const getPaymentStatusIcon = () => {
  const status = order.value?.payment?.status
  const icons = {
    'PENDING': 'schedule',
    'COMPLETED': 'check_circle',
    'FAILED': 'error',
    'REFUNDED': 'undo'
  }
  return icons[status] || 'schedule'
}

const getTransactionId = () => {
  if (order.value?.paymentMethod === 'COD') {
    return `COD-${order.value.id.slice(-8).toUpperCase()}`
  }
  
  if (order.value?.payment?.stripePaymentId) {
    return order.value.payment.stripePaymentId.slice(-12).toUpperCase()
  }
  
  return `ORD-${order.value?.id.slice(-8).toUpperCase()}`
}

// Image helpers
const getProductImage = (product) => {
  const firstImage = product.images?.[0]
  return getStaticUrl(firstImage) || '/placeholder.jpg'
}

const getUserAvatar = () => {
  return getStaticUrl(order.value?.user?.avatar) || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(order.value?.user?.name || 'User')}&background=1976d2&color=fff&size=50`
}

const handleImageError = (event) => {
  event.target.src = '/placeholder.jpg'
}

const handleAvatarError = (event) => {
  event.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.value?.user?.name || 'User')}&background=1976d2&color=fff&size=50`
}

// Calculation helpers
const calculateSubtotal = () => {
  return order.value?.items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0
}

const calculateTax = () => {
  return calculateSubtotal() * 0.08
}

// Action handlers
const fetchOrder = async () => {
  loading.value = true
  try {
    const response = await orderService.getOrderById(orderId.value)
    order.value = response.data
  } catch (error) {
    console.error('Error fetching order:', error)
    toast.error('Failed to load order details')
  } finally {
    loading.value = false
  }
}

const cancelOrder = async () => {
  if (!confirm('Are you sure you want to cancel this order?')) return
  
  processing.value = true
  try {
    await orderService.updateOrderStatus(orderId.value, 'CANCELLED')
    order.value.status = 'CANCELLED'
    toast.success('Order cancelled successfully')
  } catch (error) {
    console.error('Error cancelling order:', error)
    toast.error('Failed to cancel order')
  } finally {
    processing.value = false
  }
}

const updateOrderStatus = async () => {
  if (!newStatus.value) return
  
  processing.value = true
  try {
    await orderService.updateOrderStatus(orderId.value, newStatus.value)
    order.value.status = newStatus.value
    newStatus.value = ''
    toast.success('Order status updated successfully')
  } catch (error) {
    console.error('Error updating order status:', error)
    toast.error('Failed to update order status')
  } finally {
    processing.value = false
  }
}

const completeCODPayment = async () => {
  if (!confirm('Mark this COD payment as completed?')) return
  
  processing.value = true
  try {
    await orderService.completeCODPayment(orderId.value)
    if (order.value.payment) {
      order.value.payment.status = 'COMPLETED'
    }
    toast.success('COD payment marked as completed')
  } catch (error) {
    console.error('Error completing COD payment:', error)
    toast.error('Failed to complete COD payment')
  } finally {
    processing.value = false
  }
}

const canUpdateToStatus = (status) => {
  const currentStatus = order.value?.status
  if (status === 'CANCELLED') return currentStatus !== 'DELIVERED'
  
  const statusOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
  const currentIndex = statusOrder.indexOf(currentStatus)
  const targetIndex = statusOrder.indexOf(status)
  
  return targetIndex > currentIndex
}

const reviewProduct = (product) => {
  router.push(`/products/${product.id}#reviews`)
}

const reorderItems = async () => {
  try {
    for (const item of order.value.items) {
      await cartStore.addToCart(item.product.id, item.quantity)
    }
    toast.success('Items added to cart!')
    router.push('/cart')
  } catch (error) {
    console.error('Error reordering items:', error)
    toast.error('Failed to reorder items')
  }
}

const downloadInvoice = () => {
  toast.info('Invoice download feature coming soon')
  // TODO: Implement invoice generation
}

const shareOrder = () => {
  if (navigator.share) {
    navigator.share({
      title: `Order #${order.value.id.slice(-8).toUpperCase()}`,
      text: `Check out my order from Marketplace`,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Order link copied to clipboard!')
  }
}

const contactSupport = () => {
  toast.info('Redirecting to support...')
  // TODO: Implement support contact
}

const reportIssue = () => {
  toast.info('Issue reporting feature coming soon')
  // TODO: Implement issue reporting
}

const trackShipment = () => {
  toast.info('Shipment tracking feature coming soon')
  // TODO: Implement shipment tracking
}

onMounted(async () => {
  await fetchOrder()
  
  // Initialize select dropdown
  await nextTick()
  if (window.M) {
    const selects = document.querySelectorAll('select')
    window.M.FormSelect.init(selects)
  }
})
</script>

<style scoped lang="scss">
.custom-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h5 {
    margin-bottom: 20px;
    color: #333;
  }
}

.order-header {
  margin-bottom: 20px;
  
  h4 {
    margin-bottom: 5px;
  }
  
  .order-meta {
    .order-number {
      color: #1976d2;
      font-weight: 600;
      font-size: 1.1rem;
      margin: 0;
    }
    
    .order-date {
      color: #666;
      margin: 5px 0 0 0;
    }
  }
}

.current-status {
  margin-bottom: 30px;
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;
    margin-bottom: 10px;
    
    i {
      margin-right: 8px;
      font-size: 20px;
    }
    
    &.pending {
      background: #fff3cd;
      color: #856404;
    }
    
    &.processing {
      background: #cce5ff;
      color: #0056b3;
    }
    
    &.shipped {
      background: #d4edda;
      color: #155724;
    }
    
    &.delivered {
      background: #d1ecf1;
      color: #0c5460;
    }
    
    &.cancelled {
      background: #ffebee;
      color: #c62828;
    }
  }
  
  .status-description {
    color: #666;
    margin: 0;
  }
}

.status-timeline {
  .status-step {
    display: flex;
    align-items: flex-start;
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

.address-info {
  p {
    margin: 8px 0;
    
    i {
      margin-right: 5px;
      color: #666;
    }
  }
}

.order-items {
  .order-item {
    display: flex;
    align-items: flex-start;
    padding: 20px 0;
    border-bottom: 1px solid #e0e0e0;
    
    &:last-child {
      border-bottom: none;
    }
    
    img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      margin-right: 15px;
    }
    
    .item-details {
      flex: 1;
      
      h6 {
        margin: 0 0 5px 0;
        
        a {
          color: #1976d2;
          text-decoration: none;
          
          &:hover {
            text-decoration: underline;
          }
        }
      }
      
      .item-seller {
        color: #666;
        font-size: 0.9rem;
        margin: 5px 0;
      }
      
      .item-price {
        color: #333;
        margin: 5px 0;
      }
      
      .item-actions {
        margin-top: 10px;
      }
    }
    
    .item-total {
      font-weight: 600;
      font-size: 1.1rem;
      color: #1976d2;
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
      color: #1976d2;
    }
  }
}

.customer-info {
  display: flex;
  align-items: center;
  
  .customer-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin-right: 15px;
  }
  
  p {
    margin: 5px 0;
    
    i {
      margin-right: 5px;
      color: #666;
    }
  }
}

.payment-method {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  
  i {
    font-size: 30px;
    color: #1976d2;
    margin-right: 15px;
    margin-top: 5px;
  }
  
  .payment-status {
    display: flex;
    align-items: center;
    margin-top: 5px;
    
    i {
      font-size: 16px;
      margin-right: 5px;
    }
    
    &.completed {
      color: #4caf50;
    }
    
    &.pending {
      color: #ff9800;
    }
    
    &.failed {
      color: #f44336;
    }
  }
}

.transaction-info {
  margin-bottom: 15px;
  
  .transaction-id {
    font-family: monospace;
    background: #f5f5f5;
    padding: 5px 8px;
    border-radius: 4px;
    font-size: 0.9rem;
  }
}

.cod-notice {
  display: flex;
  align-items: flex-start;
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
  
  i {
    color: #1976d2;
    margin-right: 10px;
    margin-top: 2px;
  }
  
  .cod-amount {
    color: #1976d2;
    margin-top: 10px;
  }
}

.action-buttons {
  .full-width {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .admin-status-update {
    margin-bottom: 15px;
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    select {
      margin-bottom: 10px;
    }
    
    button {
      width: 100%;
    }
  }
}

.help-links {
  a {
    display: flex;
    align-items: center;
    padding: 10px 0;
    color: #1976d2;
    text-decoration: none;
    border-bottom: 1px solid #e0e0e0;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: #f5f5f5;
      margin: 0 -10px;
      padding-left: 10px;
      padding-right: 10px;
    }
    
    i {
      margin-right: 10px;
    }
  }
}

.loading-section {
  text-align: center;
  padding: 60px 20px;
}

.error-section {
  text-align: center;
  padding: 60px 20px;
  
  i {
    font-size: 4rem;
    color: #ccc;
    margin-bottom: 20px;
  }
  
  h5 {
    margin-bottom: 20px;
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

@media (max-width: 600px) {
  .order-item {
    flex-direction: column;
    
    img {
      width: 100%;
      height: 200px;
      margin-bottom: 15px;
    }
    
    .item-total {
      align-self: flex-start;
      margin-top: 10px;
    }
  }
  
  .customer-info {
    flex-direction: column;
    text-align: center;
    
    .customer-avatar {
      margin: 0 0 15px 0;
    }
  }
  
  .payment-method {
    flex-direction: column;
    
    i {
      margin: 0 0 10px 0;
    }
  }
}
</style>