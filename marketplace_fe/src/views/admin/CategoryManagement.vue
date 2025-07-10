<template>
  <div class="container">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h4>Quản Lý Danh Mục</h4>
        <p class="header-subtitle">Quản lý và tổ chức danh mục sản phẩm</p>
      </div>
      <div class="header-actions">
        <div class="search-wrapper">
          <Search class="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm danh mục..."
            v-model="searchQuery"
            @input="debounceSearch"
          >
        </div>
        <button 
          class="btn waves-effect waves-light primary-btn modal-trigger"
          data-target="category-modal"
          @click="resetForm"
        >
          <Plus class="icon-left" />
          Thêm Danh Mục
        </button>
        <button 
          class="btn-flat waves-effect export-btn"
          @click="exportCategories"
          :disabled="filteredCategories.length === 0"
        >
          <Download class="icon-left" />
          Xuất Excel
        </button>
      </div>
    </div>
    
    <!-- Stats Overview -->
    <div class="stats-overview">
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">
            <Grid3x3 />
          </div>
          <div class="stat-content">
            <h6>Tổng Danh Mục</h6>
            <h3>{{ categories.length }}</h3>
            <span class="trend positive">+12% so với tháng trước</span>
          </div>
        </div>
        
        <div class="stat-card products">
          <div class="stat-icon">
            <Package />
          </div>
          <div class="stat-content">
            <h6>Tổng Sản Phẩm</h6>
            <h3>{{ totalProducts }}</h3>
            <span class="trend positive">+8% so với tháng trước</span>
          </div>
        </div>
        
        <div class="stat-card popular">
          <div class="stat-icon">
            <TrendingUp />
          </div>
          <div class="stat-content">
            <h6>Phổ Biến Nhất</h6>
            <h3>{{ mostPopularCategory }}</h3>
            <span class="trend neutral">{{ mostPopularCount }} sản phẩm</span>
          </div>
        </div>
        
        <div class="stat-card empty">
          <div class="stat-icon">
            <FolderOpen />
          </div>
          <div class="stat-content">
            <h6>Danh Mục Trống</h6>
            <h3>{{ emptyCategoriesCount }}</h3>
            <span class="trend warning">Cần bổ sung sản phẩm</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Categories Table -->
    <div class="table-container">
      <div class="table-header">
        <h6>Danh Sách Danh Mục</h6>
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
              <Grid3x3 />
            </button>
          </div>
          <div class="bulk-actions" v-if="selectedCategories.length > 0">
            <span class="selection-count">{{ selectedCategories.length }} đã chọn</span>
            <button class="btn-flat waves-effect" @click="bulkDelete">
              <Trash2 />
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="loading" class="loading-container">
        <div class="skeleton-loader">
          <div class="skeleton-row" v-for="i in 5" :key="i">
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
            <div class="skeleton-cell"></div>
          </div>
        </div>
      </div>
      
      <!-- Table View -->
      <div v-else-if="viewMode === 'table'" class="table-wrapper">
        <table class="enhanced-table">
          <thead>
            <tr>
              <th class="checkbox-column">
                <label>
                  <input 
                    type="checkbox" 
                    :checked="allSelected"
                    @change="toggleSelectAll"
                  >
                  <span></span>
                </label>
              </th>
              <th>Tên Danh Mục</th>
              <th>Mô Tả</th>
              <th>Số Sản Phẩm</th>
              <th>Ngày Tạo</th>
              <th>Trạng Thái</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredCategories.length === 0" class="empty-row">
              <td colspan="7" class="center-align">
                <div class="empty-state">
                  <Folder class="empty-icon" />
                  <p>{{ searchQuery ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào' }}</p>
                  <button 
                    v-if="!searchQuery"
                    class="btn waves-effect modal-trigger"
                    data-target="category-modal"
                    @click="resetForm"
                  >
                    Tạo Danh Mục Đầu Tiên
                  </button>
                </div>
              </td>
            </tr>
            <tr 
              v-for="category in filteredCategories" 
              :key="category.id"
              class="category-row"
              :class="{ selected: selectedCategories.includes(category.id) }"
            >
              <td class="checkbox-column">
                <label>
                  <input 
                    type="checkbox" 
                    :value="category.id"
                    v-model="selectedCategories"
                  >
                  <span></span>
                </label>
              </td>
              <td>
                <div class="category-info">
                  <div class="category-avatar">
                    <Folder v-if="!category.image" />
                    <img v-else :src="category.image" :alt="category.name">
                  </div>
                  <div class="category-details">
                    <strong>{{ category.name }}</strong>
                    <span class="category-id">#{{ category.id.slice(-6) }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="description-cell">
                  {{ category.description || 'Chưa có mô tả' }}
                </div>
              </td>
              <td>
                <div class="products-count">
                  <span class="count-badge" :class="getCountBadgeClass(category._count?.products)">
                    {{ category._count?.products || 0 }}
                  </span>
                  <span class="count-label">sản phẩm</span>
                </div>
              </td>
              <td>
                <div class="date-info">
                  {{ formatDate(category.createdAt) }}
                </div>
              </td>
              <td>
                <span class="status-badge" :class="getStatusClass(category._count?.products)">
                  {{ getStatusText(category._count?.products) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="btn-flat btn-small waves-effect action-btn"
                    title="Xem Sản Phẩm"
                    @click="viewProducts(category)"
                  >
                    <Eye />
                  </button>
                  <button 
                    class="btn-flat btn-small waves-effect action-btn"
                    title="Chỉnh Sửa"
                    @click="editCategory(category)"
                  >
                    <Edit />
                  </button>
                  <button 
                    class="btn-flat btn-small waves-effect action-btn delete-btn"
                    title="Xóa"
                    @click="deleteCategory(category)"
                    :disabled="category._count?.products > 0"
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
        <div v-if="filteredCategories.length === 0" class="empty-state">
          <Folder class="empty-icon" />
          <p>{{ searchQuery ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào' }}</p>
          <button 
            v-if="!searchQuery"
            class="btn waves-effect modal-trigger"
            data-target="category-modal"
            @click="resetForm"
          >
            Tạo Danh Mục Đầu Tiên
          </button>
        </div>
        
        <div class="categories-grid">
          <div 
            v-for="category in filteredCategories" 
            :key="category.id"
            class="category-card"
            :class="{ selected: selectedCategories.includes(category.id) }"
          >
            <div class="card-header">
              <label class="card-checkbox">
                <input 
                  type="checkbox" 
                  :value="category.id"
                  v-model="selectedCategories"
                >
                <span></span>
              </label>
              <div class="card-menu">
                <button class="btn-flat btn-small" @click="toggleCardMenu(category.id)">
                  <MoreVertical />
                </button>
                <div class="menu-dropdown" v-if="activeCardMenu === category.id">
                  <a @click="editCategory(category)">
                    <Edit />
                    Chỉnh Sửa
                  </a>
                  <a @click="viewProducts(category)">
                    <Eye />
                    Xem Sản Phẩm
                  </a>
                  <a 
                    @click="deleteCategory(category)"
                    :class="{ disabled: category._count?.products > 0 }"
                  >
                    <Trash2 />
                    Xóa
                  </a>
                </div>
              </div>
            </div>
            
            <div class="card-image">
              <Folder v-if="!category.image" />
              <img v-else :src="category.image" :alt="category.name">
            </div>
            
            <div class="card-content">
              <h6>{{ category.name }}</h6>
              <p>{{ category.description || 'Chưa có mô tả' }}</p>
              
              <div class="card-stats">
                <div class="stat-item">
                  <Package />
                  <span>{{ category._count?.products || 0 }} sản phẩm</span>
                </div>
                <div class="stat-item">
                  <Calendar />
                  <span>{{ formatDateShort(category.createdAt) }}</span>
                </div>
              </div>
              
              <span class="status-badge" :class="getStatusClass(category._count?.products)">
                {{ getStatusText(category._count?.products) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Enhanced Category Modal -->
    <div id="category-modal" class="modal modal-fixed-footer">
      <div class="modal-content">
        <div class="modal-header">
          <h5>{{ editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới' }}</h5>
          <button class="btn-flat modal-close">
            <X />
          </button>
        </div>
        
        <form @submit.prevent="saveCategory" class="modal-form">
          <div class="form-section">
            <h6>Thông Tin Cơ Bản</h6>
            
            <div class="row">
              <div class="input-field col s12">
                <input 
                  id="category-name" 
                  type="text" 
                  v-model="categoryForm.name"
                  required
                  maxlength="50"
                  :class="{ invalid: nameError }"
                >
                <label for="category-name">Tên Danh Mục *</label>
                <span v-if="nameError" class="helper-text error">{{ nameError }}</span>
                <span v-else class="helper-text">
                  {{ categoryForm.name?.length || 0 }}/50 ký tự
                </span>
              </div>
              
              <div class="input-field col s12">
                <textarea 
                  id="category-description" 
                  class="materialize-textarea"
                  v-model="categoryForm.description"
                  maxlength="200"
                ></textarea>
                <label for="category-description">Mô Tả</label>
                <span class="helper-text">
                  {{ categoryForm.description?.length || 0 }}/200 ký tự
                </span>
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h6>Hình Ảnh Danh Mục</h6>
            
            <div class="image-upload-area" @drop="handleDrop" @dragover.prevent @dragenter.prevent>
              <div v-if="!imagePreview" class="upload-placeholder">
                <Upload class="upload-icon" />
                <p>Kéo thả hình ảnh vào đây hoặc</p>
                <button type="button" class="btn-flat" @click="$refs.fileInput.click()">
                  Chọn Tệp
                </button>
                <input 
                  ref="fileInput"
                  type="file" 
                  accept="image/*"
                  @change="handleImageSelect"
                  hidden
                >
                <small>PNG, JPG, GIF tối đa 2MB</small>
              </div>
              
              <div v-else class="image-preview">
                <img :src="imagePreview" alt="Preview">
                <div class="image-overlay">
                  <button type="button" class="btn-flat" @click="$refs.fileInput.click()">
                    <Edit />
                  </button>
                  <button type="button" class="btn-flat" @click="removeImage">
                    <Trash2 />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer">
        <button class="modal-close btn-flat waves-effect">
          Hủy
        </button>
        <button 
          class="btn waves-effect waves-light"
          @click="saveCategory"
          :disabled="savingCategory || !categoryForm.name || nameError"
        >
          <span v-if="savingCategory">
            <Loader class="icon-left spinning" />
            Đang lưu...
          </span>
          <span v-else>
            <Save class="icon-left" />
            {{ editingCategory ? 'Cập Nhật' : 'Tạo Mới' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useToast } from 'vue-toastification'
import { 
  Search, Plus, Download, Grid3x3, Package, TrendingUp, FolderOpen,
  Table, Trash2, Folder, Eye, Edit, MoreVertical, Calendar, X, 
  Upload, Save, Loader
} from 'lucide-vue-next'
import adminService from '@/services/admin.service'
import { formatDate } from '@/utils/formatters'

const toast = useToast()

// State
const categories = ref([])
const loading = ref(false)
const savingCategory = ref(false)
const editingCategory = ref(null)
const categoryImage = ref(null)
const imagePreview = ref('')
const searchQuery = ref('')
const searchTimeout = ref(null)
const viewMode = ref('table')
const selectedCategories = ref([])
const activeCardMenu = ref(null)

const categoryForm = ref({
  name: '',
  description: ''
})

// Computed
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  
  const query = searchQuery.value.toLowerCase()
  return categories.value.filter(category => 
    category.name.toLowerCase().includes(query) ||
    (category.description || '').toLowerCase().includes(query)
  )
})

const totalProducts = computed(() => 
  categories.value.reduce((sum, cat) => sum + (cat._count?.products || 0), 0)
)

const mostPopularCategory = computed(() => {
  if (categories.value.length === 0) return 'Chưa có'
  
  const sorted = [...categories.value].sort((a, b) => 
    (b._count?.products || 0) - (a._count?.products || 0)
  )
  
  return sorted[0]?.name || 'Chưa có'
})

const mostPopularCount = computed(() => {
  if (categories.value.length === 0) return 0
  
  const sorted = [...categories.value].sort((a, b) => 
    (b._count?.products || 0) - (a._count?.products || 0)
  )
  
  return sorted[0]?._count?.products || 0
})

const emptyCategoriesCount = computed(() => 
  categories.value.filter(cat => (cat._count?.products || 0) === 0).length
)

const allSelected = computed(() => 
  filteredCategories.value.length > 0 && 
  selectedCategories.value.length === filteredCategories.value.length
)

const nameError = computed(() => {
  if (!categoryForm.value.name) return ''
  if (categoryForm.value.name.length < 2) return 'Tên danh mục phải có ít nhất 2 ký tự'
  if (categoryForm.value.name.length > 50) return 'Tên danh mục không được quá 50 ký tự'
  
  // Check duplicate name
  const existingCategory = categories.value.find(cat => 
    cat.name.toLowerCase() === categoryForm.value.name.toLowerCase() &&
    cat.id !== editingCategory.value?.id
  )
  if (existingCategory) return 'Tên danh mục đã tồn tại'
  
  return ''
})

let modalInstance = null

// Methods
const fetchCategories = async () => {
  loading.value = true
  try {
    const response = await adminService.getAllCategories()
    categories.value = response.data
  } catch (error) {
    console.error('Error fetching categories:', error)
    toast.error('Không thể tải danh sách danh mục')
  } finally {
    loading.value = false
  }
}

const refreshCategories = async () => {
  try {
    const response = await adminService.getAllCategories()
    categories.value = response.data
  } catch (error) {
    console.error('Error refreshing categories:', error)
    toast.error('Không thể làm mới danh sách danh mục')
  }
}

const debounceSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    // Search is handled by computed property
  }, 300)
}

const resetForm = () => {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    description: ''
  }
  categoryImage.value = null
  imagePreview.value = ''
}

const editCategory = (category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description || ''
  }
  
  if (category.image) {
    imagePreview.value = category.image
  }
  
  modalInstance.open()
  
  setTimeout(() => {
    M.updateTextFields()
    M.textareaAutoResize(document.getElementById('category-description'))
  }, 100)
}

const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Kích thước hình ảnh phải nhỏ hơn 2MB')
    return
  }
  
  if (!file.type.startsWith('image/')) {
    toast.error('Vui lòng chọn tệp hình ảnh')
    return
  }
  
  categoryImage.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const handleDrop = (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('image/')) {
      handleImageSelect({ target: { files: [file] } })
    } else {
      toast.error('Vui lòng thả tệp hình ảnh')
    }
  }
}

const removeImage = () => {
  categoryImage.value = null
  imagePreview.value = ''
}

const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    toast.error('Tên danh mục là bắt buộc')
    return
  }
  
  if (nameError.value) {
    toast.error(nameError.value)
    return
  }
  
  savingCategory.value = true
  
  try {
    const categoryData = {
      name: categoryForm.value.name.trim(),
      description: categoryForm.value.description.trim() || null
    }
    
    if (editingCategory.value) {
      await adminService.updateCategory(editingCategory.value.id, categoryData)
      toast.success('Cập nhật danh mục thành công')
    } else {
      const response = await adminService.createCategory(categoryData)
      
      if (categoryImage.value && response.data.id && adminService.uploadCategoryImage) {
        try {
          await adminService.uploadCategoryImage(response.data.id, categoryImage.value)
        } catch (imgError) {
          console.error('Failed to upload category image:', imgError)
        }
      }
      
      toast.success('Tạo danh mục thành công')
    }
    
    modalInstance.close()
    resetForm()
    await refreshCategories()
    
  } catch (error) {
    console.error('Error saving category:', error)
    toast.error(error.response?.data?.message || 'Không thể lưu danh mục')
  } finally {
    savingCategory.value = false
  }
}

