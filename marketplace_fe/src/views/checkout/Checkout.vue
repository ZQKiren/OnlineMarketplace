<!-- src/views/checkout/Checkout.vue - UPDATED với Loyalty Integration -->
<template>
  <div class="container">
    <h4>Checkout</h4>
    
    <div class="row">
      <div class="col s12 m8">
        <!-- Shipping Information -->
        <div class="custom-card">
          <h5>Shipping Information</h5>
          
          <div class="row">
            <div class="input-field col s12">
              <input 
                id="fullName" 
                type="text" 
                v-model="shippingInfo.fullName"
                required
              >
              <label for="fullName" :class="{ active: !!shippingInfo.fullName }">Full Name</label>
            </div>
            
            <div class="input-field col s12">
              <input 
                id="address" 
                type="text" 
                v-model="shippingInfo.address"
                required
              >
              <label for="address" :class="{ active: !!shippingInfo.address }">Address</label>
            </div>
            
            <div class="input-field col s6">
              <input 
                id="city" 
                type="text" 
                v-model="shippingInfo.city"
                required
              >
              <label for="city" :class="{ active: !!shippingInfo.city }">City</label>
            </div>
            
            <div class="input-field col s6">
              <input 
                id="zipCode" 
                type="text" 
                v-model="shippingInfo.zipCode"
                required
              >
              <label for="zipCode" :class="{ active: !!shippingInfo.zipCode }">Zip Code</label>
            </div>
            
            <div class="input-field col s12">
              <input 
                id="phone" 
                type="tel" 
                v-model="shippingInfo.phone"
                required
              >
              <label for="phone" :class="{ active: !!shippingInfo.phone }">Phone Number</label>
            </div>
          </div>
        </div>

        <!-- ✨ NEW: Loyalty Points Redemption -->
        <div class="custom-card loyalty-redemption-card">
          <div class="card-header">
            <h5>
              <i class="material-icons">card_giftcard</i>
              Apply Loyalty Points
            </h5>
            <div class="loyalty-balance">
              <i class="material-icons">stars</i>
              <span>{{ userLoyaltyPoints }} Points Available</span>
            </div>
          </div>
          
          <div v-if="userLoyaltyPoints > 0" class="loyalty-content">
            <!-- Available Redemptions -->
            <div class="redemptions-grid">
              <div 
                v-for="redemption in availableRedemptions" 
                :key="redemption.id"
                class="redemption-option"
                :class="{ 
                  'selected': selectedRedemption?.id === redemption.id,
                  'disabled': !canUseRedemption(redemption)
                }"
                @click="selectRedemption(redemption)"
              >
                <div class="redemption-header">
                  <div class="redemption-title">{{ redemption.title }}</div>
                  <div class="redemption-badge">
                    {{ getDiscountText(redemption) }}
                  </div>
                </div>
                
                <div class="redemption-details">
                  <p class="redemption-description">{{ redemption.description }}</p>
                  
                  <div class="redemption-cost">
                    <span class="cost-points">{{ redemption.pointsCost }} points</span>
                    <span v-if="redemption.minOrderValue" class="min-order">
                      Min. order: ${{ redemption.minOrderValue }}
                    </span>
                  </div>
                </div>
                
                <div class="redemption-actions">
                  <button 
                    v-if="selectedRedemption?.id === redemption.id"
                    class="btn-small red waves-effect"
                    @click.stop="removeRedemption"
                  >
                    Remove
                  </button>
                  <button 
                    v-else-if="canUseRedemption(redemption)"
                    class="btn-small blue waves-effect"
                    @click.stop="selectRedemption(redemption)"
                  >
                    Apply
                  </button>
                  <span v-else class="redemption-status">
                    {{ getRedemptionStatus(redemption) }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- No Available Redemptions -->
            <div v-if="availableRedemptions.length === 0" class="no-redemptions">
              <i class="material-icons">info</i>
              <p>No redemption options available for your current point balance or order amount.</p>
            </div>
          </div>
          
          <!-- No Points Available -->
          <div v-else class="no-points">
            <i class="material-icons">stars_border</i>
            <div>
              <p><strong>No loyalty points available</strong></p>
              <p>Start earning points by making purchases! You'll get 1 point for every $1 spent.</p>
              <router-link to="/loyalty" class="btn-flat blue-text">Learn More</router-link>
            </div>
          </div>
        </div>
        
        <!-- Payment Method -->
        <div class="custom-card">
          <h5>Payment Method</h5>
          
          <!-- Payment Method Selection -->
          <div class="payment-methods">
            <p>
              <label>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="card"
                  v-model="selectedPaymentMethod"
                  @change="onPaymentMethodChange"
                >
                <span>Credit/Debit Card</span>
              </label>
            </p>
            <p>
              <label>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="cod"
                  v-model="selectedPaymentMethod"
                  @change="onPaymentMethodChange"
                >
                <span>Cash on Delivery (COD)</span>
              </label>
            </p>
          </div>
          
          <!-- Stripe Card Element -->
          <div v-if="selectedPaymentMethod === 'card'" class="card-payment-section">
            <div id="card-element" class="card-element"></div>
            <div id="card-errors" class="card-errors"></div>
          </div>
          
          <!-- COD Information -->
          <div v-if="selectedPaymentMethod === 'cod'" class="cod-info">
            <div class="cod-notice">
              <i class="material-icons left">info</i>
              <div>
                <p><strong>Cash on Delivery</strong></p>
                <p>You will pay cash when the order is delivered to your address. Please ensure you have the exact amount ready.</p>
                <p class="cod-amount"><strong>Amount to pay: ${{ finalTotal.toFixed(2) }}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Order Summary -->
      <div class="col s12 m4">
        <div class="custom-card order-summary">
          <h5>Order Summary</h5>
          
          <div class="order-items">
            <div 
              v-for="item in cartStore.items" 
              :key="item.id"
              class="order-item"
            >
              <div class="item-info">
                <p class="item-name">{{ item.product.name }}</p>
                <p class="item-quantity">Qty: {{ item.quantity }}</p>
              </div>
              <p class="item-price">${{ (item.product.price * item.quantity).toFixed(2) }}</p>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${{ cartStore.total.toFixed(2) }}</span>
          </div>
          
          <div class="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          
          <div class="summary-row">
            <span>Tax</span>
            <span>${{ tax.toFixed(2) }}</span>
          </div>
          
          <!-- ✨ NEW: Loyalty Discount Display -->
          <div v-if="selectedRedemption && loyaltyDiscount > 0" class="summary-row loyalty-discount">
            <span class="discount-label">
              <i class="material-icons tiny">card_giftcard</i>
              {{ selectedRedemption.title }}
            </span>
            <span class="discount-amount">-${{ loyaltyDiscount.toFixed(2) }}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="summary-row total">
            <span>Total</span>
            <span class="price">${{ finalTotal.toFixed(2) }}</span>
          </div>
          
          <!-- ✨ NEW: Savings Display -->
          <div v-if="loyaltyDiscount > 0" class="savings-display">
            <i class="material-icons">savings</i>
            <span>You saved ${{ loyaltyDiscount.toFixed(2) }} with loyalty points!</span>
          </div>
          
          <!-- ✨ NEW: Points to Earn Display -->
          <div class="points-earn-display">
            <i class="material-icons">stars</i>
            <span>You'll earn {{ pointsToEarn }} points from this order</span>
          </div>
          
          <!-- Payment Method Display -->
          <div class="payment-method-display" v-if="selectedPaymentMethod">
            <div class="summary-row">
              <span>Payment Method</span>
              <span>{{ selectedPaymentMethod === 'card' ? 'Credit Card' : 'Cash on Delivery' }}</span>
            </div>
          </div>
          
          <button 
            class="btn waves-effect waves-light full-width"
            @click="processPayment"
            :disabled="processing || !selectedPaymentMethod"
          >
            {{ getButtonText() }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useLoyaltyStore } from '@/stores/loyalty' // ✨ NEW
import { useToast } from 'vue-toastification'
import { loadStripe } from '@stripe/stripe-js'
import orderService from '@/services/order.service'
import paymentService from '@/services/payment.service'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const loyaltyStore = useLoyaltyStore() // ✨ NEW
const toast = useToast()

const stripe = ref(null)
const cardElement = ref(null)
const elements = ref(null)
const processing = ref(false)
const selectedPaymentMethod = ref('card') // Default to card
const stripeInitialized = ref(false)

// ✨ NEW: Loyalty states
const selectedRedemption = ref(null)
const loyaltyDiscount = ref(0)

const shippingInfo = ref({
  fullName: '',
  address: '',
  city: '',
  zipCode: '',
  phone: ''
})

// ✨ NEW: Loyalty computed properties
const userLoyaltyPoints = computed(() => authStore.user?.loyaltyPoints || 0)
const availableRedemptions = computed(() => {
  return loyaltyStore.redemptions.filter(redemption => 
    redemption.isActive && 
    redemption.pointsCost <= userLoyaltyPoints.value &&
    (!redemption.minOrderValue || totalWithTax.value >= redemption.minOrderValue)
  )
})

const tax = computed(() => cartStore.total * 0.08) // 8% tax
const totalWithTax = computed(() => cartStore.total + tax.value)
const finalTotal = computed(() => Math.max(0, totalWithTax.value - loyaltyDiscount.value))

// ✨ NEW: Points calculation
const pointsToEarn = computed(() => {
  const earnRate = 0.01 // 1% earn rate
  const minOrder = 10
  if (finalTotal.value < minOrder) return 0
  return Math.floor(finalTotal.value * earnRate)
})

// Auto-populate shipping info from user profile
const populateShippingInfo = async () => {
  if (authStore.user) {
    shippingInfo.value.fullName = authStore.user.name || ''
    shippingInfo.value.phone = authStore.user.phone || ''
    
    // Update Materialize labels after populating data
    await nextTick()
    if (window.M && window.M.updateTextFields) {
      window.M.updateTextFields()
    }
  }
}

// ✨ NEW: Loyalty methods
const canUseRedemption = (redemption) => {
  if (!redemption.isActive) return false
  if (redemption.pointsCost > userLoyaltyPoints.value) return false
  if (redemption.minOrderValue && totalWithTax.value < redemption.minOrderValue) return false
  
  const now = new Date()
  if (redemption.validFrom && new Date(redemption.validFrom) > now) return false
  if (redemption.validUntil && new Date(redemption.validUntil) < now) return false
  if (redemption.maxUses && redemption.usageCount >= redemption.maxUses) return false
  
  return true
}

const getDiscountText = (redemption) => {
  if (redemption.discountType === 'PERCENTAGE') {
    return `${redemption.discountValue}% off`
  } else if (redemption.discountType === 'FIXED_AMOUNT') {
    return `${redemption.discountValue} off`
  } else if (redemption.discountType === 'FREE_SHIPPING') {
    return 'Free shipping'
  }
  return 'Discount'
}

const getRedemptionStatus = (redemption) => {
  if (redemption.pointsCost > userLoyaltyPoints.value) {
    return `Need ${redemption.pointsCost - userLoyaltyPoints.value} more points`
  }
  if (redemption.minOrderValue && totalWithTax.value < redemption.minOrderValue) {
    return `Min. order ${redemption.minOrderValue}`
  }
  return 'Not available'
}

const calculateDiscount = (redemption, orderValue) => {
  let discount = 0
  
  if (redemption.discountType === 'PERCENTAGE') {
    discount = (orderValue * (redemption.discountValue || 0)) / 100
  } else if (redemption.discountType === 'FIXED_AMOUNT') {
    discount = redemption.discountValue || 0
  } else if (redemption.discountType === 'FREE_SHIPPING') {
    discount = 10 // Assume $10 shipping cost
  }
  
  return Math.min(discount, orderValue)
}

const selectRedemption = (redemption) => {
  if (!canUseRedemption(redemption)) {
    toast.error('Cannot use this redemption option')
    return
  }
  
  selectedRedemption.value = redemption
  loyaltyDiscount.value = calculateDiscount(redemption, totalWithTax.value)
  
  toast.success(`Applied ${redemption.title}! You save ${loyaltyDiscount.value.toFixed(2)}`)
}

const removeRedemption = () => {
  selectedRedemption.value = null
  loyaltyDiscount.value = 0
  toast.info('Loyalty discount removed')
}

// Watch for user data changes
watch(() => authStore.user, async () => {
  await populateShippingInfo()
}, { immediate: true })

// Watch for cart changes to update discount
watch(() => cartStore.total, () => {
  if (selectedRedemption.value) {
    loyaltyDiscount.value = calculateDiscount(selectedRedemption.value, totalWithTax.value)
  }
})

const initializeStripe = async () => {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.warn('Stripe public key not found')
    return
  }
  
  if (!stripe.value) {
    stripe.value = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
    elements.value = stripe.value.elements()
  }
  
  stripeInitialized.value = true
}

