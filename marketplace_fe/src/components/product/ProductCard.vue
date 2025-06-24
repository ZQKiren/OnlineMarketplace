<!-- src/components/product/ProductCard.vue - Loại bỏ Loyalty và Wishlist -->
<template>
  <div :class="['product-card', `view-${viewMode}`]">
    <div class="product-image-container">
      <img 
        :src="getImageUrl()" 
        :alt="product.name"
        @error="handleImageError"
        class="product-image"
        loading="lazy"
      >
      
      <!-- Stock Status Badge -->
      <div v-if="product.stock === 0" class="stock-badge out-of-stock">
        <XCircle :size="14" />
        <span>Out of Stock</span>
      </div>
      <div v-else-if="product.stock < 10" class="stock-badge low-stock">
        <AlertTriangle :size="14" />
        <span>{{ product.stock }} left</span>
      </div>
      
      <!-- Quick View Button -->
      <div class="quick-actions">
        <router-link 
          :to="`/products/${product.id}`"
          class="quick-view-btn"
          @click="handleProductClick"
          :title="`View ${product.name} details`"
        >
          <Eye :size="16" />
        </router-link>
      </div>
      
      <!-- Image Overlay for List View -->
      <div v-if="viewMode === 'list'" class="image-overlay">
        <router-link 
          :to="`/products/${product.id}`"
          @click="handleProductClick"
          class="overlay-link"
        >
          <Eye :size="20" />
          <span>View Details</span>
        </router-link>
      </div>
    </div>
    
    <div class="product-content">
      <div class="product-header">
        <!-- Category -->
        <div class="category-tag">
          <Tag :size="12" />
          <span>{{ product.category?.name || 'General' }}</span>
        </div>
        
        <!-- Rating -->
        <div v-if="product.avgRating > 0" class="rating">
          <div class="stars">
            <Star 
              v-for="i in 5" 
              :key="i"
              :size="14"
              :fill="i <= Math.round(product.avgRating) ? '#ffc107' : 'none'"
              :stroke="i <= Math.round(product.avgRating) ? '#ffc107' : '#e0e0e0'"
            />
          </div>
          <span class="rating-text">{{ product.avgRating.toFixed(1) }}</span>
          <span class="review-count">({{ product.reviewCount || 0 }})</span>
        </div>
      </div>
      
      <!-- Product Title -->
      <h3 class="product-title">
        <router-link 
          :to="`/products/${product.id}`"
          @click="handleProductClick"
        >
          {{ product.name }}
        </router-link>
      </h3>
      
      <!-- Description (List view only) -->
      <p v-if="viewMode === 'list'" class="product-description">
        {{ truncateText(product.description, 150) }}
      </p>
      
      <!-- Price Section -->
      <div class="price-section">
        <div class="price-info">
          <span class="current-price">${{ product.price.toFixed(2) }}</span>
          <span v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">
            ${{ product.originalPrice.toFixed(2) }}
          </span>
          <span v-if="product.originalPrice && product.originalPrice > product.price" class="discount-badge">
            {{ Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) }}% OFF
          </span>
        </div>
      </div>
      
      <!-- Stock Info -->
      <div class="stock-info">
        <div class="stock-status" :class="stockStatusClass">
          <component :is="stockIcon" :size="14" />
          <span>{{ stockText }}</span>
        </div>
        
        <!-- Seller Info (List view only) -->
        <div v-if="viewMode === 'list'" class="seller-info">
          <Store :size="12" />
          <span>{{ product.seller?.name || 'Marketplace' }}</span>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="product-actions">
        <button 
          v-if="authStore.isAuthenticated"
          @click="addToCart" 
          :disabled="product.stock === 0 || addingToCart"
          class="btn-add-cart"
          :class="{ loading: addingToCart }"
        >
          <LoaderCircle v-if="addingToCart" :size="16" class="loading-spinner" />
          <ShoppingCart v-else :size="16" />
          <span>{{ addingToCart ? 'Adding...' : 'Add to Cart' }}</span>
        </button>
        
        <router-link 
          v-else
          to="/login"
          class="btn-login"
        >
          <User :size="16" />
          <span>Login to Buy</span>
        </router-link>
        
        <router-link 
          :to="`/products/${product.id}`"
          @click="handleProductClick"
          class="btn-details"
        >
          <ExternalLink :size="16" />
          <span v-if="viewMode === 'list'">View Details</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useRecommendationStore } from '@/stores/recommendation'
