<!-- src/components/product/ProductFilter.vue - OPTIMIZED with Lucide Icons -->
<template>
  <div class="product-filters">
    <!-- Search Input -->
    <div class="filter-group">
      <label class="filter-label">
        <Search :size="16" />
        <span>Search Products</span>
      </label>
      <div class="input-wrapper">
        <input 
          v-model="filters.search"
          @input="debouncedEmit"
          type="text" 
          placeholder="Search by name, description..."
          class="filter-input"
        />
        <button 
          v-if="filters.search" 
          @click="clearSearch"
          class="clear-btn"
          type="button"
        >
          <X :size="14" />
        </button>
      </div>
    </div>
    
    <!-- Category Filter -->
    <div class="filter-group">
      <label class="filter-label">
        <Tag :size="16" />
        <span>Category</span>
      </label>
      <div class="select-wrapper">
        <select v-model="filters.categoryId" @change="emitFilters" class="filter-select">
          <option value="">All Categories</option>
          <option 
            v-for="category in categories" 
            :key="category.id" 
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        <ChevronDown :size="16" class="select-icon" />
      </div>
    </div>
    
    <!-- Price Range Filter -->
    <div class="filter-group">
      <label class="filter-label">
        <DollarSign :size="16" />
        <span>Price Range</span>
      </label>
      <div class="price-inputs">
        <div class="price-input-wrapper">
          <input 
            v-model.number="filters.minPrice"
            @change="emitFilters"
            type="number" 
            placeholder="Min"
            min="0"
            step="0.01"
            class="price-input"
          />
        </div>
        <span class="price-separator">-</span>
        <div class="price-input-wrapper">
          <input 
            v-model.number="filters.maxPrice"
            @change="emitFilters"
            type="number" 
            placeholder="Max"
            min="0"
            step="0.01"
            class="price-input"
          />
        </div>
      </div>
      <div v-if="priceError" class="error-message">
        <AlertTriangle :size="12" />
        <span>{{ priceError }}</span>
      </div>
    </div>
    
    <!-- Rating Filter -->
    <div class="filter-group">
      <label class="filter-label">
        <Star :size="16" />
        <span>Minimum Rating</span>
      </label>
      <div class="rating-options">
        <label 
          v-for="rating in ratingOptions" 
          :key="rating.value"
          class="rating-option"
        >
          <input 
            v-model="filters.minRating"
            :value="rating.value"
            @change="emitFilters"
            type="radio" 
            name="rating"
            class="rating-radio"
          />
          <div class="rating-display">
            <div class="stars">
              <Star 
                v-for="i in 5" 
                :key="i"
                :size="14"
                :fill="i <= rating.value ? '#ffc107' : 'none'"
                :stroke="i <= rating.value ? '#ffc107' : '#e0e0e0'"
                class="star-icon"
              />
            </div>
            <span class="rating-text">{{ rating.label }}</span>
          </div>
        </label>
        
        <!-- Clear rating option -->
        <label class="rating-option">
          <input 
            v-model="filters.minRating"
            :value="null"
            @change="emitFilters"
            type="radio" 
            name="rating"
            class="rating-radio"
          />
          <div class="rating-display">
            <span class="rating-text">Any Rating</span>
          </div>
        </label>
      </div>
    </div>
    
    <!-- Applied Filters Summary -->
    <div v-if="hasActiveFilters" class="applied-filters">
      <div class="applied-header">
        <Filter :size="14" />
        <span>Active Filters</span>
      </div>
      <div class="filter-tags">
        <div v-if="filters.search" class="filter-tag">
          <span>Search: "{{ truncateText(filters.search, 15) }}"</span>
          <button @click="removeFilter('search')" class="tag-remove">
            <X :size="12" />
          </button>
        </div>
        
        <div v-if="filters.categoryId && selectedCategory" class="filter-tag">
          <span>{{ selectedCategory.name }}</span>
          <button @click="removeFilter('categoryId')" class="tag-remove">
            <X :size="12" />
          </button>
        </div>
        
        <div v-if="filters.minPrice || filters.maxPrice" class="filter-tag">
          <span>
            ${{ filters.minPrice || '0' }} - ${{ filters.maxPrice || '∞' }}
          </span>
          <button @click="removeFilter('price')" class="tag-remove">
            <X :size="12" />
          </button>
        </div>
        
        <div v-if="filters.minRating" class="filter-tag">
          <span>{{ filters.minRating }}+ stars</span>
          <button @click="removeFilter('minRating')" class="tag-remove">
            <X :size="12" />
          </button>
        </div>
        
        <div v-if="filters.inStockOnly" class="filter-tag">
          <span>In Stock</span>
          <button @click="removeFilter('inStockOnly')" class="tag-remove">
            <X :size="12" />
          </button>
        </div>
      </div>
    </div>
    
    <!-- Clear All Button -->
    <div class="filter-actions">
      <button 
        v-if="hasActiveFilters"
        @click="clearAllFilters"
        class="clear-all-btn"
      >
        <RotateCcw :size="16" />
        <span>Clear All Filters</span>
      </button>
      
      <div v-if="hasActiveFilters" class="filter-count">
        {{ activeFilterCount }} filter{{ activeFilterCount > 1 ? 's' : '' }} applied
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCategoryStore } from '@/stores/category'
import { debounce } from 'lodash-es'

