<template>
  <div class="shopping-cart-container">
    <div class="container">
      <!-- Modern Header -->
      <div class="cart-header">
        <div class="header-content">
          <div class="header-info">
            <ShoppingCart class="header-icon" />
            <div>
              <h4>Shopping Cart</h4>
              <p v-if="!loading && cartStore.items.length > 0" class="header-subtitle">
                {{ cartStore.itemCount }} {{ cartStore.itemCount === 1 ? 'item' : 'items' }} in your cart
              </p>
              <p v-else-if="!loading" class="header-subtitle">
                Your cart is waiting for products
              </p>
            </div>
          </div>
          <div v-if="cartStore.items.length > 0" class="header-actions">
            <button 
              class="btn-flat waves-effect clear-all-btn"
              @click="confirmClearCart"
              :disabled="clearing"
            >
              <Trash2 class="icon-left" />
              Clear All
            </button>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
        <p class="loading-text">Loading your cart...</p>
      </div>
      
      <!-- Empty Cart State -->
      <div v-else-if="cartStore.items.length === 0" class="empty-cart-container">
        <div class="empty-cart-content">
          <div class="empty-cart-illustration">
            <ShoppingCart class="empty-icon" />
            <div class="floating-items">
              <div class="item item-1"></div>
              <div class="item item-2"></div>
              <div class="item item-3"></div>
            </div>
          </div>
          <h5>Your cart is empty</h5>
          <p>Looks like you haven't added any items to your cart yet. Start shopping to fill it up!</p>
          
          <div class="empty-cart-actions">
            <router-link to="/products" class="btn-primary">
              <Store class="icon-left" />
              Start Shopping
            </router-link>
          </div>
        </div>
      </div>
      
      <!-- Cart Content -->
      <div v-else class="cart-content">
        <!-- Success Messages -->
        <div v-if="successMessage" class="success-banner">
          <CheckCircle class="icon-left" />
          {{ successMessage }}
        </div>
        
        <div class="cart-layout">
          <!-- Cart Items Section -->
          <div class="cart-items-section">
            <div class="section-card">
              <div class="section-header">
                <h5>
                  <List class="icon-left" />
                  Your Items
                </h5>
                <span class="items-count">{{ cartStore.items.length }} {{ cartStore.items.length === 1 ? 'product' : 'products' }}</span>
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
                  class="cart-item-wrapper"
                />
              </div>
            </div>
          </div>
          
          <!-- Order Summary Section -->
          <div class="order-summary-section">
            <div class="summary-card">
              <div class="summary-header">
                <h5>
                  <Receipt class="icon-left" />
                  Order Summary
                </h5>
              </div>
              
              <div class="summary-content">
                <div class="summary-breakdown">
                  <div class="summary-row">
                    <span>Subtotal ({{ cartStore.itemCount }} items)</span>
                    <span class="amount">${{ cartStore.total.toFixed(2) }}</span>
                  </div>
                  
                  <div class="summary-row">
                    <span>Shipping</span>
                    <div class="free-shipping">
                      <Truck class="tiny-icon" />
                      <span>Free</span>
                    </div>
                  </div>
                  
                  <div class="summary-row" v-if="discount > 0">
                    <span>Discount</span>
                    <span class="discount-amount">-${{ discount.toFixed(2) }}</span>
                  </div>
                  
                  <div class="summary-divider"></div>
                  
                  <div class="summary-row total-row">
                    <span>Total</span>
                    <span class="total-amount">${{ finalTotal.toFixed(2) }}</span>
                  </div>
                </div>
                
                <!-- Savings Badge -->
                <div v-if="discount > 0" class="savings-badge">
                  <div class="savings-icon">
                    <PiggyBank class="tiny-icon" />
                  </div>
                  <span>You saved ${{ discount.toFixed(2) }}!</span>
                </div>
              </div>
              
              <div class="summary-actions">
                <router-link 
                  to="/checkout" 
                  class="checkout-btn"
                  :class="{ disabled: processing }"
                >
                  <CreditCard class="icon-left" />
                  {{ processing ? 'Processing...' : 'Proceed to Checkout' }}
                </router-link>
                
                <router-link 
                  to="/products" 
                  class="continue-shopping-btn"
                >
                  <ArrowLeft class="icon-left" />
                  Continue Shopping
                </router-link>
              </div>
            </div>
            
            <!-- Security & Trust Badges -->
            <div class="trust-badges">
              <div class="trust-item">
                <Shield class="trust-icon" />
                <span>Secure Checkout</span>
              </div>
              <div class="trust-item">
                <Truck class="trust-icon" />
                <span>Free Shipping</span>
              </div>
              <div class="trust-item">
                <CheckCircle class="trust-icon" />
                <span>Money Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Confirmation Modal -->
    <div id="clear-cart-modal" class="modal">
      <div class="modal-content">
        <h4>
          <AlertTriangle class="icon-left warning-icon" />
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
// Color Variables
$primary-color: #2196F3;
$success-color: #4CAF50;
$warning-color: #FF9800;
$error-color: #F44336;
$text-primary: #2c3e50;
$text-secondary: #6c757d;
$light-bg: #f8f9fa;
$white: #ffffff;

