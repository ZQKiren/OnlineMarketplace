<!-- src/views/products/ProductList.vue - REMOVED Loyalty Integration -->
<template>
  <div class="product-list-container">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <Package :size="32" class="header-icon" />
            <div class="header-text">
              <h4>Products</h4>
              <p>Discover amazing products</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <!-- Filters Sidebar -->
        <div class="col s12 m3">
          <div class="filters-card">
            <div class="filters-header">
              <Filter :size="20" />
              <h5>Filters</h5>
              <button v-if="hasActiveFilters" @click="clearAllFilters" class="btn-clear-filters">
                <X :size="16" />
              </button>
            </div>
            <ProductFilter @filter-change="handleFilterChange" />
          </div>
        </div>
        
        <!-- Products Grid -->
        <div class="col s12 m9">
          <!-- Filter Bar -->
          <div class="filter-bar">
            <div class="results-info">
              <div class="results-count">
                <span class="count">{{ totalResults }}</span>
                <span class="label">{{ totalResults === 1 ? 'product' : 'products' }} found</span>
              </div>
              
              <!-- Active Filters Display -->
              <div v-if="hasActiveFilters" class="active-filters">
                <div class="filter-chips">
                  <div v-if="filters.search" class="filter-chip">
                    <Search :size="14" />
                    <span>{{ filters.search }}</span>
                    <button @click="removeFilter('search')">
                      <X :size="12" />
                    </button>
                  </div>
                  
                  <div v-if="filters.categoryId" class="filter-chip">
                    <Tag :size="14" />
                    <span>Category</span>
                    <button @click="removeFilter('categoryId')">
                      <X :size="12" />
                    </button>
                  </div>
                  
                  <div v-if="filters.minPrice || filters.maxPrice" class="filter-chip">
                    <DollarSign :size="14" />
                    <span>Price Range</span>
                    <button @click="removeFilter('price')">
                      <X :size="12" />
                    </button>
                  </div>
                  
                  <div v-if="filters.minRating" class="filter-chip">
                    <Star :size="14" />
                    <span>{{ filters.minRating }}+ rating</span>
                    <button @click="removeFilter('minRating')">
                      <X :size="12" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Sort Controls -->
            <div class="sort-controls">
              <div class="view-toggle">
                <button 
                  :class="{ active: viewMode === 'grid' }"
                  @click="viewMode = 'grid'"
                  class="view-btn"
                >
                  <Grid3x3 :size="18" />
                </button>
                <button 
                  :class="{ active: viewMode === 'list' }"
                  @click="viewMode = 'list'"
                  class="view-btn"
                >
                  <List :size="18" />
                </button>
              </div>
              
              <div class="sort-dropdown">
                <select v-model="sortBy" @change="fetchProducts" class="browser-default">
                  <option value="">Sort by</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="rating">Best Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
                <ChevronDown :size="16" class="sort-icon" />
              </div>
            </div>
          </div>
          
          <!-- Loading State -->
          <div v-if="loading" class="loading-container">
            <div class="loading-spinner">
              <LoaderCircle :size="32" class="spinner" />
            </div>
            <p class="loading-text">Finding amazing products for you...</p>
          </div>
          
          <!-- Error State -->
          <div v-else-if="error" class="error-container">
            <div class="error-content">
              <AlertCircle :size="48" class="error-icon" />
              <h5>Oops! Something went wrong</h5>
              <p>{{ error }}</p>
              <button @click="fetchProducts" class="btn-retry">
                <RefreshCw :size="16" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
          
          <!-- No Products Found -->
          <div v-else-if="products.length === 0" class="no-products">
            <div class="no-products-content">
              <ShoppingBasket :size="64" class="no-products-icon" />
              <h5>No products found</h5>
              <p v-if="hasActiveFilters">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              <p v-else>
                It looks like we don't have any products available right now.
              </p>
              
              <div class="no-products-actions">
                <button v-if="hasActiveFilters" @click="clearAllFilters" class="btn-clear">
                  <RotateCcw :size="16" />
                  <span>Clear Filters</span>
                </button>
                <router-link to="/" class="btn-home">
                  <Home :size="16" />
                  <span>Back to Home</span>
                </router-link>
              </div>
            </div>
          </div>
          
          <!-- Products Grid/List -->
          <div v-else class="products-container">
            <div :class="['products-wrapper', `view-${viewMode}`]">
              <ProductCard 
                v-for="product in products" 
                :key="product.id" 
                :product="product"
                :view-mode="viewMode"
                class="product-item"
              />
            </div>
          </div>
          
          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination-container">
            <div class="pagination-info">
              <span>
                Showing {{ (currentPage - 1) * 12 + 1 }}-{{ Math.min(currentPage * 12, totalResults) }} 
                of {{ totalResults }} products
              </span>
            </div>
            
            <div class="pagination-controls">
              <button 
                :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)"
                class="pagination-btn"
              >
                <ChevronLeft :size="16" />
                <span>Previous</span>
              </button>
              
              <div class="page-numbers">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  :class="['page-btn', { active: page === currentPage, ellipsis: page === '...' }]"
                  @click="page !== '...' && changePage(page)"
                  :disabled="page === '...'"
                >
                  {{ page }}
                </button>
              </div>
              
              <button 
                :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
                class="pagination-btn"
              >
                <span>Next</span>
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import productService from '@/services/product.service'
import ProductCard from '@/components/product/ProductCard.vue'
import ProductFilter from '@/components/product/ProductFilter.vue'

