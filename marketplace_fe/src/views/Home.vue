<!-- src/views/Home.vue - OPTIMIZED VERSION -->
<template>
  <div>
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1>Welcome to Online Marketplace</h1>
        <p>Discover amazing products from trusted sellers</p>
        <router-link to="/products" class="btn-large waves-effect waves-light">
          Shop Now
        </router-link>
      </div>
    </section>
    
    <!-- ✅ NEW: Personalized Recommendations (for authenticated users) -->
    <section v-if="authStore.isAuthenticated" class="container recommendations-section">
      <PersonalizedRecommendations :limit="8" />
    </section>
    
    <!-- ✅ NEW: Trending Products -->
    <section class="trending-section grey lighten-5">
      <div class="container">
        <TrendingProducts :limit="6" />
      </div>
    </section>
    
    <!-- Featured Categories - FIXED LAYOUT -->
    <section class="categories-section">
      <div class="container">
        <h4 class="center-align section-title">Shop by Category</h4>
        
        <!-- Option 1: Force center with CSS Grid -->
        <div class="categories-grid">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-item"
          >
            <div class="category-card card hoverable">
              <div class="card-content center-align">
                <i class="material-icons large category-icon">{{ getCategoryIcon(category.name) }}</i>
                <h5 class="category-name">{{ category.name }}</h5>
                <p class="category-count">{{ category._count?.products || 0 }} products</p>
              </div>
              <div class="card-action center-align">
                <router-link 
                  :to="`/products?category=${category.id}`"
                  class="btn-flat waves-effect category-btn"
                >
                  Browse
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Featured Products -->
    <section class="featured-products">
      <div class="container">
        <h4 class="center-align section-title">Popular Products</h4>
        
        <div v-if="loadingProducts" class="loading-spinner">
          <div class="preloader-wrapper active">
            <div class="spinner-layer spinner-blue-only">
              <div class="circle-clipper left">
                <div class="circle"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="product-grid">
          <ProductCard 
            v-for="product in featuredProducts" 
            :key="product.id" 
            :product="product"
            @product-click="trackProductView"
          />
        </div>
        
        <!-- View More Button -->
        <div class="center-align view-more-section">
          <router-link to="/products" class="btn-large view-more-btn">
            <i class="material-icons left">arrow_forward</i>
            View All Products
          </router-link>
        </div>
      </div>
    </section>

    <!-- ✅ NEW: Why Choose Us Section -->
    <section class="why-choose-us grey lighten-4">
      <div class="container">
        <h4 class="center-align section-title">Why Choose Our Marketplace?</h4>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-card">
              <i class="material-icons large">security</i>
              <h5>Secure Payments</h5>
              <p>Your transactions are protected with enterprise-grade security</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-card">
              <i class="material-icons large">local_shipping</i>
              <h5>Fast Delivery</h5>
              <p>Quick and reliable shipping to your doorstep</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-card">
              <i class="material-icons large">verified_user</i>
              <h5>Trusted Sellers</h5>
              <p>All sellers are verified and rated by our community</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCategoryStore } from '@/stores/category'
import { useRecommendationStore } from '@/stores/recommendation'
import productService from '@/services/product.service'
import ProductCard from '@/components/product/ProductCard.vue'
import PersonalizedRecommendations from '@/components/recommendation/PersonalizedRecommendations.vue'
import TrendingProducts from '@/components/recommendation/TrendingProducts.vue'

// ✅ Stores
const authStore = useAuthStore()
const categoryStore = useCategoryStore()
const recommendationStore = useRecommendationStore()

// State
const categories = ref([])
const featuredProducts = ref([])
const loadingProducts = ref(false)

// Methods
const getCategoryIcon = (categoryName) => {
  const icons = {
    'Electronics': 'devices',
    'Clothing': 'checkroom',
    'Books': 'menu_book',
    'Home': 'home',
    'Sports': 'pool',
    'Toys': 'toys',
    'Fashion': 'style',
    'Health': 'favorite',
    'Beauty': 'face',
    'Food': 'restaurant'
  }
  return icons[categoryName] || 'category'
}

const fetchFeaturedProducts = async () => {
  loadingProducts.value = true
  try {
    const response = await productService.getProducts({ 
      limit: 8,
      sort: 'rating' 
    })
    featuredProducts.value = response.data.data || response.data
  } catch (error) {
    console.error('Error fetching featured products:', error)
  } finally {
    loadingProducts.value = false
  }
}

// ✅ NEW: Track product views for recommendations
const trackProductView = async (productId) => {
  if (authStore.isAuthenticated) {
    await recommendationStore.trackProductView(productId)
  }
}

