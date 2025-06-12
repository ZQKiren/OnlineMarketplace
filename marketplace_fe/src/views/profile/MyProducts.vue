<!-- src/views/profile/MyProducts.vue - Using Local Placeholder -->
<template>
  <div class="container">
    <div class="row">
      <div class="col s12">
        <h4>My Products</h4>
        <router-link 
          to="/products/create" 
          class="btn waves-effect waves-light right"
        >
          <i class="material-icons left">add</i>
          Add New Product
        </router-link>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Loading your products..." />
    </div>
    
    <div v-else-if="products.length === 0" class="no-products">
      <i class="material-icons large">inventory_2</i>
      <p>You haven't listed any products yet</p>
      <router-link to="/products/create" class="btn waves-effect waves-light">
        Create Your First Product
      </router-link>
    </div>
    
    <div v-else>
      <!-- Products Table -->
      <div class="products-table custom-card">
        <table class="striped responsive-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Sales</th>
              <th>Reviews</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td>
                <div class="product-info">
                  <img 
                    :src="getProductImageUrl(product)" 
                    :alt="product.name"
                    @error="handleImageError"
                    @load="handleImageLoad"
                    class="product-thumbnail"
                  >
                  <div class="product-details">
                    <strong>{{ product.name }}</strong>
                    <p>{{ truncateText(product.description, 50) }}</p>
                  </div>
                </div>
              </td>
              <td>{{ product.category?.name || 'N/A' }}</td>
              <td>${{ product.price?.toFixed(2) || '0.00' }}</td>
              <td>
                <span 
                  class="stock-badge"
                  :class="{ 'out-of-stock': product.stock === 0 }"
                >
                  {{ product.stock || 0 }}
                </span>
              </td>
              <td>{{ product._count?.orderItems || 0 }}</td>
              <td>
                <div class="rating-info">
                  <i class="material-icons tiny">star</i>
                  {{ product.avgRating?.toFixed(1) || 'N/A' }}
                  ({{ product._count?.reviews || 0 }})
                </div>
              </td>
              <td>
                <div class="actions">
                  <router-link 
                    :to="`/products/${product.id}`"
                    class="btn-flat btn-small waves-effect"
                    title="View"
                  >
                    <i class="material-icons">visibility</i>
                  </router-link>
                  
                  <router-link 
                    :to="`/products/edit/${product.id}`"
                    class="btn-flat btn-small waves-effect"
                    title="Edit"
                  >
                    <i class="material-icons">edit</i>
                  </router-link>
                  
                  <button 
                    class="btn-flat btn-small waves-effect red-text"
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
      </div>
      
      <!-- Stats Summary -->
      <div class="row stats-summary">
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <i class="material-icons blue-text">inventory_2</i>
            <h5>{{ totalProducts }}</h5>
            <p>Total Products</p>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <i class="material-icons green-text">shopping_cart</i>
            <h5>{{ totalSales }}</h5>
            <p>Total Sales</p>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <i class="material-icons orange-text">attach_money</i>
            <h5>${{ totalRevenue.toFixed(2) }}</h5>
            <p>Total Revenue</p>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <i class="material-icons amber-text">star</i>
            <h5>{{ averageRating.toFixed(1) }}</h5>
            <p>Average Rating</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import productService from '@/services/product.service'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { truncateText } from '@/utils/formatters'
import { getStaticUrl } from '@/services/api'

const toast = useToast()

const products = ref([])
const loading = ref(false)

// Local placeholder files (from public folder)
const localPlaceholders = [
  '/placeholder.jpg',
  '/placeholder.png', 
  '/no-image.jpg',
  '/default-product.jpg'
]

// Create a simple SVG placeholder as ultimate fallback
const createSVGPlaceholder = (width = 60, height = 60) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f5f5f5" stroke="#e0e0e0"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="10" dy=".3em">No Image</text>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// Get product image URL with local fallbacks
const getProductImageUrl = (product) => {
  const firstImage = product.images?.[0]
  
  if (firstImage) {
    const url = getStaticUrl(firstImage)
    if (url) {
      console.log('✅ Generated image URL for', product.name, ':', url)
      return url
    }
  }
  
  console.log('⚠️ No image for', product.name, ', using local placeholder')
  return localPlaceholders[0] // Default to /placeholder.jpg
}

