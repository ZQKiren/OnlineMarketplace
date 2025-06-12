<!-- src/views/cart/ShoppingCart.vue -->
<template>
  <div class="container">
    <h4>Shopping Cart</h4>
    
    <div v-if="loading" class="loading-spinner">
      <div class="preloader-wrapper active">
        <div class="spinner-layer spinner-blue-only">
          <div class="circle-clipper left">
            <div class="circle"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="cartStore.items.length === 0" class="empty-cart">
      <i class="material-icons large">shopping_cart</i>
      <p>Your cart is empty</p>
      <router-link to="/products" class="btn waves-effect waves-light">
        Continue Shopping
      </router-link>
    </div>
    
    <div v-else class="row">
      <div class="col s12 m8">
        <div class="cart-items">
          <CartItem 
            v-for="item in cartStore.items" 
            :key="item.id"
            :item="item"
            @update="updateCartItem"
            @remove="removeFromCart"
          />
        </div>
      </div>
      
      <div class="col s12 m4">
        <div class="cart-summary custom-card">
          <h5>Order Summary</h5>
          
          <div class="summary-row">
            <span>Subtotal ({{ cartStore.itemCount }} items)</span>
            <span class="price">${{ cartStore.total.toFixed(2) }}</span>
          </div>
          
          <div class="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="summary-row total">
            <span>Total</span>
            <span class="price">${{ cartStore.total.toFixed(2) }}</span>
          </div>
          
          <router-link 
            to="/checkout" 
            class="btn waves-effect waves-light full-width"
          >
            Proceed to Checkout
          </router-link>
          
          <button 
            class="btn-flat waves-effect full-width"
            @click="clearCart"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useToast } from 'vue-toastification'
import CartItem from '@/components/cart/CartItem.vue'

const cartStore = useCartStore()
const toast = useToast()
const loading = ref(false)

const updateCartItem = async ({ itemId, quantity }) => {
  try {
    await cartStore.updateCartItem(itemId, quantity)
  } catch (error) {
    console.error('Error updating cart item:', error)
  }
}

const removeFromCart = async (itemId) => {
  try {
    await cartStore.removeFromCart(itemId)
    toast.success('Item removed from cart')
  } catch (error) {
    console.error('Error removing item:', error)
  }
}

const clearCart = async () => {
  if (confirm('Are you sure you want to clear your cart?')) {
    try {
      await cartStore.clearCart()
      toast.success('Cart cleared')
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }
}

onMounted(async () => {
  loading.value = true
  await cartStore.fetchCart()
  loading.value = false
})
</script>

<style scoped lang="scss">
.empty-cart {
  text-align: center;
  padding: 60px 0;
  
  i {
    color: #ccc;
  }
  
  p {
    font-size: 1.2rem;
    color: #666;
    margin: 20px 0;
  }
}

.cart-items {
  margin-bottom: 20px;
}

.cart-summary {
  position: sticky;
  top: 20px;
  
  h5 {
    margin-bottom: 20px;
  }
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    margin: 15px 0;
    
    &.total {
      font-weight: 600;
      font-size: 1.2rem;
    }
  }
  
  .divider {
    margin: 20px 0;
  }
  
  .full-width {
    width: 100%;
    margin-top: 10px;
  }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>