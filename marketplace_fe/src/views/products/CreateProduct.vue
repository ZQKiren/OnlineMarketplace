<!-- src/views/products/CreateProduct.vue -->
<template>
  <div class="container">
    <div class="row">
      <div class="col s12">
        <h4>{{ isEditMode ? 'Edit Product' : 'Create New Product' }}</h4>
      </div>
    </div>
    
    <form @submit.prevent="handleSubmit">
      <div class="row">
        <div class="col s12 m8">
          <!-- Product Information -->
          <div class="custom-card">
            <h5>Product Information</h5>
            
            <div class="input-field">
              <input 
                id="name" 
                type="text" 
                v-model="form.name"
                required
                maxlength="100"
              >
              <label for="name">Product Name</label>
            </div>
            
            <div class="input-field">
              <textarea 
                id="description" 
                class="materialize-textarea"
                v-model="form.description"
                required
                maxlength="1000"
              ></textarea>
              <label for="description">Description</label>
              <span class="helper-text">
                {{ form.description.length }}/1000 characters
              </span>
            </div>
            
            <div class="row">
              <div class="input-field col s6">
                <input 
                  id="price" 
                  type="number" 
                  step="0.01"
                  min="0"
                  v-model.number="form.price"
                  required
                >
                <label for="price">Price ($)</label>
              </div>
              
              <div class="input-field col s6">
                <input 
                  id="stock" 
                  type="number" 
                  min="0"
                  v-model.number="form.stock"
                  required
                >
                <label for="stock">Stock Quantity</label>
              </div>
            </div>
            
            <div class="input-field">
              <select v-model="form.categoryId" required>
                <option value="" disabled>Choose a category</option>
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
          </div>
          
          <!-- Product Images -->
          <div class="custom-card">
            <h5>Product Images</h5>
            
            <div class="file-field input-field">
              <div class="btn">
                <span>Upload Images</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  @change="handleFileSelect"
                >
              </div>
              <div class="file-path-wrapper">
                <input 
                  class="file-path validate" 
                  type="text" 
                  placeholder="Upload one or more images"
                >
              </div>
            </div>
            
            <div class="image-preview" v-if="imagePreview.length > 0">
              <div 
                v-for="(image, index) in imagePreview" 
                :key="index"
                class="preview-item"
              >
                <img :src="image.url" :alt="`Preview ${index + 1}`">
                <button 
                  type="button"
                  class="btn-flat btn-small remove-btn"
                  @click="removeImage(index)"
                >
                  <i class="material-icons">close</i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sidebar -->
        <div class="col s12 m4">
          <div class="custom-card">
            <h5>Publishing</h5>
            
            <div class="publishing-info">
              <p><strong>Status:</strong> {{ isEditMode ? 'Published' : 'Draft' }}</p>
              <p><strong>Visibility:</strong> Public</p>
            </div>
            
            <div class="action-buttons">
              <button 
                type="submit" 
                class="btn waves-effect waves-light full-width"
                :disabled="submitting"
              >
                {{ submitting ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product') }}
              </button>
              
              <button 
                type="button"
                class="btn-flat waves-effect full-width"
                @click="handleCancel"
              >
                Cancel
              </button>
            </div>
          </div>
          
          <!-- Preview -->
          <div class="custom-card" v-if="form.name || form.price">
            <h5>Preview</h5>
            <div class="preview">
              <h6>{{ form.name || 'Product Name' }}</h6>
              <p class="price">${{ form.price?.toFixed(2) || '0.00' }}</p>
              <p class="description">{{ truncateText(form.description, 100) }}</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCategoryStore } from '@/stores/category'
import productService from '@/services/product.service'
import { truncateText } from '@/utils/formatters'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const categoryStore = useCategoryStore()

const productId = computed(() => route.params.id)
const isEditMode = computed(() => !!productId.value)

const categories = computed(() => categoryStore.categories)
const submitting = ref(false)

const form = ref({
  name: '',
  description: '',
  price: null,
  stock: null,
  categoryId: '',
  images: [] // Not used for file input, handled by imageFiles
})

const imageFiles = ref([])
const imagePreview = ref([])

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} is too large. Maximum size is 5MB`)
      return
    }
    
    imageFiles.value.push(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value.push({
        url: e.target.result,
        file: file
      })
    }
    reader.readAsDataURL(file)
  })
}

const removeImage = (index) => {
  imagePreview.value.splice(index, 1)
  imageFiles.value.splice(index, 1)
}

const handleSubmit = async () => {
  // Validation
  if (!form.value.name || !form.value.price || !form.value.categoryId) {
    toast.error('Please fill in all required fields')
    return
  }
  
  if (!isEditMode.value && imageFiles.value.length === 0) {
    toast.error('Please upload at least one image')
    return
  }

  // Ensure numeric values
  const price = parseFloat(form.value.price)
  const stock = parseInt(form.value.stock)
  
  if (isNaN(price) || price < 0) {
    toast.error('Price must be a valid positive number')
    return
  }
  
  if (isNaN(stock) || stock < 0) {
    toast.error('Stock must be a valid positive number')
    return
  }
  
  submitting.value = true
  
  try {
    if (isEditMode.value) {
      // For edit mode - send JSON data (no file upload for now)
      const updateData = {
        name: form.value.name,
        description: form.value.description,
        price: price,
        stock: stock,
        categoryId: form.value.categoryId
      }
      
      await productService.updateProduct(productId.value, updateData)
      toast.success('Product updated successfully!')
    } else {
      // For create mode - prepare data for FormData
      const productData = {
        name: form.value.name,
        description: form.value.description,
        price: price,
        stock: stock,
        categoryId: form.value.categoryId,
        images: imageFiles.value // Pass the actual files
      }
      
      await productService.createProduct(productData)
      toast.success('Product created successfully!')
    }
    
    router.push('/my-products')
  } catch (error) {
    console.error('Error saving product:', error.response?.data || error.message)
    
    // Show more detailed error message
    if (error.response?.data?.message) {
      if (Array.isArray(error.response.data.message)) {
        error.response.data.message.forEach(msg => toast.error(msg))
      } else {
        toast.error(error.response.data.message)
      }
    } else {
      toast.error('Failed to save product. Please try again.')
    }
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
    router.push('/my-products')
  }
}

const fetchProduct = async () => {
  try {
    const response = await productService.getProductById(productId.value)
    const product = response.data
    
    form.value = {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      images: product.images || []
    }
    
    imagePreview.value = (product.images || []).map(url => ({ url }))
  } catch (error) {
    console.error('Error fetching product:', error)
    toast.error('Product not found')
    router.push('/my-products')
  }
}

onMounted(async () => {
  await categoryStore.fetchCategories()
  
  if (isEditMode.value) {
    await fetchProduct()
  }
  
  setTimeout(() => {
    const elems = document.querySelectorAll('select')
    M.FormSelect.init(elems)
  }, 100)
})
</script>

<style scoped lang="scss">
.custom-card {
  h5 {
    margin-bottom: 20px;
  }
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
  
  .preview-item {
    position: relative;
    width: 120px;
    height: 120px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }
    
    .remove-btn {
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
      }
    }
  }
}

.publishing-info {
  margin-bottom: 20px;
  
  p {
    margin: 10px 0;
  }
}

.action-buttons {
  .full-width {
    width: 100%;
    margin-bottom: 10px;
  }
}

.preview {
  h6 {
    margin: 0 0 10px 0;
  }
  
  .price {
    font-size: 1.5rem;
    color: #1976d2;
    font-weight: 600;
    margin: 10px 0;
  }
  
  .description {
    color: #666;
    font-size: 0.95rem;
  }
}
</style>