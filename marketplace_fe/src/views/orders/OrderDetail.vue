<!-- src/views/orders/OrderDetail.vue - UPDATED with Loyalty Integration and Lucide Icons -->
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
              <component :is="getCurrentStatusIcon()" :size="20" />
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
                <component :is="status.icon" :size="24" />
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

        <!-- ✨ NEW: Loyalty Points Summary Card -->
        <div v-if="authStore.isAuthenticated && (order.loyaltyPointsEarned > 0 || order.loyaltyPointsRedeemed > 0)" class="custom-card loyalty-summary-card">
          <div class="loyalty-card-header">
            <h5>
              <Star :size="24" />
              Loyalty Points Summary
            </h5>
            <div class="loyalty-status-badge" :class="order.status.toLowerCase()">
              {{ getLoyaltyStatusText() }}
            </div>
          </div>
          
          <div class="loyalty-summary-content">
            <div class="loyalty-metrics">
              <!-- Points Earned -->
              <div v-if="order.loyaltyPointsEarned > 0" class="loyalty-metric earned">
                <div class="metric-icon">
                  <TrendingUp :size="20" />
                </div>
                <div class="metric-content">
                  <div class="metric-value">+{{ order.loyaltyPointsEarned }}</div>
                  <div class="metric-label">Points Earned</div>
                  <div class="metric-description">
                    {{ (loyaltyStore.earnRate * 100).toFixed(0) }}% back on ${{ order.totalAmount.toFixed(2) }}
                  </div>
                </div>
              </div>
              
              <!-- Points Redeemed -->
              <div v-if="order.loyaltyPointsRedeemed > 0" class="loyalty-metric redeemed">
                <div class="metric-icon">
                  <Gift :size="20" />
                </div>
                <div class="metric-content">
                  <div class="metric-value">-{{ order.loyaltyPointsRedeemed }}</div>
                  <div class="metric-label">Points Redeemed</div>
                  <div class="metric-description">
                    Saved ${{ order.loyaltyDiscountAmount?.toFixed(2) || '0.00' }}
                  </div>
                </div>
              </div>
              
              <!-- Net Points -->
              <div class="loyalty-metric net">
                <div class="metric-icon">
                  <Wallet :size="20" />
                </div>
                <div class="metric-content">
                  <div class="metric-value" :class="netPointsClass">
                    {{ netPoints >= 0 ? '+' : '' }}{{ netPoints }}
                  </div>
                  <div class="metric-label">Net Points</div>
                  <div class="metric-description">Total impact on balance</div>
                </div>
              </div>
            </div>
            
            <!-- Points Availability Notice -->
            <div v-if="order.loyaltyPointsEarned > 0" class="points-availability">
              <div class="availability-info" :class="pointsAvailabilityClass">
                <component :is="getPointsAvailabilityIcon()" :size="20" />
                <div class="availability-text">
                  <strong>{{ getPointsAvailabilityTitle() }}</strong>
                  <p>{{ getPointsAvailabilityDescription() }}</p>
                </div>
              </div>
            </div>
            
            <!-- Review Bonus Opportunity -->
            <div v-if="order.status === 'DELIVERED' && canEarnReviewBonus" class="review-bonus-opportunity">
              <div class="bonus-header">
                <MessageSquare :size="20" />
                <span>Earn More Points!</span>
              </div>
              <p>Write reviews for your purchased items and earn <strong>50 bonus points</strong> for each review!</p>
              <div class="bonus-actions">
                <button 
                  v-for="item in reviewableItems" 
                  :key="item.id"
                  @click="reviewProduct(item.product)"
                  class="btn-small blue waves-effect review-btn"
                >
                  <Star :size="16" class="left-icon" />
                  Review {{ item.product.name }}
                </button>
              </div>
            </div>
            
            <!-- Current Balance Display -->
            <div class="current-balance-display">
              <router-link to="/loyalty" class="loyalty-dashboard-link">
                <BarChart :size="20" />
                <span>Current Balance: {{ loyaltyStore.currentBalance }} points</span>
                <ArrowRight :size="20" />
              </router-link>
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
            <p><Phone :size="16" class="inline-icon" /> {{ order.shippingAddress.phone }}</p>
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
                
                <!-- ✨ NEW: Item Points Info -->
                <div v-if="getItemPoints(item) > 0" class="item-points">
                  <Star :size="14" />
                  <span>Earned {{ getItemPoints(item) }} points</span>
                </div>
                
                <!-- Review Button for Delivered Items -->
                <div v-if="order.status === 'DELIVERED' && canReview" class="item-actions">
                  <button 
                    class="btn-small waves-effect waves-light"
                    @click="reviewProduct(item.product)"
                  >
                    <Star :size="16" class="left-icon" />
                    Review & Earn 50 Points
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
            
            <!-- ✨ NEW: Loyalty Discount Row -->
            <div v-if="order.loyaltyDiscountAmount > 0" class="summary-row loyalty-discount">
              <span class="discount-label">
                <Gift :size="16" class="inline-icon" />
                Loyalty Discount
              </span>
              <span class="discount-amount">-${{ order.loyaltyDiscountAmount.toFixed(2) }}</span>
            </div>
            
            <div class="summary-row total">
              <span>Total</span>
              <span>${{ order.totalAmount.toFixed(2) }}</span>
            </div>
            
            <!-- ✨ NEW: Loyalty Points Summary in Order Total -->
            <div v-if="order.loyaltyPointsEarned > 0 || order.loyaltyPointsRedeemed > 0" class="loyalty-order-summary">
              <div class="loyalty-summary-divider"></div>
              
              <div v-if="order.loyaltyPointsRedeemed > 0" class="summary-row loyalty-redeemed">
                <span>Points Used</span>
                <span class="points-used">{{ order.loyaltyPointsRedeemed }} points</span>
              </div>
              
              <div v-if="order.loyaltyPointsEarned > 0" class="summary-row loyalty-earned">
                <span>Points Earned</span>
                <span class="points-earned">+{{ order.loyaltyPointsEarned }} points</span>
              </div>
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
                <p><Mail :size="16" class="inline-icon" /> {{ order.user.email }}</p>
                <p v-if="order.user.phone">
                  <Phone :size="16" class="inline-icon" /> {{ order.user.phone }}
                </p>
                
                <!-- ✨ NEW: Customer Loyalty Status -->
                <div v-if="authStore.isAuthenticated" class="customer-loyalty-status">
                  <div class="loyalty-tier">
                    <Award :size="16" />
                    <span>{{ getUserLoyaltyTier() }}</span>
                  </div>
                  <div class="loyalty-balance">
                    <Star :size="16" />
                    <span>{{ loyaltyStore.currentBalance }} points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Payment Information -->
        <div class="custom-card">
          <h5>Payment Information</h5>
          <div class="info-section">
            <div class="payment-method">
              <component :is="getPaymentMethodIcon()" :size="30" />
              <div>
                <p><strong>{{ getPaymentMethodDisplay() }}</strong></p>
                <p class="payment-status" :class="order.payment?.status?.toLowerCase()">
                  <component :is="getPaymentStatusIcon()" :size="16" class="inline-icon" />
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
              <Info :size="20" />
              <div>
                <p><strong>Cash on Delivery</strong></p>
                <p>Payment will be collected when the order is delivered to your address.</p>
                <p class="cod-amount">Amount to pay: <strong>${{ order.totalAmount.toFixed(2) }}</strong></p>
              </div>
            </div>
          </div>
        </div>

        <!-- ✨ NEW: Loyalty Actions Card -->
        <div v-if="authStore.isAuthenticated && order.status === 'DELIVERED'" class="custom-card loyalty-actions-card">
          <h5>
            <Star :size="24" />
            Loyalty Actions
          </h5>
          
          <div class="loyalty-actions-content">
            <!-- Reorder with Points Preview -->
            <div class="loyalty-action-item">
              <div class="action-info">
                <h6>Reorder Items</h6>
                <p>Reorder the same items and earn {{ calculateReorderPoints() }} more points!</p>
              </div>
              <button 
                class="btn blue waves-effect waves-light"
                @click="reorderItems"
                :disabled="processing"
              >
                <RotateCcw :size="16" class="left-icon" />
                Reorder
              </button>
            </div>
            
            <!-- Share & Earn -->
            <div class="loyalty-action-item">
              <div class="action-info">
                <h6>Share Your Purchase</h6>
                <p>Share this order on social media (feature coming soon)</p>
              </div>
              <button 
                class="btn-flat blue-text waves-effect"
                @click="shareOrder"
                disabled
              >
                <Share2 :size="16" class="left-icon" />
                Share Order
              </button>
            </div>
            
            <!-- Loyalty Program Info -->
            <div class="loyalty-program-cta">
              <router-link to="/loyalty" class="loyalty-cta-link">
                <div class="cta-content">
                  <TrendingUp :size="24" />
                  <div>
                    <strong>Maximize Your Rewards</strong>
                    <p>View your loyalty dashboard and discover more ways to earn points</p>
                  </div>
                </div>
                <ArrowRight :size="20" />
              </router-link>
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
                <X :size="16" class="left-icon" />
                Cancel Order
              </button>
              
              <button 
                v-if="order.status === 'DELIVERED'"
                class="btn waves-effect waves-light full-width"
                @click="reorderItems"
                :disabled="processing"
              >
                <RotateCcw :size="16" class="left-icon" />
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
                <CreditCard :size="16" class="left-icon" />
                Mark COD as Paid
              </button>
            </template>
            
            <!-- Common Actions -->
            <button 
              class="btn-flat waves-effect full-width"
              @click="downloadInvoice"
            >
              <FileText :size="16" class="left-icon" />
              Download Invoice
            </button>
          </div>
        </div>
        
        <!-- Need Help -->
        <div class="custom-card">
          <h5>Need Help?</h5>
          <div class="help-links">
            <a href="#" @click.prevent="contactSupport">
              <Headphones :size="20" />
              Contact Support
            </a>
            <a href="#" @click.prevent="reportIssue">
              <AlertTriangle :size="20" />
              Report an Issue
            </a>
            <a href="#" @click.prevent="trackShipment" v-if="order.status === 'SHIPPED'">
              <Truck :size="20" />
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
      <AlertCircle :size="64" />
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
import { useLoyaltyStore } from '@/stores/loyalty'
import { useToast } from 'vue-toastification'
import orderService from '@/services/order.service'
import paymentService from '@/services/payment.service'
import { formatDateTime } from '@/utils/formatters'
import { getStaticUrl } from '@/services/api'