// Lucide Icons
import {
  Package,
  Star,
  Filter,
  X,
  Search,
  Tag,
  DollarSign,
  Grid3x3,
  List,
  ChevronDown,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  ShoppingBasket,
  RotateCcw,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const products = ref([])
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(1)
const totalResults = ref(0)
const sortBy = ref('')
const viewMode = ref('grid')

const filters = ref({
  search: '',
  categoryId: '',
  minPrice: null,
  maxPrice: null,
  minRating: null
})

// Computed
const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => 
    value !== null && value !== undefined && value !== ''
  )
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

// Methods
const fetchProducts = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params = {
      page: currentPage.value,
      limit: 12,
      ...filters.value
    }
    
    // Remove null/undefined/empty values AND validate API parameters
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })
    
    // Validate specific parameters that might cause API errors
    const allowedParams = ['page', 'limit', 'search', 'categoryId', 'minPrice', 'maxPrice', 'minRating', 'sort']
    
    // Remove any params not in the allowed list
    Object.keys(params).forEach(key => {
      if (!allowedParams.includes(key)) {
        console.warn(`Removing unsupported parameter: ${key}`)
        delete params[key]
      }
    })
    
    // Add sort if exists
    if (sortBy.value) {
      params.sort = sortBy.value
    }
    
    console.log('API params:', params)
    
    const response = await productService.getProducts(params)
    products.value = response.data.data
    totalPages.value = response.data.meta.totalPages
    totalResults.value = response.data.meta.total
    
    // Update URL without triggering navigation
    updateURL()
    
  } catch (err) {
    console.error('Error fetching products:', err)
    error.value = err.response?.data?.message || 'Failed to load products. Please try again.'
    products.value = []
    totalResults.value = 0
  } finally {
    loading.value = false
  }
}

const handleFilterChange = (newFilters) => {
  filters.value = { ...newFilters }
  currentPage.value = 1
  fetchProducts()
}

const removeFilter = (filterKey) => {
  if (filterKey === 'price') {
    filters.value.minPrice = null
    filters.value.maxPrice = null
  } else {
    filters.value[filterKey] = filterKey === 'search' ? '' : null
  }
  currentPage.value = 1
  fetchProducts()
}