import { useToast } from 'vue-toastification'
import { getStaticUrl } from '@/services/api'

// Lucide Icons
import {
  Star,
  XCircle,
  AlertTriangle,
  Eye,
  Tag,
  ShoppingCart,
  LoaderCircle,
  User,
  ExternalLink,
  Store
} from 'lucide-vue-next'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  viewMode: {
    type: String,
    default: 'grid',
    validator: (value) => ['grid', 'list'].includes(value)
  }
})

const emit = defineEmits(['product-click'])

const authStore = useAuthStore()
const cartStore = useCartStore()
const recommendationStore = useRecommendationStore()
const toast = useToast()

// State
const addingToCart = ref(false)

// Computed
const stockStatusClass = computed(() => {
  if (props.product.stock === 0) return 'out-of-stock'
  if (props.product.stock < 10) return 'low-stock'
  return 'in-stock'
})

const stockIcon = computed(() => {
  if (props.product.stock === 0) return XCircle
  if (props.product.stock < 10) return AlertTriangle
  return Store
})

const stockText = computed(() => {
  if (props.product.stock === 0) return 'Out of stock'
  if (props.product.stock < 10) return `${props.product.stock} left`
  return `${props.product.stock} in stock`
})

// Methods
const getImageUrl = () => {
  const firstImage = props.product.images?.[0]
  return getStaticUrl(firstImage) || '/placeholder.jpg'
}

const handleImageError = (event) => {
  event.target.src = '/placeholder.jpg'
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const handleProductClick = async () => {
  // Track view when user clicks to view product details
  if (authStore.isAuthenticated) {
    try {
      await recommendationStore.trackProductView(props.product.id)
    } catch (error) {
      console.error('Error tracking product view:', error)
    }
  }
  
  // Emit to parent component
  emit('product-click', props.product.id)
}

const addToCart = async () => {
  if (!authStore.isAuthenticated) {
    toast.warning('Please login to add items to cart')
    return
  }
  
  if (props.product.stock === 0) {
    toast.error('This product is out of stock')
    return
  }
  
  addingToCart.value = true
  
  try {
    await cartStore.addToCart(props.product.id, 1)
    toast.success(`Added ${props.product.name} to cart!`)
  } catch (error) {
    console.error('Error adding to cart:', error)
    toast.error('Failed to add to cart. Please try again.')
  } finally {
    addingToCart.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    
    .quick-actions {
      opacity: 1;
      transform: translateY(0);
    }
    
    .product-image {
      transform: scale(1.05);
    }
  }
  
  // Grid View (Default)
  &.view-grid {
    .product-image-container {
      height: 200px;
      position: relative;
      overflow: hidden;
      
      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
    }
    
    .product-content {
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }
  
  // List View
  &.view-list {
    flex-direction: row;
    height: auto;
    
    .product-image-container {
      width: 200px;
      height: 150px;
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
      
      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }
      
      .image-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        
        .overlay-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          font-weight: 500;
        }
      }
      
      &:hover .image-overlay {
        opacity: 1;
      }
    }
    
    .product-content {
      padding: 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .product-actions {
      flex-direction: row;
      gap: 12px;
      
      .btn-add-cart, .btn-login {
        flex: 1;
      }
    }
  }
}

.product-image-container {
  .stock-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 2;
    
    &.out-of-stock {
      background: rgba(244, 67, 54, 0.9);
      color: white;
    }
    
    &.low-stock {
      background: rgba(255, 152, 0, 0.9);
      color: white;
    }
  }
  
  .quick-actions {
    position: absolute;
    bottom: 8px;
    right: 8px;
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.3s ease;
    
    .quick-view-btn {
      background: $primary-color;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
      transition: all 0.3s ease;
      
      &:hover {
        background: darken($primary-color, 10%);
        transform: scale(1.1);
      }
    }
  }
}

