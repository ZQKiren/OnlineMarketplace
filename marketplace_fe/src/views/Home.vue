<!-- src/views/Home.vue -->
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
    
    <!-- Featured Categories -->
    <section class="container">
      <h4 class="center-align">Shop by Category</h4>
      <div class="row">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="col s12 m4"
        >
          <div class="category-card card">
            <div class="card-content center-align">
              <i class="material-icons large">{{ getCategoryIcon(category.name) }}</i>
              <h5>{{ category.name }}</h5>
              <p>{{ category._count.products }} products</p>
            </div>
            <div class="card-action center-align">
              <router-link 
                :to="`/products?category=${category.id}`"
                class="btn-flat waves-effect"
              >
                Browse
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Featured Products -->
    <section class="featured-products grey lighten-5">
      <div class="container">
        <h4 class="center-align">Featured Products</h4>
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
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category'
import productService from '@/services/product.service'
import ProductCard from '@/components/product/ProductCard.vue'

const categoryStore = useCategoryStore()
const categories = ref([])
const featuredProducts = ref([])
const loadingProducts = ref(false)

const getCategoryIcon = (categoryName) => {
  const icons = {
    'Electronics': 'devices',
    'Clothing': 'checkroom',
    'Books': 'menu_book',
    'Home': 'home',
    'Sports': 'pool',
    'Toys': 'toys',
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
    featuredProducts.value = response.data.data
  } catch (error) {
    console.error('Error fetching featured products:', error)
  } finally {
    loadingProducts.value = false
  }
}

onMounted(async () => {
  await categoryStore.fetchCategories()
  categories.value = categoryStore.categories.slice(0, 6)
  fetchFeaturedProducts()
})
</script>

<style scoped lang="scss">
.hero {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  padding: 100px 0;
  text-align: center;
  
  .hero-content {
    h1 {
      font-size: 3rem;
      margin-bottom: 20px;
    }
    
    p {
      font-size: 1.3rem;
      margin-bottom: 30px;
    }
  }
}

.category-card {
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  i {
    color: #1976d2;
  }
}

.featured-products {
  padding: 60px 0;
  
  h4 {
    margin-bottom: 40px;
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style>