.shopping-cart-container {
  background: $light-bg;
  min-height: 100vh;
  padding: 20px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

// Modern Header
.cart-header {
  margin-bottom: 32px;
  
  .header-content {
    background: $white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-info {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .header-icon {
        width: 32px;
        height: 32px;
        color: $primary-color;
      }
      
      h4 {
        margin: 0 0 4px 0;
        color: $text-primary;
        font-weight: 700;
        font-size: 1.8rem;
      }
      
      .header-subtitle {
        margin: 0;
        color: $text-secondary;
        font-size: 0.9rem;
      }
    }
    
    .header-actions {
      .clear-all-btn {
        background: rgba($error-color, 0.1);
        color: $error-color;
        border-radius: 8px;
        padding: 8px 16px;
        font-weight: 500;
        transition: all 0.3s ease;
        
        .icon-left {
          width: 16px;
          height: 16px;
          margin-right: 6px;
        }
        
        &:hover {
          background: rgba($error-color, 0.15);
          transform: translateY(-1px);
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      }
    }
  }
}

// Loading State
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  .loading-spinner {
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid $primary-color;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
  
  .loading-text {
    margin-top: 20px;
    color: $text-secondary;
    font-size: 1.1rem;
    font-weight: 500;
  }
}

// Empty Cart State
.empty-cart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  
  .empty-cart-content {
    text-align: center;
    max-width: 500px;
    
    .empty-cart-illustration {
      position: relative;
      margin-bottom: 32px;
      
      .empty-icon {
        width: 120px;
        height: 120px;
        color: #e0e7ff;
        margin-bottom: 20px;
      }
      
      .floating-items {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        
        .item {
          position: absolute;
          width: 12px;
          height: 12px;
          background: $primary-color;
          border-radius: 50%;
          opacity: 0.3;
          
          &.item-1 {
            top: 20px;
            left: -40px;
            animation: float 3s ease-in-out infinite;
          }
          
          &.item-2 {
            top: 60px;
            right: -35px;
            animation: float 3s ease-in-out infinite 1s;
          }
          
          &.item-3 {
            top: 100px;
            left: -20px;
            animation: float 3s ease-in-out infinite 2s;
          }
        }
      }
    }
    
    h5 {
      color: $text-primary;
      margin-bottom: 12px;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    p {
      color: $text-secondary;
      margin-bottom: 32px;
      line-height: 1.6;
      font-size: 1rem;
    }
    
    .empty-cart-actions {
      .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, $primary-color, #1976d2);
        color: $white;
        padding: 12px 32px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba($primary-color, 0.3);
        
        .icon-left {
          width: 20px;
          height: 20px;
        }
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba($primary-color, 0.4);
        }
      }
    }
  }
}

// Cart Content
.cart-content {
  .success-banner {
    background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
    color: $success-color;
    padding: 16px 20px;
    border-radius: 12px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    border: 1px solid rgba($success-color, 0.2);
    animation: slideInDown 0.5s ease-out;
    
    .icon-left {
      width: 20px;
      height: 20px;
      margin-right: 12px;
    }
  }
  
  .cart-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 32px;
    align-items: start;
  }
}

// Cart Items Section
.cart-items-section {
  .section-card {
    background: $white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f8f9fa;
      
      h5 {
        margin: 0;
        color: $text-primary;
        font-weight: 700;
        display: flex;
        align-items: center;
        
        .icon-left {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          color: $primary-color;
        }
      }
      
      .items-count {
        color: $text-secondary;
        font-size: 0.9rem;
        font-weight: 500;
        background: $light-bg;
        padding: 4px 12px;
        border-radius: 20px;
      }
    }
    
    .cart-items-list {
      .cart-item-wrapper {
        margin-bottom: 16px;
        transition: all 0.3s ease;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        &.updating, &.removing {
          opacity: 0.6;
          pointer-events: none;
        }
      }
    }
  }
}

