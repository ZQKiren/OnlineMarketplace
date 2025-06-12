<!-- src/views/admin/CategoryManagement.vue -->
<template>
  <div class="container">
    <h4>Category Management</h4>
    
    <div class="row">
      <div class="col s12">
        <button 
          class="btn waves-effect waves-light modal-trigger"
          data-target="category-modal"
          @click="resetForm"
        >
          <i class="material-icons left">add</i>
          Add Category
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Loading categories..." />
    </div>
    
    <div v-else class="row">
      <!-- Categories List -->
      <div class="col s12">
        <div class="custom-card">
          <table class="striped responsive-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Products Count</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id">
                <td>
                  <strong>{{ category.name }}</strong>
                </td>
                <td>{{ category.description || 'No description' }}</td>
                <td>
                  <span class="badge">{{ category._count?.products || 0 }}</span>
                </td>
                <td>{{ formatDate(category.createdAt) }}</td>
                <td>
                  <div class="actions">
                    <button 
                      class="btn-flat btn-small waves-effect"
                      title="Edit"
                      @click="editCategory(category)"
                    >
                      <i class="material-icons">edit</i>
                    </button>
                    
                    <button 
                      class="btn-flat btn-small waves-effect"
                      title="Delete"
                      @click="deleteCategory(category)"
                      :disabled="category._count?.products > 0"
                    >
                      <i class="material-icons">delete</i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="categories.length === 0" class="no-data">
            <i class="material-icons large">category</i>
            <p>No categories found</p>
          </div>
        </div>
      </div>
      
      <!-- Category Stats -->
      <div class="col s12">
        <div class="row">
          <div class="col s12 m4">
            <div class="stat-card custom-card">
              <i class="material-icons">apps</i>
              <h6>Total Categories</h6>
              <h5>{{ categories.length }}</h5>
            </div>
          </div>
          
          <div class="col s12 m4">
            <div class="stat-card custom-card">
              <i class="material-icons">dvr</i>
              <h6>Total Products</h6>
              <h5>{{ totalProducts }}</h5>
            </div>
          </div>
          
          <div class="col s12 m4">
            <div class="stat-card custom-card">
              <i class="material-icons">trending_up</i>
              <h6>Most Popular</h6>
              <h5>{{ mostPopularCategory }}</h5>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Category Modal -->
    <div id="category-modal" class="modal">
      <div class="modal-content">
        <h5>{{ editingCategory ? 'Edit Category' : 'Create New Category' }}</h5>
        
        <form @submit.prevent="saveCategory">
          <div class="row">
            <div class="input-field col s12">
              <input 
                id="category-name" 
                type="text" 
                v-model="categoryForm.name"
                required
                maxlength="50"
              >
              <label for="category-name">Category Name</label>
            </div>
            
            <div class="input-field col s12">
              <textarea 
                id="category-description" 
                class="materialize-textarea"
                v-model="categoryForm.description"
                maxlength="200"
              ></textarea>
              <label for="category-description">Description (Optional)</label>
              <span class="helper-text">
                {{ categoryForm.description?.length || 0 }}/200 characters
              </span>
            </div>
            
            <!-- Category Image (optional) -->
            <div class="file-field input-field col s12">
              <div class="btn">
                <span>Category Image</span>
                <input 
                  type="file" 
                  accept="image/*"
                  @change="handleImageSelect"
                >
              </div>
              <div class="file-path-wrapper">
                <input 
                  class="file-path validate" 
                  type="text" 
                  placeholder="Upload category image (optional)"
                >
              </div>
            </div>
            
            <div v-if="imagePreview" class="col s12">
              <div class="image-preview">
                <img :src="imagePreview" alt="Category preview">
                <button 
                  type="button"
                  class="btn-flat btn-small"
                  @click="removeImage"
                >
                  <i class="material-icons">close</i>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="modal-footer">
        <button 
          class="modal-close btn-flat waves-effect"
        >
          Cancel
        </button>
        <button 
          class="btn waves-effect waves-light"
          @click="saveCategory"
          :disabled="savingCategory || !categoryForm.name"
        >
          {{ savingCategory ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import adminService from '@/services/admin.service' // Chuyển sang admin service
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate } from '@/utils/formatters'

const toast = useToast()

// Local state thay vì dùng store để dễ quản lý
const categories = ref([])
const loading = ref(false)
const savingCategory = ref(false)
const editingCategory = ref(null)
const categoryImage = ref(null)
const imagePreview = ref('')

const categoryForm = ref({
  name: '',
  description: ''
})

const totalProducts = computed(() => 
  categories.value.reduce((sum, cat) => sum + (cat._count?.products || 0), 0)
)

const mostPopularCategory = computed(() => {
  if (categories.value.length === 0) return 'N/A'
  
  const sorted = [...categories.value].sort((a, b) => 
    (b._count?.products || 0) - (a._count?.products || 0)
  )
  
  return sorted[0]?.name || 'N/A'
})

let modalInstance = null

// Fetch categories từ admin service
const fetchCategories = async () => {
  loading.value = true
  try {
    const response = await adminService.getAllCategories()
    categories.value = response.data
    console.log('Categories loaded:', categories.value.length)
  } catch (error) {
    console.error('Error fetching categories:', error)
    toast.error('Failed to load categories')
  } finally {
    loading.value = false
  }
}

// Force refresh categories - xóa cache và load lại
const refreshCategories = async () => {
  console.log('Refreshing categories...')
  try {
    const response = await adminService.getAllCategories()
    categories.value = response.data
    console.log('Categories refreshed:', categories.value.length)
  } catch (error) {
    console.error('Error refreshing categories:', error)
    toast.error('Failed to refresh categories')
  }
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
  
  modalInstance.open()
  
  // Update labels
  setTimeout(() => {
    M.updateTextFields()
  }, 100)
}

const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Image size must be less than 2MB')
    return
  }
  
  categoryImage.value = file
  
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  categoryImage.value = null
  imagePreview.value = ''
}

