<!-- src/views/products/ProductDetail.vue -->
<template>
  <div class="product-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-wrapper">
      <div class="preloader-wrapper active">
        <div class="spinner-layer spinner-blue-only">
          <div class="circle-clipper left">
            <div class="circle"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-wrapper container">
      <div class="card-panel text-center">
        <i class="material-icons large red-text">error_outline</i>
        <h5>Product Not Found</h5>
        <p>{{ error }}</p>
        <button @click="fetchProduct" class="btn waves-effect waves-light">
          <i class="material-icons left">refresh</i>
          Try Again
        </button>
      </div>
    </div>

    <!-- Product Content -->
    <div v-else-if="product" class="container product-detail">
      <div class="row">
        <!-- Product Images -->
        <div class="col s12 m6">
          <div class="product-images">
            <div class="main-image">
              <img 
                :src="getImageUrl(selectedImage)" 
                :alt="product.name"
                @error="handleImageError"
                class="responsive-img"
              >
            </div>
            
            <!-- Thumbnails -->
            <div class="thumbnails" v-if="product.images && product.images.length > 1">
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
          <div class="product-info">
            <div class="chip">{{ product.category.name }}</div>
            <h4>{{ product.name }}</h4>
            
            <!-- Rating -->
            <div class="rating-section">
              <div class="stars">
                <i class="material-icons" v-for="i in 5" :key="i">
                  {{ i <= Math.round(product.avgRating || 0) ? 'star' : 'star_border' }}
                </i>
              </div>
              <span>{{ (product.avgRating || 0).toFixed(1) }} ({{ product.reviewCount || 0 }} reviews)</span>
            </div>
            
            <!-- Price -->
            <div class="price-section">
              <h3 class="price">${{ product.price.toFixed(2) }}</h3>
              <div class="stock" :class="stockClass">
                <i class="material-icons tiny">{{ stockIcon }}</i>
                {{ stockText }}
              </div>
            </div>
            
            <!-- Purchase Actions -->
            <div class="purchase-actions" v-if="authStore.isAuthenticated">
              <!-- Add to Cart -->
              <div class="purchase-section" v-if="product.stock > 0">
                <div class="quantity-section">
                  <label>Quantity:</label>
                  <div class="quantity-controls">
                    <button class="btn-flat" @click="quantity > 1 && quantity--">
                      <i class="material-icons">remove</i>
                    </button>
                    <input type="number" v-model.number="quantity" min="1" :max="product.stock">
                    <button class="btn-flat" @click="quantity < product.stock && quantity++">
                      <i class="material-icons">add</i>
                    </button>
                  </div>
                </div>
                
                <div class="action-buttons">
                  <button 
                    class="btn waves-effect waves-light btn-large add-to-cart-btn"
                    @click="addToCart"
                    :disabled="product.stock === 0 || addingToCart"
                  >
                    <i class="material-icons left">{{ addingToCart ? 'hourglass_empty' : 'add_shopping_cart' }}</i>
                    {{ addingToCart ? 'Adding...' : (product.stock === 0 ? 'Out of Stock' : 'Add to Cart') }}
                  </button>
                </div>
              </div>
              
              <!-- Out of Stock -->
              <div v-else class="out-of-stock-section">
                <button class="btn btn-large disabled" disabled>
                  <i class="material-icons left">remove_circle</i>
                  Out of Stock
                </button>
              </div>
            </div>
            
            <!-- Login Prompt -->
            <div v-else class="login-prompt">
              <div class="card-panel amber lighten-4">
                <p>Please <router-link to="/login">login</router-link> to purchase this item</p>
              </div>
            </div>

            <!-- ✨ NEW: Chat Widget Integration -->
            <div class="chat-section">
              <ChatWidget :product="product" />
            </div>

            <!-- Description -->
            <div class="description">
              <h6>Description</h6>
              <p>{{ product.description }}</p>
            </div>
            
            <!-- Enhanced Seller Info -->
            <div class="seller-info">
              <div class="card-panel green lighten-5">
                <div class="seller-header">
                  <i class="material-icons left">store</i>
                  <div class="seller-content">
                    <div class="seller-main">
                      <span class="seller-label">Sold by:</span>
                      <strong class="seller-name">{{ product.seller.name }}</strong>
                    </div>
                    
                    <!-- ✨ NEW: Seller Stats & Online Status -->
                    <div class="seller-stats">
                      <div class="stat-item">
                        <i class="material-icons tiny">inventory</i>
                        <span>{{ getSellerProductCount() }} products</span>
                      </div>
                      <div class="stat-item">
                        <i class="material-icons tiny">star</i>
                        <span>{{ getSellerRating() }} rating</span>
                      </div>
                      <div class="stat-item" v-if="isUserOnline(product.seller.id)">
                        <i class="material-icons tiny green-text">circle</i>
                        <span class="green-text">Online now</span>
                      </div>
                      <div class="stat-item" v-else-if="product.seller.lastSeen">
                        <i class="material-icons tiny grey-text">circle</i>
                        <span class="grey-text">{{ getLastSeenText(product.seller.lastSeen) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Reviews Section -->
      <div class="row">
        <div class="col s12">
          <ProductReviews 
            :product-id="productId" 
            :can-review="canReview"
            @review-added="handleReviewAdded"
            @review-updated="handleReviewUpdated"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useChatStore } from '@/stores/chat' // ✨ NEW
import { useToast } from 'vue-toastification'
import productService from '@/services/product.service'
import orderService from '@/services/order.service'
import ProductReviews from '@/components/product/ProductReviews.vue'
import ChatWidget from '@/components/chat/ChatWidget.vue' // ✨ NEW
import { getStaticUrl } from '@/services/api'

export default {
  name: 'ProductDetail',
  components: {
    ProductReviews,
    ChatWidget // ✨ NEW
  },
  
  setup() {
    const route = useRoute()
    const authStore = useAuthStore()
    const cartStore = useCartStore()
    const chatStore = useChatStore() // ✨ NEW
    const toast = useToast()
    
    return {
      route,
      authStore,
      cartStore,
      chatStore, // ✨ NEW
      toast
    }
  },
  
  data() {
    return {
      product: null,
      loading: true,
      error: null,
      selectedImage: '',
      quantity: 1,
      canReview: false,
      addingToCart: false
    }
  },
  
  computed: {
    productId() {
      return this.route.params.id
    },
    
    stockClass() {
      if (this.product?.stock === 0) return 'red-text'
      if (this.product?.stock < 10) return 'orange-text'
      return 'green-text'
    },
    
    stockIcon() {
      if (this.product?.stock === 0) return 'remove_circle'
      if (this.product?.stock < 10) return 'warning'
      return 'check_circle'
    },
    
    stockText() {
      if (this.product?.stock === 0) return 'Out of stock'
      if (this.product?.stock < 10) return `Only ${this.product.stock} left`
      return `${this.product.stock} in stock`
    }
  },
  
  async mounted() {
    await this.fetchProduct()
  },
  
  methods: {
    async fetchProduct() {
      this.loading = true
      this.error = null
      
      try {
        const response = await productService.getProductById(this.productId)
        this.product = response.data
        
        if (this.product.images && this.product.images.length > 0) {
          this.selectedImage = this.product.images[0]
        }
        
        if (this.authStore.isAuthenticated) {
          await this.checkCanReview()
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        this.error = error.response?.data?.message || 'Product not found'
      } finally {
        this.loading = false
      }
    },
    
    async checkCanReview() {
      try {
        const response = await orderService.getUserOrders()
        const hasOrderedAndDelivered = response.data.some(order => 
          order.status === 'DELIVERED' &&
          order.items.some(item => item.productId === this.productId)
        )
        this.canReview = hasOrderedAndDelivered
      } catch (error) {
        console.error('Error checking review eligibility:', error)
      }
    },
    
    getImageUrl(imagePath) {
      return getStaticUrl(imagePath) || '/placeholder.jpg'
    },
    
    handleImageError(event) {
      event.target.src = '/placeholder.jpg'
    },
    
    async addToCart() {
      this.addingToCart = true
      
      try {
        await this.cartStore.addToCart(this.productId, this.quantity)
        this.toast.success(`Added ${this.quantity} item(s) to cart!`)
        this.quantity = 1
      } catch (error) {
        console.error('Error adding to cart:', error)
        this.toast.error(error.response?.data?.message || 'Failed to add to cart')
      } finally {
        this.addingToCart = false
      }
    },
    
    // ✨ NEW: Chat-related methods
    isUserOnline(userId) {
      return this.chatStore.isUserOnline(userId)
    },
    
    getSellerProductCount() {
      // This would ideally come from the API response
      return this.product?.seller?.productCount || 'Multiple'
    },
    
    getSellerRating() {
      // This would ideally come from the API response
      const rating = this.product?.seller?.avgRating || 0
      return rating > 0 ? rating.toFixed(1) : 'New seller'
    },
    
    getLastSeenText(lastSeenDate) {
      if (!lastSeenDate) return 'Offline'
      
      const lastSeen = new Date(lastSeenDate)
      const now = new Date()
      const diffInMinutes = (now - lastSeen) / (1000 * 60)
      
      if (diffInMinutes < 5) {
        return 'Just now'
      } else if (diffInMinutes < 60) {
        return `${Math.floor(diffInMinutes)}m ago`
      } else if (diffInMinutes < 24 * 60) {
        return `${Math.floor(diffInMinutes / 60)}h ago`
      } else {
        return `${Math.floor(diffInMinutes / (24 * 60))}d ago`
      }
    },
    
    handleReviewAdded() {
      this.fetchProduct()
    },
    
    handleReviewUpdated() {
      this.fetchProduct()
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.product-detail-container {
  min-height: 100vh;
}

.loading-wrapper, .error-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.product-detail {
  padding: 20px 0;
}

.product-images {
  .main-image {
    margin-bottom: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 400px;
      object-fit: contain;
    }
  }
  
  .thumbnails {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    
    img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border: 2px solid transparent;
      border-radius: 4px;
      cursor: pointer;
      transition: border-color 0.3s;
      
      &:hover,
      &.active {
        border-color: $primary-color;
      }
    }
  }
}

.product-info {
  .chip {
    margin-bottom: 15px;
  }
  
  h4 {
    margin-bottom: 20px;
    font-weight: 600;
  }
  
  .rating-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    
    .stars i {
      color: #ffc107;
      font-size: 20px;
    }
    
    span {
      color: #666;
    }
  }
  
  .price-section {
    margin-bottom: 30px;
    padding: 20px 0;
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    
    .price {
      color: $primary-color;
      font-weight: 700;
      margin: 0 0 10px 0;
    }
    
    .stock {
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 500;
    }
  }
  
  .purchase-actions {
    margin-bottom: 30px;
  }
  
  .purchase-section {
    .quantity-section {
      margin-bottom: 20px;
      
      label {
        display: block;
        margin-bottom: 10px;
        font-weight: 500;
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        
        input {
          width: 70px;
          text-align: center;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 5px;
        }
        
        button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
    
    .action-buttons {
      display: flex;
      gap: 10px;
      
      .add-to-cart-btn {
        flex: 1;
        background: linear-gradient(135deg, #1976d2, #1565c0) !important;
        
        &:hover {
          background: linear-gradient(135deg, #1565c0, #0d47a1) !important;
          box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
        }
      }
    }
  }
  
  .out-of-stock-section {
    .btn.disabled {
      background-color: #e0e0e0 !important;
      color: #9e9e9e !important;
    }
  }
  
  .login-prompt {
    margin-bottom: 30px;
    
    p {
      margin: 0;
      text-align: center;
    }
  }
  
  // ✨ NEW: Chat section styling
  .chat-section {
    margin-bottom: 30px;
    padding: 20px 0;
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .description {
    margin-bottom: 20px;
    
    h6 {
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    p {
      line-height: 1.6;
      color: #666;
    }
  }
  
  // ✨ NEW: Enhanced seller info styling
  .seller-info {
    margin-bottom: 20px;
    
    .card-panel {
      margin: 0;
      padding: 20px;
      
      .seller-header {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        
        i {
          margin-top: 2px;
          color: #4caf50;
        }
        
        .seller-content {
          flex: 1;
          
          .seller-main {
            margin-bottom: 12px;
            
            .seller-label {
              margin-right: 5px;
              color: #666;
            }
            
            .seller-name {
              color: #1976d2;
              font-size: 1.1rem;
            }
          }
          
          .seller-stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            
            .stat-item {
              display: flex;
              align-items: center;
              gap: 5px;
              font-size: 0.875rem;
              color: #666;
              
              i {
                font-size: 1rem;
                margin: 0;
                
                &.green-text {
                  color: #4caf50 !important;
                }
                
                &.grey-text {
                  color: #999 !important;
                }
              }
              
              span {
                &.green-text {
                  color: #4caf50;
                  font-weight: 500;
                }
                
                &.grey-text {
                  color: #999;
                }
              }
            }
          }
        }
      }
    }
  }
}

// Mobile responsive
@media (max-width: 600px) {
  .product-images {
    margin-bottom: 30px;
    
    .main-image img {
      height: 300px;
    }
    
    .thumbnails {
      justify-content: center;
      
      img {
        width: 50px;
        height: 50px;
      }
    }
  }
  
  .product-info {
    h4 {
      font-size: 1.5rem;
    }
    
    .price-section .price {
      font-size: 2rem;
    }
    
    .purchase-section {
      .quantity-controls {
        justify-content: center;
      }
      
      .action-buttons {
        flex-direction: column;
      }
    }
    
    .seller-info {
      .seller-stats {
        justify-content: center;
        gap: 15px;
        
        .stat-item {
          font-size: 0.8rem;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .seller-info .seller-stats {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>