const createCardElement = async () => {
  if (!stripe.value || !elements.value) {
    await initializeStripe()
  }
  
  // Destroy existing card element if it exists
  if (cardElement.value) {
    cardElement.value.unmount()
    cardElement.value.destroy()
    cardElement.value = null
  }
  
  // Wait for DOM to be ready
  await nextTick()
  
  // Check if the card element container exists
  const cardContainer = document.getElementById('card-element')
  if (!cardContainer) {
    console.warn('Card element container not found')
    return
  }
  
  // Create new card element
  cardElement.value = elements.value.create('card', {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  })
  
  // Mount the card element
  cardElement.value.mount('#card-element')
  
  // Setup event listeners
  cardElement.value.on('change', (event) => {
    const displayError = document.getElementById('card-errors')
    if (displayError) {
      if (event.error) {
        displayError.textContent = event.error.message
      } else {
        displayError.textContent = ''
      }
    }
  })
  
  console.log('✅ Card element created and mounted')
}

const destroyCardElement = () => {
  if (cardElement.value) {
    try {
      cardElement.value.unmount()
      cardElement.value.destroy()
    } catch (error) {
      console.warn('Error destroying card element:', error)
    }
    cardElement.value = null
  }
}

const onPaymentMethodChange = async () => {
  console.log('🔄 Payment method changed to:', selectedPaymentMethod.value)
  
  if (selectedPaymentMethod.value === 'card') {
    // Create card element when switching to card
    await nextTick() // Wait for DOM update
    await createCardElement()
  } else {
    // Destroy card element when switching away from card
    destroyCardElement()
    
    // Clear any card errors
    const displayError = document.getElementById('card-errors')
    if (displayError) {
      displayError.textContent = ''
    }
  }
}

