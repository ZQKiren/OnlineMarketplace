<!-- src/views/cart/ShoppingCart.vue - REMOVED Loyalty Integration -->
<template>
  <div class="container shopping-cart-container">
    <!-- Header with breadcrumbs -->
    <div class="cart-header">
      <h4 class="cart-title">
        <ShoppingCart class="icon-left" />
        Shopping Cart
        <span v-if="!loading && cartStore.items.length > 0" class="item-count">
          ({{ cartStore.itemCount }} {{ cartStore.itemCount === 1 ? 'item' : 'items' }})
        </span>
      </h4>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="preloader-wrapper active">
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
      <p class="loading-text">Loading your cart...</p>
    </div>
    
    <!-- Empty Cart State -->
    <div v-else-if="cartStore.items.length === 0" class="empty-cart-container">
      <div class="empty-cart-content">
        <div class="empty-cart-icon">
          <ShoppingCart :size="80" />
        </div>
        <h5>Your cart is empty</h5>
        <p>Looks like you haven't added any items to your cart yet.</p>
        
        <div class="empty-cart-actions">
          <router-link to="/products" class="btn waves-effect waves-light btn-large">
            <Store class="icon-left" />
            Continue Shopping
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- Cart Content -->
    <div v-else class="cart-content">
      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="card-panel green lighten-4 green-text text-darken-4 success-message">
        <CheckCircle class="icon-left" />
        {{ successMessage }}
      </div>
      
      <div class="row">
        <!-- Cart Items Section -->
        <div class="col s12 m8 l8">
          <div class="cart-items-section">
            <div class="section-header">
              <h5>
                <List class="icon-left" />
                Cart Items
              </h5>
              <button 
                class="btn-flat waves-effect clear-all-btn"
                @click="confirmClearCart"
                :disabled="clearing"
              >
                <Trash2 class="icon-left" />
                Clear All
              </button>
            </div>
            
            <div class="cart-items-list">
              <CartItem 
                v-for="item in cartStore.items" 
                :key="`cart-item-${item.id}`"
                :item="item"
                @update="handleUpdateItem"
                @remove="handleRemoveItem"
                :updating="updatingItems.has(item.id)"
                :removing="removingItems.has(item.id)"
              />
            </div>
          </div>
        </div>
        
        <!-- Order Summary Section -->
        <div class="col s12 m4 l4">
          <div class="cart-summary-container">
            <div class="cart-summary custom-card">
              <div class="summary-header">
                <h5>
                  <Receipt class="icon-left" />
                  Order Summary
                </h5>
              </div>
              
              <div class="summary-content">
                <div class="summary-row">
                  <span>Subtotal ({{ cartStore.itemCount }} items)</span>
                  <span class="price">${{ cartStore.total.toFixed(2) }}</span>
                </div>
                
                <div class="summary-row">
                  <span>Shipping</span>
                  <span class="free-shipping">
                    <Truck class="tiny-icon" />
                    Free
                  </span>
                </div>
                
                <div class="summary-row discount-row" v-if="discount > 0">
                  <span>Discount</span>
                  <span class="discount">-${{ discount.toFixed(2) }}</span>
                </div>
                
                <div class="divider"></div>
                
                <div class="summary-row total-row">
                  <span>Total</span>
                  <span class="total-price">${{ finalTotal.toFixed(2) }}</span>
                </div>
                
                <!-- Savings Badge -->
                <div v-if="discount > 0" class="savings-badge">
                  <PiggyBank class="tiny-icon" />
                  You saved ${{ discount.toFixed(2) }}!
                </div>
              </div>
              
              <div class="summary-actions">
                <router-link 
                  to="/checkout" 
                  class="btn waves-effect waves-light btn-large checkout-btn"
                  :class="{ disabled: processing }"
                >
                  <CreditCard class="icon-left" />
                  {{ processing ? 'Processing...' : 'Proceed to Checkout' }}
                </router-link>
                
                <router-link 
                  to="/products" 
                  class="btn-flat waves-effect continue-shopping-btn"
                >
                  <ArrowLeft class="icon-left" />
                  Continue Shopping
                </router-link>
              </div>
            </div>
            
            <!-- Security Badge -->
            <div class="security-badge">
              <Shield class="tiny-icon" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Confirmation Modal -->
    <div id="clear-cart-modal" class="modal">
      <div class="modal-content">
        <h4>
          <AlertTriangle class="icon-left red-text" />
          Clear Cart
        </h4>
        <p>Are you sure you want to remove all items from your cart? This action cannot be undone.</p>
      </div>
      <div class="modal-footer">
        <button class="modal-close waves-effect waves-light btn-flat">Cancel</button>
        <button 
          class="waves-effect waves-light btn red"
          @click="clearCart"
          :disabled="clearing"
        >
          <Trash class="icon-left" />
          {{ clearing ? 'Clearing...' : 'Clear Cart' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import CartItem from '@/components/cart/CartItem.vue'

// Lucide Icons
import {
  ShoppingCart,
  Store,
  CheckCircle,
  List,
  Trash2,
  Receipt,
  Truck,
  PiggyBank,
  CreditCard,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Trash
} from 'lucide-vue-next'

const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()

// Loading states
const loading = ref(false)
const processing = ref(false)
const clearing = ref(false)
const updatingItems = ref(new Set())
const removingItems = ref(new Set())

// UI states
const successMessage = ref('')
const discount = ref(0) // For future discount implementation

// Computed properties
const finalTotal = computed(() => {
  return Math.max(0, cartStore.total - discount.value)
})

// Modal instance
let clearCartModal = null

// Methods
const handleUpdateItem = async ({ itemId, quantity }) => {
  updatingItems.value.add(itemId)
  try {
    await cartStore.updateCartItem(itemId, quantity)
    showSuccessMessage('Cart updated successfully')
  } catch (error) {
    console.error('Error updating cart item:', error)
    toast.error('Failed to update item. Please try again.')
  } finally {
    updatingItems.value.delete(itemId)
  }
}

const handleRemoveItem = async (itemId) => {
  removingItems.value.add(itemId)
  try {
    await cartStore.removeFromCart(itemId)
    showSuccessMessage('Item removed from cart')
  } catch (error) {
    console.error('Error removing item:', error)
    toast.error('Failed to remove item. Please try again.')
  } finally {
    removingItems.value.delete(itemId)
  }
}

const confirmClearCart = () => {
  if (clearCartModal) {
    clearCartModal.open()
  }
}

const clearCart = async () => {
  clearing.value = true
  try {
    await cartStore.clearCart()
    showSuccessMessage('Cart cleared successfully')
    if (clearCartModal) {
      clearCartModal.close()
    }
  } catch (error) {
    console.error('Error clearing cart:', error)
    toast.error('Failed to clear cart. Please try again.')
  } finally {
    clearing.value = false
  }
}

const showSuccessMessage = (message) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// Performance optimizations
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Lifecycle hooks
onMounted(async () => {
  loading.value = true
  try {
    await cartStore.fetchCart()
  } catch (error) {
    console.error('Error loading cart:', error)
    toast.error('Failed to load cart. Please refresh the page.')
  } finally {
    loading.value = false
  }
  
  // Initialize modal
  await nextTick()
  const modalElem = document.getElementById('clear-cart-modal')
  if (modalElem && window.M) {
    clearCartModal = window.M.Modal.init(modalElem)
  }
})

onUnmounted(() => {
  if (clearCartModal) {
    clearCartModal.destroy()
  }
})
</script>

<style scoped lang="scss">
.shopping-cart-container {
  min-height: 80vh;
  padding: 20px 0;
}

.cart-header {
  margin-bottom: 30px;
  
  .cart-title {
    color: #333;
    font-weight: 300;
    margin: 0;
    display: flex;
    align-items: center;
    
    .icon-left {
      margin-right: 10px;
      width: 24px;
      height: 24px;
    }
    
    .item-count {
      color: #666;
      font-size: 1rem;
      font-weight: 400;
      margin-left: 10px;
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  .loading-text {
    margin-top: 20px;
    color: #666;
    font-size: 1.1rem;
  }
}

.empty-cart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  .empty-cart-content {
    text-align: center;
    max-width: 400px;
    
    .empty-cart-icon {
      margin-bottom: 20px;
      color: #e0e0e0;
    }
    
    h5 {
      color: #333;
      margin-bottom: 10px;
    }
    
    p {
      color: #666;
      margin-bottom: 30px;
      line-height: 1.5;
    }
    
    .empty-cart-actions {
      .btn-large {
        padding: 0 30px;
        
        .icon-left {
          margin-right: 8px;
          width: 20px;
          height: 20px;
        }
      }
    }
  }
}

.cart-content {
  .success-message {
    border-radius: 8px;
    margin-bottom: 20px;
    animation: slideDown 0.3s ease-out;
    display: flex;
    align-items: center;
    
    .icon-left {
      margin-right: 8px;
      width: 20px;
      height: 20px;
    }
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e0e0e0;
    
    h5 {
      margin: 0;
      color: #333;
      display: flex;
      align-items: center;
      
      .icon-left {
        margin-right: 8px;
        width: 20px;
        height: 20px;
      }
    }
    
    .clear-all-btn {
      color: #f44336;
      display: flex;
      align-items: center;
      
      .icon-left {
        margin-right: 6px;
        width: 18px;
        height: 18px;
      }
      
      &:hover {
        background-color: rgba(244, 67, 54, 0.1);
      }
      
      &:disabled {
        color: #ccc;
        cursor: not-allowed;
      }
    }
  }
  
  .cart-items-list {
    .cart-item {
      margin-bottom: 15px;
      transition: all 0.3s ease;
      
      &.updating, &.removing {
        opacity: 0.6;
        pointer-events: none;
      }
    }
  }
}

.cart-summary-container {
  position: sticky;
  top: 20px;
  
  .cart-summary {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    
    .summary-header {
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      color: white;
      padding: 20px;
      margin: -24px -24px 20px -24px;
      
      h5 {
        margin: 0;
        display: flex;
        align-items: center;
        
        .icon-left {
          margin-right: 8px;
          width: 20px;
          height: 20px;
        }
      }
    }
    
    .summary-content {
      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 15px 0;
        font-size: 14px;
        
        &.total-row {
          font-weight: 600;
          font-size: 1.2rem;
          color: #1976d2;
        }
        
        &.discount-row {
          color: #4caf50;
        }
        
        .price {
          font-weight: 500;
        }
        
        .total-price {
          font-weight: 600;
          font-size: 1.3rem;
        }
        
        .free-shipping {
          color: #4caf50;
          display: flex;
          align-items: center;
          
          .tiny-icon {
            margin-right: 4px;
            width: 14px;
            height: 14px;
          }
        }
        
        .discount {
          color: #4caf50;
          font-weight: 500;
        }
      }
      
      .divider {
        margin: 20px 0;
        background-color: #e0e0e0;
      }
      
      .savings-badge {
        background: linear-gradient(135deg, #4caf50, #388e3c);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        text-align: center;
        font-size: 12px;
        font-weight: 500;
        margin-top: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .tiny-icon {
          margin-right: 4px;
          width: 14px;
          height: 14px;
        }
      }
    }
    
    .summary-actions {
      margin-top: 25px;
      
      .checkout-btn {
        width: 100%;
        margin-bottom: 10px;
        border-radius: 8px;
        background: linear-gradient(135deg, #ff9800, #f57c00);
        display: flex;
        align-items: center;
        justify-content: center;
        
        .icon-left {
          margin-right: 8px;
          width: 20px;
          height: 20px;
        }
        
        &:hover {
          box-shadow: 0 6px 20px rgba(255, 152, 0, 0.3);
        }
        
        &.disabled {
          background: #ccc !important;
          cursor: not-allowed;
        }
      }
      
      .continue-shopping-btn {
        width: 100%;
        color: #666;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
        
        .icon-left {
          margin-right: 8px;
          width: 18px;
          height: 18px;
        }
        
        &:hover {
          background-color: #f5f5f5;
        }
      }
    }
  }
  
  .security-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    padding: 10px;
    border-radius: 8px;
    margin-top: 15px;
    color: #4caf50;
    font-size: 12px;
    font-weight: 500;
    
    i {
      margin-right: 5px;
      font-size: 16px;
    }
  }
}

// Modal styles
.modal {
  .modal-content {
    h4 {
      display: flex;
      align-items: center;
      
      i {
        margin-right: 10px;
      }
    }
  }
}

// Responsive design
@media (max-width: 992px) {
  .cart-summary-container {
    position: static;
    margin-top: 30px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    
    .clear-all-btn {
      margin-top: 10px;
      align-self: flex-end;
    }
  }
}

@media (max-width: 600px) {
  .shopping-cart-container {
    padding: 10px 0;
  }
  
  .cart-header {
    .cart-title {
      font-size: 1.5rem;
      flex-direction: column;
      align-items: flex-start;
      
      .item-count {
        margin-left: 0;
        margin-top: 5px;
      }
    }
  }
  
  .empty-cart-content {
    .empty-cart-icon i {
      font-size: 60px;
    }
    
    .btn-large {
      width: 100%;
    }
  }
  
  .cart-summary {
    .summary-header {
      padding: 15px !important;
      margin: -20px -20px 15px -20px !important;
    }
  }
}

// Animations
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Loading animation improvements
.preloader-wrapper {
  width: 60px;
  height: 60px;
}
</style>