// Lucide Vue Icons Import
import { 
  Star, TrendingUp, Gift, Wallet, CheckCircle, Clock, X, 
  ShoppingCart, Settings, Truck, CheckCheck, ArrowRight,
  BarChart, MessageSquare, Phone, Mail, Award, Info,
  RotateCcw, Share2, CreditCard, FileText, Headphones,
  AlertTriangle, AlertCircle, Banknote
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const loyaltyStore = useLoyaltyStore() 
const toast = useToast()

const order = ref(null)
const loading = ref(true)
const processing = ref(false)
const newStatus = ref('')

const orderId = computed(() => route.params.id)

const orderStatuses = [
  { value: 'PENDING', label: 'Order Placed', icon: ShoppingCart },
  { value: 'PROCESSING', label: 'Processing', icon: Settings },
  { value: 'SHIPPED', label: 'Shipped', icon: Truck },
  { value: 'DELIVERED', label: 'Delivered', icon: CheckCheck },
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

const netPoints = computed(() => {
  const earned = order.value?.loyaltyPointsEarned || 0
  const redeemed = order.value?.loyaltyPointsRedeemed || 0
  return earned - redeemed
})

const netPointsClass = computed(() => {
  if (netPoints.value > 0) return 'positive'
  if (netPoints.value < 0) return 'negative'
  return 'neutral'
})

const pointsAvailabilityClass = computed(() => {
  if (order.value?.status === 'DELIVERED') return 'available'
  if (order.value?.status === 'CANCELLED') return 'cancelled'
  return 'pending'
})

const canEarnReviewBonus = computed(() => {
  return order.value?.status === 'DELIVERED' && 
         order.value?.items?.some(item => !item.hasReviewBonus)
})

const reviewableItems = computed(() => {
  return order.value?.items?.filter(item => !item.hasReviewBonus) || []
})

const getLoyaltyStatusText = () => {
  if (order.value?.status === 'DELIVERED') return 'Processed'
  if (order.value?.status === 'CANCELLED') return 'Cancelled'
  return 'Pending'
}

const getPointsAvailabilityIcon = () => {
  switch (pointsAvailabilityClass.value) {
    case 'available': return CheckCircle
    case 'cancelled': return X
    default: return Clock
  }
}

const getPointsAvailabilityTitle = () => {
  switch (pointsAvailabilityClass.value) {
    case 'available': return 'Points Available in Your Account'
    case 'cancelled': return 'Points Not Awarded'
    default: return 'Points Pending'
  }
}

const getPointsAvailabilityDescription = () => {
  switch (pointsAvailabilityClass.value) {
    case 'available': return 'Your loyalty points have been added to your account and are ready to use.'
    case 'cancelled': return 'Points were not awarded due to order cancellation.'
    default: return 'Points will be added to your account once the order is delivered.'
  }
}

const getItemPoints = (item) => {
  if (!order.value?.loyaltyPointsEarned) return 0
  const itemTotal = item.quantity * item.price
  const orderSubtotal = calculateSubtotal()
  const pointsRatio = itemTotal / orderSubtotal
  return Math.floor(order.value.loyaltyPointsEarned * pointsRatio)
}

const getUserLoyaltyTier = () => {
  const balance = loyaltyStore.currentBalance
  if (balance >= 10000) return 'Platinum Member'
  if (balance >= 5000) return 'Gold Member'
  if (balance >= 1000) return 'Silver Member'
  return 'Bronze Member'
}

const calculateReorderPoints = () => {
  const earnRate = loyaltyStore.earnRate || 0.01
  return Math.floor(order.value?.totalAmount * earnRate)
}

const getCurrentStatusIcon = () => {
  const statusIcons = {
    'PENDING': Clock,
    'PROCESSING': Settings,
    'SHIPPED': Truck,
    'DELIVERED': CheckCheck,
    'CANCELLED': X
  }
  return statusIcons[order.value?.status] || AlertCircle
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
  return null
}

const getPaymentMethodDisplay = () => {
  if (order.value?.paymentMethod === 'COD') {
    return 'Cash on Delivery'
  }
  return order.value?.payment?.method === 'COD' ? 'Cash on Delivery' : 'Credit Card'
}

const getPaymentMethodIcon = () => {
  if (order.value?.paymentMethod === 'COD') {
    return Banknote
  }
  return CreditCard
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
    'PENDING': Clock,
    'COMPLETED': CheckCircle,
    'FAILED': AlertCircle,
    'REFUNDED': RotateCcw
  }
  return icons[status] || Clock
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
    toast.error('Failed to load order details')
  } finally {
    loading.value = false
  }
}

