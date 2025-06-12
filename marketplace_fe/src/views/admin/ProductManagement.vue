<!-- src/views/admin/ProductManagement.vue -->
<template>
  <div class="container">
    <h4>Product Management</h4>
    
    <div class="row">
      <div class="col s12">
        <div class="action-bar">
          <div class="search-box">
            <i class="material-icons prefix">search</i>
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Search products..."
              @input="debouncedSearch"
            >
          </div>
          
          <router-link 
            to="/products/create" 
            class="btn waves-effect waves-light"
          >
            <i class="material-icons left">add</i>
            Add Product
          </router-link>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Loading products..." />
    </div>
    
    <div v-else>
      <!-- Filters -->
      <div class="row">
        <div class="col s12">
          <div class="filters">
            <div class="input-field inline">
              <select v-model="filters.categoryId" @change="fetchProducts">
                <option value="">All Categories</option>
                <option 
                  v-for="category in categories" 
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
              <label>Category</label>
            </div>
            
            <div class="input-field inline">
              <select v-model="filters.stock" @change="fetchProducts">
                <option value="">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (< 10)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
              <label>Stock Status</label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Products Table -->
      <div class="custom-card">
        <table class="striped responsive-table">
          <thead>
            <tr>
              <th>
                <label>
                  <input 
                    type="checkbox" 
                    v-model="selectAll"
                    @change="toggleSelectAll"
                  >
                  <span></span>
                </label>
              </th>
              <th>Product</th>
              <th>Category</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td>
                <label>
                  <input 
                    type="checkbox" 
                    v-model="selectedProducts"
                    :value="product.id"
                  >
                  <span></span>
                </label>
              </td>
              <td>
                <div class="product-info">
                  <img 
                    :src="product.images[0] || '/placeholder.jpg'" 
                    :alt="product.name"
                  >
                  <div>
                    <strong>{{ product.name }}</strong>
                    <p>{{ truncateText(product.description, 50) }}</p>
                  </div>
                </div>
              </td>
              <td>{{ product.category.name }}</td>
              <td>{{ product.seller.name }}</td>
              <td>${{ product.price.toFixed(2) }}</td>
              <td>
                <span 
                  class="stock-badge"
                  :class="{
                    'out-of-stock': product.stock === 0,
                    'low-stock': product.stock > 0 && product.stock < 10
                  }"
                >
                  {{ product.stock }}
                </span>
              </td>
              <td>
                <div class="switch">
                  <label>
                    <input 
                      type="checkbox" 
                      :checked="product.isActive"
                      @change="toggleProductStatus(product.id)"
                    >
                    <span class="lever"></span>
                  </label>
                </div>
              </td>
              <td>
                <div class="actions">
                  <router-link 
                    :to="`/products/${product.id}`"
                    class="btn-flat btn-small"
                    title="View"
                  >
                    <i class="material-icons">visibility</i>
                  </router-link>
                  
                  <router-link 
                    :to="`/products/edit/${product.id}`"
                    class="btn-flat btn-small"
                    title="Edit"
                  >
                    <i class="material-icons">edit</i>
                  </router-link>
                  
                  <button 
                    class="btn-flat btn-small"
                    title="Delete"
                    @click="deleteProduct(product.id)"
                  >
                    <i class="material-icons">delete</i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Bulk Actions -->
        <div v-if="selectedProducts.length > 0" class="bulk-actions">
          <span>{{ selectedProducts.length }} selected</span>
          <button 
            class="btn-flat waves-effect"
            @click="bulkDelete"
          >
            Delete Selected
          </button>
          <button 
            class="btn-flat waves-effect"
            @click="bulkUpdateStatus('active')"
          >
            Activate
          </button>
          <button 
            class="btn-flat waves-effect"
            @click="bulkUpdateStatus('inactive')"
          >
            Deactivate
          </button>
        </div>
        
        <!-- Pagination -->
        <div class="center-align">
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useCategoryStore } from '@/stores/category'
import productService from '@/services/product.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { truncateText } from '@/utils/formatters'
import { debounce } from 'lodash-es'

const toast = useToast()
const categoryStore = useCategoryStore()

const products = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const selectedProducts = ref([])
const selectAll = ref(false)

const categories = computed(() => categoryStore.categories)

const filters = ref({
  categoryId: '',
  stock: ''
})

const fetchProducts = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      limit: 20,
      search: searchQuery.value,
      ...filters.value
    }
    
    const response = await productService.getProducts(params)
    products.value = response.data.data.map(p => ({
      ...p,
      isActive: true // In real app, this would come from backend
    }))
    totalPages.value = response.data.meta.totalPages
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchProducts()
}, 500)

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedProducts.value = products.value.map(p => p.id)
  } else {
    selectedProducts.value = []
  }
}

const toggleProductStatus = async (productId) => {
  toast.info('Status update coming soon')
  // Implement status toggle
}

const deleteProduct = async (productId) => {
  if (!confirm('Are you sure you want to delete this product?')) return
  
  try {
    await productService.deleteProduct(productId)
    toast.success('Product deleted successfully')
    await fetchProducts()
  } catch (error) {
    console.error('Error deleting product:', error)
  }
}

const bulkDelete = async () => {
  if (!confirm(`Delete ${selectedProducts.value.length} products?`)) return
  
  toast.info('Bulk delete coming soon')
  // Implement bulk delete
}

const bulkUpdateStatus = (status) => {
  toast.info('Bulk status update coming soon')
  // Implement bulk status update
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
  }
}

onMounted(async () => {
  await categoryStore.fetchCategories()
  fetchProducts()
  
  // Initialize select
  setTimeout(() => {
    const elems = document.querySelectorAll('select')
    M.FormSelect.init(elems)
  }, 100)
})
</script>

<style scoped lang="scss">
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .search-box {
    position: relative;
    flex: 1;
    max-width: 400px;
    
    i {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }
    
    input {
      padding-left: 40px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
  }
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  .input-field {
    margin: 0;
  }
}

.product-info {
  display: flex;
  align-items: center;
  gap: 10px;
  
  img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  p {
    margin: 5px 0 0 0;
    font-size: 0.85rem;
    color: #666;
  }
}

.stock-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  background: #e8f5e9;
  color: #2e7d32;
  
  &.low-stock {
    background: #fff3cd;
    color: #856404;
  }
  
  &.out-of-stock {
    background: #ffebee;
    color: #c62828;
  }
}

.actions {
  display: flex;
  gap: 5px;
  
  button,
  a {
    padding: 0;
    width: 30px;
    height: 30px;
    
    i {
      font-size: 18px;
    }
  }
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f5f5;
  margin-top: -1px;
  
  span {
    font-weight: 500;
  }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>