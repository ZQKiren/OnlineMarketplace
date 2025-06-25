<template>
  <div class="container">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h4>Quản Lý Sản Phẩm</h4>
        <p class="header-subtitle">Quản lý và theo dõi tất cả sản phẩm trong hệ thống</p>
      </div>
      <div class="header-actions">
        <button 
          v-if="selectedProducts.length > 0"
          class="btn-flat waves-effect bulk-delete-btn"
          @click="bulkDelete"
        >
          <Trash2 class="icon-left" />
          Xóa {{ selectedProducts.length }} mục
        </button>
        <button 
          class="btn-flat waves-effect export-btn"
          @click="exportProducts"
          :disabled="products.length === 0"
        >
          <Download class="icon-left" />
          Xuất Excel
        </button>
        <router-link 
          to="/products/create" 
          class="btn waves-effect waves-light primary-btn"
        >
          <Plus class="icon-left" />
          Thêm Sản Phẩm
        </router-link>
      </div>
    </div>
    
    <!-- Search and Filters -->
    <div class="search-filters-container">
      <div class="search-section">
        <div class="search-wrapper">
          <Search class="search-icon" />
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Tìm kiếm sản phẩm theo tên, mô tả..."
            @input="debouncedSearch"
          >
          <button v-if="searchQuery" class="clear-search" @click="clearSearch">
            <X />
          </button>
        </div>
      </div>
      
      <div class="filters-section">
        <div class="filter-group">
          <label class="filter-label">Danh Mục</label>
          <div class="select-wrapper">
            <select 
              v-model="filters.categoryId" 
              @change="applyFilters" 
              class="browser-default filter-select"
            >
              <option value="">Tất Cả Danh Mục</option>
              <option 
                v-for="category in categories" 
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
            <ChevronDown class="select-arrow" />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Trạng Thái Kho</label>
          <div class="select-wrapper">
            <select 
              v-model="filters.stock" 
              @change="applyFilters" 
              class="browser-default filter-select"
            >
              <option value="">Tất Cả Kho</option>
              <option value="in-stock">Còn Hàng</option>
              <option value="low-stock">Sắp Hết (< 10)</option>
              <option value="out-of-stock">Hết Hàng</option>
            </select>
            <ChevronDown class="select-arrow" />
          </div>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Sắp Xếp</label>
          <div class="select-wrapper">
            <select 
              v-model="filters.sortBy" 
              @change="applyFilters" 
              class="browser-default filter-select"
            >
              <option value="createdAt">Ngày Tạo</option>
              <option value="name">Tên A-Z</option>
              <option value="price">Giá Thấp-Cao</option>
              <option value="stock">Tồn Kho</option>
              <option value="rating">Đánh Giá</option>
            </select>
            <ChevronDown class="select-arrow" />
          </div>
        </div>
        
        <button 
          class="btn-flat waves-effect reset-filters"
          @click="resetFilters"
          :disabled="!hasActiveFilters"
        >
          <RotateCcw class="icon-small" />
          Đặt Lại
        </button>
      </div>
    </div>
    
    <!-- Active Filters -->
    <div v-if="hasActiveFilters" class="active-filters">
      <span class="filter-label">Bộ lọc đang áp dụng:</span>
      <div class="filter-chips">
        <div v-if="searchQuery" class="chip">
          Tìm kiếm: "{{ searchQuery }}"
          <X @click="clearSearch" />
        </div>
        <div v-if="filters.categoryId" class="chip">
          Danh mục: {{ getCategoryName(filters.categoryId) }}
          <X @click="clearFilter('categoryId')" />
        </div>
        <div v-if="filters.stock" class="chip">
          Kho: {{ getStockLabel(filters.stock) }}
          <X @click="clearFilter('stock')" />
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <Loader class="spinning" />
        <p>Đang tải sản phẩm...</p>
      </div>
    </div>
    
    <div v-else class="content-wrapper">
      <!-- Products Stats -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon total">
            <Package />
          </div>
          <div class="stat-content">
            <h6>Tổng Sản Phẩm</h6>
            <h3>{{ totalProducts }}</h3>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon in-stock">
            <CheckCircle />
          </div>
          <div class="stat-content">
            <h6>Còn Hàng</h6>
            <h3>{{ inStockCount }}</h3>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon low-stock">
            <AlertTriangle />
          </div>
          <div class="stat-content">
            <h6>Sắp Hết</h6>
            <h3>{{ lowStockCount }}</h3>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon out-stock">
            <XCircle />
          </div>
          <div class="stat-content">
            <h6>Hết Hàng</h6>
            <h3>{{ outOfStockCount }}</h3>
          </div>
        </div>
      </div>
      
      <!-- Products Table -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-title">
            <h6>Danh Sách Sản Phẩm</h6>
            <span class="result-count">{{ products.length }} sản phẩm</span>
          </div>
          <div class="table-controls">
            <div class="view-toggle">
              <button 
                class="btn-flat"
                :class="{ active: viewMode === 'table' }"
                @click="viewMode = 'table'"
              >
                <Table />
              </button>
              <button 
                class="btn-flat"
                :class="{ active: viewMode === 'grid' }"
                @click="viewMode = 'grid'"
              >
                <Grid />
              </button>
            </div>
          </div>
        </div>
        
        <!-- Table View -->
        <div v-if="viewMode === 'table'" class="table-wrapper">
          <table class="enhanced-table">
            <thead>
              <tr>
                <th class="checkbox-column">
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
              <tr v-if="products.length === 0" class="empty-row">
                <td colspan="8" class="center-align">
                  <div class="empty-state">
                    <Package class="empty-icon" />
                    <p>{{ searchQuery || hasActiveFilters ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào' }}</p>
                    <router-link 
                      v-if="!searchQuery && !hasActiveFilters"
                      to="/products/create" 
                      class="btn waves-effect"
                    >
                      Thêm Sản Phẩm Đầu Tiên
                    </router-link>
                  </div>
                </td>
              </tr>
              <tr 
                v-for="product in products" 
                :key="product.id"
                class="product-row"
                :class="{ selected: selectedProducts.includes(product.id) }"
              >
                <td class="checkbox-column">
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
                    <div class="product-image">
                      <img 
                        :src="product.images?.[0] || '/placeholder.jpg'" 
                        :alt="product.name"
                        @error="handleImageError"
                      >
                    </div>
                    <div class="product-details">
                      <strong>{{ product.name }}</strong>
                      <p>{{ truncateText(product.description, 50) }}</p>
                      <span class="product-id">#{{ product.id.slice(-6) }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="category-info">
                    <span class="category-badge">{{ product.category?.name || 'N/A' }}</span>
                  </div>
                </td>
                <td>
                  <div class="seller-info">
                    <strong>{{ product.seller?.name || 'N/A' }}</strong>
                    <span class="seller-email">{{ product.seller?.email || '' }}</span>
                  </div>
                </td>
                <td>
                  <div class="price-info">
                    <strong>${{ product.price?.toFixed(2) || '0.00' }}</strong>
                  </div>
                </td>
                <td>
                  <span 
                    class="stock-badge"
                    :class="getStockClass(product.stock)"
                  >
                    {{ product.stock || 0 }}
                  </span>
                </td>
                <td>
                  <div class="rating-info">
                    <div class="stars">
                      <Star 
                        v-for="i in 5" 
                        :key="i"
                        :class="{ filled: i <= Math.round(product.avgRating || 0) }"
                      />
                    </div>
                    <span class="rating-text">{{ product.avgRating || 0 }}/5</span>
                    <small>({{ product._count?.reviews || 0 }} đánh giá)</small>
                  </div>
                </td>
                <td>
                  <div class="action-buttons">
                    <router-link 
                      :to="`/products/${product.id}`"
                      class="btn-flat btn-small action-btn"
                      title="Xem Chi Tiết"
                    >
                      <Eye />
                    </router-link>
                    
                    <router-link 
                      :to="`/products/edit/${product.id}`"
                      class="btn-flat btn-small action-btn"
                      title="Chỉnh Sửa"
                    >
                      <Edit />
                    </router-link>
                    
                    <button 
                      class="btn-flat btn-small action-btn delete-btn"
                      title="Xóa"
                      @click="deleteProduct(product.id)"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Grid View -->
        <div v-else class="grid-wrapper">
          <div v-if="products.length === 0" class="empty-state">
            <Package class="empty-icon" />
            <p>{{ searchQuery || hasActiveFilters ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào' }}</p>
            <router-link 
              v-if="!searchQuery && !hasActiveFilters"
              to="/products/create" 
              class="btn waves-effect"
            >
              Thêm Sản Phẩm Đầu Tiên
            </router-link>
          </div>
          
          <div class="products-grid">
            <div 
              v-for="product in products" 
              :key="product.id"
              class="product-card"
              :class="{ selected: selectedProducts.includes(product.id) }"
            >
              <div class="card-header">
                <label class="card-checkbox">
                  <input 
                    type="checkbox" 
                    v-model="selectedProducts"
                    :value="product.id"
                  >
                  <span></span>
                </label>
                <div class="card-menu">
                  <button class="btn-flat btn-small" @click="toggleCardMenu(product.id)">
                    <MoreVertical />
                  </button>
                  <div class="menu-dropdown" v-if="activeCardMenu === product.id">
                    <router-link :to="`/products/${product.id}`">
                      <Eye />
                      Xem Chi Tiết
                    </router-link>
                    <router-link :to="`/products/edit/${product.id}`">
                      <Edit />
                      Chỉnh Sửa
                    </router-link>
                    <a @click="deleteProduct(product.id)">
                      <Trash2 />
                      Xóa
                    </a>
                  </div>
                </div>
              </div>
              
              <div class="card-image">
                <img 
                  :src="product.images?.[0] || '/placeholder.jpg'" 
                  :alt="product.name"
                  @error="handleImageError"
                >
                <span 
                  class="stock-badge"
                  :class="getStockClass(product.stock)"
                >
                  {{ product.stock || 0 }}
                </span>
              </div>
              
              <div class="card-content">
                <h6>{{ product.name }}</h6>
                <p>{{ truncateText(product.description, 60) }}</p>
                
                <div class="card-stats">
                  <div class="price">
                    <strong>${{ product.price?.toFixed(2) || '0.00' }}</strong>
                  </div>
                  <div class="rating">
                    <Star class="star-icon" />
                    <span>{{ product.avgRating || 0 }}</span>
                  </div>
                </div>
                
                <div class="card-meta">
                  <span class="category">{{ product.category?.name || 'N/A' }}</span>
                  <span class="seller">{{ product.seller?.name || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="pagination-wrapper" v-if="totalPages > 1">
          <div class="pagination-info">
            Trang {{ currentPage }} / {{ totalPages }}
          </div>
          <ul class="pagination">
            <li :class="{ disabled: currentPage === 1 }">
              <a @click="changePage(1)" title="Trang đầu">
                <ChevronsLeft />
              </a>
            </li>
            <li :class="{ disabled: currentPage === 1 }">
              <a @click="changePage(currentPage - 1)" title="Trang trước">
                <ChevronLeft />
              </a>
            </li>
            
            <li 
              v-for="page in getVisiblePages()" 
              :key="page"
              :class="{ active: page === currentPage }"
            >
              <a @click="changePage(page)">{{ page }}</a>
            </li>
            
            <li :class="{ disabled: currentPage === totalPages }">
              <a @click="changePage(currentPage + 1)" title="Trang sau">
                <ChevronRight />
              </a>
            </li>
            <li :class="{ disabled: currentPage === totalPages }">
              <a @click="changePage(totalPages)" title="Trang cuối">
                <ChevronsRight />
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
import { 
  Search, Plus, Download, X, ChevronDown, RotateCcw, Loader,
  Package, CheckCircle, AlertTriangle, XCircle, Table, Grid,
  Eye, Edit, Trash2, Star, MoreVertical, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight
} from 'lucide-vue-next'
import { useCategoryStore } from '@/stores/category'
import adminService from '@/services/admin.service'
import { truncateText } from '@/utils/formatters'
import { debounce } from 'lodash-es'

const toast = useToast()
const categoryStore = useCategoryStore()

const products = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalProducts = ref(0)
const selectedProducts = ref([])
const selectAll = ref(false)
const viewMode = ref('table')
const activeCardMenu = ref(null)

const categories = computed(() => categoryStore.categories)

const filters = ref({
  categoryId: '',
  stock: '',
  sortBy: 'createdAt'
})

const hasActiveFilters = computed(() => {
  return searchQuery.value || 
         filters.value.categoryId || 
         filters.value.stock ||
         (filters.value.sortBy && filters.value.sortBy !== 'createdAt')
})

const inStockCount = computed(() => 
  products.value.filter(p => p.stock > 10).length
)

const lowStockCount = computed(() => 
  products.value.filter(p => p.stock > 0 && p.stock <= 10).length
)

const outOfStockCount = computed(() => 
  products.value.filter(p => p.stock === 0).length
)

const fetchProducts = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      limit: 20,
      search: searchQuery.value,
      ...filters.value
    }
    
    console.log('Fetching products with params:', params)
    const response = await adminService.getAllProducts(params)
    products.value = response.data.data || []
    totalPages.value = response.data.meta?.totalPages || 1
    totalProducts.value = response.data.meta?.total || 0
    
    console.log(`Đã tải ${products.value.length} sản phẩm`)
  } catch (error) {
    console.error('Error fetching products:', error)
    toast.error('Không thể tải danh sách sản phẩm')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  console.log('Applying filters:', filters.value)
  currentPage.value = 1
  fetchProducts()
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchProducts()
}, 500)

const clearSearch = () => {
  searchQuery.value = ''
  debouncedSearch()
}

const resetFilters = () => {
  console.log('Resetting all filters')
  searchQuery.value = ''
  filters.value = {
    categoryId: '',
    stock: '',
    sortBy: 'createdAt'
  }
  currentPage.value = 1
  fetchProducts()
}

const clearFilter = (filterName) => {
  console.log('Clearing filter:', filterName)
  filters.value[filterName] = filterName === 'sortBy' ? 'createdAt' : ''
  applyFilters()
}

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

const toggleCardMenu = (productId) => {
  activeCardMenu.value = activeCardMenu.value === productId ? null : productId
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
  }
}

const getVisiblePages = () => {
  const delta = 2
  const range = []
  const rangeWithDots = []

  for (let i = Math.max(2, currentPage.value - delta);
       i <= Math.min(totalPages.value - 1, currentPage.value + delta);
       i++) {
    range.push(i)
  }

  if (currentPage.value - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (currentPage.value + delta < totalPages.value - 1) {
    rangeWithDots.push('...', totalPages.value)
  } else {
    rangeWithDots.push(totalPages.value)
  }

  return rangeWithDots
}

const getStockClass = (stock) => {
  if (stock === 0) return 'out-of-stock'
  if (stock <= 10) return 'low-stock'
  return 'in-stock'
}

const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || 'N/A'
}

const getStockLabel = (stock) => {
  const labels = {
    'in-stock': 'Còn Hàng',
    'low-stock': 'Sắp Hết',
    'out-of-stock': 'Hết Hàng'
  }
  return labels[stock] || stock
}

const handleImageError = (event) => {
  event.target.src = '/placeholder.jpg'
}

const exportProducts = () => {
  toast.info('Tính năng xuất Excel đang được phát triển')
}

onMounted(async () => {
  await categoryStore.fetchCategories()
  await fetchProducts()
  
  // No need to initialize Materialize since we're using browser-default selects
  console.log('Product management initialized')
})

// Close card menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.card-menu')) {
    activeCardMenu.value = null
  }
})
</script>