// Script section của OrderDetail.vue - FIXED cancelOrder method

const cancelOrder = async () => {
  if (!confirm('Are you sure you want to cancel this order?')) return
  
  processing.value = true
  try {
    await orderService.cancelOrder(orderId.value)
    
    // Cập nhật local state
    order.value.status = 'CANCELLED'
    
    toast.success('Order cancelled successfully')
    
    // Refresh order để lấy thông tin mới nhất
    await fetchOrder()
    
  } catch (error) {
    // Xử lý các loại lỗi khác nhau
    if (error.response?.status === 403) {
      toast.error('You do not have permission to cancel this order')
    } else if (error.response?.status === 400) {
      toast.error(error.response.data?.message || 'Cannot cancel this order at current status')
    } else if (error.response?.status === 404) {
      toast.error('Order not found')
    } else {
      toast.error('Failed to cancel order. Please try again.')
    }
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
    toast.success(`Items added to cart! You'll earn ${calculateReorderPoints()} points with this reorder.`)
    router.push('/cart')
  } catch (error) {
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
  
  // ✨ NEW: Load loyalty data if authenticated
  if (authStore.isAuthenticated) {
    try {
      await loyaltyStore.initialize()
    } catch (error) {
      // Xử lý lỗi nếu cần
    }
  }
  
  // Initialize select dropdown
  await nextTick()
  if (window.M) {
    const selects = document.querySelectorAll('select')
    window.M.FormSelect.init(selects)
  }
})
</script>

