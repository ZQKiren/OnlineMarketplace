<!-- src/components/recommendation/TrendingProducts.vue -->
<template>
  <div class="trending-products">
    <div class="section-header">
      <h5 class="section-title">
        <i class="material-icons left">trending_up</i>
        Trending Now
      </h5>
      <p class="section-subtitle">Hot products everyone's talking about</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="progress">
        <div class="indeterminate"></div>
      </div>
      <p class="loading-text">Loading trending products...</p>
    </div>

    <!-- Trending Grid -->
    <div v-else-if="trendingProducts.length > 0" class="trending-grid">
      <div 
        v-for="(product, index) in trendingProducts" 
        :key="product.id"
        class="trending-item"
        :class="{ 'featured': index < 2 }"
        @click="handleProductClick(product.id)"
      >
        <!-- Trending Badge -->
        <div class="trending-badge">
          <i class="material-icons">local_fire_department</i>
          <span class="rank">{{ index + 1 }}</span>
        </div>
        
        <ProductCard :product="product" />
        
        <!-- Trending Stats -->
        <div class="trending-stats">
          <span class="stat">
            <i class="material-icons">visibility</i>
            {{ formatViews(product.recentViews || product.viewCount) }} views
          </span>
          <span class="stat">
            <i class="material-icons">star</i>
            {{ product.avgRating?.toFixed(1) || '0.0' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <i class="material-icons large">trending_flat</i>
        <h6>No trending products</h6>
        <p>Check back later for trending products</p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
import { useRecommendationStore } from '@/stores/recommendation'
import ProductCard from '@/components/product/ProductCard.vue'

export default {
  name: 'TrendingProducts',
  components: { ProductCard },
  
  props: {
    limit: {
      type: Number,
      default: 8
    }
  },
  
  setup(props) {
    const recommendationStore = useRecommendationStore()
    
    const trendingProducts = computed(() => recommendationStore.trendingProducts)
    const loading = computed(() => recommendationStore.trendingLoading)
    
    const handleProductClick = async (productId) => {
      await recommendationStore.trackProductView(productId)
    }
    
    const formatViews = (views) => {
      if (!views) return '0'
      if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M'
      }
      if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'k'
      }
      return views.toString()
    }
    
    onMounted(async () => {
      await recommendationStore.fetchTrendingProducts(props.limit)
    })
    
    return {
      trendingProducts,
      loading,
      handleProductClick,
      formatViews
    }
  }
}
</script>

<style scoped lang="scss">
.trending-products {
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
        color: #ff5722;
        vertical-align: middle;
        margin-right: 4px;
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
        background-color: #ff5722;
      }
    }
    
    .loading-text {
      color: #666;
      font-style: italic;
      font-size: 1rem;
      margin: 0;
    }
  }
  
  .trending-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 25px;
    
    @media (max-width: 768px) {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
      gap: 15px;
    }
  }
  
  .trending-item {
    position: relative;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    &.featured {
      .trending-badge {
        background: linear-gradient(45deg, #ff5722, #ff9800);
        animation: pulse 2s infinite;
        box-shadow: 0 4px 15px rgba(255, 87, 34, 0.4);
        
        i {
          color: #fff;
        }
        
        .rank {
          color: #fff;
        }
      }
    }
    
    .trending-badge {
      position: absolute;
      top: -12px;
      left: -12px;
      background: linear-gradient(45deg, #1976d2, #2196f3);
      color: white;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      z-index: 2;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      
      i {
        font-size: 14px;
        margin-right: 2px;
      }
      
      .rank {
        font-size: 12px;
        font-weight: 700;
        display: none;
      }
    }
    
    .trending-stats {
      position: absolute;
      top: 15px;
      right: 15px;
      background: rgba(0,0,0,0.8);
      padding: 8px 10px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      backdrop-filter: blur(10px);
      z-index: 3;
      
      .stat {
        display: flex;
        align-items: center;
        gap: 4px;
        color: white;
        font-size: 12px;
        font-weight: 500;
        
        i {
          font-size: 14px;
          opacity: 0.9;
        }
      }
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
        margin: 0;
        font-size: 1.1rem;
        color: #666;
        line-height: 1.5;
      }
    }
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

// Additional mobile responsive improvements
@media (max-width: 600px) {
  .trending-products {
    .section-header {
      margin-bottom: 30px;
      
      .section-title {
        font-size: 1.6rem;
      }
      
      .section-subtitle {
        font-size: 1rem;
      }
    }
    
    .trending-item {
      .trending-badge {
        width: 38px;
        height: 38px;
        top: -10px;
        left: -10px;
        
        i {
          font-size: 12px;
        }
        
        .rank {
          font-size: 11px;
        }
      }
      
      .trending-stats {
        top: 10px;
        right: 10px;
        padding: 6px 8px;
        
        .stat {
          font-size: 11px;
          
          i {
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>