<!-- src/views/products/ProductList.vue -->
<template>
  <div class="container">
    <div class="row">
      <div class="col s12">
        <h4>Products</h4>
      </div>
    </div>
    
    <div class="row">
      <!-- Filters Sidebar -->
      <div class="col s12 m3">
        <ProductFilter @filter-change="handleFilterChange" />
      </div>
      
      <!-- Products Grid -->
      <div class="col s12 m9">
        <div class="row">
          <div class="col s12">
            <div class="filter-bar">
              <span>{{ products.length }} products found</span>
              <div class="input-field inline">
                <select v-model="sortBy" @change="fetchProducts">
                  <option value="">Sort by</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="rating">Best Rated</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="loading" class="loading-spinner">
          <div class="preloader-wrapper active">
            <div class="spinner-layer spinner-blue-only">
              <div class="circle-clipper left">
                <div class="circle"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="products.length === 0" class="no-products">
          <i class="material-icons large">shopping_basket</i>
          <p>No products found</p>
        </div>
        
        <div v-else class="product-grid">
          <ProductCard 
            v-for="product in products" 
            :key="product.id" 
            :product="product" 
          />
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="row">
          <div class="col s12 center-align">
            <ul class="pagination">
              <li :class="{ disabled: currentPage === 1 }">
                <a @click="changePage(currentPage - 1)">
                  <i class="material-icons">chevron_left</i>
                </a>
              </li>
              
              <li 
                v-for="page in totalPages" 
                :key="page"
                :class="{ active: page === currentPage }"
              >
                <a @click="changePage(page)">{{ page }}</a>
              </li>
              
              <li :class="{ disabled: currentPage === totalPages }">
                <a @click="changePage(currentPage + 1)">
                  <i class="material-icons">chevron_right</i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import productService from '@/services/product.service'
import ProductCard from '@/components/product/ProductCard.vue'
import ProductFilter from '@/components/product/ProductFilter.vue'

const route = useRoute()
const router = useRouter()

const products = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const sortBy = ref('')
const filters = ref({
  search: '',
  categoryId: '',
  minPrice: null,
  maxPrice: null,
  minRating: null
})

// Trong ProductList.vue, sửa lại fetchProducts
const fetchProducts = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      limit: 12,
      ...filters.value
    }
    
    // Loại bỏ các giá trị null/undefined
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })
    
    // Thêm sort nếu có
    if (sortBy.value) {
      params.sort = sortBy.value
    }
    
    console.log('API params:', params) // Debug
    
    const response = await productService.getProducts(params)
    products.value = response.data.data
    totalPages.value = response.data.meta.totalPages
  } catch (error) {
    console.error('Error fetching products:', error)
    // Hiển thị thông báo lỗi cho user
    products.value = []
  } finally {
    loading.value = false
  }
}

const handleFilterChange = (newFilters) => {
  filters.value = newFilters
  currentPage.value = 1
  fetchProducts()
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
    window.scrollTo(0, 0)
  }
}

onMounted(() => {
  // Initialize from query params
  if (route.query.category) {
    filters.value.categoryId = route.query.category
  }
  
  fetchProducts()
  
  // Initialize select
  const elems = document.querySelectorAll('select')
  M.FormSelect.init(elems)
})

watch(() => route.query, () => {
  if (route.query.category) {
    filters.value.categoryId = route.query.category
    fetchProducts()
  }
})
</script>

<style scoped lang="scss">
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
  
  .input-field {
    margin: 0;
    
    select {
      border: none;
      border-bottom: none;
    }
  }
}

.no-products {
  text-align: center;
  padding: 60px 0;
  color: #666;
  
  i {
    color: #ccc;
  }
  
  p {
    font-size: 1.2rem;
    margin-top: 20px;
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>