const handleImageError = (event) => {
  console.error('❌ Table image failed to load:', event.target.src)
  
  const currentSrc = event.target.src
  
  // If it's a backend image that failed, try local placeholder
  if (currentSrc.includes('localhost:5000') || currentSrc.startsWith('http')) {
    console.log('🔄 Backend image failed, trying local placeholder...')
    event.target.src = localPlaceholders[0]
    return
  }
  
  // If current placeholder failed, try next one
  const currentIndex = localPlaceholders.indexOf(currentSrc)
  if (currentIndex !== -1 && currentIndex < localPlaceholders.length - 1) {
    console.log('🔄 Trying next local placeholder...')
    event.target.src = localPlaceholders[currentIndex + 1]
    return
  }
  
  // Ultimate fallback - inline SVG
  console.log('🔄 All local placeholders failed, using SVG fallback')
  event.target.src = createSVGPlaceholder(60, 60)
}

const handleImageLoad = (event) => {
  console.log('✅ Table image loaded successfully:', event.target.src)
}

// Computed stats
const totalProducts = computed(() => products.value.length)

const totalSales = computed(() => 
  products.value.reduce((sum, p) => sum + (p._count?.orderItems || 0), 0)
)

const totalRevenue = computed(() => 
  products.value.reduce((sum, p) => sum + ((p.price || 0) * (p._count?.orderItems || 0)), 0)
)

const averageRating = computed(() => {
  const withRatings = products.value.filter(p => p.avgRating)
  if (withRatings.length === 0) return 0
  
  const sum = withRatings.reduce((acc, p) => acc + p.avgRating, 0)
  return sum / withRatings.length
})

const fetchProducts = async () => {
  loading.value = true
  
  try {
    console.log('🔄 Fetching user products...')
    const response = await productService.getUserProducts()
    
    products.value = response.data.map(product => {
      // Calculate average rating if reviews exist
      const avgRating = product._count?.reviews > 0 ? 
        (product.reviews?.reduce((acc, r) => acc + r.rating, 0) || 0) / product._count.reviews : 0
      
      console.log('📦 Product loaded:', {
        name: product.name,
        images: product.images,
        avgRating
      })
      
      return {
        ...product,
        avgRating
      }
    })
    
    console.log('✅ Total products loaded:', products.value.length)
  } catch (error) {
    console.error('❌ Error fetching products:', error)
    toast.error('Failed to load products. Please try again.')
  } finally {
    loading.value = false
  }
}

const deleteProduct = async (productId) => {
  if (!confirm('Are you sure you want to delete this product?')) return
  
  try {
    await productService.deleteProduct(productId)
    toast.success('Product deleted successfully')
    await fetchProducts()
  } catch (error) {
    console.error('❌ Error deleting product:', error)
    toast.error('Failed to delete product. Please try again.')
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped lang="scss">
.no-products {
  text-align: center;
  padding: 60px 0;
  
  i {
    color: #ccc;
  }
  
  p {
    font-size: 1.2rem;
    color: #666;
    margin: 20px 0;
  }
}

.products-table {
  overflow-x: auto;
  
  table {
    min-width: 800px;
  }
  
  .product-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .product-thumbnail {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      flex-shrink: 0;
      transition: opacity 0.3s ease;
      background-color: #f9f9f9; // Fallback background
    }
    
    .product-details {
      flex: 1;
      
      strong {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
      }
      
      p {
        margin: 0;
        font-size: 0.85rem;
        color: #666;
        line-height: 1.3;
      }
    }
  }
  
  .stock-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
    font-size: 0.85rem;
    background: #e8f5e9;
    color: #2e7d32;
    
    &.out-of-stock {
      background: #ffebee;
      color: #c62828;
    }
  }
  
  .rating-info {
    display: flex;
    align-items: center;
    gap: 4px;
    
    i {
      color: #ffc107;
      font-size: 16px;
    }
  }
  
  .actions {
    display: flex;
    gap: 5px;
    
    button,
    a {
      padding: 0;
      min-width: 36px;
      height: 36px;
      
      i {
        font-size: 18px;
      }
    }
  }
}

.stats-summary {
  margin-top: 30px;
  
  .stat-card {
    text-align: center;
    padding: 30px 20px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    i {
      font-size: 48px;
      margin-bottom: 15px;
    }
    
    h5 {
      margin: 10px 0;
      font-size: 1.8rem;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }
  }
}

// Loading spinner
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

// Responsive improvements
@media (max-width: 768px) {
  .products-table {
    .product-info {
      .product-thumbnail {
        width: 40px;
        height: 40px;
      }
      
      .product-details {
        strong {
          font-size: 0.9rem;
        }
        
        p {
          font-size: 0.8rem;
        }
      }
    }
    
    .actions {
      flex-direction: column;
      gap: 2px;
      
      button,
      a {
        min-width: 32px;
        height: 32px;
        
        i {
          font-size: 16px;
        }
      }
    }
  }
  
  .stats-summary {
    .stat-card {
      padding: 20px 15px;
      
      i {
        font-size: 36px;
      }
      
      h5 {
        font-size: 1.4rem;
      }
    }
  }
}
</style>