const getButtonText = () => {
  if (processing.value) {
    return selectedPaymentMethod.value === 'card' ? 'Processing Payment...' : 'Processing Order...'
  }
  if (!selectedPaymentMethod.value) {
    return 'Select Payment Method'
  }
  return selectedPaymentMethod.value === 'card' ? 'Pay Now' : 'Place Order (COD)'
}

const processPayment = async () => {
  if (!validateShippingInfo()) {
    toast.error('Please fill in all shipping information')
    return
  }
  
  if (!selectedPaymentMethod.value) {
    toast.error('Please select a payment method')
    return
  }
  
  processing.value = true
  
  try {
    // Create order items
    const orderItems = cartStore.items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }))
    
    if (selectedPaymentMethod.value === 'card') {
      await processCardPayment(orderItems)
    } else {
      await processCODPayment(orderItems)
    }
  } catch (error) {
    console.error('Payment error:', error)
    toast.error(error.message || 'Order failed. Please try again.')
  } finally {
    processing.value = false
  }
}

const processCardPayment = async (orderItems) => {
  // ✅ 1. TẠO PAYMENT METHOD TRƯỚC
  const { paymentMethod, error } = await stripe.value.createPaymentMethod({
    type: 'card',
    card: cardElement.value,
    billing_details: {
      name: shippingInfo.value.fullName,
      phone: shippingInfo.value.phone,
    },
  })
  
  if (error) {
    throw new Error(error.message)
  }

  // ✅ 2. TẠO ORDER VỚI LOYALTY REDEMPTION
  const orderData = { 
    items: orderItems,
    shippingAddress: shippingInfo.value,
    paymentMethod: 'card',
    paymentMethodId: paymentMethod.id
  }
  
  // ✨ NEW: Add redemption if selected
  if (selectedRedemption.value) {
    orderData.redemptionId = selectedRedemption.value.id
  }

  let orderResponse, order
  try {
    orderResponse = await orderService.createOrder(orderData)
    order = orderResponse.data
  } catch (err) {
    throw new Error('Order creation failed: ' + (err.message || 'Unknown error'))
  }

  // ✅ 3. XỬ LÝ PAYMENT TRONG BACKEND
  if (order.payment?.status === 'COMPLETED') {
    await cartStore.clearCart()
    
    // ✨ NEW: Refresh loyalty data
    if (selectedRedemption.value) {
      await loyaltyStore.fetchSummary()
    }
    
    toast.success('Payment successful! Order placed.')
    router.push(`/orders/${order.id}`)
  } else {
    // Nếu payment thất bại, gọi API hủy order
    try {
      await orderService.cancelOrder(order.id)
    } catch (cancelErr) {
      console.error('Failed to cancel order after payment fail:', cancelErr)
    }
    throw new Error('Payment processing failed')
  }
}

