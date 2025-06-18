<!-- src/components/recommendation/SimilarProducts.vue -->
<template>
  <div class="similar-products" v-if="shouldShow">
    <div class="section-header">
      <h5 class="section-title">
        <i class="material-icons left">compare</i>
        Similar Products
      </h5>
      <p class="section-subtitle">You might also like these products</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="preloader-wrapper small active">
        <div class="spinner-layer spinner-blue-only">
          <div class="circle-clipper left">
            <div class="circle"></div>
          </div>
        </div>
      </div>
      <p class="loading-text">Finding similar products...</p>
    </div>

    <!-- Products Grid -->
    <div v-else class="similar-grid">
      <ProductCard 
        v-for="product in similarProducts" 
        :key="product.id" 
        :product="product"
        @click="handleProductClick(product.id)"
      />
    </div>
  </div>
</template>

<script>
import { computed, watch, ref } from 'vue'
import { useRecommendationStore } from '@/stores/recommendation'
import ProductCard from '@/components/product/ProductCard.vue'

export default {
  name: 'SimilarProducts',
  components: { ProductCard },
  
  props: {
    productId: {
      type: String,
      required: true
    },
    limit: {
      type: Number,
      default: 6
    }
  },
  
  setup(props) {
    const recommendationStore = useRecommendationStore()
    const loading = ref(false)
    
    const similarProducts = computed(() => recommendationStore.similarProducts)
    
    const shouldShow = computed(() => {
      return !loading.value && similarProducts.value.length > 0
    })
    
    const handleProductClick = async (productId) => {
      await recommendationStore.trackProductView(productId)
    }
    
    const fetchSimilarProducts = async () => {
      if (!props.productId) return
      
      loading.value = true
      try {
        await recommendationStore.fetchSimilarProducts(props.productId, props.limit)
      } finally {
        loading.value = false
      }
    }
    
    // Watch for productId changes
    watch(() => props.productId, fetchSimilarProducts, { immediate: true })
    
    return {
      similarProducts,
      loading,
      shouldShow,
      handleProductClick
    }
  }
}
</script>

<style scoped lang="scss">
.similar-products {
  margin: 60px 0;
  
  .section-header {
    text-align: center;
    margin-bottom: 40px;
    
    .section-title {
      color: #1976d2;
      margin-bottom: 12px;
      font-weight: 500;
      font-size: 1.8rem;
      
      i {
        color: #4caf50;
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
    padding: 50px 20px;
    
    .preloader-wrapper {
      margin: 0 auto 20px;
    }
    
    .loading-text {
      color: #666;
      font-style: italic;
      font-size: 1rem;
      margin: 0;
    }
  }
  
  .similar-grid {
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
}
</style>