// Initialize page
onMounted(async () => {
  try {
    // Load categories
    await categoryStore.fetchCategories()
    categories.value = categoryStore.categories.slice(0, 6)
    
    // Load featured products
    await fetchFeaturedProducts()
    
    // ✅ NEW: Initialize recommendations for authenticated users
    if (authStore.isAuthenticated) {
      await recommendationStore.initializeRecommendations()
    }
  } catch (error) {
    console.error('Error initializing home page:', error)
  }
})
</script>

<style scoped lang="scss">
// Hero Section
.hero {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  padding: 100px 0;
  text-align: center;
  
  .hero-content {
    h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    p {
      font-size: 1.3rem;
      margin-bottom: 30px;
    }
    
    .btn-large {
      background: #ff9800;
      transition: all 0.3s ease;
      
      &:hover {
        background: #f57c00;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.3);
      }
    }
  }
}

// Recommendations Section
.recommendations-section {
  padding: 60px 0 40px;
}

// Trending Section
.trending-section {
  padding: 60px 0;
  margin: 0;
}

// Categories Section - FIXED LAYOUT
.categories-section {
  padding: 80px 0;
  background: white;
  
  .section-title {
    margin-bottom: 50px;
    color: #333;
    font-weight: 500;
  }
  
  // CSS Grid solution for perfect centering
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    
    // Ensure centering when items < grid columns
    justify-content: center;
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
      gap: 20px;
      padding: 0 15px;
    }
    
    @media (min-width: 601px) and (max-width: 992px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (min-width: 993px) {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  .category-item {
    display: flex;
    justify-content: center;
  }
  
  .category-card {
    transition: all 0.3s ease;
    height: 100%;
    width: 100%;
    max-width: 350px;
    
    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.15);
    }
    
    .card-content {
      padding: 40px 20px 30px;
      
      .category-icon {
        color: #1976d2;
        margin-bottom: 20px;
        transition: color 0.3s ease;
      }
      
      .category-name {
        color: #333;
        margin: 20px 0 10px;
        font-weight: 600;
        font-size: 1.4rem;
      }
      
      .category-count {
        color: #666;
        margin: 0;
        font-size: 1rem;
      }
    }
    
    .card-action {
      padding: 20px;
      
      .category-btn {
        color: #1976d2;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(25, 118, 210, 0.1);
          color: #1565c0;
        }
      }
    }
    
    &:hover .category-icon {
      color: #ff9800;
    }
  }
}

// Featured Products Section
.featured-products {
  padding: 80px 0;
  background: #fafafa;
  
  .section-title {
    margin-bottom: 50px;
    color: #333;
    font-weight: 500;
  }
  
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;
    margin-bottom: 50px;
  }
  
  .view-more-section {
    margin-top: 40px;
    
    .view-more-btn {
      background: #1976d2;
      transition: all 0.3s ease;
      padding: 0 30px;
      
      &:hover {
        background: #1565c0;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(25, 118, 210, 0.3);
      }
    }
  }
}

// Loading Spinner
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

// Why Choose Us Section
.why-choose-us {
  padding: 80px 0;
  
  .section-title {
    margin-bottom: 50px;
    color: #333;
    font-weight: 500;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    max-width: 1200px;
    margin: 0 auto;
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
      gap: 25px;
    }
  }
  
  .feature-item {
    display: flex;
    justify-content: center;
  }
  
  .feature-card {
    text-align: center;
    padding: 40px 30px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
    height: 100%;
    width: 100%;
    max-width: 350px;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    i {
      color: #1976d2;
      margin-bottom: 25px;
      transition: color 0.3s ease;
    }
    
    h5 {
      color: #333;
      margin: 25px 0 15px;
      font-weight: 600;
      font-size: 1.3rem;
    }
    
    p {
      color: #666;
      line-height: 1.6;
      margin: 0;
      font-size: 1rem;
    }
    
    &:hover i {
      color: #ff9800;
    }
  }
}

// Responsive Design
@media (max-width: 768px) {
  .hero {
    padding: 60px 0;
    
    .hero-content h1 {
      font-size: 2.2rem;
    }
  }
  
  .categories-section,
  .featured-products,
  .why-choose-us {
    padding: 50px 0;
  }
  
  .trending-section {
    padding: 50px 0;
  }
  
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .hero .hero-content h1 {
    font-size: 1.8rem;
  }
  
  .section-title {
    font-size: 1.8rem;
  }
  
  .category-card .card-content {
    padding: 30px 15px 20px;
  }
  
  .feature-card {
    padding: 30px 20px;
  }
}
</style>