<style scoped lang="scss">
// Icon positioning helper classes
.left-icon {
  margin-right: 8px;
}

.inline-icon {
  margin-right: 5px;
  vertical-align: middle;
}

.custom-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h5 {
    margin-bottom: 20px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
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
    gap: 8px;
    
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
      color: white;
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

// ✨ NEW: Loyalty Summary Card Styles
.loyalty-summary-card {
  background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%);
  border: 2px solid #ffd700;
  
  .loyalty-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h5 {
      margin: 0;
      color: #e65100;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .loyalty-status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      
      &.delivered {
        background: #4caf50;
        color: white;
      }
      
      &.pending {
        background: #ff9800;
        color: white;
      }
      
      &.cancelled {
        background: #f44336;
        color: white;
      }
    }
  }
  
  .loyalty-summary-content {
    .loyalty-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
      
      .loyalty-metric {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        
        &.earned {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.3);
        }
        
        &.redeemed {
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid rgba(33, 150, 243, 0.3);
        }
        
        &.net {
          background: rgba(255, 152, 0, 0.1);
          border: 1px solid rgba(255, 152, 0, 0.3);
        }
        
        .metric-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .metric-content {
          flex: 1;
          
          .metric-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 4px;
            
            &.positive {
              color: #4caf50;
            }
            
            &.negative {
              color: #f44336;
            }
            
            &.neutral {
              color: #666;
            }
          }
          
          .metric-label {
            font-size: 0.9rem;
            font-weight: 500;
            color: #666;
            margin-bottom: 2px;
          }
          
          .metric-description {
            font-size: 0.8rem;
            color: #999;
          }
        }
        
        &.earned .metric-icon {
          background: #4caf50;
        }
        
        &.redeemed .metric-icon {
          background: #2196f3;
        }
        
        &.net .metric-icon {
          background: #ff9800;
        }
      }
    }
    
    .points-availability {
      margin-bottom: 20px;
      
      .availability-info {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        border-radius: 8px;
        
        &.available {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.3);
          color: #4caf50;
        }
        
        &.pending {
          background: rgba(255, 152, 0, 0.1);
          border: 1px solid rgba(255, 152, 0, 0.3);
          color: #ff9800;
        }
        
        &.cancelled {
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid rgba(244, 67, 54, 0.3);
          color: #f44336;
        }
        
        .availability-text {
          flex: 1;
          
          strong {
            display: block;
            margin-bottom: 4px;
            color: #333;
          }
          
          p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
          }
        }
      }
    }
    
    .review-bonus-opportunity {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      
      .bonus-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        color: #ff6f00;
        font-weight: 600;
      }
      
      p {
        margin-bottom: 12px;
        color: #666;
      }
      
      .bonus-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .review-btn {
          font-size: 0.8rem;
          display: flex;
          align-items: center;
        }
      }
    }
    
    .current-balance-display {
      .loyalty-dashboard-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(33, 150, 243, 0.1);
        border: 1px solid rgba(33, 150, 243, 0.3);
        border-radius: 8px;
        text-decoration: none;
        color: #1976d2;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(33, 150, 243, 0.2);
          transform: translateY(-1px);
        }
        
        span {
          font-weight: 500;
        }
      }
    }
  }
}

