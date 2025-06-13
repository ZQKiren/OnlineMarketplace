<template>
  <div class="container">
    <h4>Quản Lý Sản Phẩm</h4>
    
    <div class="row">
      <div class="col s12">
        <div class="action-bar">
          <div class="search-box">
            <i class="material-icons prefix">search</i>
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Tìm kiếm sản phẩm..."
              @input="debouncedSearch"
            >
          </div>
          
          <router-link 
            to="/products/create" 
            class="btn waves-effect waves-light"
          >
            <i class="material-icons left">add</i>
            Thêm Sản Phẩm
          </router-link>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Đang tải sản phẩm..." />
    </div>
    
    <div v-else>
      <!-- Filters -->
      <div class="row">
        <div class="col s12">
          <div class="filters">
            <div class="input-field inline">
              <select v-model="filters.categoryId" @change="fetchProducts">
                <option value="">Tất Cả Danh Mục</option>
                <option 
                  v-for="category in categories" 
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
              <label>Danh Mục</label>
            </div>
            
            <div class="input-field inline">
              <select v-model="filters.stock" @change="fetchProducts">
                <option value="">Tất Cả Kho</option>
                <option value="in-stock">Còn Hàng</option>
                <option value="low-stock">Sắp Hết (< 10)</option>
                <option value="out-of-stock">Hết Hàng</option>
              </select>
              <label>Trạng Thái Kho</label>
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
              <th>Sản Phẩm</th>
              <th>Danh Mục</th>
              <th>Người Bán</th>
              <th>Giá</th>
              <th>Kho</th>
              <th>Đánh Giá</th>
              <th>Thao Tác</th>
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
                    :src="product.images?.[0] || '/placeholder.jpg'" 
                    :alt="product.name"
                  >
                  <div>
                    <strong>{{ product.name }}</strong>
                    <p>{{ truncateText(product.description, 50) }}</p>
                  </div>
                </div>
              </td>
              <td>{{ product.category?.name || 'N/A' }}</td>
              <td>
                <div>
                  <strong>{{ product.seller?.name || 'N/A' }}</strong>
                  <br>
                  <small>{{ product.seller?.email || '' }}</small>
                </div>
              </td>
              <td>${{ product.price?.toFixed(2) || '0.00' }}</td>
              <td>
                <span 
                  class="stock-badge"
                  :class="{
                    'out-of-stock': product.stock === 0,
                    'low-stock': product.stock > 0 && product.stock < 10
                  }"
                >
                  {{ product.stock || 0 }}
                </span>
              </td>
              <td>
                <div class="rating">
                  <span>⭐ {{ product.avgRating || 0 }}/5</span>
                  <small>({{ product._count?.reviews || 0 }})</small>
                </div>
              </td>
              <td>
                <div class="actions">
                  <router-link 
                    :to="`/products/${product.id}`"
                    class="btn-flat btn-small"
                    title="Xem"
                  >
                    <i class="material-icons">visibility</i>
                  </router-link>
                  
                  <router-link 
                    :to="`/products/edit/${product.id}`"
                    class="btn-flat btn-small"
                    title="Sửa"
                  >
                    <i class="material-icons">edit</i>
                  </router-link>
                  
                  <button 
                    class="btn-flat btn-small red-text"
                    title="Xóa"
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
          <span>{{ selectedProducts.length }} đã chọn</span>
          <button 
            class="btn-flat waves-effect red-text"
            @click="bulkDelete"
          >
            <i class="material-icons left">delete</i>
            Xóa Đã Chọn
          </button>
        </div>
        
        <!-- Pagination -->
        <div class="center-align" v-if="totalPages > 1">
          <ul class="pagination">
            <li :class="{ disabled: currentPage === 1 }">
              <a @click="changePage(currentPage - 1)">
                <i class="material-icons">chevron_left</i>
              </a>
            </li>
            
            <li 
              v-for="page in Math.min(totalPages, 10)" 
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
import adminService from '@/services/admin.service'
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
    
    // Sử dụng admin service để lấy TẤT CẢ sản phẩm
    const response = await adminService.getAllProducts(params)
    products.value = response.data.data || []
    totalPages.value = response.data.meta?.totalPages || 1
    
    console.log(`Đã tải ${products.value.length} sản phẩm`)
  } catch (error) {
    console.error('Error fetching products:', error)
    toast.error('Không thể tải danh sách sản phẩm')
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

const deleteProduct = async (productId) => {
  if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
  
  try {
    await adminService.bulkDeleteProducts([productId])
    toast.success('Xóa sản phẩm thành công')
    await fetchProducts()
  } catch (error) {
    console.error('Error deleting product:', error)
    toast.error('Không thể xóa sản phẩm')
  }
}

const bulkDelete = async () => {
  if (!confirm(`Xóa ${selectedProducts.value.length} sản phẩm đã chọn?`)) return
  
  try {
    await adminService.bulkDeleteProducts(selectedProducts.value)
    toast.success(`Đã xóa ${selectedProducts.value.length} sản phẩm`)
    selectedProducts.value = []
    selectAll.value = false
    await fetchProducts()
  } catch (error) {
    console.error('Error bulk deleting:', error)
    toast.error('Không thể xóa hàng loạt')
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
  }
}

onMounted(async () => {
  await categoryStore.fetchCategories()
  await fetchProducts()
  
  // Initialize Materialize select
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
      height: 40px;
      width: 100%;
    }
  }
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  .input-field {
    margin: 0;
    min-width: 200px;
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

.rating {
  font-size: 0.9rem;
  
  small {
    display: block;
    color: #666;
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
    display: flex;
    align-items: center;
    justify-content: center;
    
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
  border-top: 1px solid #e0e0e0;
  
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

.custom-card {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  margin: 0;
  
  th, td {
    padding: 12px 8px;
  }
  
  thead th {
    background: #f5f5f5;
    font-weight: 500;
  }
}
</style>