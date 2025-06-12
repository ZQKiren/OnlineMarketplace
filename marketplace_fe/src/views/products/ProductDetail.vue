<!-- src/views/products/ProductDetail.vue -->
<template>
  <div class="container product-detail" v-if="product">
    <div class="row">
      <!-- Product Images -->
      <div class="col s12 m6">
        <div class="product-images">
          <div class="main-image">
            <img 
              :src="getImageUrl(selectedImage)" 
              :alt="product.name"
              @error="handleImageError"
            >
          </div>
          <div class="image-thumbnails" v-if="product.images.length > 1">
            <img 
              v-for="(image, index) in product.images" 
              :key="index"
              :src="getImageUrl(image)"
              :class="{ active: selectedImage === image }"
              @click="selectedImage = image"
              @error="handleImageError"
            >
          </div>
        </div>
      </div>
      
      <!-- Product Info -->
      <div class="col s12 m6">
        <h4>{{ product.name }}</h4>
        
        <div class="product-meta">
          <div class="rating">
            <i class="material-icons" v-for="i in 5" :key="i">
              {{ i <= Math.round(product.avgRating) ? 'star' : 'star_border' }}
            </i>
            <span>{{ product.avgRating.toFixed(1) }} ({{ product.reviewCount }} reviews)</span>
          </div>
          
          <p class="category">
            <i class="material-icons tiny">folder</i>
            {{ product.category.name }}
          </p>
        </div>
        
        <div class="price-section">
          <h5 class="price">${{ product.price.toFixed(2) }}</h5>
          <p class="stock" :class="{ 'out-of-stock': product.stock === 0 }">
            {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' }}
          </p>
        </div>
        
        <div class="description">
          <p>{{ product.description }}</p>
        </div>
        
        <div class="seller-info">
          <p>
            <i class="material-icons tiny">store</i>
            Sold by: <strong>{{ product.seller.name }}</strong>
          </p>
        </div>
        
        <!-- Add to Cart -->
        <div class="add-to-cart-section" v-if="authStore.isAuthenticated">
          <div class="quantity-selector">
            <label>Quantity:</label>
            <button 
              class="btn-flat" 
              @click="quantity > 1 && quantity--"
              :disabled="quantity <= 1"
            >
              <i class="material-icons">remove</i>
            </button>
            <input 
              type="number" 
              v-model.number="quantity" 
              min="1" 
              :max="product.stock"
            >
            <button 
              class="btn-flat" 
              @click="quantity < product.stock && quantity++"
              :disabled="quantity >= product.stock"
            >
              <i class="material-icons">add</i>
            </button>
          </div>
          
          <button 
            class="btn waves-effect waves-light"
            @click="addToCart"
            :disabled="product.stock === 0"
          >
            <i class="material-icons left">add_shopping_cart</i>
            Add to Cart
          </button>
        </div>
        
        <div v-else class="login-prompt">
          <p>Please <router-link to="/login">login</router-link> to purchase this item</p>
        </div>
      </div>
    </div>
    
    <!-- Reviews Section -->
    <div class="row">
      <div class="col s12">
        <ProductReviews :product-id="productId" :can-review="canReview" />
      </div>
    </div>
  </div>
  
  <div v-else class="container">
    <div class="loading-spinner">
      <div class="preloader-wrapper active">
        <div class="spinner-layer spinner-blue-only">
          <div class="circle-clipper left">
            <div class="circle"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useToast } from 'vue-toastification'
import productService from '@/services/product.service'
import orderService from '@/services/order.service'
import ProductReviews from '@/components/product/ProductReviews.vue'
import { getStaticUrl } from '@/services/api'

const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()
const toast = useToast()

const productId = computed(() => route.params.id)
const product = ref(null)
const selectedImage = ref('')
const quantity = ref(1)
const canReview = ref(false)

const getImageUrl = (imagePath) => {
  return getStaticUrl(imagePath) || '/placeholder.jpg'
}

const handleImageError = (event) => {
  event.target.src = '/placeholder.jpg'
}

const fetchProduct = async () => {
  try {
    const response = await productService.getProductById(productId.value)
    product.value = response.data
    
    // Set selected image 
    selectedImage.value = product.value.images?.[0] || ''
    
    // Check if user can review
    if (authStore.isAuthenticated) {
      checkCanReview()
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    toast.error('Product not found')
  }
}

const checkCanReview = async () => {
  try {
    const orders = await orderService.getUserOrders()
    const hasOrdered = orders.data.some(order => 
      order.status === 'DELIVERED' &&
      order.items.some(item => item.productId === productId.value)
    )
    canReview.value = hasOrdered
  } catch (error) {
    console.error('Error checking review eligibility:', error)
  }
}

const addToCart = async () => {
  try {
    await cartStore.addToCart(productId.value, quantity.value)
    toast.success('Added to cart!')
    quantity.value = 1
  } catch (error) {
    console.error('Error adding to cart:', error)
  }
}

onMounted(() => {
  fetchProduct()
})
</script>

<style scoped lang="scss">
.product-detail {
  margin-top: 20px;
  
  .product-images {
    .main-image {
      margin-bottom: 20px;
      
      img {
        width: 100%;
        max-height: 500px;
        object-fit: contain;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }
    }
    
    .image-thumbnails {
      display: flex;
      gap: 10px;
      
      img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border: 2px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 0.3s;
        
        &:hover,
        &.active {
          border-color: #1976d2;
        }
      }
    }
  }
  
  .product-meta {
    margin: 20px 0;
    
    .rating {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      
      i {
        color: #ffc107;
        font-size: 20px;
      }
      
      span {
        margin-left: 10px;
        color: #666;
      }
    }
    
    .category {
      display: flex;
      align-items: center;
      color: #666;
      
      i {
        margin-right: 5px;
      }
    }
  }
  
  .price-section {
    margin: 20px 0;
    padding: 20px 0;
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    
    .price {
      color: #1976d2;
      font-weight: 600;
      margin: 0;
    }
    
    .stock {
      margin: 10px 0;
      
      &.out-of-stock {
        color: #f44336;
      }
    }
  }
  
  .add-to-cart-section {
    margin: 30px 0;
    
    .quantity-selector {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      
      label {
        margin-right: 20px;
        font-weight: 500;
      }
      
      input {
        width: 60px;
        text-align: center;
        margin: 0 10px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 5px;
      }
      
      button {
        padding: 0;
        width: 36px;
        height: 36px;
      }
    }
  }
  
  .login-prompt {
    margin: 30px 0;
    padding: 20px;
    background-color: #f5f5f5;
    border-radius: 4px;
    text-align: center;
  }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>