.product-content {
  .product-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
    
    .category-tag {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f5f5f5;
      color: #666;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .rating {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .stars {
        display: flex;
        gap: 1px;
      }
      
      .rating-text {
        font-size: 0.8rem;
        font-weight: 600;
        color: #333;
      }
      
      .review-count {
        font-size: 0.75rem;
        color: #666;
      }
    }
  }
  
  .product-title {
    margin: 0 0 8px 0;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.3;
    
    a {
      color: #333;
      text-decoration: none;
      transition: color 0.3s ease;
      display: block;
      
      &:hover {
        color: $primary-color;
      }
    }
  }
  
  .product-description {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0 0 12px 0;
  }
  
  .price-section {
    margin-bottom: 12px;
    
    .price-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      
      .current-price {
        font-size: 1.3rem;
        font-weight: 700;
        color: $primary-color;
      }
      
      .original-price {
        font-size: 0.9rem;
        color: #999;
        text-decoration: line-through;
      }
      
      .discount-badge {
        background: linear-gradient(135deg, #ff4444, #cc0000);
        color: white;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 4px rgba(255, 68, 68, 0.3);
      }
    }
  }
  
  .stock-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .stock-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 500;
      
      &.in-stock {
        color: #4caf50;
      }
      
      &.low-stock {
        color: #ff9800;
      }
      
      &.out-of-stock {
        color: #f44336;
      }
    }
    
    .seller-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #666;
    }
  }
  
  .product-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
    
    .btn-add-cart, .btn-login {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      &:active {
        transform: translateY(0);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        
        &:hover {
          transform: none;
          box-shadow: none;
        }
      }
      
      &.loading {
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
      }
    }
    
    .btn-add-cart {
      background: linear-gradient(135deg, $primary-color, darken($primary-color, 10%));
      color: white;
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, darken($primary-color, 5%), darken($primary-color, 15%));
      }
    }
    
    .btn-login {
      background: linear-gradient(135deg, #ff9800, #f57c00);
      color: white;
      
      &:hover {
        background: linear-gradient(135deg, #f57c00, #ef6c00);
      }
    }
    
    .btn-details {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      background: #f8f9fa;
      color: #666;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      border: 1px solid #e9ecef;
      
      &:hover {
        background: #e9ecef;
        color: #495057;
        border-color: #dee2e6;
        transform: translateY(-1px);
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Responsive Design
@media (max-width: 768px) {
  .product-card.view-list {
    flex-direction: column;
    
    .product-image-container {
      width: 100%;
      height: 200px;
    }
    
    .product-actions {
      flex-direction: column;
    }
  }
}

@media (max-width: 480px) {
  .product-card.view-grid {
    .product-image-container {
      height: 150px;
    }
    
    .product-content {
      padding: 12px;
    }
    
    .product-title {
      font-size: 1rem;
    }
    
    .price-section .price-info .current-price {
      font-size: 1.1rem;
    }
    
    .product-actions {
      .btn-add-cart, .btn-login, .btn-details {
        padding: 10px 12px;
        font-size: 0.85rem;
      }
    }
  }
}

// Enhanced animations
.product-card {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Focus states for accessibility
.btn-add-cart:focus,
.btn-login:focus,
.btn-details:focus,
.quick-view-btn:focus {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
}

// Better visual hierarchy
.product-content {
  .product-header {
    border-bottom: 1px solid #f8f9fa;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
}

// Improved loading state
.btn-add-cart.loading {
  background: #ccc !important;
  
  .loading-spinner {
    filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
  }
}

// Print styles
@media print {
  .product-card {
    box-shadow: none;
    border: 1px solid #ddd;
    
    .quick-actions,
    .product-actions {
      display: none;
    }
  }
}
</style>