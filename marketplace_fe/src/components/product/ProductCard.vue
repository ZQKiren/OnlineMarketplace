<!-- src/components/product/ProductCard.vue -->
<template>
  <div class="card product-card">
    <div class="card-image">
      <img 
        :src="getImageUrl()" 
        :alt="product.name"
        @error="handleImageError"
      >
      <router-link 
        :to="`/products/${product.id}`"
        class="btn-floating halfway-fab waves-effect waves-light blue"
      >
        <i class="material-icons">visibility</i>
      </router-link>
    </div>
    
    <div class="card-content">
      <span class="card-title">{{ product.name }}</span>
      
      <div class="product-meta">
        <p class="category">
          <i class="material-icons tiny">folder</i>
          {{ product.category?.name }}
        </p>
        
        <div class="rating" v-if="product.avgRating > 0">
          <i class="material-icons tiny">star</i>
          <span>{{ product.avgRating.toFixed(1) }}</span>
          <span class="review-count">({{ product.reviewCount }})</span>
        </div>
      </div>
      
      <p class="description">{{ truncateText(product.description, 100) }}</p>
      
      <div class="price-section">
        <span class="price">${{ product.price.toFixed(2) }}</span>
        <span class="stock" :class="{ 'out-of-stock': product.stock === 0 }">
          {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' }}
        </span>
      </div>
    </div>
    
    <div class="card-action">
      <button 
        @click="addToCart" 
        class="btn btn-small waves-effect waves-light"
        :disabled="product.stock === 0 || !authStore.isAuthenticated"
      >
        <i class="material-icons left">add_shopping_cart</i>
        Add to Cart
      </button>
      
      <router-link 
        :to="`/products/${product.id}`"
        class="btn btn-small btn-flat waves-effect"
      >
        View Details
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useToast } from 'vue-toastification'
import { getStaticUrl } from '@/services/api'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const authStore = useAuthStore()
const cartStore = useCartStore()
const toast = useToast()

const getImageUrl = () => {
  const firstImage = props.product.images?.[0]
  return getStaticUrl(firstImage) || '/placeholder.jpg'
}

const handleImageError = (event) => {
  // Fallback to placeholder on error
  event.target.src = '/placeholder.jpg'
}

const truncateText = (text, length) => {
  return text.length > length ? text.substring(0, length) + '...' : text
}

const addToCart = async () => {
  if (!authStore.isAuthenticated) {
    toast.warning('Please login to add items to cart')
    return
  }
  
  try {
    await cartStore.addToCart(props.product.id, 1)
    toast.success('Added to cart!')
  } catch (error) {
    console.error('Error adding to cart:', error)
  }
}
</script>

<style scoped lang="scss">
.product-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
  
  .card-image {
    img {
      height: 200px;
      width: 100%;
      object-fit: cover;
    }
  }
  
  .card-content {
    flex: 1;
    
    .card-title {
      font-size: 1.2rem;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .product-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .category {
        display: flex;
        align-items: center;
        margin: 0;
        color: #666;
        font-size: 0.9rem;
        
        i {
          margin-right: 4px;
        }
      }
      
      .rating {
        display: flex;
        align-items: center;
        
        i {
          color: #ffc107;
          margin-right: 4px;
        }
        
        .review-count {
          margin-left: 4px;
          color: #666;
          font-size: 0.9rem;
        }
      }
    }
    
    .description {
      color: #666;
      font-size: 0.95rem;
      margin-bottom: 16px;
    }
    
    .price-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .price {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1976d2;
      }
      
      .stock {
        font-size: 0.9rem;
        color: #4caf50;
        
        &.out-of-stock {
          color: #f44336;
        }
      }
    }
  }
  
  .card-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
  }
}
</style>