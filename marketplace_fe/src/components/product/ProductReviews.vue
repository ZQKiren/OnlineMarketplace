<!-- src/components/product/ProductReviews.vue -->
<template>
  <div class="product-reviews">
    <h5>Customer Reviews</h5>
    
    <!-- Review Stats -->
    <div class="review-stats" v-if="stats">
      <div class="average-rating">
        <h3>{{ stats.averageRating.toFixed(1) }}</h3>
        <div class="stars">
          <i class="material-icons" v-for="i in 5" :key="i">
            {{ i <= Math.round(stats.averageRating) ? 'star' : 'star_border' }}
          </i>
        </div>
        <p>{{ stats.totalReviews }} reviews</p>
      </div>
      
      <div class="rating-distribution">
        <div 
          v-for="rating in [5, 4, 3, 2, 1]" 
          :key="rating"
          class="rating-bar"
        >
          <span>{{ rating }} star</span>
          <div class="progress">
            <div 
              class="determinate"
              :style="{ width: getPercentage(rating) + '%' }"
            ></div>
          </div>
          <span>{{ stats.distribution[rating] || 0 }}</span>
        </div>
      </div>
    </div>
    
    <!-- Add Review Form -->
    <div v-if="canReview && !hasReviewed" class="add-review">
      <h6>Write a Review</h6>
      <form @submit.prevent="submitReview">
        <div class="rating-input">
          <label>Rating:</label>
          <div class="star-rating">
            <i 
              v-for="star in 5" 
              :key="star"
              class="material-icons"
              :class="{ active: star <= newReview.rating }"
              @click="newReview.rating = star"
            >
              {{ star <= newReview.rating ? 'star' : 'star_border' }}
            </i>
          </div>
        </div>
        
        <div class="input-field">
          <textarea 
            id="comment" 
            v-model="newReview.comment"
            class="materialize-textarea"
            maxlength="500"
          ></textarea>
          <label for="comment">Your Review (Optional)</label>
          <span class="helper-text">
            {{ newReview.comment.length }}/500 characters
          </span>
        </div>
        
        <button 
          type="submit" 
          class="btn waves-effect waves-light"
          :disabled="!newReview.rating || submitting"
        >
          {{ submitting ? 'Submitting...' : 'Submit Review' }}
        </button>
      </form>
    </div>
    
    <!-- Reviews List -->
    <div class="reviews-list">
      <div 
        v-for="review in reviews" 
        :key="review.id"
        class="review-item"
      >
        <div class="review-header">
          <div class="reviewer-info">
            <img 
              :src="review.user.avatar || '/default-avatar.png'" 
              :alt="review.user.name"
              class="reviewer-avatar"
            >
            <div>
              <h6>{{ review.user.name }}</h6>
              <div class="review-meta">
                <div class="stars">
                  <i class="material-icons" v-for="i in 5" :key="i">
                    {{ i <= review.rating ? 'star' : 'star_border' }}
                  </i>
                </div>
                <span class="review-date">{{ formatDate(review.createdAt) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="review.user.id === authStore.user?.id" class="review-actions">
            <button 
              class="btn-flat btn-small"
              @click="editReview(review)"
            >
              <i class="material-icons">edit</i>
            </button>
            <button 
              class="btn-flat btn-small"
              @click="deleteReview(review.id)"
            >
              <i class="material-icons">delete</i>
            </button>
          </div>
        </div>
        
        <p class="review-comment">{{ review.comment }}</p>
      </div>
    </div>
    
    <!-- Load More -->
    <div v-if="hasMore" class="center-align">
      <button 
        class="btn-flat waves-effect"
        @click="loadMore"
        :disabled="loading"
      >
        {{ loading ? 'Loading...' : 'Load More Reviews' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import reviewService from '@/services/review.service'
import { formatDate } from '@/utils/formatters'

const props = defineProps({
  productId: {
    type: String,
    required: true
  },
  canReview: {
    type: Boolean,
    default: false
  }
})

const authStore = useAuthStore()
const toast = useToast()

const reviews = ref([])
const stats = ref(null)
const loading = ref(false)
const submitting = ref(false)
const hasMore = ref(false)
const page = ref(1)

const newReview = ref({
  rating: 0,
  comment: ''
})

const hasReviewed = computed(() => 
  reviews.value.some(r => r.user.id === authStore.user?.id)
)

const getPercentage = (rating) => {
  if (!stats.value || stats.value.totalReviews === 0) return 0
  const count = stats.value.distribution[rating] || 0
  return (count / stats.value.totalReviews) * 100
}

const fetchReviews = async (loadingMore = false) => {
  loading.value = true
  
  try {
    const response = await reviewService.getProductReviews(props.productId)
    
    if (loadingMore) {
      reviews.value.push(...response.data.reviews)
    } else {
      reviews.value = response.data.reviews
      stats.value = response.data.stats
    }
    
    hasMore.value = response.data.reviews.length === 20
  } catch (error) {
    console.error('Error fetching reviews:', error)
  } finally {
    loading.value = false
  }
}

const submitReview = async () => {
  if (!newReview.value.rating) {
    toast.error('Please select a rating')
    return
  }
  
  submitting.value = true
  
  try {
    await reviewService.createReview({
      productId: props.productId,
      rating: newReview.value.rating,
      comment: newReview.value.comment
    })
    
    toast.success('Review submitted successfully!')
    newReview.value = { rating: 0, comment: '' }
    await fetchReviews()
  } catch (error) {
    console.error('Error submitting review:', error)
  } finally {
    submitting.value = false
  }
}

const editReview = (review) => {
  // Implement edit functionality
  toast.info('Edit functionality coming soon')
}

const deleteReview = async (reviewId) => {
  if (!confirm('Delete this review?')) return
  
  try {
    await reviewService.deleteReview(reviewId)
    toast.success('Review deleted')
    await fetchReviews()
  } catch (error) {
    console.error('Error deleting review:', error)
  }
}

const loadMore = () => {
  page.value++
  fetchReviews(true)
}

onMounted(() => {
  fetchReviews()
})
</script>

<style scoped lang="scss">
.product-reviews {
  margin-top: 40px;
  
  h5 {
    margin-bottom: 30px;
  }
  
  .review-stats {
    display: flex;
    gap: 40px;
    margin-bottom: 40px;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
    
    @media (max-width: 600px) {
      flex-direction: column;
      gap: 20px;
    }
    
    .average-rating {
      text-align: center;
      
      h3 {
        margin: 0;
        font-size: 3rem;
      }
      
      .stars {
        i {
          color: #ffc107;
          font-size: 20px;
        }
      }
      
      p {
        margin: 10px 0 0 0;
        color: #666;
      }
    }
    
    .rating-distribution {
      flex: 1;
      
      .rating-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        
        span:first-child {
          min-width: 50px;
          font-size: 0.9rem;
        }
        
        .progress {
          flex: 1;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          
          .determinate {
            background: #ffc107;
            border-radius: 4px;
          }
        }
        
        span:last-child {
          min-width: 30px;
          text-align: right;
          font-size: 0.9rem;
          color: #666;
        }
      }
    }
  }
  
  .add-review {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
    
    h6 {
      margin-bottom: 20px;
    }
    
    .rating-input {
      margin-bottom: 20px;
      
      label {
        display: block;
        margin-bottom: 10px;
        font-weight: 500;
      }
      
      .star-rating {
        i {
          font-size: 30px;
          color: #e0e0e0;
          cursor: pointer;
          transition: color 0.2s;
          
          &:hover,
          &.active {
            color: #ffc107;
          }
        }
      }
    }
  }
  
  .reviews-list {
    .review-item {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 15px;
      
      .reviewer-info {
        display: flex;
        gap: 15px;
        
        .reviewer-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        h6 {
          margin: 0 0 5px 0;
          font-weight: 500;
        }
        
        .review-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          
          .stars i {
            font-size: 16px;
            color: #ffc107;
          }
          
          .review-date {
            font-size: 0.9rem;
            color: #666;
          }
        }
      }
      
      .review-actions {
        display: flex;
        gap: 5px;
        
        button {
          padding: 0;
          width: 30px;
          height: 30px;
          
          i {
            font-size: 18px;
          }
        }
      }
    }
    
    .review-comment {
      margin: 0;
      color: #333;
      line-height: 1.6;
    }
  }
}
</style>