// Lucide Icons
import {
  Search,
  Tag,
  DollarSign,
  Star,
  Package,
  Filter,
  ChevronDown,
  X,
  AlertTriangle,
  CheckCircle2,
  Circle,
  RotateCcw
} from 'lucide-vue-next'

const emit = defineEmits(['filter-change'])

const categoryStore = useCategoryStore()
const categories = ref([])

const filters = ref({
  search: '',
  categoryId: '',
  minPrice: null,
  maxPrice: null,
  minRating: null
  // XÓA: inStockOnly: false
})

// Rating options for better UX
const ratingOptions = [
  { value: 4, label: '4+ stars' },
  { value: 3, label: '3+ stars' },
  { value: 2, label: '2+ stars' },
  { value: 1, label: '1+ stars' }
]

// Computed properties
const hasActiveFilters = computed(() => {
  return filters.value.search !== '' ||
         filters.value.categoryId !== '' ||
         filters.value.minPrice !== null ||
         filters.value.maxPrice !== null ||
         filters.value.minRating !== null
         // XÓA: || filters.value.inStockOnly
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.search) count++
  if (filters.value.categoryId) count++
  if (filters.value.minPrice || filters.value.maxPrice) count++
  if (filters.value.minRating) count++
  // XÓA: if (filters.value.inStockOnly) count++
  return count
})

const selectedCategory = computed(() => {
  if (!filters.value.categoryId) return null
  return categories.value.find(cat => cat.id === filters.value.categoryId)
})

const priceError = computed(() => {
  if (filters.value.minPrice && filters.value.maxPrice) {
    if (Number(filters.value.minPrice) > Number(filters.value.maxPrice)) {
      return 'Min price cannot be greater than max price'
    }
  }
  if (filters.value.minPrice && Number(filters.value.minPrice) < 0) {
    return 'Price cannot be negative'
  }
  if (filters.value.maxPrice && Number(filters.value.maxPrice) < 0) {
    return 'Price cannot be negative'
  }
  return null
})

// Methods
const emitFilters = () => {
  // Don't emit if there's a price error
  if (priceError.value) return
  
  // Clean up the filters before emitting
  const cleanFilters = { ...filters.value }
  
  // Convert empty strings to null
  Object.keys(cleanFilters).forEach(key => {
    if (cleanFilters[key] === '' || cleanFilters[key] === undefined) {
      cleanFilters[key] = null
    }
  })
  
  // REMOVE inStockOnly if it's false or convert to a different property name
  if (!cleanFilters.inStockOnly) {
    delete cleanFilters.inStockOnly
  } else {
    // Đổi tên thành 'inStock' hoặc 'availability' tùy theo API của bạn
    cleanFilters.inStock = true
    delete cleanFilters.inStockOnly
  }
  
  emit('filter-change', cleanFilters)
}

const debouncedEmit = debounce(emitFilters, 300)

const clearSearch = () => {
  filters.value.search = ''
  emitFilters()
}

// Cập nhật removeFilter method:
const removeFilter = (filterKey) => {
  switch (filterKey) {
    case 'search':
      filters.value.search = ''
      break
    case 'categoryId':
      filters.value.categoryId = ''
      break
    case 'price':
      filters.value.minPrice = null
      filters.value.maxPrice = null
      break
    case 'minRating':
      filters.value.minRating = null
      break
    // XÓA case 'inStockOnly'
  }
  emitFilters()
}