const clearAllFilters = () => {
  filters.value = {
    search: '',
    categoryId: '',
    minPrice: null,
    maxPrice: null,
    minRating: null
  }
  sortBy.value = ''
  currentPage.value = 1
  fetchProducts()
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    fetchProducts()
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const updateURL = () => {
  const query = {}
  
  if (filters.value.categoryId) {
    query.category = filters.value.categoryId
  }
  if (filters.value.search) {
    query.search = filters.value.search
  }
  if (currentPage.value > 1) {
    query.page = currentPage.value
  }
  if (sortBy.value) {
    query.sort = sortBy.value
  }
  
  // Update URL without navigation
  const newQuery = { ...route.query, ...query }
  if (JSON.stringify(newQuery) !== JSON.stringify(route.query)) {
    router.replace({ query: newQuery })
  }
}

const initializeFromURL = () => {
  // Initialize from query params
  if (route.query.category) {
    filters.value.categoryId = route.query.category
  }
  if (route.query.search) {
    filters.value.search = route.query.search
  }
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page) || 1
  }
  if (route.query.sort) {
    sortBy.value = route.query.sort
  }
}

// Lifecycle
onMounted(async () => {
  initializeFromURL()
  await fetchProducts()
})

// Watch route changes
watch(() => route.query, (newQuery, oldQuery) => {
  if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
    initializeFromURL()
    fetchProducts()
  }
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.product-list-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 20px 0;
}

.page-header {
  margin-bottom: 30px;
  
  .header-content {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 20px;
      text-align: center;
    }
    
    .header-info {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .header-icon {
        color: $primary-color;
      }
      
      .header-text {
        h4 {
          margin: 0 0 4px 0;
          color: #333;
          font-weight: 600;
        }
        
        p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
      }
    }
  }
}

.filters-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
  
  .filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
    
    h5 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #333;
      font-weight: 600;
    }
    
    .btn-clear-filters {
      background: transparent;
      border: none;
      color: #666;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #f5f5f5;
        color: #333;
      }
    }
  }
}

.filter-bar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .results-info {
    margin-bottom: 16px;
    
    .results-count {
      margin-bottom: 12px;
      
      .count {
        font-weight: 700;
        color: $primary-color;
        font-size: 1.1rem;
      }
      
      .label {
        color: #666;
        margin-left: 4px;
      }
    }
    
    .active-filters {
      .filter-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .filter-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #e3f2fd;
          color: $primary-color;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.85rem;
          
          button {
            background: transparent;
            border: none;
            color: inherit;
            padding: 2px;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.3s ease;
            
            &:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          }
        }
      }
    }
  }
  
  .sort-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
    }
    
    .view-toggle {
      display: flex;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 2px;
      
      .view-btn {
        background: transparent;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        color: #666;
        transition: all 0.3s ease;
        
        &:hover {
          color: #333;
        }
        
        &.active {
          background: white;
          color: $primary-color;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
    }
    
    .sort-dropdown {
      position: relative;
      
      select {
        appearance: none;
        background: #f5f5f5;
        border: none;
        padding: 10px 40px 10px 16px;
        border-radius: 8px;
        color: #333;
        font-weight: 500;
        cursor: pointer;
        
        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }
      }
      
      .sort-icon {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
        pointer-events: none;
      }
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  
  .loading-spinner {
    margin-bottom: 16px;
    
    .spinner {
      animation: spin 1s linear infinite;
      color: $primary-color;
    }
  }
  
  .loading-text {
    color: #666;
    font-size: 1.1rem;
  }
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  .error-content {
    text-align: center;
    max-width: 400px;
    
    .error-icon {
      color: #f44336;
      margin-bottom: 16px;
    }
    
    h5 {
      color: #333;
      margin-bottom: 8px;
    }
    
    p {
      color: #666;
      margin-bottom: 24px;
    }
    
    .btn-retry {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: $primary-color;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s ease;
      
      &:hover {
        background: darken($primary-color, 10%);
      }
    }
  }
}

.no-products {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  .no-products-content {
    text-align: center;
    max-width: 500px;
    
    .no-products-icon {
      color: #ccc;
      margin-bottom: 20px;
    }
    
    h5 {
      color: #333;
      margin-bottom: 12px;
    }
    
    p {
      color: #666;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    
    .no-products-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      
      @media (max-width: 480px) {
        flex-direction: column;
      }
      
      .btn-clear, .btn-home {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        text-decoration: none;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
        }
      }
      
      .btn-clear {
        background: $primary-color;
        color: white;
        border: none;
        cursor: pointer;
        
        &:hover {
          background: darken($primary-color, 10%);
        }
      }
      
      .btn-home {
        background: #e9ecef;
        color: #495057;
        
        &:hover {
          background: #dee2e6;
        }
      }
    }
  }
}