const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    toast.error('Category name is required')
    return
  }
  
  savingCategory.value = true
  
  try {
    const categoryData = {
      name: categoryForm.value.name.trim(),
      description: categoryForm.value.description.trim() || null
    }
    
    if (editingCategory.value) {
      // Update category
      console.log('Updating category:', editingCategory.value.id, categoryData)
      await adminService.updateCategory(editingCategory.value.id, categoryData)
      toast.success('Category updated successfully')
    } else {
      // Create category
      console.log('Creating category:', categoryData)
      const response = await adminService.createCategory(categoryData)
      
      // Upload image if provided (nếu có endpoint này)
      if (categoryImage.value && response.data.id && adminService.uploadCategoryImage) {
        try {
          await adminService.uploadCategoryImage(response.data.id, categoryImage.value)
        } catch (imgError) {
          console.warn('Failed to upload category image:', imgError)
        }
      }
      
      toast.success('Category created successfully')
    }
    
    modalInstance.close()
    resetForm()
    
    // Tự động refresh danh sách categories
    await refreshCategories()
    
  } catch (error) {
    console.error('Error saving category:', error)
    toast.error(error.response?.data?.message || 'Failed to save category')
  } finally {
    savingCategory.value = false
  }
}

const deleteCategory = async (category) => {
  if (category._count?.products > 0) {
    toast.error(`Cannot delete category with ${category._count.products} products`)
    return
  }
  
  if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return
  
  try {
    console.log('Deleting category:', category.id)
    await adminService.deleteCategory(category.id)
    toast.success('Category deleted successfully')
    
    // Tự động refresh danh sách categories
    await refreshCategories()
    
  } catch (error) {
    console.error('Error deleting category:', error)
    toast.error(error.response?.data?.message || 'Failed to delete category')
  }
}

onMounted(() => {
  fetchCategories()
  
  // Initialize modal
  const modalElem = document.getElementById('category-modal')
  modalInstance = M.Modal.init(modalElem, {
    onCloseEnd: resetForm
  })
})
</script>

<style scoped lang="scss">
.custom-card {
  overflow: visible;
}

.no-data {
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

.actions {
  display: flex;
  gap: 5px;
  
  button {
    padding: 0;
    width: 30px;
    height: 30px;
    
    i {
      font-size: 18px;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.badge {
  background: #1976d2;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.875rem;
}

.stat-card {
  text-align: center;
  padding: 30px 20px;
  
  i {
    font-size: 48px;
    color: #1976d2;
    margin-bottom: 10px;
  }
  
  h6 {
    margin: 10px 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  h5 {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
  }
}

.image-preview {
  position: relative;
  display: inline-block;
  margin: 20px 0;
  
  img {
    max-width: 200px;
    max-height: 200px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }
  
  button {
    position: absolute;
    top: -10px;
    right: -10px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    width: 30px;
    height: 30px;
    padding: 0;
    
    i {
      font-size: 18px;
      color: #f44336;
    }
  }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
.material-icons {
  width: 48px;
}
</style>