const processCODPayment = async (orderItems) => {
  // Create COD order with loyalty redemption
  const orderData = { 
    items: orderItems,
    shippingAddress: shippingInfo.value,
    paymentMethod: 'cod'
  }
  
  // ✨ NEW: Add redemption if selected
  if (selectedRedemption.value) {
    orderData.redemptionId = selectedRedemption.value.id
  }
  
  const orderResponse = await orderService.createOrder(orderData)
  const order = orderResponse.data
  
  // For COD, we don't need to process payment immediately
  // Clear cart and redirect to success page
  await cartStore.clearCart()
  
  // ✨ NEW: Refresh loyalty data
  if (selectedRedemption.value) {
    await loyaltyStore.fetchSummary()
  }
  
  toast.success('Order placed successfully! You will pay upon delivery.')
  router.push(`/orders/${order.id}`)
}

const validateShippingInfo = () => {
  return Object.values(shippingInfo.value).every(value => value.trim() !== '')
}

onMounted(async () => {
  if (cartStore.items.length === 0) {
    router.push('/cart')
    return
  }
  
  // Ensure user profile is loaded
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchProfile()
  }
  
  // ✨ NEW: Load loyalty data
  try {
    await loyaltyStore.fetchRedemptions()
    if (authStore.isAuthenticated) {
      await loyaltyStore.fetchSummary()
    }
  } catch (error) {
    console.error('Error loading loyalty data:', error)
  }
  
  // Populate shipping info from user profile
  await populateShippingInfo()
  
  // Initialize Stripe
  await initializeStripe()
  
  // Create card element since default is 'card'
  if (selectedPaymentMethod.value === 'card') {
    await nextTick()
    await createCardElement()
  }
})