<style scoped lang="scss">
// Color Variables
$primary-color: #2196F3;
$success-color: #4CAF50;
$warning-color: #FF9800;
$error-color: #F44336;
$light-blue: #E3F2FD;
$light-green: #E8F5E9;
$light-orange: #FFF3E0;
$light-red: #FFEBEE;

// Icon Styles
.icon-left {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

.icon-small {
  width: 16px;
  height: 16px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #666;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #666;
  pointer-events: none;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
  
  .header-content {
    h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-weight: 600;
    }
    
    .header-subtitle {
      color: #666;
      margin: 0;
      font-size: 0.95rem;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    
    .primary-btn {
      background: linear-gradient(135deg, $primary-color 0%, #1976D2 100%);
      border-radius: 25px;
      padding: 0 1.5rem;
      
      &:hover {
        background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
      }
    }
    
    .export-btn, .bulk-delete-btn {
      border-radius: 25px;
      color: #666;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .bulk-delete-btn {
      color: $error-color;
      
      &:hover {
        background-color: $light-red;
      }
    }
  }
}

.search-filters-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 2rem;
  margin-bottom: 2rem;
}

.search-section {
  margin-bottom: 1.5rem;
  
  .search-wrapper {
    position: relative;
    max-width: 500px;
    
    input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: 2px solid #e0e0e0;
      border-radius: 25px;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
    }
    
    .clear-search {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      
      &:hover {
        background-color: #f0f0f0;
      }
      
      svg {
        width: 16px;
        height: 16px;
        color: #999;
      }
    }
  }
}

