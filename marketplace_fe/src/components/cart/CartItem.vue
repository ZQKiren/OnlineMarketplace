<!-- src/components/cart/CartItem.vue -->
<template>
  <div class="cart-item card">
    <div class="card-content">
      <div class="item-content">
        <div class="item-image">
          <img 
            :src="item.product.images[0] || '/placeholder.jpg'" 
            :alt="item.product.name"
          >
        </div>
        
        <div class="item-details">
          <h6 class="item-name">
            <router-link :to="`/products/${item.product.id}`">
              {{ item.product.name }}
            </router-link>
          </h6>
          <p class="item-category">{{ item.product.category.name }}</p>
          <p class="item-seller">Sold by: {{ item.product.seller.name }}</p>
          
          <div class="item-price-mobile">
            <span class="price">${{ item.product.price.toFixed(2) }}</span>
          </div>
        </div>
        
        <div class="item-quantity">
          <label>Quantity:</label>
          <div class="quantity-controls">
            <button 
              class="btn-flat btn-small"
              @click="updateQuantity(item.quantity - 1)"
              :disabled="item.quantity <= 1"
            >
              <i class="material-icons">remove</i>
            </button>
            
            <input 
              type="number" 
              :value="item.quantity"
              @change="updateQuantity($event.target.value)"
              min="1"
              :max="item.product.stock"
            >
            
            <button 
              class="btn-flat btn-small"
              @click="updateQuantity(item.quantity + 1)"
              :disabled="item.quantity >= item.product.stock"
            >
              <i class="material-icons">add</i>
            </button>
          </div>
          <p class="stock-info">{{ item.product.stock }} available</p>
        </div>
        
        <div class="item-price hide-on-small-only">
          <span class="price">${{ item.product.price.toFixed(2) }}</span>
          <span class="total">${{ (item.product.price * item.quantity).toFixed(2) }}</span>
        </div>
        
        <div class="item-actions">
          <button 
            class="btn-flat waves-effect"
            @click="removeItem"
          >
            <i class="material-icons">delete</i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from 'vue-toastification'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'remove'])
const toast = useToast()

const updateQuantity = (newQuantity) => {
  const quantity = parseInt(newQuantity)
  
  if (isNaN(quantity) || quantity < 1) {
    toast.error('Invalid quantity')
    return
  }
  
  if (quantity > props.item.product.stock) {
    toast.error('Not enough stock available')
    return
  }
  
  emit('update', { 
    itemId: props.item.id, 
    quantity 
  })
}

const removeItem = () => {
  if (confirm('Remove this item from cart?')) {
    emit('remove', props.item.id)
  }
}
</script>

<style scoped lang="scss">
.cart-item {
  margin-bottom: 15px;
  
  .item-content {
    display: flex;
    align-items: center;
    gap: 20px;
    
    @media (max-width: 600px) {
      flex-wrap: wrap;
    }
  }
  
  .item-image {
    width: 100px;
    height: 100px;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
    }
  }
  
  .item-details {
    flex: 1;
    
    .item-name {
      margin: 0 0 5px 0;
      font-weight: 500;
      
      a {
        color: inherit;
        
        &:hover {
          color: #1976d2;
        }
      }
    }
    
    .item-category,
    .item-seller {
      margin: 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    .item-price-mobile {
      display: none;
      margin-top: 10px;
      
      @media (max-width: 600px) {
        display: block;
      }
    }
  }
  
  .item-quantity {
    text-align: center;
    
    label {
      font-size: 0.9rem;
      color: #666;
    }
    
    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 5px;
      
      input {
        width: 60px;
        text-align: center;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 5px;
      }
      
      button {
        padding: 0;
        width: 30px;
        height: 30px;
        min-width: 30px;
      }
    }
    
    .stock-info {
      margin: 5px 0 0 0;
      font-size: 0.85rem;
      color: #666;
    }
  }
  
  .item-price {
    text-align: right;
    min-width: 100px;
    
    .price {
      display: block;
      color: #666;
      font-size: 0.9rem;
    }
    
    .total {
      display: block;
      font-weight: 600;
      font-size: 1.1rem;
      color: #1976d2;
    }
  }
  
  .item-actions {
    button {
      color: #f44336;
    }
  }
}
</style>