.address-info {
  p {
    margin: 8px 0;
    display: flex;
    align-items: center;
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

      // ✨ NEW: Item Points Display
      .item-points {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 5px 0;
        color: #ffd700;
        font-size: 0.85rem;
        font-weight: 500;
      }
      
      .item-actions {
        margin-top: 10px;
        
        button {
          display: flex;
          align-items: center;
        }
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

    // ✨ NEW: Loyalty Discount Styling
    &.loyalty-discount {
      color: #4caf50;
      font-weight: 500;
      
      .discount-label {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .discount-amount {
        font-weight: 600;
      }
    }

    // ✨ NEW: Loyalty Points in Summary
    &.loyalty-redeemed {
      color: #2196f3;
      
      .points-used {
        font-weight: 500;
      }
    }
    
    &.loyalty-earned {
      color: #4caf50;
      
      .points-earned {
        font-weight: 500;
      }
    }
  }

  // ✨ NEW: Loyalty Order Summary Section
  .loyalty-order-summary {
    .loyalty-summary-divider {
      height: 2px;
      background: linear-gradient(90deg, #ffd700, #ffb347);
      margin: 15px 0;
      border-radius: 1px;
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
    display: flex;
    align-items: center;
  }

  // ✨ NEW: Customer Loyalty Status
  .customer-loyalty-status {
    margin-top: 8px;
    
    .loyalty-tier, .loyalty-balance {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      margin-bottom: 4px;
    }
    
    .loyalty-tier {
      color: #ff9800;
    }
    
    .loyalty-balance {
      color: #4caf50;
    }
  }
}

.payment-method {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 15px;
  
  .payment-status {
    display: flex;
    align-items: center;
    margin-top: 5px;
    gap: 5px;
    
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
  gap: 10px;
  
  .cod-amount {
    color: #1976d2;
    margin-top: 10px;
  }
}

// ✨ NEW: Loyalty Actions Card
.loyalty-actions-card {
  background: linear-gradient(135deg, #f8f9fa, #e8f5e8);
  border: 1px solid #4caf50;
  
  .loyalty-actions-content {
    .loyalty-action-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #e0e0e0;
      
      &:last-of-type {
        border-bottom: none;
      }
      
      .action-info {
        flex: 1;
        
        h6 {
          margin: 0 0 4px 0;
          color: #333;
        }
        
        p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
      }
      
      button {
        display: flex;
        align-items: center;
      }
    }
    
    .loyalty-program-cta {
      margin-top: 16px;
      
      .loyalty-cta-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: rgba(33, 150, 243, 0.1);
        border: 1px solid rgba(33, 150, 243, 0.3);
        border-radius: 8px;
        text-decoration: none;
        color: #1976d2;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(33, 150, 243, 0.2);
          transform: translateY(-1px);
        }
        
        .cta-content {
          display: flex;
          align-items: center;
          gap: 12px;
          
          strong {
            display: block;
            margin-bottom: 4px;
          }
          
          p {
            margin: 0;
            font-size: 0.85rem;
            color: #666;
          }
        }
      }
    }
  }
}

.action-buttons {
  .full-width {
    width: 100%;
    margin-bottom: 10px;
  }
  
  button {
    display: flex;
    align-items: center;
    justify-content: center;
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
    gap: 10px;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: #f5f5f5;
      margin: 0 -10px;
      padding-left: 10px;
      padding-right: 10px;
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

@media (max-width: 992px) {
  .loyalty-metrics {
    grid-template-columns: 1fr !important;
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
    
    > * {
      margin: 0 0 10px 0;
    }
  }

  .loyalty-action-item {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .bonus-actions {
    flex-direction: column;
    
    .review-btn {
      width: 100%;
    }
  }
}
</style>