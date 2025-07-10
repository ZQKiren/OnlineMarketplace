<!-- src/views/profile/MyProducts.vue -->
<template>
  <div class="container">
    <div class="row">
      <div class="col s12">
        <h4>My Products</h4>
        <router-link 
          to="/products/create" 
          class="btn waves-effect waves-light right"
        >
          <Plus class="icon-left" />
          Add New Product
        </router-link>
      </div>
    </div>
    
    <div v-if="loading" class="loading-spinner">
      <LoadingSpinner text="Loading your products..." />
    </div>
    
    <div v-else-if="products.length === 0" class="no-products">
      <Package class="large-icon" />
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
                  <Star class="star-icon" />
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
                    <Eye class="action-icon" />
                  </router-link>
                  
                  <router-link 
                    :to="`/products/edit/${product.id}`"
                    class="btn-flat btn-small waves-effect"
                    title="Edit"
                  >
                    <Edit class="action-icon" />
                  </router-link>
                  
                  <button 
                    class="btn-flat btn-small waves-effect red-text"
                    title="Delete"
                    @click="deleteProduct(product.id)"
                  >
                    <Trash2 class="action-icon" />
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
            <Package class="stat-icon blue-icon" />
            <h5>{{ totalProducts }}</h5>
            <p>Total Products</p>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <ShoppingCart class="stat-icon green-icon" />
            <h5>{{ totalSales }}</h5>
            <p>Total Sales</p>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <DollarSign class="stat-icon orange-icon" />
            <h5>${{ totalRevenue.toFixed(2) }}</h5>
            <p>Total Revenue</p>
          </div>
        </div>
        
        <div class="col s12 m3">
          <div class="stat-card custom-card">
            <Star class="stat-icon amber-icon" />
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

// Lucide Icons
import {
  Plus,
  Package,
  Star,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  DollarSign
} from 'lucide-vue-next'

const toast = useToast()

const products = ref([])
const loading = ref(false)

// Local placeholder files
const localPlaceholders = [
  '/placeholder.jpg',
  '/placeholder.png', 
  '/no-image.jpg',
  '/default-product.jpg'
]

// Create SVG placeholder
const createSVGPlaceholder = (width = 60, height = 60) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f5f5f5" stroke="#e0e0e0"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="10" dy=".3em">No Image</text>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// Get product image URL with fallbacks
const getProductImageUrl = (product) => {
  const firstImage = product.images?.[0]
  
  if (firstImage) {
    const url = getStaticUrl(firstImage)
    if (url) return url
  }
  
  return localPlaceholders[0]
}

const handleImageError = (event) => {
  const currentSrc = event.target.src
  
  // Try backend image fallback
  if (currentSrc.includes('localhost:5000') || currentSrc.startsWith('http')) {
    event.target.src = localPlaceholders[0]
    return
  }
  
  // Try next placeholder
  const currentIndex = localPlaceholders.indexOf(currentSrc)
  if (currentIndex !== -1 && currentIndex < localPlaceholders.length - 1) {
    event.target.src = localPlaceholders[currentIndex + 1]
    return
  }
  
  // Ultimate fallback
  event.target.src = createSVGPlaceholder(60, 60)
}

const handleImageLoad = (event) => {
  // XÓA console.log và console.error không cần thiết
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
    const response = await productService.getUserProducts()
    
    products.value = response.data.map(product => {
      // Calculate average rating
      const avgRating = product._count?.reviews > 0 ? 
        (product.reviews?.reduce((acc, r) => acc + r.rating, 0) || 0) / product._count.reviews : 0
      
      return {
        ...product,
        avgRating
      }
    })
  } catch (error) {
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
    toast.error('Failed to delete product. Please try again.')
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped lang="scss">
.icon-left {
  width: 18px;
  height: 18px;
  margin-right: 8px;
}

.large-icon {
  width: 64px;
  height: 64px;
  color: #ccc;
}

.star-icon {
  width: 16px;
  height: 16px;
  color: #ffc107;
}

.action-icon {
  width: 18px;
  height: 18px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 15px;
}

.blue-icon { color: #2196f3; }
.green-icon { color: #4caf50; }
.orange-icon { color: #ff9800; }
.amber-icon { color: #ffc107; }

.no-products {
  text-align: center;
  padding: 60px 0;
  
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
      background-color: #f9f9f9;
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
  }
  
  .actions {
    display: flex;
    gap: 5px;
    
    button,
    a {
      padding: 0;
      min-width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
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

.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

// Responsive
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
      }
    }
  }
  
  .stats-summary {
    .stat-card {
      padding: 20px 15px;
      
      .stat-icon {
        width: 36px;
        height: 36px;
      }
      
      h5 {
        font-size: 1.4rem;
      }
    }
  }
}
</style>