<!-- src/views/products/EditProduct.vue -->
<template>
  <div class="container">
    <div class="row">
      <div class="col s12">
        <h4>Edit Product</h4>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Loading product..." />
    </div>
    
    <form v-else @submit.prevent="handleSubmit">
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
              <label for="name" class="active">Product Name</label>
            </div>
            
            <div class="input-field">
              <textarea 
                id="description" 
                class="materialize-textarea"
                v-model="form.description"
                required
                maxlength="1000"
              ></textarea>
              <label for="description" class="active">Description</label>
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
                <label for="price" class="active">Price ($)</label>
              </div>
              
              <div class="input-field col s6">
                <input 
                  id="stock" 
                  type="number" 
                  min="0"
                  v-model.number="form.stock"
                  required
                >
                <label for="stock" class="active">Stock Quantity</label>
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
            
            <!-- Existing Images -->
            <div v-if="existingImages.length > 0" class="existing-images">
              <p>Current Images:</p>
              <div class="image-preview">
                <div 
                  v-for="(image, index) in existingImages" 
                  :key="index"
                  class="preview-item"
                >
                  <img :src="image" :alt="`Product image ${index + 1}`">
                  <button 
                    type="button"
                    class="btn-flat btn-small remove-btn"
                    @click="removeExistingImage(index)"
                  >
                    <i class="material-icons">close</i>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Add New Images -->
            <div class="file-field input-field">
              <div class="btn">
                <span>Add New Images</span>
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
            
            <!-- New Images Preview -->
            <div v-if="newImagePreview.length > 0" class="new-images">
              <p>New Images to Upload:</p>
              <div class="image-preview">
                <div 
                  v-for="(image, index) in newImagePreview" 
                  :key="index"
                  class="preview-item"
                >
                  <img :src="image.url" :alt="`New image ${index + 1}`">
                  <button 
                    type="button"
                    class="btn-flat btn-small remove-btn"
                    @click="removeNewImage(index)"
                  >
                    <i class="material-icons">close</i>
                  </button>
                </div>
              </div>
            </div>
            
            <p class="helper-text">
              <i class="material-icons tiny">info</i>
              You must have at least one image for your product
            </p>
          </div>
        </div>
        
        <!-- Sidebar -->
        <div class="col s12 m4">
          <div class="custom-card">
            <h5>Publishing</h5>
            
            <div class="publishing-info">
              <p><strong>Created:</strong> {{ formatDate(product?.createdAt) }}</p>
              <p><strong>Last Updated:</strong> {{ formatDate(product?.updatedAt) }}</p>
              <p><strong>Seller:</strong> {{ product?.seller?.name }}</p>
            </div>
            
            <div class="action-buttons">
              <button 
                type="submit" 
                class="btn waves-effect waves-light full-width"
                :disabled="submitting || !hasChanges"
              >
                {{ submitting ? 'Updating...' : 'Update Product' }}
              </button>
              
              <button 
                type="button"
                class="btn-flat waves-effect full-width"
                @click="handleCancel"
              >
                Cancel
              </button>
              
              <router-link 
                :to="`/products/${productId}`"
                class="btn-flat waves-effect full-width"
              >
                View Product
              </router-link>
            </div>
          </div>
          
          <!-- Product Stats -->
          <div class="custom-card" v-if="product">
            <h5>Product Stats</h5>
            <div class="stats">
              <p>
                <i class="material-icons tiny">shopping_cart</i>
                <strong>Sales:</strong> {{ product._count?.orderItems || 0 }}
              </p>
              <p>
                <i class="material-icons tiny">star</i>
                <strong>Reviews:</strong> {{ product._count?.reviews || 0 }}
              </p>
              <p v-if="product.avgRating">
                <i class="material-icons tiny">grade</i>
                <strong>Rating:</strong> {{ product.avgRating.toFixed(1) }}/5
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useCategoryStore } from '@/stores/category'
import productService from '@/services/product.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate } from '@/utils/formatters'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const categoryStore = useCategoryStore()

