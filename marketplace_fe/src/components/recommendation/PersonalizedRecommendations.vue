<!-- src/components/recommendation/PersonalizedRecommendations.vue -->
<template>
  <div class="personalized-recommendations">
    <div class="section-header">
      <h5 class="section-title">
        
        {{ title }}
      </h5>
      <p class="section-subtitle">{{ subtitle }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="progress">
        <div class="indeterminate"></div>
      </div>
      <p class="loading-text">Finding perfect products for you...</p>
    </div>

    <!-- Recommendations Grid -->
    <div v-else-if="recommendations.length > 0" class="recommendations-grid">
      <ProductCard 
        v-for="product in recommendations" 
        :key="product.id" 
        :product="product"
        @click="handleProductClick(product.id)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <i class="material-icons large">explore</i>
        <h6>No recommendations yet</h6>
        <p>Browse some products to get personalized recommendations!</p>
        <router-link to="/products" class="btn waves-effect waves-light">
          <i class="material-icons left">shopping_bag</i>
          Explore Products
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRecommendationStore } from '@/stores/recommendation'
import { useAuthStore } from '@/stores/auth'
import ProductCard from '@/components/product/ProductCard.vue'

export default {
  name: 'PersonalizedRecommendations',
  components: { ProductCard },
  
  props: {
    title: {
      type: String,
      default: 'Recommended for You'
    },
    subtitle: {
      type: String, 
      default: 'Products picked just for you based on your interests'
    },
    limit: {
      type: Number,
      default: 8
    }
  },
  
  setup(props) {
    const recommendationStore = useRecommendationStore()
    const authStore = useAuthStore()
    
    const recommendations = computed(() => recommendationStore.personalizedRecommendations)
    const loading = computed(() => recommendationStore.loading)
    
    const handleProductClick = async (productId) => {
      // Track product view when user clicks
      await recommendationStore.trackProductView(productId)
    }
    
    onMounted(async () => {
      if (authStore.isAuthenticated) {
        await recommendationStore.fetchPersonalizedRecommendations(props.limit)
      }
    })
    
    return {
      recommendations,
      loading,
      handleProductClick
    }
  }
}
</script>

<style scoped lang="scss">
.personalized-recommendations {
  margin: 0;
  
  .section-header {
    text-align: center;
    margin-bottom: 40px;
    
    .section-title {
      color: #1976d2;
      margin-bottom: 12px;
      font-weight: 500;
      font-size: 2rem;
      
      i {
        color: #ff9800;
        vertical-align: middle;
        margin-right: 8px;
      }
    }
    
    .section-subtitle {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
      line-height: 1.5;
    }
  }
  
  .loading-container {
    text-align: center;
    padding: 60px 20px;
    
    .progress {
      width: 250px;
      margin: 0 auto 25px;
      height: 4px;
      
      .indeterminate {
        background-color: #1976d2;
      }
    }
    
    .loading-text {
      color: #666;
      font-style: italic;
      font-size: 1rem;
      margin: 0;
    }
  }
  
  .recommendations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;
    margin-top: 20px;
    
    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
      gap: 15px;
    }
  }
  
  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    padding: 40px 20px;
    
    .empty-content {
      text-align: center;
      max-width: 400px;
      
      i {
        font-size: 4rem;
        margin-bottom: 25px;
        opacity: 0.5;
        color: #999;
      }
      
      h6 {
        margin-bottom: 15px;
        color: #555;
        font-size: 1.4rem;
        font-weight: 500;
      }
      
      p {
        margin-bottom: 30px;
        font-size: 1.1rem;
        color: #666;
        line-height: 1.5;
      }
      
      .btn {
        background: #1976d2;
        transition: all 0.3s ease;
        
        &:hover {
          background: #1565c0;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3);
        }
      }
    }
  }
}
</style>