onBeforeUnmount(() => {
  // Clean up Stripe elements
  destroyCardElement()
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

// ✨ NEW: Loyalty redemption card styles
.loyalty-redemption-card {
  border: 1px solid #e3f2fd;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e3f2fd;
    
    h5 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #2c3e50;
      
      i {
        color: #ffd700;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      }
    }
    
    .loyalty-balance {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #ffd700, #ffb347);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 2px 8px rgba(255, 179, 71, 0.3);
      
      i {
        font-size: 1.1rem;
      }
    }
  }
}

.redemptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.redemption-option {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  
  &:hover:not(.disabled) {
    border-color: #2196f3;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.15);
  }
  
  &.selected {
    border-color: #2196f3;
    background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.2);
  }
  
  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f5f5f5;
  }
  
  .redemption-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    
    .redemption-title {
      font-weight: 600;
      color: #2c3e50;
      font-size: 1.1rem;
    }
    
    .redemption-badge {
      background: #2196f3;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 0.8rem;
      font-weight: 600;
    }
  }
  
  .redemption-details {
    margin-bottom: 16px;
    
    .redemption-description {
      color: #6c757d;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    
    .redemption-cost {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .cost-points {
        font-weight: 600;
        color: #ffd700;
        font-size: 1.1rem;
      }
      
      .min-order {
        font-size: 0.8rem;
        color: #6c757d;
      }
    }
  }
  
  .redemption-actions {
    display: flex;
    justify-content: flex-end;
    
    .redemption-status {
      font-size: 0.8rem;
      color: #dc3545;
      font-style: italic;
    }
  }
}

