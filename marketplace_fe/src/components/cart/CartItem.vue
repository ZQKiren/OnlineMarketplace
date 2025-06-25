<template>
  <div class="cart-item" :class="{ 'updating': updating, 'removing': removing }">
    <div class="item-content">
      <!-- Product Image -->
      <div class="item-image">
        <img 
          :src="getImageUrl()" 
          :alt="item.product.name"
          @error="handleImageError"
        >
        <div v-if="removing" class="removing-overlay">
          <Trash2 class="removing-icon" />
        </div>
      </div>
      
      <!-- Product Details -->
      <div class="item-details">
        <div class="product-info">
          <h6 class="item-name">
            <router-link :to="`/products/${item.product.id}`">
              {{ item.product.name }}
            </router-link>
          </h6>
          
          <div class="item-meta">
            <div class="category-info">
              <Tag class="meta-icon" />
              <span>{{ item.product.category?.name || 'General' }}</span>
            </div>
            <div class="seller-info">
              <Store class="meta-icon" />
              <span>{{ item.product.seller?.name || 'Marketplace' }}</span>
            </div>
          </div>
          
          <!-- Mobile Price -->
          <div class="item-price-mobile">
            <div class="price-row">
              <span class="unit-price">${{ item.product.price.toFixed(2) }}</span>
              <span class="multiply">×</span>
              <span class="quantity">{{ item.quantity }}</span>
              <span class="equals">=</span>
              <span class="total-price">${{ (item.product.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quantity Controls -->
      <div class="item-quantity">
        <label class="quantity-label">Quantity</label>
        <div class="quantity-controls">
          <button 
            class="quantity-btn decrease"
            @click="updateQuantity(item.quantity - 1)"
            :disabled="item.quantity <= 1 || updating"
            title="Decrease quantity"
          >
            <Minus class="btn-icon" />
          </button>
          
          <div class="quantity-input-wrapper">
            <input 
              type="number" 
              :value="item.quantity"
              @change="updateQuantity($event.target.value)"
              @blur="$event.target.value = item.quantity"
              min="1"
              :max="item.product.stock"
              :disabled="updating"
              class="quantity-input"
            >
            <div v-if="updating" class="quantity-loading">
              <Loader class="loading-icon" />
            </div>
          </div>
          
          <button 
            class="quantity-btn increase"
            @click="updateQuantity(item.quantity + 1)"
            :disabled="item.quantity >= item.product.stock || updating"
            title="Increase quantity"
          >
            <Plus class="btn-icon" />
          </button>
        </div>
        
        <div class="stock-info">
          <Package class="stock-icon" />
          <span :class="{ 'low-stock': item.product.stock < 10 }">
            {{ item.product.stock }} available
          </span>
        </div>
      </div>
      
      <!-- Desktop Price -->
      <div class="item-price">
        <div class="price-breakdown">
          <div class="unit-price">
            <span class="label">Unit Price</span>
            <span class="value">${{ item.product.price.toFixed(2) }}</span>
          </div>
          <div class="total-price">
            <span class="label">Total</span>
            <span class="value">${{ (item.product.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="item-actions">
        <button 
          class="remove-btn"
          @click="removeItem"
          :disabled="removing"
          title="Remove from cart"
        >
          <Trash2 v-if="!removing" class="action-icon" />
          <Loader v-else class="action-icon loading" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from 'vue-toastification'

// Lucide Icons
import {
  Tag,
  Store,
  Minus,
  Plus,
  Package,
  Trash2,
  Loader
} from 'lucide-vue-next'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  updating: {
    type: Boolean,
    default: false
  },
  removing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update', 'remove'])
const toast = useToast()

// Methods
const getImageUrl = () => {
  const firstImage = props.item.product.images?.[0]
  return firstImage || '/placeholder.jpg'
}

const handleImageError = (event) => {
  event.target.src = '/placeholder.jpg'
}

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
  
  if (quantity === props.item.quantity) {
    return // No change needed
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
// Color Variables
$primary-color: #2196F3;
$success-color: #4CAF50;
$warning-color: #FF9800;
$error-color: #F44336;
$text-primary: #2c3e50;
$text-secondary: #6c757d;
$light-bg: #f8f9fa;
$white: #ffffff;
$border-color: #e9ecef;

.cart-item {
  background: $white;
  border-radius: 16px;
  padding: 20px;
  border: 2px solid $border-color;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: rgba($primary-color, 0.3);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
  
  &.updating {
    .item-content {
      opacity: 0.7;
    }
  }
  
  &.removing {
    .item-content {
      opacity: 0.5;
    }
    
    .item-image {
      position: relative;
      
      .removing-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba($error-color, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        
        .removing-icon {
          width: 24px;
          height: 24px;
          color: $white;
          animation: pulse 1s infinite;
        }
      }
    }
  }
}

.item-content {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  gap: 20px;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: auto 1fr auto;
    grid-template-areas: 
      "image details actions"
      "quantity quantity quantity";
    gap: 16px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "image"
      "details" 
      "quantity"
      "actions";
    gap: 12px;
    text-align: center;
  }
}

// Product Image
.item-image {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  
  @media (max-width: 480px) {
    width: 120px;
    height: 120px;
    margin: 0 auto;
    grid-area: image;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
}

// Product Details
.item-details {
  @media (max-width: 768px) {
    grid-area: details;
  }
  
  .product-info {
    .item-name {
      margin: 0 0 8px 0;
      font-weight: 700;
      font-size: 1.1rem;
      line-height: 1.3;
      
      a {
        color: $text-primary;
        text-decoration: none;
        transition: color 0.3s ease;
        
        &:hover {
          color: $primary-color;
        }
      }
    }
    
    .item-meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
      
      .category-info,
      .seller-info {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: $text-secondary;
        
        .meta-icon {
          width: 14px;
          height: 14px;
        }
      }
    }
    
    .item-price-mobile {
      display: none;
      
      @media (max-width: 768px) {
        display: block;
        background: $light-bg;
        padding: 12px;
        border-radius: 8px;
        margin-top: 12px;
      }
      
      .price-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 600;
        
        .unit-price {
          color: $text-secondary;
          font-size: 0.9rem;
        }
        
        .multiply,
        .equals {
          color: $text-secondary;
          font-size: 0.8rem;
        }
        
        .quantity {
          background: $primary-color;
          color: $white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
        }
        
        .total-price {
          color: $primary-color;
          font-size: 1.1rem;
          font-weight: 700;
        }
      }
    }
  }
}

// Quantity Controls
.item-quantity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    grid-area: quantity;
    width: 100%;
  }
  
  .quantity-label {
    font-size: 0.8rem;
    color: $text-secondary;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .quantity-controls {
    display: flex;
    align-items: center;
    background: $light-bg;
    border-radius: 12px;
    padding: 4px;
    border: 1px solid $border-color;
    
    .quantity-btn {
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      
      .btn-icon {
        width: 16px;
        height: 16px;
        color: $text-secondary;
      }
      
      &:hover:not(:disabled) {
        background: $white;
        
        .btn-icon {
          color: $primary-color;
        }
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.decrease:hover:not(:disabled) .btn-icon {
        color: $error-color;
      }
      
      &.increase:hover:not(:disabled) .btn-icon {
        color: $success-color;
      }
    }
    
    .quantity-input-wrapper {
      position: relative;
      
      .quantity-input {
        width: 60px;
        height: 32px;
        text-align: center;
        border: none;
        background: transparent;
        font-weight: 600;
        color: $text-primary;
        
        &:focus {
          outline: none;
        }
        
        &:disabled {
          opacity: 0.7;
        }
        
        // Remove spinner arrows
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        &[type=number] {
          appearance: textfield;
          -moz-appearance: textfield;
        }
      }
      
      .quantity-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        
        .loading-icon {
          width: 16px;
          height: 16px;
          color: $primary-color;
          animation: spin 1s linear infinite;
        }
      }
    }
  }
  
  .stock-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: $text-secondary;
    
    .stock-icon {
      width: 12px;
      height: 12px;
    }
    
    .low-stock {
      color: $warning-color;
      font-weight: 600;
    }
  }
}

// Desktop Price
.item-price {
  text-align: right;
  min-width: 120px;
  
  @media (max-width: 768px) {
    display: none;
  }
  
  .price-breakdown {
    .unit-price,
    .total-price {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-bottom: 8px;
      
      .label {
        font-size: 0.75rem;
        color: $text-secondary;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      
      .value {
        font-weight: 600;
        font-size: 0.95rem;
        color: $text-primary;
      }
    }
    
    .total-price .value {
      color: $primary-color;
      font-size: 1.2rem;
      font-weight: 700;
    }
  }
}

// Actions
.item-actions {
  @media (max-width: 768px) {
    grid-area: actions;
    justify-self: end;
  }
  
  @media (max-width: 480px) {
    grid-area: actions;
    justify-self: center;
  }
  
  .remove-btn {
    background: rgba($error-color, 0.1);
    border: 1px solid rgba($error-color, 0.2);
    color: $error-color;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    
    .action-icon {
      width: 18px;
      height: 18px;
      
      &.loading {
        animation: spin 1s linear infinite;
      }
    }
    
    &:hover:not(:disabled) {
      background: $error-color;
      color: $white;
      transform: scale(1.05);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }
}

// Animations
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// Responsive adjustments
@media (max-width: 480px) {
  .cart-item {
    padding: 16px;
    border-radius: 12px;
  }
  
  .item-content {
    gap: 16px;
  }
  
  .item-details .product-info .item-name {
    font-size: 1rem;
    text-align: center;
  }
  
  .item-details .product-info .item-meta {
    justify-content: center;
    align-items: center;
  }
  
  .item-quantity {
    width: 100%;
    
    .quantity-controls {
      justify-self: center;
    }
  }
}

// Smooth transitions
* {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
}
</style>