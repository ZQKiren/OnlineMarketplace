<!-- src/views/products/ProductDetail.vue -->
<template>
  <div class="product-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-wrapper">
      <LoadingSpinner text="Loading product details..." />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-wrapper">
      <div class="error-content">
        <div class="error-icon">
          <i class="material-icons">error_outline</i>
        </div>
        <h4>Product Not Found</h4>
        <p>{{ error }}</p>
        <div class="error-actions">
          <button @click="fetchProduct" class="btn-retry">
            <i class="material-icons left">refresh</i>
            Try Again
          </button>
          <router-link to="/products" class="btn-secondary">
            <i class="material-icons left">arrow_back</i>
            Back to Products
          </router-link>
        </div>
      </div>
    </div>

    <!-- Product Content -->
    <div v-else-if="product" class="product-detail">
      <div class="container">
        <div class="product-main">
          <!-- Product Images Section -->
          <div class="product-images-section">
            <div class="image-gallery">
              <!-- Main Image -->
              <div class="main-image-container">
                <div class="main-image">
                  <img 
                    :src="getImageUrl(selectedImage)" 
                    :alt="product.name"
                    @error="handleImageError"
                    class="product-image"
                  >
                  <!-- Image Overlay Actions -->
                  <div class="image-overlay">
                    <button class="zoom-btn" @click="openImageModal">
                      <i class="material-icons">zoom_in</i>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Thumbnails -->
              <div class="thumbnails-container" v-if="product.images && product.images.length > 1">
                <div class="thumbnails-scroll">
                  <div 
                    v-for="(image, index) in product.images" 
                    :key="index"
                    class="thumbnail"
                    :class="{ active: selectedImage === image }"
                    @click="selectedImage = image"
                  >
                    <img 
                      :src="getImageUrl(image)"
                      :alt="`${product.name} ${index + 1}`"
                      @error="handleImageError"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Product Info Section -->
          <div class="product-info-section">
            <div class="product-header">
              <!-- Category Badge -->
              <div class="category-badge">
                <i class="material-icons">restaurant</i>
                <span>{{ product.category.name }}</span>
              </div>

              <!-- Product Title -->
              <h1 class="product-title">{{ product.name }}</h1>
              
              <!-- Rating Section -->
              <div class="rating-section">
                <div class="stars">
                  <i 
                    v-for="i in 5" 
                    :key="i"
                    class="material-icons star"
                    :class="{ filled: i <= Math.round(product.avgRating || 0) }"
                  >
                    {{ i <= Math.round(product.avgRating || 0) ? 'star' : 'star_border' }}
                  </i>
                </div>
                <span class="rating-text">
                  {{ (product.avgRating || 0).toFixed(1) }} 
                  ({{ product.reviewCount || 0 }} {{ product.reviewCount === 1 ? 'review' : 'reviews' }})
                </span>
              </div>
            </div>
            
            <!-- Price Section -->
            <div class="price-section">
              <div class="price-main">
                <span class="currency">$</span>
                <span class="amount">{{ Math.floor(product.price) }}</span>
                <span class="decimal">.{{ (product.price % 1).toFixed(2).slice(2) }}</span>
              </div>
              
              <!-- Stock Status -->
              <div class="stock-status" :class="stockClass">
                <i class="material-icons">{{ stockIcon }}</i>
                <span>{{ stockText }}</span>
              </div>
            </div>
            
            <!-- Purchase Actions -->
            <div class="purchase-section" v-if="authStore.isAuthenticated">
              <div v-if="product.stock > 0" class="purchase-form">
                <!-- Quantity Selector -->
                <div class="quantity-wrapper">
                  <label class="quantity-label">Quantity:</label>
                  <div class="quantity-selector">
                    <button 
                      class="quantity-btn decrease" 
                      @click="decreaseQuantity"
                      :disabled="quantity <= 1"
                    >
                      <i class="material-icons">remove</i>
                    </button>
                    <input 
                      type="number" 
                      v-model.number="quantity" 
                      min="1" 
                      :max="product.stock"
                      class="quantity-input"
                    >
                    <button 
                      class="quantity-btn increase" 
                      @click="increaseQuantity"
                      :disabled="quantity >= product.stock"
                    >
                      <i class="material-icons">add</i>
                    </button>
                  </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="action-buttons">
                  <button 
                    class="btn-add-cart"
                    @click="addToCart"
                    :disabled="addingToCart"
                  >
                    <span v-if="addingToCart" class="loading-spinner"></span>
                    <i v-else class="material-icons">add_shopping_cart</i>
                    <span>{{ addingToCart ? 'Adding...' : 'Add to Cart' }}</span>
                  </button>
                  
                  <button class="btn-buy-now" @click="buyNow">
                    <i class="material-icons">flash_on</i>
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
              
              <!-- Out of Stock -->
              <div v-else class="out-of-stock">
                <button class="btn-disabled" disabled>
                  <i class="material-icons">remove_circle</i>
                  <span>Out of Stock</span>
                </button>
                <p>This item is currently unavailable</p>
              </div>
            </div>
            
            <!-- Login Prompt -->
            <div v-else class="login-prompt">
              <div class="login-card">
                <i class="material-icons">account_circle</i>
                <h6>Sign in to purchase</h6>
                <p>Create an account or sign in to add items to your cart</p>
                <div class="login-actions">
                  <router-link to="/login" class="btn-login">Sign In</router-link>
                  <router-link to="/register" class="btn-register">Create Account</router-link>
                </div>
              </div>
            </div>

            <!-- Enhanced Features -->
            <div class="product-features">
              <div class="feature-item">
                <i class="material-icons">local_shipping</i>
                <div class="feature-text">
                  <strong>Free Shipping</strong>
                  <span>On orders over $50</span>
                </div>
              </div>
              <div class="feature-item">
                <i class="material-icons">cached</i>
                <div class="feature-text">
                  <strong>Easy Returns</strong>
                  <span>30-day return policy</span>
                </div>
              </div>
              <div class="feature-item">
                <i class="material-icons">security</i>
                <div class="feature-text">
                  <strong>Secure Payment</strong>
                  <span>Your data is protected</span>
                </div>
              </div>
            </div>

            <!-- Chat Widget -->
            <div class="chat-section" v-if="authStore.isAuthenticated">
              <ChatWidget :product="product" />
            </div>
          </div>
        </div>

        <!-- Product Details Tabs -->
        <div class="product-details-section">
          <div class="details-tabs">
            <button 
              class="tab-button"
              :class="{ active: activeTab === 'description' }"
              @click="activeTab = 'description'"
            >
              Description
            </button>
            <button 
              class="tab-button"
              :class="{ active: activeTab === 'seller' }"
              @click="activeTab = 'seller'"
            >
              Seller Info
            </button>
            <button 
              class="tab-button"
              :class="{ active: activeTab === 'shipping' }"
              @click="activeTab = 'shipping'"
            >
              Shipping & Returns
            </button>
          </div>

          <div class="tab-content">
            <!-- Description Tab -->
            <div v-if="activeTab === 'description'" class="tab-panel">
              <div class="description-content">
                <h5>Product Description</h5>
                <p>{{ product.description }}</p>
              </div>
            </div>

            <!-- Seller Tab -->
            <div v-if="activeTab === 'seller'" class="tab-panel">
              <div class="seller-card">
                <div class="seller-header">
                  <div class="seller-avatar">
                    <i class="material-icons">store</i>
                  </div>
                  <div class="seller-info">
                    <h6>{{ product.seller.name }}</h6>
                    <div class="seller-stats">
                      <div class="stat">
                        <i class="material-icons">inventory</i>
                        <span>{{ getSellerProductCount() }} products</span>
                      </div>
                      <div class="stat">
                        <i class="material-icons">star</i>
                        <span>{{ getSellerRating() }} rating</span>
                      </div>
                      <div class="stat" v-if="isUserOnline(product.seller.id)">
                        <i class="material-icons online">circle</i>
                        <span class="online-text">Online now</span>
                      </div>
                      <div class="stat" v-else-if="product.seller.lastSeen">
                        <i class="material-icons offline">circle</i>
                        <span class="offline-text">{{ getLastSeenText(product.seller.lastSeen) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shipping Tab -->
            <div v-if="activeTab === 'shipping'" class="tab-panel">
              <div class="shipping-info">
                <div class="shipping-option">
                  <h6>Standard Shipping</h6>
                  <p>5-7 business days • Free on orders over $50</p>
                </div>
                <div class="shipping-option">
                  <h6>Express Shipping</h6>
                  <p>2-3 business days • $9.99</p>
                </div>
                <div class="shipping-option">
                  <h6>Returns</h6>
                  <p>30-day return policy • Return shipping fees may apply</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Reviews Section -->
        <div class="reviews-section">
          <ProductReviews 
            :product-id="productId" 
            :can-review="canReview"
            @review-added="handleReviewAdded"
            @review-updated="handleReviewUpdated"
          />
        </div>
        <!-- Similar Products Section -->
        <div class="similar-products-section">
          <SimilarProducts 
            v-if="product" 
            :product-id="product.id" 
            :limit="6" 
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
import { useChatStore } from '@/stores/chat'
import { useToast } from 'vue-toastification'
import productService from '@/services/product.service'
import orderService from '@/services/order.service'
import ProductReviews from '@/components/product/ProductReviews.vue'
import ChatWidget from '@/components/chat/ChatWidget.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { getStaticUrl } from '@/services/api'
import { useRecommendationStore } from '@/stores/recommendation'
import SimilarProducts from '@/components/recommendation/SimilarProducts.vue'

export default {
  name: 'ProductDetail',
  components: {
    ProductReviews,
    ChatWidget,
    LoadingSpinner
  },
  
  setup() {
    const route = useRoute()
    const authStore = useAuthStore()
    const cartStore = useCartStore()
    const chatStore = useChatStore()
    const toast = useToast()
    const recommendationStore = useRecommendationStore()
    
    return {
      route,
      authStore,
      cartStore,
      chatStore,
      toast,
      recommendationStore
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
      addingToCart: false,
      activeTab: 'description'
    }
  },
  
  computed: {
    productId() {
      return this.route.params.id
    },
    
    stockClass() {
      if (this.product?.stock === 0) return 'out-of-stock'
      if (this.product?.stock < 10) return 'low-stock'
      return 'in-stock'
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
    async trackProductView() {
      if (this.productId) {
        await this.recommendationStore.trackProductView(this.productId)
      }
    },

    async fetchProduct() {
      this.loading = true
      this.error = null
      
      try {
        const response = await productService.getProductById(this.productId)
        this.product = response.data
        
        if (this.product.images && this.product.images.length > 0) {
          this.selectedImage = this.product.images[0]
        }

        await this.trackProductView()
        
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
    
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--
      }
    },
    
    increaseQuantity() {
      if (this.quantity < this.product.stock) {
        this.quantity++
      }
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
    
    async buyNow() {
      try {
        await this.addToCart()
        this.$router.push('/checkout')
      } catch (error) {
        console.error('Error in buy now:', error)
      }
    },
    
    openImageModal() {
      console.log('Open image modal')
    },
    
    isUserOnline(userId) {
      return this.chatStore.isUserOnline(userId)
    },
    
    getSellerProductCount() {
      return this.product?.seller?.productCount || 'Multiple'
    },
    
    getSellerRating() {
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
  background: #f8f9fa;
}

// Loading State
.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

// Error State
.error-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
  
  .error-content {
    text-align: center;
    max-width: 400px;
    
    .error-icon {
      margin-bottom: 24px;
      
      i {
        font-size: 80px;
        color: #f44336;
      }
    }
    
    h4 {
      color: #333;
      margin-bottom: 12px;
    }
    
    p {
      color: #666;
      margin-bottom: 32px;
    }
    
    .error-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      
      .btn-retry, .btn-secondary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        text-decoration: none;
        transition: all 0.3s ease;
        
        i {
          font-size: 18px;
        }
      }
      
      .btn-retry {
        background: $primary-color;
        color: white;
        
        &:hover {
          background: darken($primary-color, 10%);
          transform: translateY(-2px);
        }
      }
      
      .btn-secondary {
        background: #e9ecef;
        color: #495057;
        
        &:hover {
          background: #dee2e6;
          transform: translateY(-2px);
        }
      }
    }
  }
}

// Main Product Layout
.product-detail {
  background: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  padding: 40px 0;
  background: white;
  margin-bottom: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 30px 20px;
  }
}

// Product Images
.product-images-section {
  padding: 0 40px;
  
  @media (max-width: 768px) {
    padding: 0;
  }
}

.image-gallery {
  .main-image-container {
    margin-bottom: 20px;
    
    .main-image {
      position: relative;
      background: #f8f9fa;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 1;
      
      .product-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: transform 0.3s ease;
      }
      
      .image-overlay {
        position: absolute;
        top: 16px;
        right: 16px;
        opacity: 0;
        transition: opacity 0.3s ease;
        
        .zoom-btn {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          
          &:hover {
            background: rgba(0, 0, 0, 0.9);
          }
        }
      }
      
      &:hover {
        .image-overlay {
          opacity: 1;
        }
        
        .product-image {
          transform: scale(1.05);
        }
      }
    }
  }
  
  .thumbnails-container {
    .thumbnails-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
      
      .thumbnail {
        flex-shrink: 0;
        width: 80px;
        height: 80px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        &:hover,
        &.active {
          border-color: $primary-color;
          transform: scale(1.05);
        }
      }
    }
  }
}