// Order Summary Section
.order-summary-section {
  position: sticky;
  top: 20px;
  
  .summary-card {
    width: 86%;
    background: $white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #f0f0f0;
    
    .summary-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f8f9fa;
      
      h5 {
        margin: 0;
        color: $text-primary;
        font-weight: 700;
        display: flex;
        align-items: center;
        
        .icon-left {
          width: 20px;
          height: 20px;
          margin-right: 8px;
          color: $primary-color;
        }
      }
    }
    
    .summary-content {
      .summary-breakdown {
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 12px 0;
          
          &.total-row {
            margin-top: 16px;
            padding-top: 16px;
            font-weight: 700;
            font-size: 1.1rem;
            color: $text-primary;
          }
          
          .amount {
            font-weight: 600;
            color: $text-primary;
          }
          
          .total-amount {
            font-weight: 700;
            font-size: 1.3rem;
            color: $primary-color;
          }
          
          .free-shipping {
            display: flex;
            align-items: center;
            gap: 4px;
            color: $success-color;
            font-weight: 500;
            
            .tiny-icon {
              width: 14px;
              height: 14px;
            }
          }
          
          .discount-amount {
            color: $success-color;
            font-weight: 600;
          }
        }
        
        .summary-divider {
          height: 1px;
          background: #e9ecef;
          margin: 16px 0;
        }
      }
      
      .savings-badge {
        background: linear-gradient(135deg, $success-color, #388e3c);
        color: $white;
        padding: 12px 16px;
        border-radius: 12px;
        margin-top: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        
        .savings-icon {
          .tiny-icon {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
    
    .summary-actions {
      margin-top: 24px;
      
      .checkout-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        background: linear-gradient(135deg, $warning-color, #f57c00);
        color: $white;
        padding: 14px 24px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: 12px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba($warning-color, 0.3);
        
        .icon-left {
          width: 20px;
          height: 20px;
        }
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba($warning-color, 0.4);
        }
        
        &.disabled {
          background: #ccc !important;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      }
      
      .continue-shopping-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        background: transparent;
        color: $text-secondary;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.3s ease;
        border: 1px solid #e9ecef;
        
        .icon-left {
          width: 18px;
          height: 18px;
        }
        
        &:hover {
          background: $light-bg;
          color: $text-primary;
        }
      }
    }
  }
  
  .trust-badges {
    width: 86%;
    background: $white;
    border-radius: 12px;
    padding: 16px;
    margin-top: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    
    .trust-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.8rem;
      color: $text-secondary;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .trust-icon {
        width: 14px;
        height: 14px;
        color: $success-color;
      }
    }
  }
}

// Modal Styles
.modal {
  .modal-content {
    h4 {
      display: flex;
      align-items: center;
      color: $text-primary;
      
      .icon-left {
        margin-right: 12px;
        
        &.warning-icon {
          color: $warning-color;
        }
      }
    }
    
    p {
      color: $text-secondary;
      line-height: 1.6;
    }
  }
  
  .modal-footer {
    .btn {
      display: flex;
      align-items: center;
      gap: 6px;
      
      .icon-left {
        width: 16px;
        height: 16px;
      }
    }
  }
}

// Animations
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Responsive Design
@media (max-width: 1024px) {
  .cart-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .order-summary-section {
    position: static;
    order: -1;
  }
}

@media (max-width: 768px) {
  .shopping-cart-container {
    padding: 10px 0;
  }
  
  .container {
    padding: 0 15px;
  }
  
  .cart-header {
    margin-bottom: 20px;
    
    .header-content {
      flex-direction: column;
      gap: 16px;
      align-items: center;
      text-align: center;
      padding: 20px;
      
      .header-info {
        flex-direction: column;
        text-align: center;
        gap: 8px;
      }
      
      .header-actions {
        width: 100%;
        
        .clear-all-btn {
          width: 100%;
          justify-content: center;
        }
      }
    }
  }
  
  .section-card, .summary-card {
    padding: 16px;
  }
  
  .empty-cart-content {
    .empty-cart-illustration .empty-icon {
      width: 80px;
      height: 80px;
    }
    
    h5 {
      font-size: 1.3rem;
    }
    
    .btn-primary {
      width: 100%;
      justify-content: center;
    }
  }
}

@media (max-width: 480px) {
  .cart-header .header-content h4 {
    font-size: 1.5rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    
    .items-count {
      align-self: flex-end;
    }
  }
  
  .summary-actions {
    .checkout-btn {
      padding: 12px 20px;
      font-size: 0.9rem;
    }
  }
}

// Icon utilities
.icon-left {
  margin-right: 8px;
}

.tiny-icon {
  width: 14px;
  height: 14px;
}

// Smooth transitions
* {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
}
</style>