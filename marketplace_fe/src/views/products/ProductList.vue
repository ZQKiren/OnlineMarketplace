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
              <h5>
                <Filter :size="18" />
                Filters
              </h5>
              <button v-if="hasActiveFilters" @click="clearAllFilters" class="clear-all-btn">
                <RotateCcw :size="14" />
              </button>
            </div>
            
            <!-- Search -->
            <div class="filter-section">
              <div class="search-box">
                <Search :size="16" class="search-icon" />
                <input 
                  v-model="filters.search"
                  @input="debouncedSearch"
                  type="text" 
                  placeholder="Search products..."
                  class="search-input"
                />
                <button 
                  v-if="filters.search" 
                  @click="clearSearch"
                  class="clear-search"
                >
                  <X :size="14" />
                </button>
              </div>
            </div>
            
            <!-- Category -->
            <div class="filter-section">
              <h6 class="filter-title">Category</h6>
              <select v-model="filters.categoryId" @change="fetchProducts" class="filter-select">
                <option value="">All Categories</option>
                <option 
                  v-for="category in categories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
            
            <!-- Price Range -->
            <div class="filter-section">
              <h6 class="filter-title">Price Range</h6>
              <div class="price-range">
                <input 
                  v-model.number="filters.minPrice"
                  @change="fetchProducts"
                  type="number" 
                  placeholder="Min"
                  min="0"
                  class="price-input"
                />
                <span class="range-separator">to</span>
                <input 
                  v-model.number="filters.maxPrice"
                  @change="fetchProducts"
                  type="number" 
                  placeholder="Max"
                  min="0"
                  class="price-input"
                />
              </div>
              <div v-if="priceError" class="error-text">
                {{ priceError }}
              </div>
            </div>
            
            <!-- Rating -->
            <div class="filter-section">
              <h6 class="filter-title">Rating</h6>
              <div class="rating-list">
                <label 
                  v-for="rating in ratingOptions" 
                  :key="rating.value"
                  class="rating-item"
                >
                  <input 
                    v-model="filters.minRating"
                    :value="rating.value"
                    @change="fetchProducts"
                    type="radio" 
                    name="rating"
                  />
                  <div class="rating-content">
                    <div class="stars">
                      <Star 
                        v-for="i in 5" 
                        :key="i"
                        :size="12"
                        :fill="i <= rating.value ? '#ffc107' : 'none'"
                        :stroke="i <= rating.value ? '#ffc107' : '#ddd'"
                      />
                    </div>
                    <span>& Up</span>
                  </div>
                </label>
                
                <label class="rating-item">
                  <input 
                    v-model="filters.minRating"
                    :value="null"
                    @change="fetchProducts"
                    type="radio" 
                    name="rating"
                  />
                  <span class="any-rating">Any Rating</span>
                </label>
              </div>
            </div>
            
            <!-- Active Filters -->
            <div v-if="hasActiveFilters" class="active-filters-section">
              <div class="active-filters-header">
                <span>Active Filters ({{ activeFilterCount }})</span>
              </div>
              <div class="active-filters-list">
                <div v-if="filters.search" class="active-filter-tag">
                  <span>"{{ truncateText(filters.search, 12) }}"</span>
                  <button @click="removeFilter('search')">
                    <X :size="10" />
                  </button>
                </div>
                
                <div v-if="filters.categoryId && selectedCategory" class="active-filter-tag">
                  <span>{{ selectedCategory.name }}</span>
                  <button @click="removeFilter('categoryId')">
                    <X :size="10" />
                  </button>
                </div>
                
                <div v-if="filters.minPrice || filters.maxPrice" class="active-filter-tag">
                  <span>${{ filters.minPrice || '0' }}-${{ filters.maxPrice || '∞' }}</span>
                  <button @click="removeFilter('price')">
                    <X :size="10" />
                  </button>
                </div>
                
                <div v-if="filters.minRating" class="active-filter-tag">
                  <span>{{ filters.minRating }}+ stars</span>
                  <button @click="removeFilter('minRating')">
                    <X :size="10" />
                  </button>
                </div>
              </div>
            </div>
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
                    <Search :size="12" />
                    <span>{{ truncateText(filters.search, 20) }}</span>
                    <button @click="removeFilter('search')">
                      <X :size="10" />
                    </button>
                  </div>
                  
                  <div v-if="filters.categoryId && selectedCategory" class="filter-chip">
                    <span>{{ selectedCategory.name }}</span>
                    <button @click="removeFilter('categoryId')">
                      <X :size="10" />
                    </button>
                  </div>
                  
                  <div v-if="filters.minPrice || filters.maxPrice" class="filter-chip">
                    <span>${{ filters.minPrice || '0' }} - ${{ filters.maxPrice || '∞' }}</span>
                    <button @click="removeFilter('price')">
                      <X :size="10" />
                    </button>
                  </div>
                  
                  <div v-if="filters.minRating" class="filter-chip">
                    <Star :size="12" />
                    <span>{{ filters.minRating }}+</span>
                    <button @click="removeFilter('minRating')">
                      <X :size="10" />
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCategoryStore } from '@/stores/category'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'
import productService from '@/services/product.service'
import ProductCard from '@/components/product/ProductCard.vue'

