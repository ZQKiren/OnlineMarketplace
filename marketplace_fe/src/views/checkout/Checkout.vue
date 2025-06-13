<!-- src/views/checkout/Checkout.vue -->
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
                <p class="cod-amount"><strong>Amount to pay: ${{ totalWithTax.toFixed(2) }}</strong></p>
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
          
          <div class="divider"></div>
          
          <div class="summary-row total">
            <span>Total</span>
            <span class="price">${{ totalWithTax.toFixed(2) }}</span>
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
import { useToast } from 'vue-toastification'
import { loadStripe } from '@stripe/stripe-js'
import orderService from '@/services/order.service'
import paymentService from '@/services/payment.service'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()

const stripe = ref(null)
const cardElement = ref(null)
const elements = ref(null)
const processing = ref(false)
const selectedPaymentMethod = ref('card') // Default to card
const stripeInitialized = ref(false)

const shippingInfo = ref({
  fullName: '',
  address: '',
  city: '',
  zipCode: '',
  phone: ''
})

const tax = computed(() => cartStore.total * 0.08) // 8% tax
const totalWithTax = computed(() => cartStore.total + tax.value)

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

// Watch for user data changes
watch(() => authStore.user, async () => {
  await populateShippingInfo()
}, { immediate: true })

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

// Cập nhật processCardPayment function trong Checkout.vue

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

  // ✅ 2. TẠO ORDER VỚI PAYMENT METHOD ID
  const orderResponse = await orderService.createOrder({ 
    items: orderItems,
    shippingAddress: shippingInfo.value,
    paymentMethod: 'card',
    paymentMethodId: paymentMethod.id  // ← THÊM VÀO DTO
  })
  const order = orderResponse.data
  
  // ✅ 3. XỬ LÝ PAYMENT TRONG BACKEND
  // Backend sẽ tự động tạo payment intent và xử lý
  
  if (order.payment?.status === 'COMPLETED') {
    await cartStore.clearCart()
    toast.success('Payment successful! Order placed.')
    router.push(`/orders/${order.id}`)
  } else {
    throw new Error('Payment processing failed')
  }
}

const processCODPayment = async (orderItems) => {
  // Create COD order
  const orderResponse = await orderService.createOrder({ 
    items: orderItems,
    shippingAddress: shippingInfo.value,
    paymentMethod: 'cod'
  })
  const order = orderResponse.data
  
  // For COD, we don't need to process payment immediately
  // Clear cart and redirect to success page
  await cartStore.clearCart()
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
</style>