const deleteCategory = async (category) => {
  if (category._count?.products > 0) {
    toast.error(`Không thể xóa danh mục có ${category._count.products} sản phẩm`)
    return
  }
  
  if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) return
  
  try {
    await adminService.deleteCategory(category.id)
    toast.success('Xóa danh mục thành công')
    await refreshCategories()
    
    // Remove from selected if it was selected
    selectedCategories.value = selectedCategories.value.filter(id => id !== category.id)
    
  } catch (error) {
    console.error('Error deleting category:', error)
    toast.error(error.response?.data?.message || 'Không thể xóa danh mục')
  }
}

const bulkDelete = async () => {
  if (selectedCategories.value.length === 0) return
  
  const categoriesWithProducts = selectedCategories.value.filter(id => {
    const category = categories.value.find(cat => cat.id === id)
    return category?._count?.products > 0
  })
  
  if (categoriesWithProducts.length > 0) {
    toast.error('Không thể xóa danh mục có sản phẩm')
    return
  }
  
  if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedCategories.value.length} danh mục đã chọn?`)) return
  
  try {
    await Promise.all(selectedCategories.value.map(id => adminService.deleteCategory(id)))
    toast.success(`Đã xóa ${selectedCategories.value.length} danh mục thành công`)
    selectedCategories.value = []
    await refreshCategories()
  } catch (error) {
    console.error('Error bulk deleting categories:', error)
    toast.error('Không thể xóa các danh mục đã chọn')
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedCategories.value = []
  } else {
    selectedCategories.value = filteredCategories.value.map(cat => cat.id)
  }
}

const toggleCardMenu = (categoryId) => {
  activeCardMenu.value = activeCardMenu.value === categoryId ? null : categoryId
}

const viewProducts = (category) => {
  // Navigate to products page with category filter
  toast.info(`Xem sản phẩm của danh mục: ${category.name}`)
}

const exportCategories = () => {
  toast.info('Tính năng xuất Excel đang được phát triển')
}

const getCountBadgeClass = (count) => {
  if (count === 0) return 'empty'
  if (count < 5) return 'low'
  if (count < 20) return 'medium'
  return 'high'
}

const getStatusClass = (count) => {
  if (count === 0) return 'empty'
  if (count < 5) return 'low'
  return 'active'
}

const getStatusText = (count) => {
  if (count === 0) return 'Trống'
  if (count < 5) return 'Ít sản phẩm'
  return 'Hoạt động'
}

const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit'
  })
}

// Lifecycle
onMounted(async () => {
  await fetchCategories()
  
  const modalElem = document.getElementById('category-modal')
  modalInstance = M.Modal.init(modalElem, {
    onCloseEnd: resetForm
  })
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

.search-icon {
  position: absolute;
  left: 12px;
  width: 20px;
  height: 20px;
  color: #666;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #ccc;
  margin-bottom: 1rem;
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
    
    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      
      i {
        position: absolute;
        left: 12px;
        color: #666;
        font-size: 1.2rem;
      }
      
      input {
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1px solid #ddd;
        border-radius: 25px;
        width: 300px;
        font-size: 0.9rem;
        
        &:focus {
          outline: none;
          border-color: $primary-color;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }
      }
    }
    
    .primary-btn {
      background: linear-gradient(135deg, $primary-color 0%, #1976D2 100%);
      border-radius: 25px;
      padding: 0 1.5rem;
      
      &:hover {
        background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
      }
    }
    
    .export-btn {
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
  }
}

.stats-overview {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }
  
  &.total::before { background: linear-gradient(90deg, #667eea, #764ba2); }
  &.products::before { background: linear-gradient(90deg, #f093fb, #f5576c); }
  &.popular::before { background: linear-gradient(90deg, #4facfe, #00f2fe); }
  &.empty::before { background: linear-gradient(90deg, #fa709a, #fee140); }
  
  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    
    svg {
      width: 32px;
      height: 32px;
      color: white;
    }
  }
  
  &.total .stat-icon { background: linear-gradient(135deg, #667eea, #764ba2); }
  &.products .stat-icon { background: linear-gradient(135deg, #f093fb, #f5576c); }
  &.popular .stat-icon { background: linear-gradient(135deg, #4facfe, #00f2fe); }
  &.empty .stat-icon { background: linear-gradient(135deg, #fa709a, #fee140); }
  
  .stat-content {
    flex: 1;
    
    h6 {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1;
    }
    
    .trend {
      font-size: 0.8rem;
      font-weight: 500;
      
      &.positive { color: $success-color; }
      &.warning { color: $warning-color; }
      &.neutral { color: #666; }
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
  
  h6 {
    margin: 0;
    color: #333;
    font-weight: 600;
  }
  
  .table-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    
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
    
    .bulk-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: $light-blue;
      border-radius: 8px;
      
      .selection-count {
        font-size: 0.9rem;
        color: $primary-color;
        font-weight: 500;
      }
      
      button {
        color: $primary-color;
        
        &:hover {
          background-color: rgba(33, 150, 243, 0.1);
        }
        
        svg {
          width: 18px;
          height: 18px;
        }
      }
    }
  }
}

.loading-container {
  padding: 2rem;
}

.skeleton-loader {
  .skeleton-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    
    .skeleton-cell {
      height: 40px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
      flex: 1;
      
      &:first-child { flex: 0 0 40px; }
      &:last-child { flex: 0 0 120px; }
    }
  }
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
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
    position: sticky;
    top: 0;
    z-index: 10;
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
  
  i {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
  }
  
  button {
    border-radius: 25px;
  }
}

.category-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .category-avatar {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: $light-blue;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    
    svg {
      color: $primary-color;
      width: 24px;
      height: 24px;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .category-details {
    strong {
      display: block;
      color: #333;
      font-size: 1rem;
    }
    
    .category-id {
      font-size: 0.8rem;
      color: #666;
      font-family: 'Courier New', monospace;
    }
  }
}

.description-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666;
}

.products-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .count-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.8rem;
    
    &.empty {
      background: $light-red;
      color: $error-color;
    }
    
    &.low {
      background: $light-orange;
      color: $warning-color;
    }
    
    &.medium {
      background: $light-blue;
      color: $primary-color;
    }
    
    &.high {
      background: $light-green;
      color: $success-color;
    }
  }
  
  .count-label {
    font-size: 0.85rem;
    color: #666;
  }
}

.date-info {
  font-size: 0.9rem;
  color: #666;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  
  &.empty {
    background: $light-red;
    color: $error-color;
  }
  
  &.low {
    background: $light-orange;
    color: $warning-color;
  }
  
  &.active {
    background: $light-green;
    color: $success-color;
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
    
    &.delete-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
}

// Grid View Styles
.grid-wrapper {
  padding: 2rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.category-card {
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
          
          &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
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
    height: 150px;
    background: $light-blue;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      width: 48px;
      height: 48px;
      color: $primary-color;
      opacity: 0.7;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
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
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .card-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #666;
        font-size: 0.85rem;
        
        svg {
          width: 16px;
          height: 16px;
        }
      }
    }
  }
}

// Modal Styles
.modal {
  max-width: 600px;
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    
    h5 {
      margin: 0;
      color: #333;
    }
    
    button {
      color: #666;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      svg {
        width: 20px;
        height: 20px;
      }
    }
  }
}

.modal-form {
  .form-section {
    margin-bottom: 2rem;
    
    h6 {
      margin: 0 0 1rem 0;
      color: #555;
      font-weight: 500;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #eee;
    }
  }
  
  .helper-text {
    &.error {
      color: $error-color;
    }
  }
}

.image-upload-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: border-color 0.2s ease;
  
  &:hover {
    border-color: $primary-color;
  }
  
  .upload-placeholder {
    svg {
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 1rem;
    }
    
    p {
      margin: 0 0 1rem 0;
      color: #666;
    }
    
    small {
      color: #999;
      font-size: 0.8rem;
    }
  }
  
  .image-preview {
    position: relative;
    display: inline-block;
    
    img {
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
    }
    
    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      opacity: 0;
      transition: opacity 0.2s ease;
      
      button {
        background: white;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        
        svg {
          width: 20px;
          height: 20px;
          color: #333;
        }
      }
    }
    
    &:hover .image-overlay {
      opacity: 1;
    }
  }
}

// Responsive Design
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .categories-grid {
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
      
      .search-wrapper input {
        width: 100%;
      }
    }
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    
    .table-controls {
      justify-content: space-between;
    }
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .enhanced-table {
    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.9rem;
    }
  }
  
  .category-info {
    .category-avatar {
      width: 32px;
      height: 32px;
      
      svg {
        width: 20px;
        height: 20px;
      }
    }
  }
  
  .description-cell {
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .modal {
    width: 95%;
    margin: 2.5% auto;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>