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
              <label for="fullName">Full Name</label>
            </div>
            
            <div class="input-field col s12">
              <input 
                id="address" 
                type="text" 
                v-model="shippingInfo.address"
                required
              >
              <label for="address">Address</label>
            </div>
            
            <div class="input-field col s6">
              <input 
                id="city" 
                type="text" 
                v-model="shippingInfo.city"
                required
              >
              <label for="city">City</label>
            </div>
            
            <div class="input-field col s6">
              <input 
                id="zipCode" 
                type="text" 
                v-model="shippingInfo.zipCode"
                required
              >
              <label for="zipCode">Zip Code</label>
            </div>
            
            <div class="input-field col s12">
              <input 
                id="phone" 
                type="tel" 
                v-model="shippingInfo.phone"
                required
              >
              <label for="phone">Phone Number</label>
            </div>
          </div>
        </div>
        
        <!-- Payment Method -->
        <div class="custom-card">
          <h5>Payment Method</h5>
          
          <div id="card-element" class="card-element"></div>
          <div id="card-errors" class="card-errors"></div>
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
          
          <button 
            class="btn waves-effect waves-light full-width"
            @click="processPayment"
            :disabled="processing"
          >
            {{ processing ? 'Processing...' : 'Place Order' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useToast } from 'vue-toastification'
import { loadStripe } from '@stripe/stripe-js'
import orderService from '@/services/order.service'
import paymentService from '@/services/payment.service'

const router = useRouter()
const cartStore = useCartStore()
const toast = useToast()

const stripe = ref(null)
const cardElement = ref(null)
const processing = ref(false)

const shippingInfo = ref({
  fullName: '',
  address: '',
  city: '',
  zipCode: '',
  phone: ''
})

const tax = computed(() => cartStore.total * 0.08) // 8% tax
const totalWithTax = computed(() => cartStore.total + tax.value)

const initializeStripe = async () => {
  stripe.value = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  
  const elements = stripe.value.elements()
  cardElement.value = elements.create('card', {
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
  
  cardElement.value.mount('#card-element')
  
  cardElement.value.on('change', (event) => {
    const displayError = document.getElementById('card-errors')
    if (event.error) {
      displayError.textContent = event.error.message
    } else {
      displayError.textContent = ''
    }
  })
}

const processPayment = async () => {
  if (!validateShippingInfo()) {
    toast.error('Please fill in all shipping information')
    return
  }
  
  processing.value = true
  
  try {
    // Create payment method
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
    
    // Create order
    const orderItems = cartStore.items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }))
    
    const orderResponse = await orderService.createOrder({ items: orderItems })
    const order = orderResponse.data
    
    // Create payment intent
    const paymentResponse = await paymentService.createPaymentIntent({
      orderId: order.id,
      paymentMethodId: paymentMethod.id,
    })
    
    if (paymentResponse.data.payment.status === 'COMPLETED') {
      // Clear cart and redirect to success page
      await cartStore.clearCart()
      toast.success('Order placed successfully!')
      router.push(`/orders/${order.id}`)
    } else {
      throw new Error('Payment failed')
    }
  } catch (error) {
    console.error('Payment error:', error)
    toast.error(error.message || 'Payment failed. Please try again.')
  } finally {
    processing.value = false
  }
}

const validateShippingInfo = () => {
  return Object.values(shippingInfo.value).every(value => value.trim() !== '')
}

onMounted(() => {
  if (cartStore.items.length === 0) {
    router.push('/cart')
    return
  }
  
  initializeStripe()
})
</script>

<style scoped lang="scss">
.custom-card {
  h5 {
    margin-bottom: 20px;
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