.products-container {
  .products-wrapper {
    &.view-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }
    
    &.view-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 40px;
      
      .product-item {
        max-width: none;
      }
    }
  }
}

.pagination-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .pagination-info {
    text-align: center;
    color: #666;
    margin-bottom: 20px;
    font-size: 0.9rem;
  }
  
  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    
    .pagination-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: 1px solid #e0e0e0;
      padding: 10px 16px;
      border-radius: 8px;
      color: #666;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        background: #f5f5f5;
        color: #333;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .page-numbers {
      display: flex;
      gap: 4px;
      margin: 0 16px;
      
      .page-btn {
        background: transparent;
        border: 1px solid #e0e0e0;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        color: #666;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover:not(:disabled) {
          background: #f5f5f5;
          color: #333;
        }
        
        &.active {
          background: $primary-color;
          color: white;
          border-color: $primary-color;
        }
        
        &.ellipsis {
          border: none;
          cursor: default;
          
          &:hover {
            background: transparent;
            color: #666;
          }
        }
        
        &:disabled {
          cursor: not-allowed;
        }
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
@media (max-width: 992px) {
  .product-list-container {
    .row {
      .col.m3 {
        .filters-card {
          position: static;
          margin-bottom: 24px;
        }
      }
    }
  }
  
  .products-wrapper.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .product-list-container {
    padding: 10px 0;
  }
  
  .page-header .header-content {
    padding: 20px;
    
    .header-info {
      flex-direction: column;
      text-align: center;
      gap: 12px;
    }
  }
  
  .filter-bar {
    padding: 16px;
    
    .sort-controls {
      .view-toggle {
        order: 2;
      }
      
      .sort-dropdown {
        order: 1;
        width: 100%;
        
        select {
          width: 100%;
        }
      }
    }
  }
  
  .products-wrapper.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .pagination-controls {
    flex-wrap: wrap;
    gap: 8px;
    
    .page-numbers {
      margin: 0 8px;
      
      .page-btn {
        width: 35px;
        height: 35px;
        font-size: 0.9rem;
      }
    }
    
    .pagination-btn {
      padding: 8px 12px;
      font-size: 0.9rem;
    }
  }
}

@media (max-width: 600px) {
  .filters-card .filters-header {
    h5 {
      font-size: 1.1rem;
    }
  }
  
  .filter-bar .results-info .active-filters .filter-chips {
    .filter-chip {
      font-size: 0.8rem;
      padding: 4px 8px;
    }
  }
  
  .products-wrapper.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .no-products .no-products-content {
    padding: 20px;
    
    .no-products-icon {
      width: 48px;
      height: 48px;
    }
    
    h5 {
      font-size: 1.2rem;
    }
    
    .no-products-actions {
      gap: 12px;
      
      .btn-clear, .btn-home {
        padding: 10px 20px;
        font-size: 0.9rem;
      }
    }
  }
}

// Animation classes
.product-item {
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

// Loading state improvements
.loading-container {
  .loading-spinner .spinner {
    filter: drop-shadow(0 2px 4px rgba(25, 118, 210, 0.2));
  }
}

// Enhanced focus states for accessibility
.pagination-btn:focus,
.page-btn:focus,
.view-btn:focus,
.btn-clear-filters:focus {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
}

// Smooth transitions
* {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
}

// Print styles
@media print {
  .filters-card,
  .filter-bar .sort-controls,
  .pagination-container {
    display: none;
  }
  
  .products-wrapper.view-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}
</style>