// Product Info
.product-info-section {
  padding: 0 40px;
  
  @media (max-width: 768px) {
    padding: 0;
  }
}

.product-header {
  margin-bottom: 32px;
  
  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #e3f2fd;
    color: $primary-color;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 16px;
    
    i {
      font-size: 14px;
    }
  }
  
  .product-title {
    font-size: 2rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 16px;
    line-height: 1.3;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
  
  .rating-section {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .stars {
      display: flex;
      gap: 2px;
      
      .star {
        font-size: 20px;
        transition: color 0.3s ease;
        
        &.filled {
          color: #ffc107;
        }
        
        &:not(.filled) {
          color: #e0e0e0;
        }
      }
    }
    
    .rating-text {
      color: #666;
      font-size: 14px;
    }
  }
}

.price-section {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 32px;
  
  .price-main {
    display: flex;
    align-items: baseline;
    margin-bottom: 12px;
    
    .currency {
      font-size: 1.2rem;
      color: $primary-color;
      font-weight: 600;
    }
    
    .amount {
      font-size: 2.5rem;
      font-weight: 700;
      color: $primary-color;
      margin: 0 4px;
    }
    
    .decimal {
      font-size: 1.2rem;
      color: $primary-color;
      font-weight: 600;
    }
  }
  
  .stock-status {
    display: flex;
    align-items: center;
    gap: 8px;
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
    
    i {
      font-size: 18px;
    }
  }
}