// Lucide Icons
import {
  Package,
  Star,
  Filter,
  X,
  Search,
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
const categoryStore = useCategoryStore()
const toast = useToast()

// State
const products = ref([])
const categories = ref([])
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

// Rating options for better UX
const ratingOptions = [
  { value: 4, label: '4+ stars' },
  { value: 3, label: '3+ stars' },
  { value: 2, label: '2+ stars' },
  { value: 1, label: '1+ stars' }
]

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.search !== '' ||
         filters.value.categoryId !== '' ||
         filters.value.minPrice !== null ||
         filters.value.maxPrice !== null ||
         filters.value.minRating !== null
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.search) count++
  if (filters.value.categoryId) count++
  if (filters.value.minPrice || filters.value.maxPrice) count++
  if (filters.value.minRating) count++
  return count
})

const selectedCategory = computed(() => {
  if (!filters.value.categoryId) return null
  return categories.value.find(cat => cat.id === filters.value.categoryId)
})

const priceError = computed(() => {
  if (filters.value.minPrice && filters.value.maxPrice) {
    if (Number(filters.value.minPrice) > Number(filters.value.maxPrice)) {
      return 'Min price cannot be greater than max price'
    }
  }
  if (filters.value.minPrice && Number(filters.value.minPrice) < 0) {
    return 'Price cannot be negative'
  }
  if (filters.value.maxPrice && Number(filters.value.maxPrice) < 0) {
    return 'Price cannot be negative'
  }
  return null
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
  // Don't fetch if there's a price error
  if (priceError.value) return
  
  loading.value = true
  error.value = null
  
  try {
    const params = {
      page: currentPage.value,
      limit: 12,
      ...filters.value
    }
    
    // Remove null/undefined/empty values
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
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

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchProducts()
}, 500)

const clearSearch = () => {
  filters.value.search = ''
  currentPage.value = 1
  fetchProducts()
}

const removeFilter = (filterKey) => {
  switch (filterKey) {
    case 'search':
      filters.value.search = ''
      break
    case 'categoryId':
      filters.value.categoryId = ''
      break
    case 'price':
      filters.value.minPrice = null
      filters.value.maxPrice = null
      break
    case 'minRating':
      filters.value.minRating = null
      break
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

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Lifecycle
onMounted(async () => {
  try {
    await categoryStore.fetchCategories()
    categories.value = categoryStore.categories
  } catch (error) {
    console.error('Error loading categories:', error)
  }
  
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

// Watch for price changes to validate
watch(() => [filters.value.minPrice, filters.value.maxPrice], () => {
  if (!priceError.value) {
    debouncedSearch()
  }
}, { deep: true })
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
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 20px;
  border: 1px solid #f0f0f0;
  
  .filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f8f9fa;
    
    h5 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #2c3e50;
      font-weight: 700;
      font-size: 1.1rem;
    }
    
    .clear-all-btn {
      background: #ff4757;
      border: none;
      color: white;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #ff3838;
        transform: scale(1.05);
      }
    }
  }
  
  .filter-section {
    margin-bottom: 20px;
    
    .filter-title {
      color: #2c3e50;
      font-weight: 600;
      font-size: 0.9rem;
      margin: 0 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
  
  // Search Box
  .search-box {
    position: relative;
    
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #7f8c8d;
      z-index: 2;
    }
    
    .search-input {
      width: 70%;
      padding: 12px 16px 12px 40px;
      border: 2px solid #e9ecef;
      border-radius: 10px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      background: #f8f9fa;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        background: white;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
      
      &::placeholder {
        color: #95a5a6;
      }
    }
    
    .clear-search {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #95a5a6;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #e74c3c;
        color: white;
      }
    }
  }
  
  // Select
  .filter-select {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    background: #f8f9fa;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: $primary-color;
      background: white;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
    }
  }
  
  // Price Range
  .price-range {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .price-input {
      flex: 1;
      padding: 8px 10px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 0.8rem;
      text-align: center;
      background: #f8f9fa;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        background: white;
      }
      
      &::placeholder {
        color: #95a5a6;
      }
      
      // Remove arrows
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
    
    .range-separator {
      color: #7f8c8d;
      font-weight: 500;
      font-size: 0.8rem;
    }
  }
  
  .error-text {
    color: #e74c3c;
    font-size: 0.7rem;
    margin-top: 4px;
  }
  
  // Rating
  .rating-list {
    .rating-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 6px;
      
      &:hover {
        background: #f8f9fa;
        padding-left: 4px;
      }
      
      input[type="radio"] {
        width: 14px;
        height: 14px;
        cursor: pointer;
      }
      
      .rating-content {
        display: flex;
        align-items: center;
        gap: 6px;
        
        .stars {
          display: flex;
          gap: 1px;
        }
        
        span {
          font-size: 0.8rem;
          color: #34495e;
          font-weight: 500;
        }
      }
      
      .any-rating {
        font-size: 0.8rem;
        color: #7f8c8d;
        font-weight: 500;
      }
    }
  }
  
  // Active Filters Section
  .active-filters-section {
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-radius: 12px;
    padding: 16px;
    margin-top: 20px;
    border-left: 4px solid $primary-color;
    
    .active-filters-header {
      font-size: 0.8rem;
      color: #2c3e50;
      font-weight: 600;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .active-filters-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      
      .active-filter-tag {
        display: flex;
        align-items: center;
        gap: 4px;
        background: $primary-color;
        color: white;
        padding: 4px 8px;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 500;
        
        span {
          white-space: nowrap;
        }
        
        button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 2px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
          }
        }
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
        gap: 6px;
        
        .filter-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #e3f2fd;
          color: $primary-color;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          
          button {
            background: transparent;
            border: none;
            color: inherit;
            padding: 1px;
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
  
  .filters-card {
    position: static;
    margin-bottom: 20px;
    padding: 16px;
    
    .filters-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      
      h5 {
        font-size: 1rem;
      }
    }
    
    .filter-section {
      margin-bottom: 16px;
      
      .filter-title {
        font-size: 0.8rem;
        margin-bottom: 6px;
      }
    }
    
    .search-box .search-input {
      padding: 10px 14px 10px 36px;
      font-size: 0.85rem;
    }
    
    .filter-select {
      padding: 8px 10px;
      font-size: 0.8rem;
    }
    
    .price-range {
      flex-direction: column;
      gap: 6px;
      
      .range-separator {
        transform: rotate(90deg);
        margin: 2px 0;
      }
    }
    
    .rating-list .rating-item {
      padding: 4px 0;
      
      .rating-content span {
        font-size: 0.75rem;
      }
    }
    
    .active-filters-section {
      padding: 12px;
      
      .active-filters-header {
        font-size: 0.75rem;
        margin-bottom: 8px;
      }
      
      .active-filters-list .active-filter-tag {
        font-size: 0.65rem;
        padding: 3px 6px;
      }
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
      font-size: 1rem;
    }
  }
  
  .filter-bar .results-info .active-filters .filter-chips {
    .filter-chip {
      font-size: 0.7rem;
      padding: 3px 6px;
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

// Focus states for accessibility
.pagination-btn:focus,
.page-btn:focus,
.view-btn:focus,
.clear-all-btn:focus,
.search-input:focus,
.filter-select:focus,
.price-input:focus {
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