.filters-section {
  display: flex;
  gap: 1.5rem;
  align-items: end;
  flex-wrap: wrap;
  
  .filter-group {
    display: flex;
    flex-direction: column;
    min-width: 160px;
    position: relative;
    
    .filter-label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .select-wrapper {
      position: relative;
      
      .filter-select {
        width: 100%;
        padding: 0.75rem 2.5rem 0.75rem 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: white;
        font-size: 0.95rem;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        transition: all 0.2s ease;
        
        &:focus {
          outline: none;
          border-color: $primary-color;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }
        
        &:hover {
          border-color: #bbb;
        }
        
        // Ensure it's clickable and accessible
        pointer-events: auto;
        z-index: 10;
        position: relative;
      }
      
      .select-arrow {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        color: #666;
        pointer-events: none;
        z-index: 5;
      }
    }
  }
  
  .reset-filters {
    height: 2.5rem;
    padding: 0 1rem;
    border-radius: 8px;
    color: #666;
    white-space: nowrap;
    
    &:hover {
      background-color: #f5f5f5;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.active-filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  
  .filter-label {
    font-weight: 500;
    color: #666;
    font-size: 0.9rem;
  }
  
  .filter-chips {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    
    .chip {
      background: $light-blue;
      color: $primary-color;
      padding: 0.25rem 0.75rem;
      border-radius: 16px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      svg {
        width: 14px;
        height: 14px;
        cursor: pointer;
        opacity: 0.7;
        
        &:hover {
          opacity: 1;
        }
      }
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  .loading-spinner {
    text-align: center;
    
    svg {
      width: 40px;
      height: 40px;
      color: $primary-color;
      margin-bottom: 1rem;
    }
    
    p {
      color: #666;
      margin: 0;
    }
  }
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  .stat-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
    }
    
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border-radius: 12px;
      
      svg {
        width: 24px;
        height: 24px;
        color: white;
      }
      
      &.total { background: linear-gradient(135deg, #667eea, #764ba2); }
      &.in-stock { background: linear-gradient(135deg, #4CAF50, #45a049); }
      &.low-stock { background: linear-gradient(135deg, #FF9800, #f57c00); }
      &.out-stock { background: linear-gradient(135deg, #F44336, #d32f2f); }
    }
    
    .stat-content {
      h6 {
        margin: 0 0 0.25rem 0;
        color: #666;
        font-size: 0.85rem;
        font-weight: 500;
      }
      
      h3 {
        margin: 0;
        color: #333;
        font-size: 1.8rem;
        font-weight: 700;
      }
    }
  }
}

.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
  background: #fafafa;
  
  .table-title {
    h6 {
      margin: 0;
      color: #333;
      font-weight: 600;
    }
    
    .result-count {
      color: #666;
      font-size: 0.9rem;
    }
  }
  
  .table-controls {
    .view-toggle {
      display: flex;
      background: #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      
      button {
        padding: 0.5rem 1rem;
        margin: 0;
        background: transparent;
        border: none;
        
        &.active {
          background: $primary-color;
          color: white;
        }
        
        svg {
          width: 20px;
          height: 20px;
        }
      }
    }
  }
}

.table-wrapper {
  overflow-x: auto;
}

.enhanced-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  
  thead th {
    background: #fafafa;
    font-weight: 600;
    color: #555;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  tbody tr {
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #f8f9fa;
    }
    
    &.selected {
      background-color: $light-blue;
    }
  }
  
  .checkbox-column {
    width: 40px;
    
    label {
      margin: 0;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #999;
  
  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }
  
  .btn {
    border-radius: 25px;
  }
}

.product-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .product-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .product-details {
    flex: 1;
    
    strong {
      display: block;
      color: #333;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }
    
    p {
      margin: 0 0 0.25rem 0;
      font-size: 0.85rem;
      color: #666;
      line-height: 1.3;
    }
    
    .product-id {
      font-size: 0.75rem;
      color: #999;
      font-family: 'Courier New', monospace;
    }
  }
}

.category-info {
  .category-badge {
    background: $light-blue;
    color: $primary-color;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }
}

.seller-info {
  strong {
    display: block;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .seller-email {
    font-size: 0.85rem;
    color: #666;
  }
}

.price-info {
  strong {
    color: $success-color;
    font-size: 1.1rem;
  }
}

.stock-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.8rem;
  
  &.in-stock {
    background: $light-green;
    color: $success-color;
  }
  
  &.low-stock {
    background: $light-orange;
    color: $warning-color;
  }
  
  &.out-of-stock {
    background: $light-red;
    color: $error-color;
  }
}

.rating-info {
  .stars {
    display: flex;
    gap: 0.125rem;
    margin-bottom: 0.25rem;
    
    svg {
      width: 14px;
      height: 14px;
      color: #ddd;
      
      &.filled {
        color: #ffc107;
      }
    }
  }
  
  .rating-text {
    font-size: 0.9rem;
    font-weight: 500;
    color: #333;
  }
  
  small {
    display: block;
    color: #666;
    font-size: 0.8rem;
    margin-top: 0.25rem;
  }
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  
  .action-btn {
    padding: 0.5rem;
    border-radius: 6px;
    min-width: auto;
    
    &:hover {
      background-color: #f0f0f0;
    }
    
    &.delete-btn:hover {
      background-color: $light-red;
      color: $error-color;
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
}

// Grid View Styles
.grid-wrapper {
  padding: 2rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: white;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }
  
  &.selected {
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    
    .card-checkbox label {
      margin: 0;
    }
    
    .card-menu {
      position: relative;
      
      .menu-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 0.5rem 0;
        min-width: 150px;
        z-index: 100;
        
        a {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          color: #333;
          text-decoration: none;
          transition: background-color 0.2s ease;
          
          &:hover {
            background-color: #f5f5f5;
          }
          
          svg {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }
  
  .card-image {
    position: relative;
    height: 200px;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .stock-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
    }
  }
  
  .card-content {
    padding: 1.5rem;
    
    h6 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-weight: 600;
    }
    
    p {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    
    .card-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      
      .price strong {
        color: $success-color;
        font-size: 1.2rem;
      }
      
      .rating {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        
        .star-icon {
          width: 16px;
          height: 16px;
          color: #ffc107;
        }
        
        span {
          font-size: 0.9rem;
          color: #333;
        }
      }
    }
    
    .card-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #666;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-top: 1px solid #eee;
  background: #fafafa;
  
  .pagination-info {
    color: #666;
    font-size: 0.9rem;
  }
  
  .pagination {
    margin: 0;
    
    li a {
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      margin: 0 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background-color: #e0e0e0;
      }
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
    
    li.active a {
      background-color: $primary-color;
      color: white;
    }
    
    li.disabled a {
      color: #ccc;
      cursor: not-allowed;
      
      &:hover {
        background-color: transparent;
      }
    }
  }
}

// Responsive Design
@media (max-width: 1200px) {
  .filters-section {
    .filter-group {
      min-width: 140px;
    }
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    
    .header-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
  
  .search-filters-container {
    padding: 1rem;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
    
    .filter-group {
      min-width: 100%;
    }
    
    .reset-filters {
      width: 100%;
      text-align: center;
    }
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination-wrapper {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .enhanced-table {
    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.85rem;
    }
  }
  
  .product-info {
    .product-image {
      width: 40px;
      height: 40px;
    }
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>