.purchase-section {
  margin-bottom: 32px;
  
  .purchase-form {
    .quantity-wrapper {
      margin-bottom: 24px;
      
      .quantity-label {
        display: block;
        font-weight: 500;
        margin-bottom: 12px;
        color: #333;
      }
      
      .quantity-selector {
        display: flex;
        align-items: center;
        gap: 0;
        width: fit-content;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
        
        .quantity-btn {
          background: #f8f9fa;
          border: none;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s ease;
          
          &:hover:not(:disabled) {
            background: #e9ecef;
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          i {
            font-size: 18px;
            color: #666;
          }
        }
        
        .quantity-input {
          border: none;
          width: 60px;
          height: 40px;
          text-align: center;
          font-weight: 500;
          background: white;
          
          &:focus {
            outline: none;
          }
        }
      }
    }
    
    .action-buttons {
      display: flex;
      gap: 16px;
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
      
      .btn-add-cart, .btn-buy-now {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 24px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        
        i {
          font-size: 20px;
        }
      }
      
      .btn-add-cart {
        background: $primary-color;
        color: white;
        
        &:hover:not(:disabled) {
          background: darken($primary-color, 10%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(25, 118, 210, 0.3);
        }
        
        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }
      
      .btn-buy-now {
        background: #ff9800;
        color: white;
        
        &:hover {
          background: darken(#ff9800, 10%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 152, 0, 0.3);
        }
      }
    }
  }
  
  .out-of-stock {
    text-align: center;
    
    .btn-disabled {
      background: #e9ecef;
      color: #6c757d;
      border: none;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 600;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
      
      i {
        font-size: 20px;
      }
    }
    
    p {
      color: #666;
      margin: 0;
    }
  }
}

.login-prompt {
  .login-card {
    background: linear-gradient(135deg, #fff8e1, #ffecb3);
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    
    i {
      font-size: 48px;
      color: #ff9800;
      margin-bottom: 16px;
    }
    
    h6 {
      margin-bottom: 8px;
      color: #333;
    }
    
    p {
      color: #666;
      margin-bottom: 20px;
    }
    
    .login-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
      
      .btn-login, .btn-register {
        padding: 10px 20px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
        }
      }
      
      .btn-login {
        background: $primary-color;
        color: white;
        
        &:hover {
          background: darken($primary-color, 10%);
        }
      }
      
      .btn-register {
        background: white;
        color: $primary-color;
        border: 2px solid $primary-color;
        
        &:hover {
          background: $primary-color;
          color: white;
        }
      }
    }
  }
}

.product-features {
  margin-bottom: 32px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  
  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    i {
      color: #4caf50;
      font-size: 24px;
    }
    
    .feature-text {
      strong {
        display: block;
        color: #333;
        font-weight: 600;
      }
      
      span {
        color: #666;
        font-size: 14px;
      }
    }
  }
}

.chat-section {
  padding: 24px 0;
  border-top: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 32px;
}

// Product Details Tabs
.product-details-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 40px;
  overflow: hidden;
  
  .details-tabs {
    display: flex;
    border-bottom: 1px solid #e9ecef;
    
    .tab-button {
      flex: 1;
      padding: 20px;
      border: none;
      background: transparent;
      font-weight: 500;
      color: #666;
      cursor: pointer;
      transition: all 0.3s ease;
      border-bottom: 3px solid transparent;
      
      &:hover {
        background: #f8f9fa;
        color: #333;
      }
      
      &.active {
        color: $primary-color;
        border-bottom-color: $primary-color;
        background: #f8f9fa;
      }
    }
  }
  
  .tab-content {
    .tab-panel {
      padding: 32px;
      
      .description-content {
        h5 {
          margin-bottom: 16px;
          color: #333;
        }
        
        p {
          line-height: 1.8;
          color: #666;
        }
      }
      
      .seller-card {
        .seller-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          
          .seller-avatar {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #4caf50, #2e7d32);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            
            i {
              color: white;
              font-size: 24px;
            }
          }
          
          .seller-info {
            flex: 1;
            
            h6 {
              margin-bottom: 12px;
              color: #333;
              font-size: 1.2rem;
            }
            
            .seller-stats {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              
              .stat {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                color: #666;
                
                i {
                  font-size: 16px;
                  
                  &.online {
                    color: #4caf50;
                  }
                  
                  &.offline {
                    color: #999;
                  }
                }
                
                .online-text {
                  color: #4caf50;
                  font-weight: 500;
                }
                
                .offline-text {
                  color: #999;
                }
              }
            }
          }
        }
      }
      
      .shipping-info {
        .shipping-option {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e9ecef;
          
          &:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }
          
          h6 {
            margin-bottom: 8px;
            color: #333;
          }
          
          p {
            color: #666;
            margin: 0;
          }
        }
      }
    }
  }
}

.reviews-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.similar-products-section {
  margin-top: 50px;
  padding-top: 50px;
  border-top: 1px solid #e0e0e0;
}
</style>