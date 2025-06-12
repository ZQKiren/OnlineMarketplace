<!-- src/components/product/ProductFilter.vue -->
<template>
  <div class="product-filters">
    <h5>Filters</h5>
    
    <!-- Search -->
    <div class="input-field">
      <i class="material-icons prefix">search</i>
      <input 
        id="search" 
        type="text" 
        v-model="filters.search"
        @input="debouncedEmit"
      >
      <label for="search">Search products</label>
    </div>
    
    <!-- Category -->
    <div class="input-field">
      <select v-model="filters.categoryId" @change="emitFilters">
        <option value="">All Categories</option>
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
    
    <!-- Price Range -->
    <div class="price-range">
      <label>Price Range</label>
      <div class="row">
        <div class="col s6">
          <input 
            type="number" 
            placeholder="Min" 
            v-model.number="filters.minPrice"
            @change="emitFilters"
          >
        </div>
        <div class="col s6">
          <input 
            type="number" 
            placeholder="Max" 
            v-model.number="filters.maxPrice"
            @change="emitFilters"
          >
        </div>
      </div>
    </div>
    
    <!-- Rating -->
    <div class="rating-filter">
      <label>Minimum Rating</label>
      <div class="rating-options">
        <label v-for="rating in [4, 3, 2, 1]" :key="rating">
          <input 
            type="radio" 
            name="rating" 
            :value="rating"
            v-model="filters.minRating"
            @change="emitFilters"
          >
          <span>
            <i class="material-icons" v-for="i in 5" :key="i">
              {{ i <= rating ? 'star' : 'star_border' }}
            </i>
            & up
          </span>
        </label>
      </div>
    </div>
    
    <!-- Clear Filters -->
    <button 
      class="btn-flat waves-effect full-width"
      @click="clearFilters"
    >
      Clear Filters
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { debounce } from 'lodash-es'

const emit = defineEmits(['filter-change'])

const categoryStore = useCategoryStore()
const categories = ref([])

const filters = ref({
  search: '',
  categoryId: '',
  minPrice: null,
  maxPrice: null,
  minRating: null
})

const emitFilters = () => {
  emit('filter-change', { ...filters.value })
}

const debouncedEmit = debounce(emitFilters, 500)

const clearFilters = () => {
  filters.value = {
    search: '',
    categoryId: '',
    minPrice: null,
    maxPrice: null,
    minRating: null
  }
  emitFilters()
}

onMounted(async () => {
  await categoryStore.fetchCategories()
  categories.value = categoryStore.categories
  
  // Initialize select
  setTimeout(() => {
    const elems = document.querySelectorAll('select')
    M.FormSelect.init(elems)
  }, 100)
})
</script>

<style scoped lang="scss">
.product-filters {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h5 {
    margin-bottom: 20px;
  }
  
  .price-range {
    margin: 20px 0;
    
    label {
      font-weight: 500;
      color: #666;
    }
    
    input {
      text-align: center;
    }
  }
  
  .rating-filter {
    margin: 20px 0;
    
    label {
      font-weight: 500;
      color: #666;
    }
    
    .rating-options {
      label {
        display: block;
        margin: 10px 0;
        cursor: pointer;
        
        span {
          margin-left: 10px;
          
          i {
            font-size: 16px;
            color: #ffc107;
            vertical-align: middle;
          }
        }
      }
    }
  }
  
  .full-width {
    width: 100%;
  }
}
</style>