.no-redemptions, .no-points {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  
  i {
    font-size: 2rem;
    color: #6c757d;
  }
  
  p {
    margin: 5px 0;
    color: #6c757d;
    
    &:first-child {
      font-weight: 600;
      color: #2c3e50;
    }
  }
}

.payment-methods {
  margin-bottom: 20px;
  
  p {
    margin: 15px 0;
    
    label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 16px;
      
      input[type="radio"] {
        margin-right: 10px;
      }
    }
  }
}

.card-payment-section {
  margin-top: 20px;
}

.cod-info {
  margin-top: 20px;
  
  .cod-notice {
    display: flex;
    align-items: flex-start;
    background-color: #e3f2fd;
    padding: 15px;
    border-radius: 4px;
    border-left: 4px solid #2196f3;
    
    i {
      color: #2196f3;
      margin-right: 10px;
      margin-top: 2px;
    }
    
    p {
      margin: 5px 0;
      line-height: 1.4;
      
      &.cod-amount {
        color: #1976d2;
        font-size: 16px;
        margin-top: 10px;
      }
    }
  }
}

.order-summary {
  position: sticky;
  top: 20px;
  
  .order-items {
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 15px;
  }
  
  .order-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    
    .item-info {
      flex: 1;
      
      .item-name {
        margin: 0;
        font-weight: 500;
      }
      
      .item-quantity {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
      }
    }
    
    .item-price {
      margin: 0;
      font-weight: 500;
    }
  }
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    
    &.total {
      font-weight: 600;
      font-size: 1.2rem;
    }
    
    // ✨ NEW: Loyalty discount styling
    &.loyalty-discount {
      color: #4caf50;
      font-weight: 500;
      
      .discount-label {
        display: flex;
        align-items: center;
        gap: 6px;
        
        i {
          font-size: 1rem;
        }
      }
      
      .discount-amount {
        font-weight: 600;
      }
    }
  }
  
  .payment-method-display {
    margin: 15px 0;
    padding-top: 10px;
    border-top: 1px solid #e0e0e0;
    
    .summary-row {
      font-weight: 500;
      color: #666;
    }
  }
  
  // ✨ NEW: Savings and points display
  .savings-display, .points-earn-display {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 8px;
    margin: 12px 0;
    font-size: 0.9rem;
    font-weight: 500;
    
    i {
      font-size: 1.2rem;
    }
  }
  
  .savings-display {
    background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
    color: #2e7d32;
    border: 1px solid #a5d6a7;
  }
  
  .points-earn-display {
    background: linear-gradient(135deg, #fff3e0, #fef7ed);
    color: #f57c00;
    border: 1px solid #ffcc02;
  }
  
  .full-width {
    width: 100%;
    margin-top: 20px;
  }
}

.card-element {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: white;
}

.card-errors {
  color: #f44336;
  margin-top: 10px;
  font-size: 0.9rem;
}

// Responsive design
@media (max-width: 768px) {
  .loyalty-redemption-card .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .redemptions-grid {
    grid-template-columns: 1fr;
  }
  
  .redemption-option {
    padding: 16px;
    
    .redemption-header {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }
  }
  
  .no-redemptions, .no-points {
    flex-direction: column;
    text-align: center;
    
    i {
      font-size: 3rem;
    }
  }
}
</style>