const clearAllFilters = () => {
  filters.value = {
    search: '',
    categoryId: '',
    minPrice: null,
    maxPrice: null,
    minRating: null
    // XÓA: inStockOnly: false
  }
  emitFilters()
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Watch for price changes to validate
watch(() => [filters.value.minPrice, filters.value.maxPrice], () => {
  // Only emit if there's no error
  if (!priceError.value) {
    debouncedEmit()
  }
}, { deep: true })

// Lifecycle
onMounted(async () => {
  try {
    await categoryStore.fetchCategories()
    categories.value = categoryStore.categories
  } catch (error) {
    console.error('Error loading categories:', error)
  }
})

// Expose methods for parent component
defineExpose({
  clearAllFilters,
  hasActiveFilters: () => hasActiveFilters.value
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables';

.product-filters {
  .filter-group {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .filter-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }
  }
  
  // Input styles
  .input-wrapper {
    position: relative;
    
    .filter-input {
      width: 100%;
      padding: 12px 16px;
      padding-right: 40px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
      }
      
      &::placeholder {
        color: #999;
      }
    }
    
    .clear-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #666;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #f5f5f5;
        color: #333;
      }
    }
  }
  
  // Select styles
  .select-wrapper {
    position: relative;
    
    .filter-select {
      width: 100%;
      padding: 12px 40px 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      font-size: 0.9rem;
      cursor: pointer;
      appearance: none;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
      }
    }
    
    .select-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
      pointer-events: none;
    }
  }
  
  // Price inputs
  .price-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .price-input-wrapper {
      flex: 1;
      
      .price-input {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 0.85rem;
        text-align: center;
        transition: all 0.3s ease;
        
        &:focus {
          outline: none;
          border-color: $primary-color;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
        }
        
        &::placeholder {
          color: #999;
        }
        
        // Remove number input arrows
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        &[type=number] {
          appearance: textfield;
          -moz-appearance: textfield;
        }
      }
    }
    
    .price-separator {
      color: #666;
      font-weight: 500;
      flex-shrink: 0;
    }
  }
  
  .error-message {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #f44336;
    font-size: 0.75rem;
    margin-top: 4px;
  }
  
  // Rating options
  .rating-options {
    .rating-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      cursor: pointer;
      transition: background 0.3s ease;
      border-radius: 6px;
      
      &:hover {
        background: #f8f9fa;
      }
      
      .rating-radio {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      
      .rating-display {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        
        .stars {
          display: flex;
          gap: 1px;
          
          .star-icon {
            transition: all 0.2s ease;
          }
        }
        
        .rating-text {
          font-size: 0.85rem;
          color: #555;
          font-weight: 500;
        }
      }
    }
  }
  
  // Checkbox options
  .checkbox-options {
    .checkbox-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      cursor: pointer;
      transition: background 0.3s ease;
      border-radius: 6px;
      
      &:hover {
        background: #f8f9fa;
      }
      
      .filter-checkbox {
        display: none;
      }
      
      .checkbox-display {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .check-icon {
          color: $primary-color;
          transition: all 0.3s ease;
        }
        
        span {
          font-size: 0.85rem;
          color: #555;
          font-weight: 500;
        }
      }
    }
  }
  
  // Applied filters
  .applied-filters {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    
    .applied-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
      font-size: 0.85rem;
    }
    
    .filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      
      .filter-tag {
        display: flex;
        align-items: center;
        gap: 6px;
        background: $primary-color;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        
        span {
          white-space: nowrap;
        }
        
        .tag-remove {
          background: transparent;
          border: none;
          color: white;
          padding: 2px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.3s ease;
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        }
      }
    }
  }
  
  // Filter actions
  .filter-actions {
    .clear-all-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 16px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: darken(#f44336, 10%);
        transform: translateY(-1px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    .filter-count {
      text-align: center;
      font-size: 0.75rem;
      color: #666;
      margin-top: 8px;
      font-weight: 500;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .product-filters {
    .filter-group {
      margin-bottom: 20px;
    }
    
    .price-inputs {
      flex-direction: column;
      
      .price-separator {
        transform: rotate(90deg);
        margin: 4px 0;
      }
    }
    
    .applied-filters {
      padding: 12px;
      
      .filter-tags .filter-tag {
        font-size: 0.7rem;
        padding: 3px 6px;
      }
    }
  }
}

// Focus states for accessibility
.filter-input:focus,
.filter-select:focus,
.price-input:focus,
.clear-all-btn:focus {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
}

// Smooth transitions
* {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>