const productId = computed(() => route.params.id)
const categories = computed(() => categoryStore.categories)

const loading = ref(true)
const submitting = ref(false)
const product = ref(null)

const form = ref({
  name: '',
  description: '',
  price: null,
  stock: null,
  categoryId: ''
})

const existingImages = ref([])
const imagesToRemove = ref([])
const newImageFiles = ref([])
const newImagePreview = ref([])

const originalForm = ref(null)

const hasChanges = computed(() => {
  if (!originalForm.value) return false
  
  // Check if form fields changed
  const formChanged = JSON.stringify(form.value) !== JSON.stringify(originalForm.value)
  
  // Check if images changed
  const imagesChanged = imagesToRemove.value.length > 0 || newImageFiles.value.length > 0
  
  return formChanged || imagesChanged
})

const fetchProduct = async () => {
  loading.value = true
  
  try {
    const response = await productService.getProductById(productId.value)
    product.value = response.data
    
    // Populate form
    form.value = {
      name: product.value.name,
      description: product.value.description,
      price: product.value.price,
      stock: product.value.stock,
      categoryId: product.value.categoryId
    }
    
    // Store original form for comparison
    originalForm.value = { ...form.value }
    
    // Set existing images
    existingImages.value = [...(product.value.images || [])]
    
    // Initialize select after data is loaded
    setTimeout(() => {
      const elems = document.querySelectorAll('select')
      M.FormSelect.init(elems)
    }, 100)
  } catch (error) {
    console.error('Error fetching product:', error)
    toast.error('Product not found')
    router.push('/my-products')
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} is too large. Maximum size is 5MB`)
      return
    }
    
    newImageFiles.value.push(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      newImagePreview.value.push({
        url: e.target.result,
        file: file
      })
    }
    reader.readAsDataURL(file)
  })
}

const removeExistingImage = (index) => {
  const imageUrl = existingImages.value[index]
  existingImages.value.splice(index, 1)
  imagesToRemove.value.push(imageUrl)
}

const removeNewImage = (index) => {
  newImagePreview.value.splice(index, 1)
  newImageFiles.value.splice(index, 1)
}

const handleSubmit = async () => {
  // Validate at least one image
  const totalImages = existingImages.value.length + newImageFiles.value.length
  if (totalImages === 0) {
    toast.error('Please upload at least one image')
    return
  }
  
  submitting.value = true
  
  try {
    // Prepare update data
    const updateData = {
      ...form.value,
      imagesToRemove: imagesToRemove.value,
      newImages: newImageFiles.value
    }
    
    await productService.updateProduct(productId.value, updateData)
    toast.success('Product updated successfully!')
    router.push('/my-products')
  } catch (error) {
    console.error('Error updating product:', error)
    toast.error('Failed to update product')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  if (hasChanges.value) {
    if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return
    }
  }
  router.push('/my-products')
}

onMounted(async () => {
  await categoryStore.fetchCategories()
  await fetchProduct()
})

// Watch for route changes (in case user navigates between edit pages)
watch(() => route.params.id, (newId) => {
  if (newId && newId !== productId.value) {
    fetchProduct()
  }
})
</script>

<style scoped lang="scss">
.custom-card {
  h5 {
    margin-bottom: 20px;
  }
}

.existing-images,
.new-images {
  margin-bottom: 20px;
  
  p {
    font-weight: 500;
    margin-bottom: 10px;
  }
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  
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
        color: #f44336;
      }
    }
  }
}

.publishing-info {
  margin-bottom: 20px;
  
  p {
    margin: 10px 0;
    font-size: 0.95rem;
  }
}

.action-buttons {
  .full-width {
    width: 100%;
    margin-bottom: 10px;
  }
}

.stats {
  p {
    margin: 10px 0;
    display: flex;
    align-items: center;
    gap: 5px;
    
    i {
      color: #666;
    }
  }
}

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.helper-text {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  margin-top: 10px;
  
  i {
    color: #1976d2;
  }
}
</style>